import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CRAFT_TYPES, INDIAN_STATES } from "@/lib/constants";
import { useServerFn } from "@tanstack/react-start";
import { generateDescription } from "@/server/ai";
import { Sparkles, Loader2, Mic, MicOff, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { disableMockDataMode, enableMockDataMode, isSchemaMissingError, shouldUseMockData } from "@/lib/data-mode";
import { normalizeImageUrl } from "@/lib/image-url";

const ProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(4000),
  price: z.number().min(0).max(10_000_000),
  state: z.string().min(2).max(50),
  craft: z.string().min(2).max(40),
  images: z.array(z.string()).max(8),
});

export interface ProductInput {
  id?: string;
  name: string;
  description: string;
  price: string;
  state: string;
  craft: string;
  images: string[];
}

const empty: ProductInput = { name: "", description: "", price: "", state: "", craft: "", images: [] };

export function ProductForm({ initial, onSaved, onCancel }: {
  initial?: ProductInput;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [v, setV] = useState<ProductInput>(initial ?? empty);
  const [busy, setBusy] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const generate = useServerFn(generateDescription);

  const set = <K extends keyof ProductInput>(k: K, val: ProductInput[K]) => setV((s) => ({ ...s, [k]: val }));

  const uploadImages = async (files: FileList | null) => {
    if (!files || !user) return;
    if (shouldUseMockData()) {
      const localUrls = Array.from(files)
        .slice(0, 8 - v.images.length)
        .map((f) => URL.createObjectURL(f));
      set("images", [...v.images, ...localUrls]);
      toast.info("Using local image previews in mock mode.");
      return;
    }
    setBusy(true);
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 8 - v.images.length)) {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} > 5MB`); continue; }
      const path = `${user.id}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, f, { upsert: false });
      if (error) {
        if (isSchemaMissingError(error) || error.message.toLowerCase().includes("bucket") || error.message.toLowerCase().includes("not found")) {
          enableMockDataMode();
          urls.push(URL.createObjectURL(f));
          toast.info("Supabase storage bucket not found. Switched to mock/local image mode.");
          continue;
        }
        toast.error(error.message);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      disableMockDataMode();
      urls.push(data.publicUrl);
    }
    set("images", [...v.images, ...urls]);
    setBusy(false);
  };

  const removeImage = (i: number) => set("images", v.images.filter((_, idx) => idx !== i));

  const aiGenerate = async () => {
    if (!aiBrief.trim()) { toast.error("Add a few notes first."); return; }
    setAiBusy(true);
    try {
      const res = await generate({ data: { brief: aiBrief.trim(), name: v.name, craft: v.craft, state: v.state } });
      if (res.error) toast.error(res.error);
      else if (res.description) { set("description", res.description); toast.success("Description generated"); }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI request failed. Verify API key and AI_API_URL, then restart dev server.";
      toast.error(msg);
    } finally { setAiBusy(false); }
  };

  // Web Speech API for voice input
  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser."); return; }
    const rec = new SR();
    rec.lang = "en-IN"; rec.continuous = false; rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onerror = () => { setListening(false); toast.error("Voice input failed."); };
    rec.onend = () => setListening(false);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setAiBrief((prev) => (prev ? prev + " " : "") + text);
    };
    rec.start();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = ProductSchema.safeParse({
      name: v.name.trim(),
      description: v.description.trim(),
      price: Number(v.price),
      state: v.state, craft: v.craft, images: v.images,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid"); return; }
    if (shouldUseMockData()) {
      toast.success("Saved in mock mode (not persisted to Supabase).");
      onSaved();
      return;
    }
    setBusy(true);
    const payload = { ...parsed.data, craft: parsed.data.craft as any, artisan_id: user.id };
    const { error } = initial?.id
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(initial?.id ? "Product updated" : "Product published"); onSaved(); }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* AI assist */}
      <div className="rounded-xl border border-border bg-[var(--gradient-subtle)] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display font-medium">AI description assistant</h3>
        </div>
        <p className="text-xs text-muted-foreground">A few notes about your piece — type or speak.</p>
        <div className="relative">
          <Textarea value={aiBrief} onChange={(e) => setAiBrief(e.target.value)}
            placeholder="e.g. Blue pottery vase, glazed twice, made over 3 days..."
            className="min-h-[80px] pr-12" />
          <Button type="button" size="icon" variant="ghost"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={startVoice}
            aria-label={listening ? "Listening..." : "Voice input"}>
            {listening ? <MicOff className="h-4 w-4 text-primary animate-pulse" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        <Button type="button" onClick={aiGenerate} disabled={aiBusy} variant="outline" className="w-full">
          {aiBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate description
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Product name</Label>
        <Input id="name" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={120} required />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} required />
        </div>
        <div className="space-y-2">
          <Label>Craft</Label>
          <Select value={v.craft} onValueChange={(val) => set("craft", val)}>
            <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
            <SelectContent>{CRAFT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Select value={v.state} onValueChange={(val) => set("state", val)}>
            <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
            <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <Textarea id="desc" value={v.description} onChange={(e) => set("description", e.target.value)} className="min-h-[180px]" required />
      </div>

      <div className="space-y-2">
        <Label>Images <span className="text-xs text-muted-foreground">(up to 8, max 5MB each)</span></Label>
        <div className="grid grid-cols-4 gap-2">
          {v.images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
              <img src={normalizeImageUrl(url)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeImage(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {v.images.length < 8 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => uploadImages(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (initial?.id ? "Save changes" : "Publish")}
        </Button>
      </div>
    </form>
  );
}
