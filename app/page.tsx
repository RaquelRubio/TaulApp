"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import recipes from "./data/recipes.json";
import { getFavorites, toggleFavorite } from "./lib/favorites";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Star, Search, ChevronDown, Copy, MessageCircle, Clock, Heart } from "lucide-react";
import { cn } from "./lib/utils";
import AccountMenu from "./components/AccountMenu";
import { supabase } from "./lib/supabaseClient";
import { getRecipeImageUrl, getRecipeImageUrls } from "./lib/recipeImages";
import { getFlagForNationality, normalizeNationalityForFilter } from "./data/countries";

type Nationality = "todas" | "aleatorio" | "espanola" | "española" | "arabe" | "india" | "palestina" | "marroqui" | "marroquí";

const nationalityLabel: Record<Exclude<Nationality, "todas" | "aleatorio">, string> = {
  espanola: "Española",
  española: "Española",
  arabe: "Árabe",
  india: "India",
  palestina: "Palestina",
  marroqui: "Marroquí",
  marroquí: "Marroquí",
};

/** Banderas por nacionalidad: España 🇪🇸, India 🇮🇳, Palestina 🇵🇸, Marruecos 🇲🇦, Árabe (Marruecos) 🇲🇦 */
const nationalityFlag: Record<string, string> = {
  todas: "🌍",
  aleatorio: "🎲",
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

/** Recetas con imagen en .png u otro formato distinto a .jpeg */
const RECIPE_IMAGE_OVERRIDES: Record<string, string> = {
  fattouch: "fattouch.png",
  kanafeh: "knafeh.jpeg",
};

/** Normaliza nacionalidad para filtrar (española/espanola → espanola, marroquí/marroqui → marroqui). */
function normalizeNationality(n: string): string {
  const s = (n ?? "").toLowerCase().trim();
  if (s === "española") return "espanola";
  if (s === "marroquí") return "marroqui";
  return s;
}

/** Ingredientes que impiden que una receta sea halal (cerdo, alcohol, etc.). */
const BLOCK_HALAL_PATTERNS = ["cerdo", "jamon", "jamón", "tocino", "panceta", "lardo", "vino", "cerveza", "whisky", "ron", "brandy", "licor"];

/** Ingredientes que impiden que una receta sea kosher (cerdo, mariscos, etc.). */
const BLOCK_KOSHER_PATTERNS = ["cerdo", "jamon", "jamón", "tocino", "panceta", "lardo", "marisco", "gamba", "langostino", "mejillon", "mejillón", "calamar", "pulpo", "vieira", "almeja", "ostra", "camarón", "camaron"];

type RecipeForFilter = {
  id: string;
  title?: string;
  tags?: string[];
  nationality?: string;
  time?: number;
  ingredients?: { key?: string; name?: string; canBeHalal?: boolean; canBeKosher?: boolean }[];
};

/** Indica si un ingrediente bloquea halal (por su key o nombre). */
function ingredientBlocksHalal(ing: { key?: string; name?: string; canBeHalal?: boolean }): boolean {
  if (ing.canBeHalal === false) return true;
  const k = (ing.key ?? "").toLowerCase();
  const n = (ing.name ?? "").toLowerCase();
  return BLOCK_HALAL_PATTERNS.some((p) => k.includes(p) || n.includes(p));
}

/** Indica si un ingrediente bloquea kosher (por su key o nombre). */
function ingredientBlocksKosher(ing: { key?: string; name?: string; canBeKosher?: boolean }): boolean {
  if (ing.canBeKosher === false) return true;
  const k = (ing.key ?? "").toLowerCase();
  const n = (ing.name ?? "").toLowerCase();
  return BLOCK_KOSHER_PATTERNS.some((p) => k.includes(p) || n.includes(p));
}

/** Comprueba si una receta cumple un filtro dietético. Halal y kosher: también admiten recetas adaptables (p.ej. pollo que puede comprarse halal/kosher). */
function recipeMatchesDietFilter(recipe: RecipeForFilter, filter: string): boolean {
  const tags = recipe.tags ?? [];
  if (tags.includes(filter)) return true;

  // Halal y kosher: recetas adaptables si ningún ingrediente bloquea
  if (filter === "halal") {
    const ings = recipe.ingredients ?? [];
    return !ings.some(ingredientBlocksHalal);
  }
  if (filter === "kosher") {
    const ings = recipe.ingredients ?? [];
    return !ings.some(ingredientBlocksKosher);
  }

  // Resto de filtros: solo por tag
  return tags.includes(filter);
}

export default function Home() {
  const [nationality, setNationality] = useState<Nationality>("todas");
  const [favIds, setFavIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [opcionesOpen, setOpcionesOpen] = useState(false);
  const [randomKey, setRandomKey] = useState(0);

  const [filters, setFilters] = useState({
    vegano: false,
    vegetariano: false,
    halal: false,
    kosher: false,
    sin_lactosa: false,
    sin_gluten: false,
  });

  const [communityRecipes, setCommunityRecipes] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    setFavIds(getFavorites());
  }, []);

  useEffect(() => {
    void supabase
      .from("user_recipes")
      .select("id, title, nationality, time_minutes, tags, ingredients, image_path, image_paths")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setCommunityRecipes(error ? [] : data || []);
      });
  }, []);

  const filtered = useMemo(() => {
    type Recipe = {
      id: string;
      title?: string;
      tags?: string[];
      nationality?: string;
      time?: number;
      ingredients?: RecipeForFilter["ingredients"];
    };

    const staticRecipes = (recipes as Recipe[]).filter(
      (r) => !r.id.includes("**") && (r.title ?? "") !== "(Nueva receta)"
    );

    const community = (communityRecipes as any[]).map((r) => ({
      id: r.id as string,
      title: (r.title as string) ?? null,
      nationality: (r.nationality as string | null) ?? undefined,
      time: (r.time_minutes as number | null) ?? undefined,
      tags: (r.tags as string[] | null) ?? [],
      ingredients: (r.ingredients as RecipeForFilter["ingredients"] | null) ?? [],
      image_path: (r.image_path as string | null) ?? undefined,
      image_paths: (r.image_paths as string[] | null) ?? undefined,
    }));

    const all: Recipe[] = [...staticRecipes, ...community];
    const baseList = all;

    const activeFilters = Object.entries(filters).filter(([, v]) => v).map(([k]) => k);
    const hasSearch = searchQuery.trim().length > 0;

    // Sin ningún filtro (Todos + sin opciones alimentarias + sin búsqueda) → siempre todas las recetas
    if (nationality === "todas" && activeFilters.length === 0 && !hasSearch) {
      return baseList;
    }

    let list = baseList;

    if (activeFilters.length > 0) {
      list = list.filter(
        (r) => activeFilters.every((f) => recipeMatchesDietFilter(r as RecipeForFilter, f))
      );
    }

    if (hasSearch) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => (r.title ?? "").toLowerCase().includes(q));
    }

    if (nationality === "aleatorio") {
      if (list.length === 0) return [];
      const idx = Math.floor(Math.random() * list.length);
      return [list[idx]];
    }

    if (nationality !== "todas") {
      const normFilter = normalizeNationality(nationality);
      list = list.filter(
        (r) => normalizeNationalityForFilter(r.nationality) === normFilter || normalizeNationality(r.nationality ?? "") === normFilter
      );
    }

    return list;
  }, [nationality, filters, searchQuery, randomKey, communityRecipes]);

  const chips: { key: Nationality; label: string }[] = [
    { key: "todas", label: "Todos" },
    { key: "espanola", label: "Española" },
    { key: "arabe", label: "Árabe" },
    { key: "india", label: "India" },
    { key: "palestina", label: "Palestina" },
    { key: "marroqui", label: "Marroquí" },
    { key: "aleatorio", label: "Aleatorio" },
  ];

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <h1 className="text-2xl font-bold text-primary">TaulApp</h1>
        <div className="flex items-center gap-1">
          <Link
            href="/nosotras"
            className="flex items-center justify-center w-10 h-10 rounded-full text-foreground hover:bg-muted"
            aria-label="Nosotras"
          >
            <Heart className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <AccountMenu />
        </div>
      </header>

      {/* Barra de búsqueda */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="¿Qué te apetece cocinar hoy?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 rounded-xl bg-white border-border"
          />
        </div>
      </div>

      {/* Pills nacionalidad (con banderas) */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 px-4">
        {chips.map((c) => {
          const active = c.key === nationality;
          return (
            <Button
              key={c.key}
              type="button"
              onClick={() => {
                if (c.key === "aleatorio" && nationality === "aleatorio") {
                  setRandomKey((k) => k + 1);
                } else {
                  setNationality(c.key);
                }
              }}
              variant={active ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full font-medium whitespace-nowrap shrink-0",
                active && "bg-primary text-primary-foreground"
              )}
            >
              <span className="mr-1.5">{nationalityFlag[c.key]}</span>
              {c.label}
            </Button>
          );
        })}
      </div>

      {/* Sección Opciones alimentarias (colapsable) */}
      <section className="px-4 mt-4">
        <button
          type="button"
          onClick={() => setOpcionesOpen(!opcionesOpen)}
          className="w-full flex items-center justify-between py-2 text-left"
        >
          <h2 className="font-bold text-foreground">Opciones alimentarias</h2>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", opcionesOpen && "rotate-180")} />
        </button>

        {opcionesOpen && (
          <div className="pt-2 pb-4 space-y-3">
            <div className="grid gap-2">
              {[
                ["vegano", "Vegano"],
                ["vegetariano", "Vegetariano"],
                ["halal", "Halal"],
                ["kosher", "Kosher"],
                ["sin_lactosa", "Sin lactosa"],
                ["sin_gluten", "Sin gluten"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between border rounded-xl p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <span className="font-medium">{label}</span>
                  <Checkbox
                    checked={(filters as Record<string, boolean>)[key]}
                    onCheckedChange={(checked) =>
                      setFilters((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Lista de recetas (cards con imagen) */}
      <div className="px-4 pb-6 grid gap-4 mt-2">
        {filtered.map((r) => {
          const dietaryTags = (r.tags || []).filter((t: string) => dietaryLabel[t]);
          const showTags = dietaryTags.slice(0, 3);
          const extraCount = dietaryTags.length - 3;
          const flag = getFlagForNationality(r.nationality) || nationalityFlag[r.nationality as Nationality] || "🌍";

          return (
            <Card key={r.id} className="relative overflow-hidden rounded-2xl border shadow-sm">
              <Link
                href={`/recipe/${r.id}`}
                className="block no-underline text-inherit"
              >
             {/* Imagen de la receta (comunidad: Supabase; estáticas: public) */}
<div className="relative w-full aspect-[16/10] bg-muted">
  {(() => {
    const urls = getRecipeImageUrls(r as { image_path?: string; image_paths?: string[] });
    if (urls.length > 0) {
      return (
        <img
          src={urls[0]}
          alt={r.title ? String(r.title) : `Receta: ${r.id}`}
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <Image
        src={`/${(r as { image?: string }).image ?? (RECIPE_IMAGE_OVERRIDES[r.id] ?? `${r.id}.jpeg`)}`}
        alt={r.title ? String(r.title) : `Receta: ${r.id}`}
        width={400}
        height={250}
        className="object-cover w-full h-full"
        unoptimized
      />
    );
  })()}
</div>

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
                    className="absolute right-2 top-2 h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white shadow"
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
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-foreground pr-6">{r.title}</h3>
                    <span className="shrink-0 text-lg" aria-hidden>{flag}</span>
                  </div>
                  <p className="text-sm text-foreground mt-1 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      {typeof r.time === "number" ? r.time : "—"} min
                    </span>
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

      {filtered.length === 0 && (
        <p className="px-4 py-8 text-center text-muted-foreground">
          No hay recetas con estos filtros.
        </p>
      )}
    </main>
  );
}
