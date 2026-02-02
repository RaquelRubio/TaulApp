"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useMemo, useState, useEffect, useRef } from "react";
import recipes from "../../data/recipes.json";
import { Copy, MessageCircle } from "lucide-react";

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

function getNextRotationIndex(categoryKey: string): number {
  if (typeof window === "undefined") return 0;
  const storageKey = `taulapp:rec:${categoryKey}`;
  const current = Number(localStorage.getItem(storageKey) ?? "0");
  const next = current + 1;
  localStorage.setItem(storageKey, String(next));
  return next;
}

/** Recomendación solo para categorías concretas; una sola opción, rotando entre las disponibles. */
function getIngredientRecommendation(ingKey: string, ingName: string): string | null {
  const k = (ingKey ?? "").toLowerCase().trim();
  const n = (ingName ?? "").toLowerCase().trim();
  const combined = `${k} ${n}`;

  let category: keyof typeof RECOMMENDATION_OPTIONS | null = null;

  if (k.includes("aceite") || n.includes("aceite")) category = "aceite";
  else if (
    /leche|yogur|yoghur|queso|nata|mantequilla|crema\s+(de\s+)?leche/.test(combined) ||
    k.includes("leche") || k.includes("yogur") || k.includes("queso") ||
    k.includes("nata") || k.includes("mantequilla")
  ) category = "lacteos";
  else if (
    k.includes("pan") ||
    n.includes("barra de pan") ||
    n.includes("pan de barra") ||
    (n.includes("pan") && n.includes("barra"))
  ) category = "pan";
  else {
    const produceKeys = [
      "limon", "limón", "ajo", "cebolla", "patata", "tomate", "pimiento",
      "zanahoria", "calabacin", "calabacín", "berenjena", "pepino", "aguacate",
      "manzana", "pera", "naranja", "platano", "plátano", "cebollino", "puerro",
      "apio", "espinaca", "lechuga", "col", "brócoli", "brocoli", "calabaza",
      "judia", "judía", "guisante", "haba", "remolacha", "nabo", "rábano"
    ];
    if (produceKeys.some((pk) => k.includes(pk) || k === pk)) category = "fruta";
    else if (
      /fruta|verdura|hortaliza|legumbre\s+fresca|hoja\s+verde/.test(combined) ||
      n.includes("fruta") || n.includes("verdura") || n.includes("hortaliza") ||
      n.includes("a granel")
    ) category = "fruta";
    else if (
      /pollo|ternera|cordero|cerdo|carne|pavo|conejo|codorniz/.test(combined) ||
      k.includes("pollo") || k.includes("ternera") || k.includes("cordero") ||
      k.includes("cerdo") || k.includes("carne") || k.includes("pavo")
    ) category = "carne";
  }

  if (!category) return null;
  const options = RECOMMENDATION_OPTIONS[category];
  if (!options?.length) return null;
  if (options.length === 1) return options[0];
  const idx = getNextRotationIndex(category);
  return options[idx % options.length];
}

const TAG_LABELS: Record<string, string> = {
  vegano: "Vegano",
  halal: "Halal",
  kosher: "Kosher",
  sin_gluten: "Sin gluten",
  sin_lactosa: "Sin lactosa",
};

const TAG_COLORS: Record<string, string> = {
  vegano: "bg-emerald-100 text-emerald-800",
  halal: "bg-sky-100 text-sky-800",
  kosher: "bg-violet-100 text-violet-800",
  sin_gluten: "bg-amber-100 text-amber-800",
  sin_lactosa: "bg-rose-100 text-rose-800",
};

const DIET_TAGS = ["vegano", "halal", "kosher", "sin_gluten", "sin_lactosa"];

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

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [servings, setServings] = useState(4);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [brandModal, setBrandModal] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, [id]);

  useEffect(() => {
    if (!shareOpen) return;
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [shareOpen]);

  const recipe = useMemo(() => {
    return (recipes as any[]).find((r) => r.id === id) ?? null;
  }, [id]);

  if (!recipe) {
    return (
      <main className="min-h-screen bg-white font-sans max-w-[520px] mx-auto px-4 py-6">
        <p className="text-foreground">No encuentro esta receta.</p>
        <Link href="/" className="text-primary underline">
          Volver
        </Link>
      </main>
    );
  }

  const displayTags = (recipe.tags ?? []).filter((t: string) => DIET_TAGS.includes(t));
  const servingsOptions = Array.isArray(recipe.servings) ? recipe.servings : [2, 4, 6];

  const recipeTitle = recipe.title ?? (recipe as { name?: string }).name ?? recipe.id;
  const shareText = `Mira esta receta: ${recipeTitle}`;

  return (
    <main className="min-h-screen bg-white font-sans max-w-[520px] mx-auto text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border/60 flex items-center justify-between h-14 px-4">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-muted text-muted-foreground"
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
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-muted-foreground"
            aria-label="Compartir receta"
            aria-expanded={shareOpen}
            aria-haspopup="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Imagen */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-b-2xl">
        <Image
         src={`/${recipe.id}.jpeg`}
         alt={recipeTitle}
         fill
         className="object-cover"
         sizes="(max-width: 520px) 100vw, 520px"
         unoptimized
        />

      </div>

      <div className="px-4 pb-8">
        {/* Título y metadata */}
        <h1 className="text-2xl font-black mt-4 mb-1 text-foreground">
          {recipe.title ?? (recipe as { name?: string }).name}
        </h1>
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
          ? (ing.unit || "al gusto")
          : `${formatQuantity(scaledQty)} ${ing.unit || ""}`.trim();
        const recommendation = getIngredientRecommendation(ing.key ?? "", ing.name ?? "");
        const hasNote = ing.note && String(ing.note).trim();

      return (
        <li
          key={`${String(ing.key ?? ing.name ?? "ing")}-${idx}`}
          className="flex justify-between items-start gap-3 border-b border-border/60 pb-3 last:border-0"
        >
          <div>
            <p className="font-semibold text-foreground">{ing.name}</p>
            {(recommendation || hasNote) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {recommendation && recommendation in BRAND_DESCRIPTIONS ? (
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
                ) : recommendation ? (
                  recommendation + (hasNote ? ` — ${String(ing.note).trim()}` : "")
                ) : (
                  hasNote ? String(ing.note).trim() : ""
                )}
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
                <span className="pt-0.5 text-foreground">{step}</span>
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
            <p className="text-sm text-foreground/90">{recipe.storage}</p>
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
              {recipe.tips ?? (Array.isArray((recipe as { notes?: string[] }).notes) ? (recipe as { notes: string[] }).notes.join("\n") : "")}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
