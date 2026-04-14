"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import recipes from "../../data/recipes.json";
import teamData from "../../data/team.json";
import { Copy, MessageCircle, Star } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../lib/useSupabaseAuth";
import { getRecipeImageUrl, getRecipeImageUrls } from "../../lib/recipeImages";
import { RecipeImageCarousel } from "../../components/RecipeImageCarousel";
import { isFavorite, toggleFavorite } from "../../lib/favorites";

type TeamMember = { id: string; name: string; image?: string; bio: string; recipeIds: string[] };
const team = teamData as TeamMember[];

function getAuthorByRecipeId(recipeId: string): TeamMember | null {
  for (const person of team) {
    if (person.recipeIds?.includes(recipeId)) return person;
  }
  return null;
}

/** Recetas con imagen en .png u otro formato distinto a .jpeg */
const RECIPE_IMAGE_OVERRIDES: Record<string, string> = {
  fattouch: "fattouch.png",
  kanafeh: "knafeh.jpeg",
  "hummus-clasico": "hummus-clasico.png",
  "gazpacho-andaluz": "gazpacho-andaluz.png",
};

/** Opciones por categoría; se muestra solo una y se va alternando. */
const RECOMMENDATION_OPTIONS: Record<string, string[]> = {
  aceite: ["Acesur", "Oleocampo", "Masía el Altet"],
  lacteos: ["Central Lechera Asturiana", "Calidad Pascual", "Covap"],
  pan: ["La panadería de la calle"],
  fruta: ["La frutería de tu barrio"],
  carne: ["La carnicería de toda la vida"],
};

/** Textos para el modal al clicar en una marca (solo marcas con descripción). */
const BRAND_DESCRIPTIONS: Record<string, { category: string; categoryEmoji: string; description: string }> = {
  "Acesur": {
    category: "Aceite",
    categoryEmoji: "🫒",
    description: "Empresa española con más de 180 años de historia, vinculada al olivar y al desarrollo del sector agrícola. Combina tradición, calidad y compromiso con el entorno rural.",
  },
  "Oleocampo": {
    category: "Aceite",
    categoryEmoji: "🫒",
    description: "Cooperativa andaluza formada por agricultores locales. Produce aceite de oliva virgen extra apostando por la igualdad, la sostenibilidad y el trabajo cooperativo.",
  },
  "Masía el Altet": {
    category: "Aceite",
    categoryEmoji: "🫒",
    description: "Finca familiar que elabora aceite de oliva virgen extra de alta calidad. Producción cuidada, respeto por la tierra y reconocimiento internacional.",
  },
  "Central Lechera Asturiana": {
    category: "Lácteos",
    categoryEmoji: "🥛",
    description: "Cooperativa de ganaderos españoles. Apoya al campo, promueve una producción responsable y garantiza trazabilidad y calidad desde el origen.",
  },
  "Calidad Pascual": {
    category: "Lácteos",
    categoryEmoji: "🥛",
    description: "Empresa familiar española con una fuerte apuesta por la innovación responsable, el bienestar animal y la sostenibilidad en toda su cadena de valor.",
  },
  "Covap": {
    category: "Lácteos",
    categoryEmoji: "🥛",
    description: "Cooperativa ganadera que agrupa a miles de familias del medio rural. Modelo basado en economía social, calidad alimentaria y desarrollo local.",
  },
};

type RecCategory = keyof typeof RECOMMENDATION_OPTIONS;

function capitalizeIngredientName(name: string): string {
  const s = String(name ?? "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
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
    if (typeof ing === "string") return parseLegacyIngredientLine(ing);
    if (ing && typeof ing === "object") {
      const nameRaw = String((ing as any).name ?? "").trim();
      const qty = (ing as any).qty;
      const unit = (ing as any).unit;
      const shouldReparse =
        nameRaw.length > 0 &&
        (qty === null || qty === undefined || Number.isNaN(Number(qty))) &&
        (unit === null || unit === undefined || String(unit).trim() === "" || String(unit).trim().toLowerCase() === "al gusto") &&
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
      if (Array.isArray(parsed)) return parsed.map(normalizeOne).filter(Boolean);
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

function getCategory(ingKey: string, ingName: string): RecCategory | null {
  const k = (ingKey ?? "").toLowerCase().trim();
  const n = (ingName ?? "").toLowerCase().trim();
  const combined = `${k} ${n}`;
  if (k.includes("aceite") || n.includes("aceite")) return "aceite";
  if (
    /leche|yogur|yoghur|queso|nata|mantequilla|crema\s+(de\s+)?leche/.test(combined) ||
    k.includes("leche") || k.includes("yogur") || k.includes("queso") ||
    k.includes("nata") || k.includes("mantequilla")
  ) return "lacteos";
  if (
    k.includes("pan") ||
    n.includes("barra de pan") ||
    n.includes("pan de barra") ||
    (n.includes("pan") && n.includes("barra"))
  ) return "pan";
  const produceKeys = [
    "limon", "limón", "ajo", "cebolla", "patata", "tomate", "pimiento",
    "zanahoria", "calabacin", "calabacín", "berenjena", "pepino", "aguacate",
    "manzana", "pera", "naranja", "platano", "plátano", "cebollino", "puerro",
    "apio", "espinaca", "lechuga", "col", "brócoli", "brocoli", "calabaza",
    "judia", "judía", "guisante", "haba", "remolacha", "nabo", "rábano"
  ];
  if (produceKeys.some((pk) => k.includes(pk) || k === pk)) return "fruta";
  if (
    /fruta|verdura|hortaliza|legumbre\s+fresca|hoja\s+verde/.test(combined) ||
    n.includes("fruta") || n.includes("verdura") || n.includes("hortaliza") ||
    n.includes("a granel")
  ) return "fruta";
  if (
    /pollo|ternera|cordero|cerdo|carne|pavo|conejo|codorniz/.test(combined) ||
    k.includes("pollo") || k.includes("ternera") || k.includes("cordero") ||
    k.includes("cerdo") || k.includes("carne") || k.includes("pavo")
  ) return "carne";
  return null;
}

/** Solo lectura: índice actual de rotación (no incrementa). Estable en SSR. */
function getCurrentRotationIndex(categoryKey: string): number {
  if (typeof window === "undefined") return 0;
  const storageKey = `taulapp:rec:${categoryKey}`;
  return Number(localStorage.getItem(storageKey) ?? "0");
}

function getNextRotationIndex(categoryKey: string): number {
  if (typeof window === "undefined") return 0;
  const storageKey = `taulapp:rec:${categoryKey}`;
  const current = Number(localStorage.getItem(storageKey) ?? "0");
  const next = current + 1;
  localStorage.setItem(storageKey, String(next));
  return next;
}

/** Recomendación estable (misma en servidor y cliente) para evitar hydration mismatch. */
function getStableIngredientRecommendation(ingKey: string, ingName: string): string | null {
  const category = getCategory(ingKey, ingName);
  if (!category) return null;
  const options = RECOMMENDATION_OPTIONS[category];
  if (!options?.length) return null;
  return options[0];
}

const TAG_LABELS: Record<string, string> = {
  vegano: "Vegano",
  vegetariano: "Vegetariano",
  pescetariano: "Pescetariano",
  sin_frutos_secos: "Sin frutos secos",
  alta_proteina: "Alta en proteína",
  halal: "Halal",
  kosher: "Kosher",
  sin_gluten: "Sin gluten",
  sin_lactosa: "Sin lactosa",
  dulce: "Dulce",
  salado: "Salado",
  picante: "Picante",
  muy_picante: "Muy picante",
  acido: "Ácido",
  agridulce: "Agridulce",
};

const TAG_COLORS: Record<string, string> = {
  vegano: "bg-emerald-100 text-emerald-800",
  vegetariano: "bg-lime-100 text-lime-800",
  pescetariano: "bg-cyan-100 text-cyan-800",
  sin_frutos_secos: "bg-teal-100 text-teal-800",
  alta_proteina: "bg-blue-100 text-blue-800",
  halal: "bg-sky-100 text-sky-800",
  kosher: "bg-violet-100 text-violet-800",
  sin_gluten: "bg-amber-100 text-amber-800",
  sin_lactosa: "bg-rose-100 text-rose-800",
  dulce: "bg-pink-100 text-pink-800",
  salado: "bg-slate-100 text-slate-800",
  picante: "bg-red-100 text-red-800",
  muy_picante: "bg-rose-200 text-rose-900",
  acido: "bg-yellow-100 text-yellow-800",
  agridulce: "bg-fuchsia-100 text-fuchsia-800",
};

const DIET_TAGS = [
  "vegano",
  "vegetariano",
  "pescetariano",
  "sin_frutos_secos",
  "alta_proteina",
  "halal",
  "kosher",
  "sin_gluten",
  "sin_lactosa",
  "dulce",
  "salado",
  "picante",
  "muy_picante",
  "acido",
  "agridulce",
];

/** Convierte texto con **negrita** en nodos React (texto y <strong>). */
function renderTextWithBold(text: string | undefined): React.ReactNode {
  const s = typeof text === "string" ? text : "";
  if (!s || !s.includes("**")) return s;
  const parts = s.split("**");
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;

  const fractions: Record<number, string> = {
    0.25: "1/4",
    0.5: "1/2",
    0.75: "3/4",
  };

  if (fractions[rounded]) {
    return fractions[rounded];
  }

  // números enteros
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  // fallback decimal limpio
  return String(rounded);
}

function RecipeContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const fromFavoritos = searchParams.get("from") === "favoritos";
  const [servings, setServings] = useState(4);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [brandModal, setBrandModal] = useState<string | null>(null);
  const [rotatedRecommendations, setRotatedRecommendations] = useState<Record<string, string>>({});
  const [authorImageFailed, setAuthorImageFailed] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [dbRecipe, setDbRecipe] = useState<any | null>(null);
  const [loadingDbRecipe, setLoadingDbRecipe] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [favoritesReady, setFavoritesReady] = useState(false);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, [id]);

  useEffect(() => {
    setFavorite(isFavorite(id));
    setFavoritesReady(true);
  }, [id]);

  useEffect(() => {
    if (!shareOpen) return;
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [shareOpen]);

  const staticRecipe = useMemo(() => {
    return (recipes as any[]).find((r) => r.id === id) ?? null;
  }, [id]);

  useEffect(() => {
    if (staticRecipe) {
      setDbRecipe(null);
      setLoadingDbRecipe(false);
      return;
    }
    let cancelled = false;
    setLoadingDbRecipe(true);
    void supabase
      .from("user_recipes")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setDbRecipe(null);
        } else {
          const next = { ...(data as any) };
          next.ingredients = coerceIngredients((data as any).ingredients);
          setDbRecipe(next);
        }
        setLoadingDbRecipe(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, staticRecipe]);

  const recipe = staticRecipe ?? dbRecipe;

  useEffect(() => {
    if (!recipe?.ingredients) return;
    const categories = new Set<RecCategory>();
    for (const ing of recipe.ingredients as { key?: string; name?: string }[]) {
      const cat = getCategory(ing.key ?? "", ing.name ?? "");
      if (cat) categories.add(cat);
    }
    const next: Record<string, string> = {};
    for (const category of categories) {
      const options = RECOMMENDATION_OPTIONS[category];
      if (!options?.length) continue;
      const idx = getNextRotationIndex(category);
      next[category] = options[idx % options.length];
    }
    setRotatedRecommendations(next);
  }, [recipe?.id]);

  if (!recipe) {
    return (
      <main className="min-h-screen bg-white font-sans max-w-[520px] mx-auto px-4 py-6">
        {loadingDbRecipe ? (
          <p className="text-foreground">Buscando esta receta...</p>
        ) : (
          <>
            <p className="text-foreground">No encuentro esta receta.</p>
            <Link href="/" className="text-primary underline">
              Volver
            </Link>
          </>
        )}
      </main>
    );
  }

  const displayTags = (recipe.tags ?? []).filter((t: string) => DIET_TAGS.includes(t));
  const servingsOptions = Array.isArray(recipe.servings) ? recipe.servings : [1, 2, 4];

  const recipeTitle = recipe.title ?? (recipe as { name?: string }).name ?? recipe.id;
  const shareText = `Mira esta receta: ${recipeTitle}`;
  const isCommunityRecipe = !!dbRecipe && !staticRecipe;

  return (
    <main className="min-h-screen bg-white font-sans max-w-[520px] mx-auto text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border/60 h-14 flex items-center justify-between px-4 shrink-0">
        <Link
          href={fromFavoritos ? "/favoritos" : "/"}
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full text-foreground hover:bg-muted"
          aria-label="Volver"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="relative" ref={shareRef}>
            <button
              type="button"
              onClick={() => setShareOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-full text-foreground hover:bg-muted"
              aria-label="Compartir receta"
              aria-expanded={shareOpen}
              aria-haspopup="true"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
              </svg>
            </button>
          {shareOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-lg py-2 z-50">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs text-muted-foreground">Compartir receta</p>
                <p className="text-xs font-medium truncate mt-0.5 text-foreground" title={recipeTitle}>{recipeTitle}</p>
                <p className="text-xs truncate mt-0.5" title={shareUrl}>{shareUrl || "…"}</p>
              </div>
              <div className="grid gap-0.5 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!shareUrl) return;
                    await navigator.clipboard.writeText(shareUrl);
                    setShareOpen(false);
                    alert("Link copiado ✅");
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-accent"
                >
                  <Copy className="h-4 w-4" />
                  Copiar link
                </button>
                <a
                  href={shareUrl ? `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-accent no-underline text-foreground"
                  onClick={() => setShareOpen(false)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Compartir por WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modal marca */}
      {brandModal && BRAND_DESCRIPTIONS[brandModal] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setBrandModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="brand-modal-title"
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-muted-foreground mb-1">
              {BRAND_DESCRIPTIONS[brandModal].categoryEmoji} {BRAND_DESCRIPTIONS[brandModal].category}
            </p>
            <h3 id="brand-modal-title" className="text-lg font-bold text-foreground mb-2">
              {brandModal}
            </h3>
            <p className="text-sm text-foreground/90 leading-relaxed mb-4">
              {BRAND_DESCRIPTIONS[brandModal].description}
            </p>
            <button
              type="button"
              onClick={() => setBrandModal(null)}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Imagen o carrusel (máx. 6 fotos) */}
      {(() => {
        const imageUrls = getRecipeImageUrls(recipe as { image_path?: string; image_paths?: string[] });
        if (imageUrls.length > 0) {
          return <RecipeImageCarousel urls={imageUrls} alt={recipeTitle} />;
        }
        return (
          <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-b-2xl">
            <Image
              src={`/${(recipe as { image?: string }).image ?? (RECIPE_IMAGE_OVERRIDES[recipe.id] ?? `${recipe.id}.jpeg`)}`}
              alt={recipeTitle}
              fill
              className="object-cover"
              sizes="(max-width: 520px) 100vw, 520px"
              unoptimized
            />
          </div>
        );
      })()}

      <div className="px-4 pb-8">
        {/* Título y metadata */}
        <div className="mt-4 mb-1 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-black text-foreground">
            {recipe.title ?? (recipe as { name?: string }).name}
          </h1>
          {favoritesReady && (
            <button
              type="button"
              onClick={() => {
                const next = toggleFavorite(recipe.id);
                setFavorite(next.includes(recipe.id));
              }}
              className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-card hover:bg-accent transition-colors"
              aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
              title={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
              <Star
                className={
                  favorite
                    ? "h-4 w-4 fill-amber-400 text-amber-500"
                    : "h-4 w-4 fill-none text-muted-foreground"
                }
              />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {typeof (recipe as { time?: number }).time === "number"
              ? (recipe as { time: number }).time
              : (recipe as { time_minutes?: number }).time_minutes ?? "—"} minutos
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {servings} personas
          </span>
        </div>

        {/* Tags dietéticos */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {displayTags.map((tag: string) => (
              <span
                key={tag}
                className={`px-3 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground"}`}
              >
                {TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}

        {/* Raciones */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-2">Raciones</h2>
          <div className="flex gap-2">
            {servingsOptions.map((n: number) => (
              <button
                key={n}
                type="button"
                onClick={() => setServings(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  servings === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredientes */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-foreground mb-3">Ingredientes</h2>
          <ul className="space-y-3">
    {(recipe.ingredients ?? []).map((ing: any, idx: number) => {
      const baseQty: number | null =
        ing.qty === null || ing.qty === undefined ? null : Number(ing.qty);
      const baseServings = Number((recipe as { baseServings?: number }).baseServings ?? 1);
      const scaledQty =
        baseQty === null ? null : baseQty * (Number(servings ?? 1) / baseServings);

        const qtyText =
        scaledQty === null
          ? (String(ing.unit ?? "").trim() || "al gusto")
          : `${formatQuantity(scaledQty)} ${ing.unit || ""}`.trim();
        const category = getCategory(ing.key ?? "", ing.name ?? "");
        const recommendation = (category && rotatedRecommendations[category]) ?? getStableIngredientRecommendation(ing.key ?? "", ing.name ?? "");
        const hasNote = ing.note && String(ing.note).trim();
        const canBeKosher = !!ing.canBeKosher;
        const canBeHalal = !!ing.canBeHalal;
        const dietaryNote =
          canBeKosher && canBeHalal
            ? "Puede ser kosher o halal (elegir carne con el certificado correspondiente)."
            : canBeKosher
              ? "Puede ser kosher (elegir carne con certificado kashrut)."
              : canBeHalal
                ? "Puede ser halal (elegir carne sacrificada según Dhabiha)."
                : null;

      return (
        <li
          key={`${String(ing.key ?? ing.name ?? "ing")}-${idx}`}
          className="flex justify-between items-start gap-3 border-b border-border/60 pb-3 last:border-0"
        >
          <div>
            <p className="font-semibold text-foreground">{capitalizeIngredientName(ing.name)}</p>
            {dietaryNote && (
              <p className="text-xs text-muted-foreground mt-0.5 italic">
                {dietaryNote}
              </p>
            )}
            {(recommendation && recommendation in BRAND_DESCRIPTIONS || hasNote) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {recommendation && recommendation in BRAND_DESCRIPTIONS && (
                  <>
                    <button
                      type="button"
                      onClick={() => setBrandModal(recommendation)}
                      className="underline underline-offset-1 hover:text-foreground focus:outline-none focus:underline"
                    >
                      {recommendation}
                    </button>
                    {hasNote ? ` — ${String(ing.note).trim()}` : ""}
                  </>
                )}
                {(!recommendation || !(recommendation in BRAND_DESCRIPTIONS)) && hasNote && String(ing.note).trim()}
              </p>
            )}
          </div>
          <span className="text-sm text-foreground whitespace-nowrap">
            {qtyText}
          </span>
        </li>
      );
    })}
  </ul>
</section>


        {/* Preparación */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-foreground mb-3">Preparación</h2>
          <ol className="space-y-3">
            {(recipe.steps ?? []).map((step: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="pt-0.5 text-foreground">{renderTextWithBold(step)}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Conservación */}
        {recipe.storage && (
          <section className="mb-5 rounded-xl bg-sky-50 border border-sky-100 p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Conservación
            </h3>
            <p className="text-sm text-foreground/90">{renderTextWithBold(recipe.storage)}</p>
          </section>
        )}

        {/* Consejos prácticos */}
        {(recipe.tips || (Array.isArray((recipe as { notes?: string[] }).notes) && (recipe as { notes: string[] }).notes.length > 0)) && (
          <section className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
              </svg>
              Consejos prácticos
            </h3>
            <p className="text-sm text-foreground/90 whitespace-pre-line">
              {renderTextWithBold(recipe.tips ?? (Array.isArray((recipe as { notes?: string[] }).notes) ? (recipe as { notes: string[] }).notes.join("\n") : ""))}
            </p>
          </section>
        )}

        {/* Curiosidades y tradición */}
        {((recipe as { curiosidades?: string }).curiosidades ?? "").trim() && (
          <section className="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.6 3.8L18 8.4l-3.2 2.7L15.7 15 12 12.8 8.3 15l.9-3.9L6 8.4l4.4-1.6L12 3z" />
                <path d="M19 17l.8 1.9L22 19.7l-1.6 1.3.5 2-1.9-1.1-1.9 1.1.5-2L16 19.7l2.2-.8L19 17z" />
              </svg>
              Curiosidades y tradición
            </h3>
            <p className="text-sm text-foreground/90 whitespace-pre-line">
              {renderTextWithBold((recipe as { curiosidades?: string }).curiosidades)}
            </p>
          </section>
        )}

        {/* Editar / Eliminar (solo recetas propias de la comunidad) */}
        {dbRecipe && user?.id === (recipe as { author_id?: string }).author_id && (
          <section className="mt-6 pt-4 border-t border-border/60 flex flex-wrap gap-2">
            <Link
              href={`/compartir?editar=${recipe.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 no-underline"
            >
              Editar receta
            </Link>
            <button
              type="button"
              onClick={async () => {
                if (!user || !confirm("¿Eliminar esta receta? No se puede deshacer.")) return;
                await supabase
                  .from("user_recipes")
                  .delete()
                  .eq("id", recipe.id)
                  .eq("author_id", user.id);
                window.location.href = "/mis-recetas";
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive border border-destructive hover:bg-destructive/10"
            >
              Eliminar receta
            </button>
          </section>
        )}

        {/* Autor de la receta (comunidad) */}
        {isCommunityRecipe && (
          <section className="mt-6 pt-4 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Receta compartida por
            </p>
            {(() => {
              const authorId = (recipe as { author_id?: string | null }).author_id ?? null;
              const rawName =
                (recipe as { author_display_name?: string | null }).author_display_name ??
                "Persona de la comunidad";
              const safeName = String(rawName).trim() || "Persona de la comunidad";

              // Si es la receta de la usuaria actual, usamos su emoji de perfil
              const isCurrentUserAuthor = !!authorId && !!user && user.id === authorId;
              const avatarEmoji = isCurrentUserAuthor
                ? (user?.user_metadata?.avatar_emoji || "🥦")
                : null;

              const fallbackEmoji = "👩🏻‍🍳";

              const content = (
                <>
                  <span className="relative w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center text-2xl">
                    {avatarEmoji ? (
                      <span aria-hidden>{avatarEmoji}</span>
                    ) : (
                      <span aria-hidden>{fallbackEmoji}</span>
                    )}
                  </span>
                  <span className="font-medium text-foreground">{safeName}</span>
                </>
              );

              if (!authorId) {
                return (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-transparent">
                    {content}
                  </div>
                );
              }

              return (
                <Link
                  href={`/nosotras#community-${authorId}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60 transition-colors"
                >
                  {content}
                </Link>
              );
            })()}
          </section>
        )}

        {/* Autor de la receta (solo recetas del equipo) */}
        {(() => {
          const author = getAuthorByRecipeId(recipe.id);
          if (!author) return null;
          const showAuthorImage = author.image && !authorImageFailed;
          return (
            <section className="mt-6 pt-4 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Receta de</p>
              <Link
                href={`/nosotras#person-${author.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60 transition-colors"
              >
                <span className="relative w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center text-2xl">
                  {showAuthorImage ? (
                    <img
                      src={author.image}
                      alt=""
                      width={48}
                      height={48}
                      className="w-full h-full object-cover object-center"
                      style={{ imageOrientation: "from-image" }}
                      onError={() => setAuthorImageFailed(true)}
                    />
                  ) : (
                    <span aria-hidden>{(author as { emoji?: string }).emoji ?? "👩🏻‍🍳"}</span>
                  )}
                </span>
                <span className="font-medium text-foreground">{author.name}</span>
              </Link>
            </section>
          );
        })()}
      </div>
    </main>
  );
}

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white max-w-[520px] mx-auto flex items-center justify-center"><p className="text-foreground">Cargando receta...</p></main>}>
      <RecipeContent params={params} />
    </Suspense>
  );
}
