import { db } from "./db";
import {
  users, projects, offers,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Offer, type InsertOffer
} from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Projects
  createProject(userId: number, project: InsertProject): Promise<Project>;
  getUserProjects(userId: number): Promise<(Project & { offerCount: number })[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectByToken(token: string): Promise<Project | undefined>;

  // Offers
  createOffer(projectId: number, offer: InsertOffer): Promise<Offer>;
  getProjectOffers(projectId: number): Promise<Offer[]>;
}

export class DatabaseStorage implements IStorage {
  // === Auth ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // === Projects ===
  async createProject(userId: number, project: InsertProject): Promise<Project> {
    // Generate a unique public token
    const publicToken = nanoid(10);
    
    const [newProject] = await db.insert(projects).values({
      title: project.title,
      description: project.description,
      expectedResult: project.expectedResult,
      deadline: project.deadline,
      budget: project.budget || null,
      criteria: (project.criteria as string[]) || null,
      userId,
      publicToken,
      status: "open"
    }).returning();
    return newProject;
  }

  async getUserProjects(userId: number): Promise<(Project & { offerCount: number })[]> {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
    
    const result = [];
    for (const p of userProjects) {
      const [{ count: offerCount }] = await db
        .select({ count: count() })
        .from(offers)
        .where(eq(offers.projectId, p.id));
        
      result.push({ ...p, offerCount: Number(offerCount) });
    }
    
    return result;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectByToken(token: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.publicToken, token));
    return project;
  }

  // === Offers ===
  async createOffer(projectId: number, insertOffer: InsertOffer): Promise<Offer> {
    const [offer] = await db.insert(offers).values({
      freelancerName: insertOffer.freelancerName,
      contact: insertOffer.contact,
      approach: insertOffer.approach,
      deadline: insertOffer.deadline,
      price: insertOffer.price,
      guarantees: insertOffer.guarantees,
      risks: insertOffer.risks,
      projectId
    }).returning();
    return offer;
  }

  async getProjectOffers(projectId: number): Promise<Offer[]> {
    return await db.select().from(offers).where(eq(offers.projectId, projectId)).orderBy(desc(offers.createdAt));
  }
}

export const storage = new DatabaseStorage();
