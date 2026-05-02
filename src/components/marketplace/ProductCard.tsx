import { Link } from "@tanstack/react-router";
import { CRAFT_TYPES } from "@/lib/constants";
import { MapPin } from "lucide-react";
import { normalizeImageUrl } from "@/lib/image-url";
import { getProductBadge, getProductType, getShortDescription } from "@/lib/product-info";

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  state: string;
  craft: string;
  images: string[];
}

export function ProductCard({ p, onPreview }: { p: ProductRow; onPreview?: (product: ProductRow) => void }) {
  const craftLabel = CRAFT_TYPES.find((c) => c.value === p.craft)?.label ?? p.craft;
  const img = normalizeImageUrl(p.images?.[0]);
  const badge = getProductBadge(p);
  const type = getProductType(p);
  const summary = getShortDescription(p.description, 95);

  if (onPreview) {
    return (
      <button
        type="button"
        onClick={() => onPreview(p)}
        className="group block w-full text-left overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <span className="absolute right-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-sm">
            {badge}
          </span>
          {img ? (
            <img
              src={img}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40 font-display italic">No image</div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">{craftLabel}</p>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-medium leading-snug">{p.name}</h3>
            <span className="font-medium text-primary whitespace-nowrap">₹{Number(p.price).toLocaleString("en-IN")}</span>
          </div>
          <p className="text-sm font-medium text-foreground/80">Type: {type}</p>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{summary}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.state}</span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <span className="absolute right-3 top-3 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground shadow-sm">
          {badge}
        </span>
        {img ? (
          <img
            src={img}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40 font-display italic">No image</div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <p className="text-[11px] font-semibold tracking-wide text-primary uppercase">{craftLabel}</p>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-medium leading-snug">{p.name}</h3>
          <span className="font-medium text-primary whitespace-nowrap">₹{Number(p.price).toLocaleString("en-IN")}</span>
        </div>
        <p className="text-sm font-medium text-foreground/80">Type: {type}</p>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{summary}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.state}</span>
        </div>
      </div>
    </Link>
  );
}
