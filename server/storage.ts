import { db } from "./db";
import {
  users, projects, offers, activityLogs,
  type User,
  type Project, type InsertProject,
  type Offer, type InsertOffer,
  type OfferStatus,
  type ActivityLog, type EventType
} from "@shared/schema";
import { eq, desc, count, inArray, gte, sql, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; passwordHash: string }): Promise<User>;

  // Projects
  createProject(userId: number, project: InsertProject): Promise<Project>;
  getUserProjects(userId: number): Promise<(Project & { offerCount: number })[]>;
  getProject(id: number): Promise<Project | undefined>;
  getProjectByToken(token: string): Promise<Project | undefined>;

  // Offers
  createOffer(projectId: number, offer: InsertOffer): Promise<Offer>;
  getProjectOffers(projectId: number): Promise<Offer[]>;
  
  // Offer status & deletion (single)
  updateOfferStatus(offerId: number, status: OfferStatus): Promise<Offer>;
  deleteOffer(offerId: number): Promise<void>;
  
  // Bulk operations
  updateOffersStatus(offerIds: number[], status: OfferStatus): Promise<Offer[]>;
  deleteOffers(offerIds: number[]): Promise<{ deleted: number }>;
  
  // Authorization
  getOfferWithProject(offerId: number): Promise<{ offer: Offer; project: Project } | undefined>;
  verifyOffersOwnership(offerIds: number[], userId: number): Promise<boolean>;
  
  // Activity Logs
  logActivity(userId: number | null, eventType: EventType, metadata?: Record<string, unknown>): Promise<ActivityLog>;
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
  
  // Admin - Users
  getAllUsers(): Promise<User[]>;
  blockUser(userId: number): Promise<User>;
  unblockUser(userId: number): Promise<User>;
  updateUserPassword(userId: number, passwordHash: string): Promise<User>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateLoginStats(userId: number): Promise<void>;
  
  // Admin - Stats
  getStats(days: number): Promise<{
    totals: { users: number; projects: number; offers: number };
    activeUsers: number;
    series: {
      usersPerDay: Array<{ date: string; count: number }>;
      projectsPerDay: Array<{ date: string; count: number }>;
      offersPerDay: Array<{ date: string; count: number }>;
      eventsPerDay: Array<Record<string, number | string>>;
    };
    recentEvents: ActivityLog[];
  }>;
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

  async createUser(insertUser: { username: string; passwordHash: string }): Promise<User> {
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
      portfolioLinks: insertOffer.portfolioLinks || null,
      experience: insertOffer.experience || null,
      skills: insertOffer.skills || null,
      approach: insertOffer.approach,
      deadline: insertOffer.deadline,
      price: insertOffer.price,
      guarantees: insertOffer.guarantees || null,
      risks: insertOffer.risks || null,
      projectId
    }).returning();
    return offer;
  }

  async getProjectOffers(projectId: number): Promise<Offer[]> {
    return await db.select().from(offers).where(eq(offers.projectId, projectId)).orderBy(desc(offers.createdAt));
  }

  // === Single offer status & deletion ===
  async updateOfferStatus(offerId: number, status: OfferStatus): Promise<Offer> {
    const [offer] = await db.update(offers)
      .set({ status })
      .where(eq(offers.id, offerId))
      .returning();
    return offer;
  }

  async deleteOffer(offerId: number): Promise<void> {
    await db.delete(offers).where(eq(offers.id, offerId));
  }

  // === Bulk operations ===
  async updateOffersStatus(offerIds: number[], status: OfferStatus): Promise<Offer[]> {
    if (offerIds.length === 0) return [];
    return await db.update(offers)
      .set({ status })
      .where(inArray(offers.id, offerIds))
      .returning();
  }

  async deleteOffers(offerIds: number[]): Promise<{ deleted: number }> {
    if (offerIds.length === 0) return { deleted: 0 };
    const result = await db.delete(offers).where(inArray(offers.id, offerIds)).returning();
    return { deleted: result.length };
  }

  // === Authorization ===
  async getOfferWithProject(offerId: number): Promise<{ offer: Offer; project: Project } | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, offerId));
    if (!offer) return undefined;
    const [project] = await db.select().from(projects).where(eq(projects.id, offer.projectId));
    if (!project) return undefined;
    return { offer, project };
  }

  async verifyOffersOwnership(offerIds: number[], userId: number): Promise<boolean> {
    if (offerIds.length === 0) return true;
    const offersList = await db.select().from(offers).where(inArray(offers.id, offerIds));
    if (offersList.length !== offerIds.length) return false;
    const projectIdsSet = new Set(offersList.map(o => o.projectId));
    const projectIds = Array.from(projectIdsSet);
    const projectsList = await db.select().from(projects).where(inArray(projects.id, projectIds));
    return projectsList.every(p => p.userId === userId);
  }

  // === Activity Logs ===
  async logActivity(userId: number | null, eventType: EventType, metadata?: Record<string, unknown>): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values({
      userId,
      eventType,
      metadata: metadata || null,
    }).returning();
    return log;
  }

  async getRecentActivity(limit: number = 50): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }

  // === Admin - Users ===
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async blockUser(userId: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ isBlocked: true, blockedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async unblockUser(userId: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ isBlocked: false, blockedAt: null })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateLoginStats(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        lastLoginAt: new Date(),
        loginCount: sql`${users.loginCount} + 1`
      })
      .where(eq(users.id, userId));
  }

  // === Admin - Stats ===
  async getStats(days: number): Promise<{
    totals: { users: number; projects: number; offers: number };
    activeUsers: number;
    series: {
      usersPerDay: Array<{ date: string; count: number }>;
      projectsPerDay: Array<{ date: string; count: number }>;
      offersPerDay: Array<{ date: string; count: number }>;
      eventsPerDay: Array<Record<string, number | string>>;
    };
    recentEvents: ActivityLog[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Totals
    const [{ count: usersTotal }] = await db.select({ count: count() }).from(users);
    const [{ count: projectsTotal }] = await db.select({ count: count() }).from(projects);
    const [{ count: offersTotal }] = await db.select({ count: count() }).from(offers);

    // Active users (logged in within days)
    const [{ count: activeUsersCount }] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.lastLoginAt, cutoffDate));

    // Users per day
    const usersPerDayRaw = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: count(),
      })
      .from(users)
      .where(gte(users.createdAt, cutoffDate))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    // Projects per day
    const projectsPerDayRaw = await db
      .select({
        date: sql<string>`DATE(${projects.createdAt})`,
        count: count(),
      })
      .from(projects)
      .where(gte(projects.createdAt, cutoffDate))
      .groupBy(sql`DATE(${projects.createdAt})`)
      .orderBy(sql`DATE(${projects.createdAt})`);

    // Offers per day
    const offersPerDayRaw = await db
      .select({
        date: sql<string>`DATE(${offers.createdAt})`,
        count: count(),
      })
      .from(offers)
      .where(gte(offers.createdAt, cutoffDate))
      .groupBy(sql`DATE(${offers.createdAt})`)
      .orderBy(sql`DATE(${offers.createdAt})`);

    // Events per day grouped by type
    const eventsRaw = await db
      .select({
        date: sql<string>`DATE(${activityLogs.createdAt})`,
        eventType: activityLogs.eventType,
        count: count(),
      })
      .from(activityLogs)
      .where(gte(activityLogs.createdAt, cutoffDate))
      .groupBy(sql`DATE(${activityLogs.createdAt})`, activityLogs.eventType)
      .orderBy(sql`DATE(${activityLogs.createdAt})`);

    // Aggregate events by date
    const eventsMap = new Map<string, Record<string, number | string>>();
    for (const event of eventsRaw) {
      const dateStr = String(event.date);
      if (!eventsMap.has(dateStr)) {
        eventsMap.set(dateStr, { date: dateStr });
      }
      eventsMap.get(dateStr)![event.eventType] = Number(event.count);
    }

    // Recent events
    const recentEvents = await this.getRecentActivity(50);

    return {
      totals: {
        users: Number(usersTotal),
        projects: Number(projectsTotal),
        offers: Number(offersTotal),
      },
      activeUsers: Number(activeUsersCount),
      series: {
        usersPerDay: usersPerDayRaw.map(r => ({ date: String(r.date), count: Number(r.count) })),
        projectsPerDay: projectsPerDayRaw.map(r => ({ date: String(r.date), count: Number(r.count) })),
        offersPerDay: offersPerDayRaw.map(r => ({ date: String(r.date), count: Number(r.count) })),
        eventsPerDay: Array.from(eventsMap.values()),
      },
      recentEvents,
    };
  }
}

export const storage = new DatabaseStorage();
