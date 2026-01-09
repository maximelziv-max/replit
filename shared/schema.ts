
import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TEMPLATE TYPES ===

export const TEMPLATE_TYPES = ["video", "design", "marketing", "development", "content", "universal"] as const;
export type TemplateType = typeof TEMPLATE_TYPES[number];

export const TEMPLATES = {
  video: {
    name: "Видео / монтаж",
    icon: "🎥",
    projectHints: {
      title: "Например: Монтаж серии Reels для Instagram",
      description: "Укажите количество роликов, формат (Reels/Shorts/YouTube), длительность, стиль (по рефам), субтитры/музыка, количество правок...",
      expectedResult: "Например: 10 смонтированных роликов в формате MP4, субтитры, музыка без авторских прав...",
    },
    offerHints: {
      approach: "Опишите как будет построен монтаж: сценарий, темп, стиль обработки...",
      deadline: "Укажите срок за 1 ролик и за весь пакет",
      price: "Цена за пакет или за ролик",
      guarantees: "Количество правок, сроки согласования...",
      risks: "Качество исходников, скорость согласования, авторские права на музыку...",
    },
    defaultCriteria: [
      "Опыт в похожих проектах",
      "Сроки выполнения",
      "Цена",
      "Качество портфолио",
      "Коммуникация",
      "Количество правок",
    ],
  },
  design: {
    name: "Дизайн",
    icon: "🎨",
    projectHints: {
      title: "Например: Дизайн лендинга для SaaS продукта",
      description: "Что дизайнится, площадка (web/smm), наличие бренд-гайда, референсы, формат сдачи (Figma), адаптив, правки...",
      expectedResult: "Например: Макеты в Figma, UI Kit, адаптивные версии...",
    },
    offerHints: {
      approach: "Опишите этапы работы: концепт → дизайн → правки...",
      deadline: "Сроки по каждому этапу",
      price: "Общая стоимость проекта",
      guarantees: "Количество правок, передача исходников...",
      risks: "Отсутствие референсов, изменение требований...",
    },
    defaultCriteria: [
      "Опыт в похожих проектах",
      "Сроки выполнения",
      "Цена",
      "Качество портфолио",
      "Коммуникация",
      "Гарантии и правки",
    ],
  },
  marketing: {
    name: "Маркетинг",
    icon: "📈",
    projectHints: {
      title: "Например: Настройка таргетированной рекламы в VK",
      description: "Укажите цель (лиды/продажи), нишу, каналы, доступы/аналитика, KPI (ориентир), формат отчётности...",
      expectedResult: "Например: Настроенные рекламные кампании, еженедельные отчёты, достижение N лидов...",
    },
    offerHints: {
      approach: "Опишите стратегию и этапы работы...",
      deadline: "Сроки первых результатов и общий срок",
      price: "Цена за месяц или за проект",
      guarantees: "Гарантии процесса, формат отчётов...",
      risks: "Особенности ниши, бюджет, зависимость от контента...",
    },
    defaultCriteria: [
      "Опыт в нише",
      "Сроки первых результатов",
      "Цена",
      "Кейсы с метриками",
      "Коммуникация",
      "Формат отчётности",
    ],
  },
  development: {
    name: "Разработка",
    icon: "💻",
    projectHints: {
      title: "Например: Разработка MVP мобильного приложения",
      description: "Что разрабатываем, стек (если есть предпочтения), макеты/ТЗ, интеграции, деплой, критерии готовности...",
      expectedResult: "Например: Рабочий MVP, исходный код, документация, деплой на сервер...",
    },
    offerHints: {
      approach: "Опишите план: MVP → тестирование → релиз...",
      deadline: "Сроки по этапам разработки",
      price: "Общая стоимость или почасовая ставка",
      guarantees: "Багфикс, поддержка после сдачи...",
      risks: "Изменения ТЗ, сложности с интеграциями...",
    },
    defaultCriteria: [
      "Опыт с нужным стеком",
      "Сроки выполнения",
      "Цена",
      "Качество кода и кейсов",
      "Коммуникация",
      "Поддержка после сдачи",
    ],
  },
  content: {
    name: "Контент",
    icon: "✍️",
    projectHints: {
      title: "Например: Написание серии статей для блога",
      description: "Формат (посты/статьи/сценарии), объём, стиль/тон, площадка, примеры, количество правок...",
      expectedResult: "Например: 10 статей по 3000 знаков, SEO-оптимизация, уникальность 95%+...",
    },
    offerHints: {
      approach: "Как будет построено согласование контента...",
      deadline: "Сроки по партиям материалов",
      price: "Цена за весь объём или за единицу",
      guarantees: "Уникальность, количество правок...",
      risks: "Размытые вводные, долгое согласование...",
    },
    defaultCriteria: [
      "Опыт в тематике",
      "Сроки выполнения",
      "Цена",
      "Примеры работ",
      "Коммуникация",
      "Гарантии уникальности",
    ],
  },
  universal: {
    name: "Другое",
    icon: "🧩",
    projectHints: {
      title: "Например: Название вашего проекта",
      description: "Опишите что нужно сделать, зачем, какой результат ожидаете, сроки, ограничения...",
      expectedResult: "Перечислите конкретные результаты работы...",
    },
    offerHints: {
      approach: "Как вы планируете реализовать проект?",
      deadline: "Сроки выполнения",
      price: "Общая стоимость",
      guarantees: "Какие гарантии предоставляете?",
      risks: "Какие могут возникнуть сложности?",
    },
    defaultCriteria: [
      "Опыт в похожих проектах",
      "Сроки выполнения",
      "Цена",
      "Качество кейсов",
      "Коммуникация",
      "Гарантии и правки",
    ],
  },
} as const;

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Linked to users.id
  templateType: text("template_type").default("universal"), // Template type for hints
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
