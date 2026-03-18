"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import recipes from "../data/recipes.json";
import { supabase } from "../lib/supabaseClient";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Search, Recycle } from "lucide-react";
import { cn } from "../lib/utils";

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

  const stripped = raw
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/^\s*(\d+([.,]\d+)?|\d+\s*\/\s*\d+)\s+/i, "")
    .replace(
      /^\s*(una|un|unas|unos)\s+(pizca|pizquita|chorrito|poco|poca|taza|tacita|cucharada|cucharadas|cucharadita|cucharaditas|cucharadita\s+de|cucharadas\s+de|tazas\s+de|vaso|vasos)\s+(de\s+)?/i,
      ""
    )
    .replace(/^\s*(pizca|pizcas|pizquita|pizquitas|chorrito|chorritos|al\s+gusto)\s+(de\s+)?/i, "")
    .replace(/\bdel?\s+d[ií]a\s+anterior\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const lowered = normalizeForSearch(stripped);
  if (lowered.startsWith("aceite")) return "Aceite";
  if (lowered.startsWith("arroz")) return "Arroz";
  if (lowered.startsWith("pan")) return "Pan";

  const baseBeforeDe = stripped.split(/\s+de\s+/i)[0]?.trim() ?? stripped;

  const dropTailWords = new Set([
    "fresco", "fresca", "frescos", "frescas",
    "molido", "molida", "molidos", "molidas",
    "triturado", "triturada", "triturados", "trituradas",
    "cocido", "cocida", "cocidos", "cocidas",
    "en", "polvo",
    "vegetal", "virgen", "extra",
    "negra", "negro", "negras", "negros",
    "dulce", "dulces",
    "verde", "verdes",
    "rojo", "roja", "rojos", "rojas",
    "pardina", "pardinas",
  ]);

  const parts = baseBeforeDe.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
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

  if (/[0-9]/.test(s) || /\b\d+\s*\/\s*\d+\b/.test(s)) return true;
  if (/\b(pizca|pizcas|chorrito|chorritos|cucharada|cucharadas|cucharadita|cucharaditas|taza|tazas|vaso|vasos|al\s+gusto)\b/.test(s)) return true;

  // Bebidas
  if (/\b(agua|cafe|te|infusion|zumo|jugo|cerveza|vino|licor|ron|whisky|brandy|refresco|cola|batido)\b/.test(s)) return true;

  // Especias/hierbas
  const spices = new Set([
    "pimienta", "pimenton", "pimentón", "comino", "curry", "curcuma", "cúrcuma", "laurel",
    "oregano", "orégano", "canela", "clavo", "jengibre", "nuez moscada", "vainilla",
    "azafran", "azafrán", "perejil", "cilantro", "romero", "tomillo", "albahaca",
  ]);
  if (spices.has(s)) return true;

  // Condimentos
  const condiments = new Set(["sal", "azucar", "azúcar", "vinagre", "mayonesa", "mostaza", "ketchup", "salsa"]);
  if (condiments.has(s)) return true;

  return false;
}

function getActiveToken(input: string): { token: string; start: number } {
  const lastComma = input.lastIndexOf(",");
  const start = lastComma === -1 ? 0 : lastComma + 1;
  const token = input.slice(start).trim();
  return { token, start };
}

function coerceIngredients(value: unknown): any[] {
  function parseLegacyIngredientLine(line: string): { name: string; qty: number | null; unit: string | null } {
    const l = String(line ?? "").trim();
    if (!l) return { name: "", qty: null, unit: null };

    function spanishWordToNumber(s: string): number | null {
      const t = (s ?? "").toLowerCase().trim();
      const map: Record<string, number> = {
        un: 1,
        uno: 1,
        una: 1,
        dos: 2,
        tres: 3,
        cuatro: 4,
        cinco: 5,
        seis: 6,
        siete: 7,
        ocho: 8,
        nueve: 9,
        diez: 10,
      };
      if (map[t] != null) return map[t];
      const n = Number.parseInt(t, 10);
      return Number.isNaN(n) ? null : n;
    }

    function numberToSpanishWord(n: number, feminine: boolean): string {
      if (n === 1) return feminine ? "una" : "un";
      const map: Record<number, string> = {
        2: "dos",
        3: "tres",
        4: "cuatro",
        5: "cinco",
        6: "seis",
        7: "siete",
        8: "ocho",
        9: "nueve",
        10: "diez",
      };
      return map[n] ?? String(n);
    }

    const containerNouns = new Set([
      "bote",
      "botes",
      "lata",
      "latas",
      "cuña",
      "cuñas",
      "diente",
      "dientes",
      "rama",
      "ramas",
      "cabeza",
      "cabezas",
      "paquete",
      "paquetes",
      "sobre",
      "sobres",
      "tarro",
      "tarros",
      "tubo",
      "tubos",
    ]);

    const pinchMatch = l.match(/^(una\s+pizca|un\s+pizca|pizca|una\s+punta|un\s+chorrito|chorrito)\s+de\s+(.+)$/i);
    if (pinchMatch) {
      return { name: pinchMatch[2].trim(), qty: null, unit: pinchMatch[1].toLowerCase() };
    }

    const containerMatch = l.match(/^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)\s+(?:de\s+)?(.+)$/i);
    if (containerMatch) {
      const qtyToken = containerMatch[1] ?? "";
      const containerRaw = (containerMatch[2] ?? "").trim();
      const rest = (containerMatch[3] ?? "").trim();
      const containerNorm = containerRaw.toLowerCase();
      if (containerNouns.has(containerNorm)) {
        const n = spanishWordToNumber(qtyToken);
        const feminine = containerNorm.endsWith("a") || containerNorm.endsWith("as");
        const word = n != null ? numberToSpanishWord(n, feminine) : qtyToken.toLowerCase();
        const singularContainer = containerNorm.endsWith("s") ? containerRaw.slice(0, -1) : containerRaw;
        const pluralContainer = containerNorm.endsWith("s") ? containerRaw : `${containerRaw}s`;
        const containerForm = n === 1 ? singularContainer : pluralContainer;
        return { name: rest, qty: null, unit: `${word} ${containerForm}`.replace(/\s+/g, " ").trim() };
      }
    }

    const simpleCountMatch = l.match(/^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+(.+)$/i);
    if (simpleCountMatch) {
      const n = spanishWordToNumber(simpleCountMatch[1] ?? "");
      const name = (simpleCountMatch[2] ?? "").trim();
      if (n != null && name) return { name, qty: n, unit: null };
    }

    const qtyUnitName =
      /^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(g|gr|gramos|kg|ml|l|ud|uds|unidad(?:es)?|cda|cdas|cdita|cdta|taza|tazas)?\b(?:\s+de)?\s+(.+)$/i;
    const m = l.match(qtyUnitName);
    if (m) {
      const qtyRaw = (m[1] ?? "").trim();
      const name = (m[3] ?? "").trim();
      let qty: number | null = null;
      if (qtyRaw.includes("/")) {
        const [a, b] = qtyRaw.split("/");
        const na = Number.parseFloat(a.replace(",", "."));
        const nb = Number.parseFloat(b.replace(",", "."));
        qty = !Number.isNaN(na) && !Number.isNaN(nb) && nb !== 0 ? na / nb : null;
      } else {
        const n = Number.parseFloat(qtyRaw.replace(",", "."));
        qty = Number.isNaN(n) ? null : n;
      }

      const unitRaw = (m[2] ?? "").toLowerCase();
      let unit: string | null = null;
      switch (unitRaw) {
        case "g":
        case "gr":
        case "gramos":
          unit = "g";
          break;
        case "kg":
          unit = "kg";
          break;
        case "ml":
          unit = "ml";
          break;
        case "l":
          unit = "l";
          break;
        case "ud":
        case "uds":
        case "unidad":
        case "unidades":
          unit = "ud";
          break;
        case "cda":
        case "cdas":
          unit = "cda";
          break;
        case "cdita":
        case "cdta":
          unit = "cdita";
          break;
        case "taza":
        case "tazas":
          unit = "taza";
          break;
        default:
          unit = unitRaw || null;
      }
      return { name, qty, unit };
    }

    const dashSplit = l.split("–");
    if (dashSplit.length === 2) {
      const left = dashSplit[0].trim();
      const right = dashSplit[1].trim();
      const m2 = right.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/i);
      if (m2) {
        const qtyRaw = (m2[1] ?? "").trim();
        let qty: number | null = null;
        if (qtyRaw.includes("/")) {
          const [a, b] = qtyRaw.split("/");
          const na = Number.parseFloat(a.replace(",", "."));
          const nb = Number.parseFloat(b.replace(",", "."));
          qty = !Number.isNaN(na) && !Number.isNaN(nb) && nb !== 0 ? na / nb : null;
        } else {
          const n = Number.parseFloat(qtyRaw.replace(",", "."));
          qty = Number.isNaN(n) ? null : n;
        }
        const unit = (m2[2] ?? "").trim() || null;
        return { name: left, qty, unit };
      }
    }

    return { name: l, qty: null, unit: "al gusto" };
  }

  function normalizeOne(ing: any): any {
    // strings -> parsear siempre
    if (typeof ing === "string") return parseLegacyIngredientLine(ing);

    if (ing && typeof ing === "object") {
      const nameRaw = String((ing as any).name ?? "").trim();
      const qty = (ing as any).qty;
      const unit = (ing as any).unit;
      const shouldReparse =
        nameRaw.length > 0 &&
        (qty === null || qty === undefined || Number.isNaN(Number(qty))) &&
        (unit === null || unit === undefined || String(unit).trim() === "" || String(unit).trim().toLowerCase() === "al gusto") &&
        // si hay números o patrones típicos, casi seguro que viene "plano"
        (/\d/.test(nameRaw) || /^\s*(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/i.test(nameRaw));

      if (shouldReparse) {
        const parsed = parseLegacyIngredientLine(nameRaw);
        return { ...(ing as any), ...parsed };
      }
      return ing;
    }
    return null;
  }

  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(normalizeOne).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeOne).filter(Boolean);
      }
      return [];
    } catch {
      const raw = value.trim();
      if (!raw) return [];
      const parts = raw
        .split(/\n|,|;/g)
        .map((x) => x.trim())
        .filter(Boolean);
      return parts.map(parseLegacyIngredientLine).filter((x) => x.name.trim().length > 0);
    }
  }

  return [];
}

export default function IdeasPage() {
  const [query, setQuery] = useState("");
  const [communityRecipes, setCommunityRecipes] = useState<any[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void supabase
      .from("user_recipes")
      .select("id, title, time_minutes, ingredients")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setCommunityRecipes(error ? [] : data || []);
      });
  }, []);

  const ingredientIndex = useMemo(() => {
    const staticList = (recipes as any[]).filter(
      (r) => !r.id?.includes("**") && (r.title ?? "") !== "(Nueva receta)"
    );

    const fromStatic = staticList
      .flatMap((r) => (r.ingredients ?? []).map((ing: any) => canonicalizeIngredientLabel(String(ing?.name ?? ing?.key ?? "").trim())))
      .filter(Boolean);

    const fromCommunity = (communityRecipes as any[])
      .flatMap((r) => coerceIngredients(r?.ingredients).map((ing) => canonicalizeIngredientLabel(String((ing && typeof ing === "object" ? (ing as any).name ?? (ing as any).key : ing) ?? "").trim())))
      .filter(Boolean);

    const uniq = Array.from(
      new Map([...fromStatic, ...fromCommunity].map((l) => [normalizeForSearch(l), l] as const)).values()
    ).filter((l) => !isExcludedFoodSuggestion(l));

    uniq.sort((a, b) => a.localeCompare(b, "es"));
    return uniq;
  }, [communityRecipes]);

  const token = useMemo(() => getActiveToken(query).token, [query]);

  const suggestions = useMemo(() => {
    const q = normalizeForSearch(token);
    if (!q) return [];

    // Solo autocompletar por prefijo (que EMPIECE por lo escrito).
    const matches = ingredientIndex.filter((label) => normalizeForSearch(label).startsWith(q));
    matches.sort((a, b) => a.localeCompare(b, "es"));
    return matches.slice(0, 8);
  }, [token, ingredientIndex]);

  useEffect(() => {
    const t = normalizeForSearch(token);
    if (!t) {
      setSuggestOpen(false);
      setActiveSuggestIdx(-1);
      return;
    }
    setSuggestOpen(suggestions.length > 0);
    setActiveSuggestIdx((idx) => (idx >= 0 && idx < suggestions.length ? idx : -1));
  }, [token, suggestions.length]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setSuggestOpen(false);
        setActiveSuggestIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function applySuggestion(label: string) {
    const { start } = getActiveToken(query);
    const before = query.slice(0, start).replace(/\s+$/g, "");
    const prefix = before.length === 0 ? "" : `${before}, `;
    setQuery(`${prefix}${label}, `);
    setSuggestOpen(false);
    setActiveSuggestIdx(-1);
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const terms = q.split(/[\s,]+/).filter(Boolean);
    if (terms.length === 0) return [];

    const list = [
      ...(recipes as any[]).filter(
        (r) => !r.id?.includes("**") && (r.title ?? "") !== "(Nueva receta)"
      ),
      ...(communityRecipes as any[]).map((r) => ({
        id: String(r.id),
        title: String(r.title ?? r.id),
        time_minutes: (r.time_minutes as number | null) ?? undefined,
        ingredients: coerceIngredients(r.ingredients),
      })),
    ];

    const filteredTerms = terms
      .map((t) => canonicalizeIngredientLabel(t))
      .map((t) => normalizeForSearch(t))
      .filter(Boolean)
      .filter((t) => !isExcludedFoodSuggestion(t));

    if (filteredTerms.length === 0) return [];

    return list.filter((r) =>
      filteredTerms.some((term) =>
        coerceIngredients(r.ingredients).some((ing: any) => {
          const raw = ing && typeof ing === "object" ? String(ing.name ?? ing.key ?? "") : String(ing ?? "");
          const label = canonicalizeIngredientLabel(raw);
          const nl = normalizeForSearch(label);
          return nl.includes(term);
        })
      )
    );
  }, [query, communityRecipes]);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto pb-24">
      <header className="h-14 flex items-center px-4 border-b border-border/60 shrink-0">
        <h1 className="text-xl font-bold text-foreground">Ideas</h1>
      </header>
      <div className="px-4 pt-4 pb-5">
        <p className="text-sm text-muted-foreground mb-4 leading-snug">
          Escribe los ingredientes disponibles y te sugeriremos recetas perfectas para ti
        </p>

        {/* Card: Tengo en casa... */}
        <Card className="rounded-2xl border shadow-sm mb-5 bg-white">
          <CardContent className="p-4">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Tengo en casa...
            </label>
            <div className="flex gap-2 relative" ref={wrapRef}>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
                placeholder="Ej: tomate, cebolla, arroz"
                className="flex-1 rounded-xl h-11 border-border bg-white"
                aria-autocomplete="list"
                aria-expanded={suggestOpen}
                aria-controls="taulapp-ideas-suggestions"
              />
              <Button
                type="button"
                size="icon"
                className="shrink-0 h-11 w-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                aria-label="Buscar recetas"
              >
                <Search className="h-5 w-5" />
              </Button>

              {suggestOpen && suggestions.length > 0 && (
                <div
                  id="taulapp-ideas-suggestions"
                  role="listbox"
                  className="absolute z-50 top-full left-0 mt-2 w-[calc(100%-52px)] overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
                >
                  {suggestions.map((label, idx) => {
                    const active = idx === activeSuggestIdx;
                    return (
                      <button
                        key={`${normalizeForSearch(label)}-${idx}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setActiveSuggestIdx(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applySuggestion(label)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-3 hover:bg-accent",
                          active && "bg-accent"
                        )}
                      >
                        <span className="font-medium text-foreground truncate">{label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">Ingrediente</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              Separa los ingredientes con comas
            </p>
          </CardContent>
        </Card>

        {/* Card: Aprovecha lo que tienes (solo cuando no hay búsqueda) */}
        {!query.trim() && (
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
        )}

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
                        {typeof r.time === "number"
                          ? r.time
                          : (r.time_minutes ?? "—")}{" "}
                        min
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
