import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AI_URL = process.env.AI_API_URL ?? "https://openrouter.ai/api/v1";
const MODEL = process.env.AI_MODEL ?? "google/gemini-2.0-flash-001";

function getChatUrl() {
  const base = AI_URL.replace(/\/+$/, "");
  return `${base}/chat/completions`;
}

function getKey() {
  const k = process.env.AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!k) throw new Error("AI_API_KEY (or GEMINI_API_KEY) is not configured");
  return k;
}

async function readErrorMessage(res: Response) {
  const fallback = `AI request failed (${res.status})`;
  try {
    const body = await res.json();
    return body?.error?.message ?? body?.message ?? fallback;
  } catch {
    try {
      const text = await res.text();
      return text || fallback;
    } catch {
      return fallback;
    }
  }
}

async function readQuotaOrRateMessage(res: Response) {
  const msg = (await readErrorMessage(res)).toLowerCase();
  if (msg.includes("quota") || msg.includes("billing") || msg.includes("resource exhausted") || msg.includes("credits")) {
    return "AI quota exceeded for this API key. Check OpenRouter billing/credits or use another key.";
  }
  return "Too many AI requests right now. Please wait a few seconds and try again.";
}

function extractChatText(json: unknown) {
  const response = json as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  return response.choices?.[0]?.message?.content?.trim() ?? "";
}

function extractFirstJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  return candidate.slice(firstBrace, lastBrace + 1);
}

/** Generate an SEO-friendly product description from a brief. */
export const generateDescription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brief: z.string().min(3).max(2000),
      name: z.string().max(200).optional(),
      craft: z.string().max(50).optional(),
      state: z.string().max(50).optional(),
    }).parse,
  )
  .handler(async ({ data }) => {
    let apiKey = "";
    try {
      apiKey = getKey();
    } catch {
      return {
        description: "",
        error: "AI is not configured. Set AI_API_KEY in .env.local and restart the dev server.",
      };
    }

    const system = `You are a copywriter for a marketplace of Indian artisans.
Write a warm, vivid, SEO-friendly product description in 90-130 words.
- 2-3 short paragraphs, no bullet lists, no markdown headings.
- Highlight materials, craft technique, region, and one sensory detail.
- End with a soft call-to-action. Avoid clichés like "premium quality".`;
    const userMsg = `Product: ${data.name ?? "(unnamed)"}
Craft: ${data.craft ?? "(unspecified)"} | State: ${data.state ?? "(unspecified)"}
Artisan's notes: ${data.brief}`;

    try {
      const res = await fetch(getChatUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ],
        }),
      });
      if (res.status === 429) return { description: "", error: await readQuotaOrRateMessage(res) };
      if (res.status === 401) return { description: "", error: "Invalid AI API key. Check AI_API_KEY in .env.local." };
      if (res.status === 403) return { description: "", error: "AI API access denied. Check key permissions and billing." };
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        console.error("AI error", res.status, msg);
        return { description: "", error: msg };
      }
      const json = await res.json();
      const text = extractChatText(json);
      return { description: text, error: null };
    } catch (err) {
      console.error("AI request failed", err);
      return { description: "", error: "Could not reach AI provider. Check AI_API_URL/network and try again." };
    }
  });

/** Convert a natural-language search query into structured marketplace filters. */
export const queryToFilters = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().min(1).max(500) }).parse)
  .handler(async ({ data }) => {
    let apiKey = "";
    try {
      apiKey = getKey();
    } catch {
      return {
        filters: null,
        reply: "AI is not configured yet.",
        error: "config" as const,
      };
    }

    const system = `You convert artisan-marketplace shopping queries into structured filters.
Only fill fields that are clearly implied.
Indian states must be spelled correctly (e.g. "Rajasthan", "Tamil Nadu").

Return ONLY valid JSON with this exact shape:
{
  "craft": "pottery|textiles|jewelry|woodwork|metalwork|painting|leather|glasswork|basketry|stonework|other|''",
  "state": "string or ''",
  "min_price": "number or null",
  "max_price": "number or null",
  "keywords": "string or ''",
  "reply": "short friendly one-sentence summary"
}`;

    try {
      const res = await fetch(getChatUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: data.query },
          ],
        }),
      });

      if (res.status === 429) {
        return {
          filters: null,
          reply: await readQuotaOrRateMessage(res),
          error: "rate_limit" as const,
        };
      }
      if (res.status === 401) return { filters: null, reply: "Invalid AI API key configured.", error: "config" as const };
      if (res.status === 403) return { filters: null, reply: "AI API access denied. Check key permissions and billing.", error: "config" as const };
      if (!res.ok) {
        const msg = await readErrorMessage(res);
        console.error("AI chatbot error", res.status, msg);
        return { filters: null, reply: msg, error: "unknown" as const };
      }
      const json = await res.json();
      const text = extractChatText(json);
      const jsonString = extractFirstJsonObject(text);
      if (!jsonString) return { filters: {}, reply: "Here are some results.", error: null };
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(jsonString) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
      const reply = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply : "Here are some results.";
      const filters = {
        craft: typeof parsed.craft === "string" ? parsed.craft : undefined,
        state: typeof parsed.state === "string" ? parsed.state : undefined,
        min_price: typeof parsed.min_price === "number" ? parsed.min_price : undefined,
        max_price: typeof parsed.max_price === "number" ? parsed.max_price : undefined,
        keywords: typeof parsed.keywords === "string" ? parsed.keywords : undefined,
      };
      return { filters, reply, error: null };
    } catch (err) {
      console.error("AI chatbot request failed", err);
      return {
        filters: null,
        reply: "Could not reach AI provider. Check AI_API_URL/network and try again.",
        error: "unknown" as const,
      };
    }
  });
