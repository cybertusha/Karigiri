import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CRAFT_TYPES, INDIAN_STATES } from "@/lib/constants";
import { X } from "lucide-react";

export interface FilterState {
  q: string;
  state: string;
  craft: string;
  min_price: string;
  max_price: string;
}
export const emptyFilters: FilterState = { q: "", state: "", craft: "", min_price: "", max_price: "" };

export function Filters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...value, [k]: v });
  const hasAny = Object.values(value).some(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Filters</h2>
        {hasAny && (
          <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="q">Search</Label>
        <Input id="q" placeholder="Hand-painted bowl..." value={value.q} onChange={(e) => set("q", e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Craft</Label>
        <Select value={value.craft || "all"} onValueChange={(v) => set("craft", v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All crafts</SelectItem>
            {CRAFT_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>State</Label>
        <Select value={value.state || "all"} onValueChange={(v) => set("state", v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="min">Min ₹</Label>
          <Input id="min" inputMode="numeric" value={value.min_price} onChange={(e) => set("min_price", e.target.value.replace(/[^\d]/g, ""))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max">Max ₹</Label>
          <Input id="max" inputMode="numeric" value={value.max_price} onChange={(e) => set("max_price", e.target.value.replace(/[^\d]/g, ""))} />
        </div>
      </div>
    </div>
  );
}
