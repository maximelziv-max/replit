import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { OFFER_STATUSES, type OfferStatus } from "@shared/schema";

// Extend session type
declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Session setup
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: true,
    saveUninitialized: true,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // === Auth Routes ===

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username, password } = api.auth.login.input.parse(req.body);
      
      let user = await storage.getUserByUsername(username);
      
      if (!user) {
        // Create new user with hashed password
        const passwordHash = await bcrypt.hash(password, 10);
        user = await storage.createUser({ username, passwordHash });
      } else {
        // Verify password for existing user
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          return res.status(400).json({ message: "Неверный пароль" });
        }
      }

      req.session.userId = user.id;
      
      // Save session explicitly before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        // Don't send passwordHash to client
        const { passwordHash: _, ...safeUser } = user!;
        res.json(safeUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const firstError = err.errors[0];
        res.status(400).json({ message: firstError?.message || "Invalid input" });
      } else {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.json(null);
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.json(null);
    }
    // Don't send passwordHash to client
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // === Project Routes ===

  app.post(api.projects.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(req.session.userId!, input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.errors);
        res.status(400).json({ message: "Invalid input" });
      } else {
        console.error("Create project error:", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.get(api.projects.listMy.path, requireAuth, async (req, res) => {
    const projects = await storage.getUserProjects(req.session.userId!);
    res.json(projects);
  });

  app.get(api.projects.getMine.path, requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const project = await storage.getProject(id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    if (project.userId !== req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const offers = await storage.getProjectOffers(id);
    res.json({ ...project, offers });
  });

  app.get(api.projects.getByToken.path, async (req, res) => {
    const token = req.params.token;
    const project = await storage.getProjectByToken(token);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  });

  // === Offer Routes ===

  app.post(api.offers.create.path, async (req, res) => {
    try {
      const token = req.params.token;
      const project = await storage.getProjectByToken(token);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const input = api.offers.create.input.parse(req.body);
      const offer = await storage.createOffer(project.id, input);
      
      res.status(201).json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        console.error("Create offer error:", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // === Single Offer Status/Delete ===

  const offerStatusSchema = z.object({
    status: z.enum(OFFER_STATUSES)
  });

  app.patch("/api/offers/:id/status", requireAuth, async (req, res) => {
    try {
      const offerId = Number(req.params.id);
      const { status } = offerStatusSchema.parse(req.body);
      
      const result = await storage.getOfferWithProject(offerId);
      if (!result) {
        return res.status(404).json({ message: "Офер не найден" });
      }
      if (result.project.userId !== req.session.userId) {
        return res.status(403).json({ message: "Нет доступа" });
      }
      
      const offer = await storage.updateOfferStatus(offerId, status);
      res.json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid status" });
      } else {
        console.error("Update offer status error:", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.delete("/api/offers/:id", requireAuth, async (req, res) => {
    try {
      const offerId = Number(req.params.id);
      
      const result = await storage.getOfferWithProject(offerId);
      if (!result) {
        return res.status(404).json({ message: "Офер не найден" });
      }
      if (result.project.userId !== req.session.userId) {
        return res.status(403).json({ message: "Нет доступа" });
      }
      
      await storage.deleteOffer(offerId);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete offer error:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // === Bulk Offer Operations ===

  const bulkStatusSchema = z.object({
    offerIds: z.array(z.number()).min(1, "Выберите хотя бы один офер"),
    status: z.enum(OFFER_STATUSES)
  });

  const bulkDeleteSchema = z.object({
    offerIds: z.array(z.number()).min(1, "Выберите хотя бы один офер")
  });

  app.patch("/api/offers/bulk/status", requireAuth, async (req, res) => {
    try {
      const { offerIds, status } = bulkStatusSchema.parse(req.body);
      
      const isOwner = await storage.verifyOffersOwnership(offerIds, req.session.userId!);
      if (!isOwner) {
        return res.status(403).json({ message: "Нет доступа к некоторым оферам" });
      }
      
      const offers = await storage.updateOffersStatus(offerIds, status);
      res.json(offers);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.errors[0]?.message || "Invalid input";
        res.status(400).json({ message });
      } else {
        console.error("Bulk status update error:", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.delete("/api/offers/bulk", requireAuth, async (req, res) => {
    try {
      const { offerIds } = bulkDeleteSchema.parse(req.body);
      
      const isOwner = await storage.verifyOffersOwnership(offerIds, req.session.userId!);
      if (!isOwner) {
        return res.status(403).json({ message: "Нет доступа к некоторым оферам" });
      }
      
      const result = await storage.deleteOffers(offerIds);
      res.json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.errors[0]?.message || "Invalid input";
        res.status(400).json({ message });
      } else {
        console.error("Bulk delete error:", err);
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  return httpServer;
}
