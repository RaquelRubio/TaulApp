"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import recipes from "../data/recipes.json";
import { getFavorites, toggleFavorite } from "../lib/favorites";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Star, Heart, Clock } from "lucide-react";
import { cn } from "../lib/utils";

const nationalityFlag: Record<string, string> = {
  espanola: "🇪🇸",
  española: "🇪🇸",
  arabe: "🇲🇦",
  india: "🇮🇳",
  palestina: "🇵🇸",
  marroqui: "🇲🇦",
  marroquí: "🇲🇦",
};

const dietaryTagStyle: Record<string, string> = {
  vegano: "bg-emerald-100 text-emerald-800",
  vegetariano: "bg-lime-100 text-lime-800",
  halal: "bg-sky-100 text-sky-800",
  kosher: "bg-violet-100 text-violet-800",
  sin_lactosa: "bg-amber-100 text-amber-800",
  sin_gluten: "bg-orange-100 text-orange-800",
};

const dietaryLabel: Record<string, string> = {
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  halal: "Halal",
  kosher: "Kosher",
  sin_lactosa: "Sin lactosa",
  sin_gluten: "Sin gluten",
};

export default function FavoritosPage() {
  const [favIds, setFavIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavIds(getFavorites());
  }, []);

  const favRecipes = useMemo(() => {
    const set = new Set(favIds);
    return (recipes as any[]).filter((r) => set.has(r.id));
  }, [favIds]);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto pb-24">
      <header className="h-14 flex items-center px-4 border-b border-border/60 shrink-0">
        <h1 className="text-xl font-bold text-primary">Favoritos</h1>
      </header>
      <div className="px-4 pt-4">
      {favRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-24 h-24 rounded-full bg-[oklch(0.936_0.032_17.717)] flex items-center justify-center mb-5">
            <Heart className="h-10 w-10 fill-[oklch(0.637_0.237_25.331)] stroke-none" strokeWidth={0} />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No tienes favoritos aún
          </h2>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Guarda tus recetas favoritas para encontrarlas fácilmente
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {favRecipes.map((r) => {
            const dietaryTags = (r.tags || []).filter((t: string) => dietaryLabel[t]);
            const showTags = dietaryTags.slice(0, 3);
            const extraCount = dietaryTags.length - 3;
            const flag = nationalityFlag[r.nationality] || "🌍";
            const title = r.title ?? (r as { name?: string }).name ?? r.id;
            const time = typeof r.time === "number" ? r.time : (r as { time_minutes?: number }).time_minutes ?? "—";

            return (
              <Card key={r.id} className="relative overflow-hidden rounded-2xl border shadow-sm">
                <Link
                  href={`/recipe/${r.id}?from=favoritos`}
                  className="block no-underline text-inherit"
                >
                  {mounted && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        const next = toggleFavorite(r.id);
                        setFavIds(next);
                      }}
                      className="absolute right-2 top-2 z-10 h-8 w-8 p-0 rounded-full hover:bg-muted"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          favIds.includes(r.id) ? "fill-amber-400 text-amber-500" : "fill-none text-muted-foreground"
                        )}
                      />
                    </Button>
                  )}
                  <CardContent className="p-4">
                    <h3 className="text-lg font-bold text-foreground pr-10">{title}</h3>
                    <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                      <span className="shrink-0 text-base" aria-hidden>{flag}</span>
                      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span>{time !== "—" ? `${time} min` : "—"}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {showTags.map((tag: string) => (
                        <span
                          key={tag}
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            dietaryTagStyle[tag] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {dietaryLabel[tag] || tag}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                          +{extraCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </main>
  );
}
