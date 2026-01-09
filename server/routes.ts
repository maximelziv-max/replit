
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Session setup
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: app.get("env") === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // === Auth Routes ===

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { username } = api.auth.login.input.parse(req.body);
      
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.createUser({ username });
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        throw err;
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
    res.json(user || null);
  });

  // === Project Routes ===

  app.post(api.projects.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(req.session.userId, input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        throw err;
      }
    }
  });

  app.get(api.projects.listMy.path, requireAuth, async (req, res) => {
    const projects = await storage.getUserProjects(req.session.userId);
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
      const offer = await storage.createOffer({
        ...input,
        projectId: project.id
      });
      
      res.status(201).json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
      } else {
        throw err;
      }
    }
  });

  return httpServer;
}
