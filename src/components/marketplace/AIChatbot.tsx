import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { queryToFilters } from "@/server/ai";
import type { FilterState } from "./Filters";
import { emptyFilters } from "./Filters";

export function AIChatbot({ onApply }: { onApply: (f: FilterState, reply: string) => void }) {
  const fn = useServerFn(queryToFilters);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fn({ data: { query: q.trim() } });
      if (res.error === "credits") { setLastReply("AI credits exhausted. Please add credits in Workspace → Usage."); return; }
      if (res.error === "rate_limit") { setLastReply("Slow down a moment — too many requests."); return; }
      if (res.error === "config") { setLastReply("AI is not configured correctly. Check AI key and restart dev server."); return; }
      const f = res.filters ?? {};
      const next: FilterState = {
        ...emptyFilters,
        q: f.keywords ?? "",
        state: f.state ?? "",
        craft: f.craft ?? "",
        min_price: f.min_price != null ? String(f.min_price) : "",
        max_price: f.max_price != null ? String(f.max_price) : "",
      };
      setLastReply(res.reply);
      onApply(next, res.reply);
    } catch {
      setLastReply("AI request failed. Please verify API key, URL, and internet connection.");
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-border bg-[var(--gradient-subtle)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gradient-warm)]">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-medium">Ask anything</h3>
          <p className="text-xs text-muted-foreground">"Pottery from Rajasthan under ₹1000"</p>
        </div>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Describe what you're looking for..." disabled={busy} />
        <Button type="submit" disabled={busy || !q.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
      {lastReply && <p className="mt-3 text-sm text-muted-foreground italic">{lastReply}</p>}
    </div>
  );
}
