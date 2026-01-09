
import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Linked to users.id
  title: text("title").notNull(),
  description: text("description").notNull(),
  expectedResult: text("expected_result").notNull(),
  deadline: text("deadline").notNull(),
  budget: text("budget"),
  criteria: jsonb("criteria").$type<string[]>(), // Array of selection criteria
  status: text("status").notNull().default("open"),
  publicToken: text("public_token").notNull().unique(), // For the sharing link
  createdAt: timestamp("created_at").defaultNow(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(), // Linked to projects.id
  freelancerName: text("freelancer_name").notNull(),
  contact: text("contact").notNull(),
  approach: text("approach").notNull(),
  deadline: text("deadline").notNull(),
  price: text("price").notNull(),
  guarantees: text("guarantees"),
  risks: text("risks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  offers: many(offers),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  project: one(projects, {
    fields: [offers.projectId],
    references: [projects.id],
  }),
}));

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  userId: true, 
  publicToken: true, 
  createdAt: true,
  status: true
});

export const insertOfferSchema = createInsertSchema(offers).omit({ 
  id: true, 
  projectId: true, 
  createdAt: true 
});

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

// Custom types for API responses
export type ProjectWithOffers = Project & { offers: Offer[] };
