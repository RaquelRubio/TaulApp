"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import recipes from "../data/recipes.json";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Search, Recycle } from "lucide-react";

export default function IdeasPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const terms = q.split(/[\s,]+/).filter(Boolean);
    if (terms.length === 0) return [];

    const list = (recipes as any[]).filter(
      (r) => !r.id?.includes("**") && (r.title ?? "") !== "(Nueva receta)"
    );
    return list.filter((r) =>
      terms.some((term) =>
        (r.ingredients ?? []).some((ing: any) => {
          const name = String(ing.name ?? "").toLowerCase();
          const key = String(ing.key ?? "").toLowerCase();
          return name.includes(term) || key.includes(term);
        })
      )
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-24">
      {/* Header: solo texto */}
      <header className="mb-6">
        <h1 className="text-xl font-bold text-foreground leading-tight">
          ¿Qué tienes en la cocina?
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-snug">
          Escribe los ingredientes disponibles y te sugeriremos recetas perfectas para ti
        </p>
      </header>

      {/* Card: Tengo en casa... */}
      <Card className="rounded-2xl border shadow-sm mb-5 bg-white">
        <CardContent className="p-4">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Tengo en casa...
          </label>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: tomate, cebolla, arroz"
              className="flex-1 rounded-xl h-11 border-border bg-white"
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0 h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Buscar recetas"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          <p className="mt-2.5 text-xs text-muted-foreground">
            Separa los ingredientes con comas
          </p>
        </CardContent>
      </Card>

      {/* Card: Aprovecha lo que tienes */}
      <Card className="rounded-2xl border-0 shadow-sm mb-6 bg-emerald-50 dark:bg-emerald-950/30">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center">
              <Recycle className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm">
                Aprovecha lo que tienes
              </h2>
              <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed">
                En España, cada hogar desperdicia una media de{" "}
                <strong>250 kg de alimentos al año</strong>. Reaprovechar ingredientes no solo ayuda al planeta, también a tu bolsillo.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Fuente: Ministerio de Agricultura, Pesca y Alimentación (MAPA) - Informe 2023
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {query.trim() && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            {results.length > 0
              ? `Recetas con lo que tienes (${results.length})`
              : "No hay recetas con esos ingredientes"}
          </h2>
          <div className="grid gap-3">
            {results.map((r) => (
              <Card key={r.id} className="rounded-xl border shadow-sm">
                <Link
                  href={`/recipe/${r.id}`}
                  className="block no-underline text-inherit"
                >
                  <CardContent className="p-4">
                    <div className="font-bold text-foreground">{r.title ?? r.name ?? r.id}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {typeof r.time === "number" ? r.time : (r.time_minutes ?? "—")} min
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
