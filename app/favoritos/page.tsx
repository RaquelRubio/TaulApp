"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import recipes from "../data/recipes.json";
import { getFavorites, toggleFavorite } from "../lib/favorites";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Star, Heart } from "lucide-react";

export default function FavoritosPage() {
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    setFavIds(getFavorites());
  }, []);

  const favRecipes = useMemo(() => {
    const set = new Set(favIds);
    return (recipes as any[]).filter((r) => set.has(r.id));
  }, [favIds]);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-24">
      <h1 className="text-2xl font-bold text-primary mb-6">Favoritos</h1>

      {favRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          {/* Círculo relleno Red 100; corazón relleno Red 500, sin stroke */}
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
        <div className="grid gap-3">
          {favRecipes.map((r) => (
            <Card key={r.id} className="relative rounded-xl border shadow-sm">
              <Link
                href={`/recipe/${r.id}`}
                className="block no-underline text-inherit"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    const next = toggleFavorite(r.id);
                    setFavIds(next);
                  }}
                  className="absolute right-3 top-3 h-auto w-auto p-0 hover:bg-transparent"
                >
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                </Button>

                <CardContent className="p-4">
                  <div className="font-bold pr-8 text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.time_minutes} min
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        (V1) Si añades/quitas favoritos en Home/Ideas, refresca esta pestaña si no se actualiza aún.
      </p>
    </main>
  );
}
