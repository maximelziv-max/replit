import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MAX_INPUT_LENGTH = 5000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  entry.count++;
  return true;
}

export function truncateText(text: string): string {
  if (text.length > MAX_INPUT_LENGTH) {
    return text.slice(0, MAX_INPUT_LENGTH) + "...";
  }
  return text;
}

interface ProjectImproveInput {
  title: string;
  description: string;
  result?: string;
  deadline?: string;
  budget?: string;
  template: string;
}

interface ProjectImproveOutput {
  suggested_description: string;
  suggested_result: string;
  improvements: string[];
  missing_info: string[];
}

interface ProjectReviewInput {
  template: string;
  description: string;
  result?: string;
  deadline?: string;
  budget?: string;
}

interface ProjectReviewOutput {
  improvements: string[];
  missing_info: string[];
}

interface OfferImproveInput {
  project: {
    title: string;
    description: string;
    result?: string;
  };
  offer: {
    approach: string;
    deadline: string;
    price: string;
    guarantees?: string;
    risks?: string;
  };
  template: string;
}

interface OfferImproveOutput {
  suggested_offer: {
    approach: string;
    guarantees: string;
    risks: string;
  };
  improvements: string[];
}

interface OfferReviewInput {
  project: {
    title: string;
    description: string;
    result?: string;
  };
  offer: {
    approach: string;
    deadline: string;
    price: string;
    guarantees?: string;
    risks?: string;
  };
  template: string;
}

interface OfferReviewOutput {
  improvements: string[];
  missing_info: string[];
}

async function callAI<T>(systemPrompt: string, userContent: string): Promise<T> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: truncateText(userContent) }
    ],
    max_completion_tokens: 2048,
    response_format: { type: "json_object" }
  });
  
  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as T;
}

export async function improveProject(input: ProjectImproveInput): Promise<ProjectImproveOutput> {
  const systemPrompt = `Ты — AI-помощник для улучшения технических заданий (ТЗ).
Твоя задача:
1. Сделать описание более структурным и понятным
2. Улучшить формулировку ожидаемого результата
3. Предложить конкретные улучшения
4. Указать недостающую информацию

Правила:
- НЕ выдумывай данные — если чего-то не хватает, добавь в missing_info
- Пиши кратко и по делу
- Отвечай на русском языке
- Верни JSON в формате:
{
  "suggested_description": "улучшенное описание",
  "suggested_result": "улучшенный ожидаемый результат",
  "improvements": ["улучшение 1", "улучшение 2"],
  "missing_info": ["чего не хватает 1", "чего не хватает 2"]
}`;

  const userContent = JSON.stringify({
    template: input.template,
    title: input.title,
    description: input.description,
    result: input.result || "",
    deadline: input.deadline || "",
    budget: input.budget || ""
  });

  return callAI<ProjectImproveOutput>(systemPrompt, userContent);
}

export async function reviewProject(input: ProjectReviewInput): Promise<ProjectReviewOutput> {
  const systemPrompt = `Ты — AI-советник по техническим заданиям (ТЗ).
Твоя задача — дать советы по улучшению ТЗ, НЕ переписывая его.

Правила:
- Укажи конкретные улучшения
- Перечисли недостающую информацию
- Пиши кратко и по делу
- Отвечай на русском языке
- Верни JSON в формате:
{
  "improvements": ["совет 1", "совет 2"],
  "missing_info": ["чего не хватает 1", "чего не хватает 2"]
}`;

  const userContent = JSON.stringify({
    template: input.template,
    description: input.description,
    result: input.result || "",
    deadline: input.deadline || "",
    budget: input.budget || ""
  });

  return callAI<ProjectReviewOutput>(systemPrompt, userContent);
}

export async function improveOffer(input: OfferImproveInput): Promise<OfferImproveOutput> {
  const systemPrompt = `Ты — AI-помощник для улучшения оферов (предложений) от исполнителей.
Твоя задача:
1. Сделать подход к работе более структурным и убедительным
2. Улучшить формулировку гарантий
3. Лучше описать возможные риски
4. Предложить конкретные улучшения

Правила:
- НЕ меняй цену и сроки — только approach, guarantees, risks
- НЕ выдумывай данные
- Пиши кратко и по делу
- Отвечай на русском языке
- Верни JSON в формате:
{
  "suggested_offer": {
    "approach": "улучшенный подход",
    "guarantees": "улучшенные гарантии",
    "risks": "улучшенное описание рисков"
  },
  "improvements": ["улучшение 1", "улучшение 2"]
}`;

  const userContent = JSON.stringify({
    template: input.template,
    project: input.project,
    offer: input.offer
  });

  return callAI<OfferImproveOutput>(systemPrompt, userContent);
}

export async function reviewOffer(input: OfferReviewInput): Promise<OfferReviewOutput> {
  const systemPrompt = `Ты — AI-советник для исполнителей.
Твоя задача — дать советы по улучшению офера (предложения), НЕ переписывая его.

Правила:
- НЕ оценивай "брать / не брать" — ты не выбираешь кандидата
- Укажи конкретные улучшения
- Перечисли недостающую информацию
- Пиши кратко и по делу
- Отвечай на русском языке
- Верни JSON в формате:
{
  "improvements": ["совет 1", "совет 2"],
  "missing_info": ["чего не хватает 1", "чего не хватает 2"]
}`;

  const userContent = JSON.stringify({
    template: input.template,
    project: input.project,
    offer: input.offer
  });

  return callAI<OfferReviewOutput>(systemPrompt, userContent);
}
