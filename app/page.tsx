"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import { getFlagForNationality, getLabelForNationality, normalizeNationalityForFilter } from "./data/countries";

type NationalityKey = "todas" | "aleatorio";

/** Banderas por nacionalidad: España 🇪🇸, India 🇮🇳, Palestina 🇵🇸, Marruecos 🇲🇦, Arabia Saudí 🇸🇦 */
const nationalityFlag: Record<string, string> = {
  todas: "🌍",
  aleatorio: "🎲",
  espanola: "🇪🇸",
  española: "🇪🇸",
  arabe: "🇸🇦",
  india: "🇮🇳",
  palestina: "🇵🇸",
  marroqui: "🇲🇦",
  marroquí: "🇲🇦",
};

const dietaryTagStyle: Record<string, string> = {
  vegano: "bg-emerald-100 text-emerald-800",
  vegetariano: "bg-lime-100 text-lime-800",
  pescetariano: "bg-cyan-100 text-cyan-800",
  sin_frutos_secos: "bg-teal-100 text-teal-800",
  alta_proteina: "bg-blue-100 text-blue-800",
  halal: "bg-sky-100 text-sky-800",
  kosher: "bg-violet-100 text-violet-800",
  sin_lactosa: "bg-amber-100 text-amber-800",
  sin_gluten: "bg-orange-100 text-orange-800",
  dulce: "bg-pink-100 text-pink-800",
  salado: "bg-slate-100 text-slate-800",
  picante: "bg-red-100 text-red-800",
  muy_picante: "bg-rose-200 text-rose-900",
  acido: "bg-yellow-100 text-yellow-800",
  agridulce: "bg-fuchsia-100 text-fuchsia-800",
};

const dietaryLabel: Record<string, string> = {
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  pescetariano: "Pescetariano",
  sin_frutos_secos: "Sin frutos secos",
  alta_proteina: "Alta en proteína",
  halal: "Halal",
  kosher: "Kosher",
  sin_lactosa: "Sin lactosa",
  sin_gluten: "Sin gluten",
  dulce: "Dulce",
  salado: "Salado",
  picante: "Picante",
  muy_picante: "Muy picante",
  acido: "Ácido",
  agridulce: "Agridulce",
};

/** Recetas con imagen en .png u otro formato distinto a .jpeg */
const RECIPE_IMAGE_OVERRIDES: Record<string, string> = {
  fattouch: "fattouch.png",
  kanafeh: "knafeh.jpeg",
  "hummus-clasico": "hummus-clasico.png",
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

function normalizeForSearch(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function canonicalizeIngredientLabel(label: string): string {
  const raw = String(label ?? "").trim();
  if (!raw) return "";

  // Quita prefijos típicos de cantidad / medida ("una pizca", "2 cucharadas", "al gusto", etc.)
  const stripped = raw
    // quita paréntesis
    .replace(/\s*\([^)]*\)\s*/g, " ")
    // quita fracciones y números al inicio ("1/2", "2", "0,5", etc.)
    .replace(/^\s*(\d+([.,]\d+)?|\d+\s*\/\s*\d+)\s+/i, "")
    // quita cuantificadores comunes al inicio
    .replace(
      /^\s*(una|un|unas|unos)\s+(pizca|pizquita|chorrito|poco|poca|taza|tacita|cucharada|cucharadas|cucharadita|cucharaditas|cucharadita\s+de|cucharadas\s+de|tazas\s+de|vaso|vasos)\s+(de\s+)?/i,
      ""
    )
    .replace(/^\s*(pizca|pizcas|pizquita|pizquitas|chorrito|chorritos|al\s+gusto)\s+(de\s+)?/i, "")
    // quita coletillas muy comunes
    .replace(/\bdel?\s+d[ií]a\s+anterior\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const lowered = normalizeForSearch(stripped);

  // Casos especiales (para evitar variantes tipo "aceite de oliva", "aceite vegetal", etc.)
  if (lowered.startsWith("aceite")) return "Aceite";
  if (lowered.startsWith("arroz")) return "Arroz";
  if (lowered.startsWith("pan")) return "Pan";

  // Limpieza básica
  const withoutParens = stripped.replace(/\s+/g, " ").trim();

  // "X de Y" -> "X" (Vinagre de Jerez -> Vinagre, Aceite de oliva -> Aceite, Leche de coco -> Leche)
  const baseBeforeDe = withoutParens.split(/\s+de\s+/i)[0]?.trim() ?? withoutParens;

  // Quita adjetivos comunes al final (Tomate triturado -> Tomate, Pimentón dulce -> Pimentón)
  const dropTailWords = new Set([
    "fresco",
    "fresca",
    "frescos",
    "frescas",
    "molido",
    "molida",
    "molidos",
    "molidas",
    "triturado",
    "triturada",
    "triturados",
    "trituradas",
    "cocido",
    "cocida",
    "cocidos",
    "cocidas",
    "en",
    "polvo",
    "vegetal",
    "virgen",
    "extra",
    "negra",
    "negro",
    "negras",
    "negros",
    "dulce",
    "dulces",
    "verde",
    "verdes",
    "rojo",
    "roja",
    "rojos",
    "rojas",
    // variedades comunes de legumbres (queremos sugerir solo "Lentejas", "Garbanzos", etc.)
    "pardina",
    "pardinas",
  ]);

  const parts = baseBeforeDe.split(" ").filter(Boolean);
  while (parts.length > 1 && dropTailWords.has(normalizeForSearch(parts[parts.length - 1]))) {
    parts.pop();
  }

  const out = parts.join(" ").trim();
  if (!out) return "";
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function isExcludedFoodSuggestion(label: string): boolean {
  const s = normalizeForSearch(label);
  if (!s) return true;

  // Si todavía contiene números o fracciones, lo consideramos "cantidad" y se excluye
  if (/[0-9]/.test(s) || /\b\d+\s*\/\s*\d+\b/.test(s)) return true;

  // Palabras de cantidad sueltas
  if (/\b(pizca|pizcas|chorrito|chorritos|cucharada|cucharadas|cucharadita|cucharaditas|taza|tazas|vaso|vasos|al\s+gusto)\b/.test(s)) {
    return true;
  }

  // Bebidas (excluye también variantes tipo "agua mineral", "té verde", etc.)
  if (/\b(agua|cafe|te|infusion|zumo|jugo|cerveza|vino|licor|ron|whisky|brandy|refresco|cola|batido)\b/.test(s)) {
    return true;
  }

  // Especias y hierbas típicas
  const spices = new Set([
    "pimienta",
    "pimenton",
    "pimentón",
    "comino",
    "curry",
    "curcuma",
    "cúrcuma",
    "laurel",
    "oregano",
    "orégano",
    "canela",
    "clavo",
    "jengibre",
    "nuez moscada",
    "vainilla",
    "pimenton",
    "azafran",
    "azafrán",
    "perejil",
    "cilantro",
    "romero",
    "tomillo",
    "albahaca",
  ]);
  if (spices.has(s)) return true;

  // Condimentos / básicos que no quieres sugerir
  const condiments = new Set([
    "sal",
    "azucar",
    "azúcar",
    "vinagre",
    "mayonesa",
    "mostaza",
    "ketchup",
    "salsa",
  ]);
  if (condiments.has(s)) return true;

  return false;
}

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
  const router = useRouter();
  const [nationality, setNationality] = useState<string>("todas");
  const [favIds, setFavIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [opcionesOpen, setOpcionesOpen] = useState(false);
  const [randomKey, setRandomKey] = useState(0);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState({
    vegano: false,
    vegetariano: false,
    pescetariano: false,
    sin_frutos_secos: false,
    alta_proteina: false,
    halal: false,
    kosher: false,
    sin_lactosa: false,
    sin_gluten: false,
    dulce: false,
    salado: false,
    picante: false,
    muy_picante: false,
    acido: false,
    agridulce: false,
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

  const searchIndex = useMemo(() => {
    type StaticRecipe = { id: string; title?: string; ingredients?: { name?: string }[] } & Record<string, any>;
    const staticRecipes = (recipes as StaticRecipe[]).filter(
      (r) => !r.id.includes("**") && (r.title ?? "") !== "(Nueva receta)"
    );

    const recipeSuggestions = [
      ...staticRecipes.map((r) => ({ kind: "receta" as const, id: r.id, label: String(r.title ?? r.id) })),
      ...(communityRecipes as any[]).map((r) => ({ kind: "receta" as const, id: String(r.id), label: String(r.title ?? r.id) })),
    ];

    return {
      recipes: recipeSuggestions,
    };
  }, [communityRecipes]);

  const suggestions = useMemo(() => {
    const q = normalizeForSearch(searchQuery);
    if (!q) return [];

    const score = (label: string) => {
      const nl = normalizeForSearch(label);
      if (nl === q) return 0;
      if (nl.startsWith(q)) return 1;
      const idx = nl.indexOf(q);
      if (idx >= 0) return 2 + Math.min(idx, 20) / 100;
      return 999;
    };

    const raw = [
      ...searchIndex.recipes.map((r) => ({ ...r, _score: score(r.label) })),
    ].filter((s) => s._score < 999);

    raw.sort((a, b) => a._score - b._score || a.label.localeCompare(b.label, "es"));

    // evita duplicados por etiqueta (p.ej. misma receta en estático y comunidad)
    const seen = new Set<string>();
    const out: Array<{ kind: "receta"; id: string; label: string }> = [];
    for (const s of raw) {
      const key = `${s.kind}:${normalizeForSearch(s.label)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: "receta", id: (s as any).id, label: s.label });
      if (out.length >= 8) break;
    }
    return out;
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    const q = normalizeForSearch(searchQuery);
    if (!q) {
      setSuggestOpen(false);
      setActiveSuggestIdx(-1);
      return;
    }
    setSuggestOpen(suggestions.length > 0);
    setActiveSuggestIdx((idx) => (idx >= 0 && idx < suggestions.length ? idx : -1));
  }, [searchQuery, suggestions.length]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = searchWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setSuggestOpen(false);
        setActiveSuggestIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function applySuggestion(s: { kind: "receta"; id: string; label: string }) {
    setSuggestOpen(false);
    setActiveSuggestIdx(-1);
    router.push(`/recipe/${s.id}`);
  }

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
      const q = normalizeForSearch(searchQuery);
      list = list.filter((r) => normalizeForSearch(r.title ?? "").includes(q));
    }

    if (nationality === "aleatorio") {
      if (list.length === 0) return [];
      const idx = Math.floor(Math.random() * list.length);
      return [list[idx]];
    }

    if (nationality !== "todas") {
      const normFilter = normalizeNationalityForFilter(nationality) || normalizeNationality(nationality);
      list = list.filter(
        (r) =>
          normalizeNationalityForFilter(r.nationality) === normFilter ||
          normalizeNationality(r.nationality ?? "") === normFilter
      );
    }

    return list;
  }, [nationality, filters, searchQuery, randomKey, communityRecipes]);

  const chips = useMemo(() => {
    // Contamos recetas por nacionalidad (estáticas + comunidad) usando la misma normalización que el filtro.
    const counts = new Map<string, { count: number; sampleRaw: string }>();

    const addNationality = (rawNationality: unknown) => {
      const raw = String(rawNationality ?? "").trim();
      if (!raw) return;
      const key = normalizeNationalityForFilter(raw) || normalizeNationality(raw);
      if (!key) return;
      const prev = counts.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        counts.set(key, { count: 1, sampleRaw: raw });
      }
    };

    // Estáticas (recipes.json)
    for (const r of (recipes as any[])) {
      if (!r?.id || String(r.id).includes("**")) continue;
      if ((r.title ?? "") === "(Nueva receta)") continue;
      addNationality(r.nationality);
    }

    // Comunidad (Supabase)
    for (const r of (communityRecipes as any[])) {
      addNationality(r?.nationality);
    }

    const specialLabels: Record<string, string> = {
      espanola: "España",
      arabe: "Arabia",
      marroqui: "Marruecos",
    };

    const list = Array.from(counts.entries())
      .map(([key, meta]) => ({
        key,
        count: meta.count,
        label: specialLabels[key] ?? getLabelForNationality(meta.sampleRaw) ?? key,
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));

    return [
      { key: "todas", label: "Todos" },
      ...list.map(({ key, label }) => ({ key, label })),
      { key: "aleatorio", label: "Aleatorio" },
    ];
  }, [communityRecipes]);

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
        <div className="relative" ref={searchWrapRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="¿Qué te apetece cocinar hoy?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setSuggestOpen(true);
            }}
            onKeyDown={(e) => {
              if (!suggestOpen || suggestions.length === 0) {
                if (e.key === "Escape") {
                  setSuggestOpen(false);
                  setActiveSuggestIdx(-1);
                }
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestIdx((i) => {
                  const next = i + 1;
                  return next >= suggestions.length ? 0 : next;
                });
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestIdx((i) => {
                  const next = i - 1;
                  return next < 0 ? suggestions.length - 1 : next;
                });
              } else if (e.key === "Enter") {
                if (activeSuggestIdx >= 0 && activeSuggestIdx < suggestions.length) {
                  e.preventDefault();
                  applySuggestion(suggestions[activeSuggestIdx]);
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                setSuggestOpen(false);
                setActiveSuggestIdx(-1);
              }
            }}
            className="pl-9 h-11 rounded-xl bg-white border-border"
            aria-autocomplete="list"
            aria-expanded={suggestOpen}
            aria-controls="taulapp-search-suggestions"
          />

          {suggestOpen && suggestions.length > 0 && (
            <div
              id="taulapp-search-suggestions"
              role="listbox"
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
            >
              {suggestions.map((s, idx) => {
                const active = idx === activeSuggestIdx;
                return (
                  <button
                    key={`${s.kind}-${(s as any).id ?? s.label}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveSuggestIdx(idx)}
                    onMouseDown={(e) => {
                      // evita perder el foco antes del click
                      e.preventDefault();
                    }}
                    onClick={() => applySuggestion(s)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-3 hover:bg-accent",
                      active && "bg-accent"
                    )}
                  >
                    <span className="font-medium text-foreground truncate">{s.label}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      Receta
                    </span>
                  </button>
                );
              })}
            </div>
          )}
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
              <span className="mr-1.5">
                {nationalityFlag[c.key] ?? getFlagForNationality(c.key) ?? "🌍"}
              </span>
              {c.label}
            </Button>
          );
        })}
      </div>

      {/* Sección Etiquetas (colapsable) */}
      <section className="px-4 mt-4">
        <button
          type="button"
          onClick={() => setOpcionesOpen(!opcionesOpen)}
          className="w-full flex items-center justify-between py-2 text-left"
        >
          <h2 className="font-bold text-foreground">Etiquetas</h2>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", opcionesOpen && "rotate-180")} />
        </button>

        {opcionesOpen && (
          <div className="pt-2 pb-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dieta</p>
            <div className="grid gap-2">
              {[
                ["vegano", "Vegano"],
                ["vegetariano", "Vegetariano"],
                ["pescetariano", "Pescetariano"],
                ["sin_frutos_secos", "Sin frutos secos"],
                ["alta_proteina", "Alta en proteína"],
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
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-1">Sabor</p>
            <div className="grid gap-2">
              {[
                ["dulce", "Dulce"],
                ["salado", "Salado"],
                ["picante", "Picante"],
                ["muy_picante", "Muy picante"],
                ["acido", "Ácido"],
                ["agridulce", "Agridulce"],
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
          const flag = getFlagForNationality(r.nationality) || nationalityFlag[String(r.nationality ?? "")] || "🌍";

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
