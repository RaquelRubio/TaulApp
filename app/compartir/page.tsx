"use client";

import { FormEvent, Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";
import { getRecipeImageUrl, MAX_RECIPE_IMAGES } from "../lib/recipeImages";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { NationalityAutocomplete } from "../components/NationalityAutocomplete";

type RecipeTag =
  | "vegano"
  | "vegetariano"
  | "pescetariano"
  | "sin_frutos_secos"
  | "alta_proteina"
  | "halal"
  | "kosher"
  | "sin_gluten"
  | "sin_lactosa"
  | "dulce"
  | "salado"
  | "picante"
  | "muy_picante"
  | "acido"
  | "agridulce";

const DIET_TAGS: { id: RecipeTag; label: string }[] = [
  { id: "vegano", label: "Vegano" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "pescetariano", label: "Pescetariano" },
  { id: "sin_frutos_secos", label: "Sin frutos secos" },
  { id: "alta_proteina", label: "Alta en proteína" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
  { id: "sin_gluten", label: "Sin gluten" },
  { id: "sin_lactosa", label: "Sin lactosa" },
];

const FLAVOR_TAGS: { id: RecipeTag; label: string }[] = [
  { id: "dulce", label: "Dulce" },
  { id: "salado", label: "Salado" },
  { id: "picante", label: "Picante" },
  { id: "muy_picante", label: "Muy picante" },
  { id: "acido", label: "Ácido" },
  { id: "agridulce", label: "Agridulce" },
];

const STORAGE_TIPS: string[] = [
  "La mayor parte de las recetas aguanta perfectamente 3-4 días en la nevera en recipiente hermético.",
  "Si lleva patata, mejor no congelar porque cambia la textura.",
  "La carne cocinada puede mantenerse congelada 2-3 meses sin perder demasiada calidad.",
  "La espinaca fresca aguanta poco (2-3 días en nevera), pero cocinada puede congelarse en porciones.",
  "Congela en porciones y etiqueta con fecha.",
  "Enfría antes de guardar (máx. 2 h a temperatura ambiente).",
  "Al recalentar, que llegue bien caliente en el centro.",
];

const PRACTICAL_TIPS_EXAMPLES: string[] = [
  "Si te queda espeso, añade 1-2 cucharadas de agua caliente.",
  "Prueba de sal al final, justo antes de servir.",
  "Si usas bote de garbanzos, lávalos bien para que quede más suave.",
  "Prepara los ingredientes antes de empezar para cocinar más rápido.",
  "Deja reposar 5 minutos antes de servir para que se asienten los sabores.",
];

function capitalizeIngredientName(name: string): string {
  const s = String(name ?? "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function CompartirContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useSupabaseAuth();

  const [title, setTitle] = useState("");
  const [nationality, setNationality] = useState("");
  const [timeMinutes, setTimeMinutes] = useState<string>("");
  const [dietTags, setDietTags] = useState<RecipeTag[]>([]);
  const [baseServings, setBaseServings] = useState<1 | 2 | 4>(4);
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [tips, setTips] = useState("");
  const [storage, setStorage] = useState("");
  const [curiosidades, setCuriosidades] = useState("");
  const [storagePlaceholder, setStoragePlaceholder] = useState(
    "Ej. La mayor parte de las recetas aguanta perfectamente 3-4 días en la nevera en recipiente hermético."
  );
  const [tipsPlaceholder, setTipsPlaceholder] = useState(
    "Ej. Si te queda espeso, añade 1-2 cucharadas de agua caliente."
  );
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const editId = searchParams.get("editar");

  function parseIngredientLine(line: string): { name: string; qty: number | null; unit: string | null } {
    const raw = line.trim();
    if (!raw) {
      return { name: "", qty: null, unit: null };
    }

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

    // 1) Cantidades textuales tipo "una pizca de sal"
    const pinchMatch = raw.match(/^(una\s+pizca|un\s+pizca|pizca|una\s+punta|un\s+chorrito|chorrito)\s+de\s+(.+)$/i);
    if (pinchMatch) {
      const unitText = pinchMatch[1].toLowerCase();
      const name = capitalizeIngredientName(pinchMatch[2].trim());
      return {
        name,
        qty: null,
        unit: unitText,
      };
    }

    // 1.5) Cantidad + "envase/pieza" + (de) + ingrediente
    // Ej: "2 botes de corazones de alcachofas" -> name: "corazones de alcachofas", unit: "dos botes"
    // Ej: "1 cuña de Grana Padano" -> name: "Grana Padano", unit: "una cuña"
    const containerMatch = raw.match(/^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)?)\s+(?:de\s+)?(.+)$/i);
    if (containerMatch) {
      const qtyToken = containerMatch[1] ?? "";
      const containerRaw = (containerMatch[2] ?? "").trim();
      const rest = (containerMatch[3] ?? "").trim();

      const containerNorm = containerRaw.toLowerCase();
      if (containerNouns.has(containerNorm)) {
        const n = spanishWordToNumber(qtyToken);
        const feminine = containerNorm.endsWith("a") || containerNorm.endsWith("as");
        const word = n != null ? numberToSpanishWord(n, feminine) : qtyToken.toLowerCase();

        const singularContainer =
          containerNorm.endsWith("s") ? containerRaw.slice(0, -1) : containerRaw;
        const pluralContainer =
          containerNorm.endsWith("s") ? containerRaw : `${containerRaw}s`;
        const containerForm = n === 1 ? singularContainer : pluralContainer;

        return {
          name: capitalizeIngredientName(rest),
          qty: null,
          unit: `${word} ${containerForm}`.replace(/\s+/g, " ").trim(),
        };
      }
    }

    // 1.6) Cantidad simple + ingrediente (sin unidad) "1 limón" / "un limón"
    const simpleCountMatch = raw.match(/^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+(.+)$/i);
    if (simpleCountMatch) {
      const n = spanishWordToNumber(simpleCountMatch[1] ?? "");
      const name = capitalizeIngredientName((simpleCountMatch[2] ?? "").trim());
      if (n != null && name) {
        return { name, qty: n, unit: null };
      }
    }

    // 2) Soportar líneas tipo "200g de arroz redondo" o "200 g arroz redondo"
    //    Sin grupos con nombre para máxima compatibilidad.
    const qtyUnitName =
      /^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(g|gr|gramos|kg|ml|l|ud|uds|unidad(?:es)?|cda|cdas|cdita|cdta|taza|tazas)?\b(?:\s+de)?\s+(.+)$/i;
    const m = raw.match(qtyUnitName);
    if (m) {
      const qtyRaw = (m[1] ?? "").trim();
      const name = capitalizeIngredientName((m[3] ?? "").trim());
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

      return {
        name,
        qty,
        unit,
      };
    }

    // 3) Soportar líneas tipo "Arroz redondo – 200 g"
    const dashSplit = raw.split("–");
    if (dashSplit.length === 2) {
      const left = dashSplit[0].trim();
      const right = dashSplit[1].trim();
      const m2 =
        /^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*(.*)$/i;
      const mRight = right.match(m2);
      if (mRight) {
        const qtyRaw = (mRight[1] ?? "").trim();
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
        const unit = (mRight[2] ?? "").trim() || null;
        return {
          name: capitalizeIngredientName(left),
          qty,
          unit,
        };
      }
    }

    // 4) Sin cantidad reconocible: mostramos "al gusto"
    return {
      name: capitalizeIngredientName(raw),
      qty: null,
      unit: "al gusto",
    };
  }

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirectTo = searchParams.get("redirectTo") || "/compartir";
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }, [user, loading, router, searchParams]);

  useEffect(() => {
    if (!user || !editId) return;
    setLoadingEdit(true);
    void supabase
      .from("user_recipes")
      .select("*")
      .eq("id", editId)
      .eq("author_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setError("No se pudo cargar la receta.");
          setLoadingEdit(false);
          return;
        }
        if (!data) {
          setError("No tienes permiso para editar esta receta.");
          setLoadingEdit(false);
          return;
        }
        const r = data as any;
        setTitle(r.title ?? "");
        setNationality(r.nationality ?? "");
        setTimeMinutes(r.time_minutes != null ? String(r.time_minutes) : "");
        setDietTags(Array.isArray(r.tags) ? r.tags : []);
        setBaseServings(
          (r.baseServings === 1 || r.baseServings === 2 || r.baseServings === 4)
            ? r.baseServings
            : 4
        );
        setIngredientsText(
          Array.isArray(r.ingredients)
            ? r.ingredients
                .map((i: { name?: string; qty?: number | null; unit?: string | null }) => {
                  const name = (i?.name ?? "").trim();
                  const hasQty = i?.qty != null && !Number.isNaN(Number(i.qty));
                  const unit = (i?.unit ?? "").trim();
                  if (hasQty) {
                    const qtyText = String(i.qty);
                    if (unit) {
                      return `${qtyText} ${unit} ${name}`.trim();
                    }
                    return `${qtyText} ${name}`.trim();
                  }
                  if (unit) return `${unit} ${name}`.trim();
                  return name;
                })
                .join("\n")
            : ""
        );
        setStepsText(Array.isArray(r.steps) ? r.steps.join("\n") : "");
        setTips(r.tips ?? "");
        setStorage(r.storage ?? "");
        setCuriosidades(r.curiosidades ?? "");
        if (Array.isArray(r.image_paths) && r.image_paths.length > 0) {
          setExistingImagePaths(r.image_paths.filter((p: unknown) => typeof p === "string" && p.trim()));
        } else if (r.image_path?.trim()) {
          setExistingImagePaths([r.image_path.trim()]);
        }
        setLoadingEdit(false);
      });
  }, [user, editId]);

  useEffect(() => {
    if (STORAGE_TIPS.length === 0) return;
    const idx = Math.floor(Math.random() * STORAGE_TIPS.length);
    setStoragePlaceholder(`Ej. ${STORAGE_TIPS[idx]}`);
  }, []);

  useEffect(() => {
    if (PRACTICAL_TIPS_EXAMPLES.length === 0) return;
    const idx = Math.floor(Math.random() * PRACTICAL_TIPS_EXAMPLES.length);
    setTipsPlaceholder(`Ej. ${PRACTICAL_TIPS_EXAMPLES[idx]}`);
  }, []);

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newFiles]);

  const totalSlots = MAX_RECIPE_IMAGES - existingImagePaths.length;
  const canAddMore = totalSlots > 0;
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const take = Math.min(files.length, totalSlots);
    setNewFiles((prev) => [...prev, ...files.slice(0, take)].slice(0, totalSlots));
    e.target.value = "";
  }

  function removeExisting(index: number) {
    setExistingImagePaths((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNew(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading || !user || (editId && loadingEdit)) {
    return (
      <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground no-underline"
          >
            &larr; Volver
          </Link>
          <h1 className="text-base font-semibold text-foreground">
            {editId ? "Editar receta" : "Compartir receta"}
          </h1>
          <div className="w-10" aria-hidden />
        </header>
        <section className="flex-1 px-4 py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {editId ? "Cargando receta..." : "Cargando tu sesión..."}
          </p>
        </section>
      </main>
    );
  }

  function toggleDietTag(tag: RecipeTag) {
    setDietTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    const isEdit = !!editId;
    setError(null);
    setSubmitting(true);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Pon un título a tu receta.");
      setSubmitting(false);
      return;
    }

    const timeNumber =
      timeMinutes.trim() === "" ? null : Number.parseInt(timeMinutes.trim(), 10);
    if (timeNumber === null || Number.isNaN(timeNumber) || timeNumber <= 0) {
      setError("Indica el tiempo en minutos (obligatorio).");
      setSubmitting(false);
      return;
    }

    const ingredients = ingredientsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => parseIngredientLine(line))
      .filter((ing) => ing.name.length > 0);

    if (ingredients.length === 0) {
      setError("Añade al menos un ingrediente (obligatorio).");
      setSubmitting(false);
      return;
    }

    const steps = stepsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (steps.length === 0) {
      setError("Añade al menos un paso de preparación (obligatorio).");
      setSubmitting(false);
      return;
    }

    const totalImages = existingImagePaths.length + newFiles.length;
    if (totalImages === 0) {
      setError("Añade al menos una foto de la receta (obligatorio).");
      setSubmitting(false);
      return;
    }
    if (totalImages > MAX_RECIPE_IMAGES) {
      setError(`Máximo ${MAX_RECIPE_IMAGES} fotos por receta.`);
      setSubmitting(false);
      return;
    }

    // Aseguramos que existe un perfil para esta usuaria (necesario por la FK author_id → profiles.id)
    // y preparamos un nombre público para «Quiénes cocinan».
    let authorDisplayName: string | null = null;

    const [{ data: existingProfile }, { data: authData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.auth.getUser(),
    ]);

    const metaDisplayName = (authData.user?.user_metadata as { display_name?: string } | null | undefined)?.display_name;

    // Nombre público elegido por la persona (perfil o metadatos).
    // Si no hay ninguno, más abajo generaremos "Cocinillas N".
    authorDisplayName =
      (existingProfile?.display_name ?? "").trim() ||
      (metaDisplayName ?? "").trim() ||
      null;

    // Si seguimos sin nombre, generamos un alias tipo "Cocinillas N"
    if (!authorDisplayName) {
      const { data: cocinillasProfiles } = await supabase
        .from("profiles")
        .select("display_name")
        .ilike("display_name", "Cocinillas %");

      let maxNumber = 0;
      for (const row of cocinillasProfiles ?? []) {
        const raw = String((row as { display_name?: string }).display_name ?? "").trim();
        const match = raw.match(/^Cocinillas\s+(\d+)$/i);
        if (match) {
          const n = Number.parseInt(match[1], 10);
          if (!Number.isNaN(n) && n > maxNumber) maxNumber = n;
        }
      }
      const nextNumber = maxNumber + 1;
      authorDisplayName = `Cocinillas ${nextNumber}`;
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: authorDisplayName,
    });

    if (profileError) {
      setSubmitting(false);
      setError(
        profileError.message ||
          "No se ha podido preparar tu perfil para guardar la receta."
      );
      return;
    }

    const uploadedPaths: string[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!file?.size) continue;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = `${user.id}/${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("recipe-images")
        .upload(safeName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setSubmitting(false);
        const msg = (uploadError.message ?? "").toLowerCase();
        const isBucketNotFound = msg.includes("bucket not found") || msg.includes("not found");
        const isRls = msg.includes("row-level security") || msg.includes("policy");
        setError(
          isBucketNotFound
            ? "Falta crear el bucket de fotos en Supabase: ve a Storage → New bucket → nombre «recipe-images», público. Ver docs/supabase.md."
            : isRls
              ? "Storage no permite subir aún. En Supabase SQL Editor ejecuta las políticas de Storage del docs/supabase.md (sección 4, paso 2)."
              : uploadError.message || "No se ha podido subir una foto. Inténtalo de nuevo."
        );
        return;
      }
      uploadedPaths.push(safeName);
    }
    const imagePaths = [...existingImagePaths, ...uploadedPaths].slice(0, MAX_RECIPE_IMAGES);
    const imagePath = imagePaths[0] ?? null;

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("user_recipes")
        .update({
          title: trimmedTitle,
          nationality: nationality.trim() || null,
          time_minutes: timeNumber,
          tags: dietTags,
          ingredients,
          steps,
          tips: tips.trim() || null,
          storage: storage.trim() || null,
          curiosidades: curiosidades.trim() || null,
          baseServings,
          image_path: imagePath,
          image_paths: imagePaths,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editId)
        .eq("author_id", user.id);

      if (updateError) {
        const um = (updateError.message ?? "").toLowerCase();
        const isMissingColumn =
          um.includes("image_paths") ||
          um.includes("curiosidades") ||
          um.includes("schema cache");

        // Fallback: reintentar sin image_paths para no bloquear a la usuaria
        if (isMissingColumn) {
          const { error: fallbackError } = await supabase
            .from("user_recipes")
            .update({
              title: trimmedTitle,
              nationality: nationality.trim() || null,
              time_minutes: timeNumber,
              tags: dietTags,
              ingredients,
              steps,
              tips: tips.trim() || null,
              storage: storage.trim() || null,
              baseServings,
              image_path: imagePath,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editId)
            .eq("author_id", user.id);

          if (!fallbackError) {
            router.push(`/recipe/${editId}`);
            return;
          }

          setSubmitting(false);
          setError(
            fallbackError.message ||
              "No se ha podido guardar los cambios (image_paths). Inténtalo de nuevo en un momento."
          );
          return;
        }

        setSubmitting(false);
        setError(
          updateError.message ||
            "No se ha podido guardar los cambios. Inténtalo de nuevo."
        );
        return;
      }
      router.push(`/recipe/${editId}`);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("user_recipes")
      .insert([
        {
          author_id: user.id,
          author_display_name: authorDisplayName,
          title: trimmedTitle,
          nationality: nationality.trim() || null,
          time_minutes: timeNumber,
          tags: dietTags,
          ingredients,
          steps,
          tips: tips.trim() || null,
          storage: storage.trim() || null,
          curiosidades: curiosidades.trim() || null,
          baseServings,
          image_path: imagePath,
          image_paths: imagePaths,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      const msg = (insertError.message ?? "").toLowerCase();
      const isRls =
        msg.includes("row-level security") || msg.includes("policy");
      const isMissingColumn =
        msg.includes("image_paths") ||
        msg.includes("curiosidades") ||
        msg.includes("schema cache");

      // Fallback: reintentar insert sin image_paths si la columna no existe
      if (isMissingColumn) {
        const { data: dataFallback, error: fallbackError } = await supabase
          .from("user_recipes")
          .insert([
            {
              author_id: user.id,
              author_display_name: authorDisplayName,
              title: trimmedTitle,
              nationality: nationality.trim() || null,
              time_minutes: timeNumber,
              tags: dietTags,
              ingredients,
              steps,
              tips: tips.trim() || null,
              storage: storage.trim() || null,
              baseServings,
              image_path: imagePath,
            },
          ])
          .select("id")
          .single();

        if (!fallbackError && dataFallback?.id) {
          router.push(`/recipe/${dataFallback.id}`);
          return;
        }

        setSubmitting(false);
        setError(
          fallbackError?.message ||
            "No se ha podido guardar la receta (image_paths). Inténtalo de nuevo en un momento."
        );
        return;
      }

      setSubmitting(false);
      setError(
        isRls
          ? "Error de permisos (RLS). Comprueba en Supabase: Storage → bucket recipe-images → políticas de subida, y que la tabla user_recipes tenga las políticas del docs/supabase.md."
          : insertError.message ||
            "No se ha podido guardar la receta. Inténtalo de nuevo en un momento."
      );
      return;
    }

    if (data?.id) {
      router.push(`/recipe/${data.id}`);
    } else {
      setSubmitting(false);
      setError("La receta se ha guardado pero no puedo abrirla. Vuelve a intentarlo.");
    }
  }

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          href={editId ? `/recipe/${editId}` : "/"}
          className="text-sm text-muted-foreground hover:text-foreground no-underline"
        >
          &larr; {editId ? "Volver a la receta" : "Inicio"}
        </Link>
        <h1 className="text-base font-semibold text-foreground">
          {editId ? "Editar receta" : "Compartir receta"}
        </h1>
        <div className="w-10" aria-hidden />
      </header>

      <section className="flex-1 px-4 py-4 pb-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="recipe-title">
              Título de la receta <span className="text-destructive">*</span>
            </label>
            <Input
              id="recipe-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Hummus cremoso de garbanzo"
              className="rounded-xl bg-white border-border"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Fotos de la receta (máx. {MAX_RECIPE_IMAGES}) <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Al menos una foto. En la ficha de la receta se verán en un carrusel.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            {canAddMore && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors"
              >
                Añadir fotos ({existingImagePaths.length + newFiles.length}/{MAX_RECIPE_IMAGES})
              </button>
            )}
            {(existingImagePaths.length > 0 || newPreviews.length > 0) && (
              <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                {existingImagePaths.map((path, i) => (
                  <div key={`e-${i}`} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted group">
                    <img
                      src={getRecipeImageUrl(path) ?? ""}
                      alt={`Vista previa ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newPreviews.map((url, i) => (
                  <div key={`n-${i}`} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-border bg-muted group">
                    <img
                      src={url}
                      alt={`Nueva foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="recipe-nationality">
                Nacionalidad (opcional)
              </label>
              <NationalityAutocomplete
                id="recipe-nationality"
                value={nationality}
                onChange={setNationality}
                placeholder="Ej. España, India, Marruecos..."
              />
            </div>
            <div className="w-32 space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="recipe-minutes">
                Minutos <span className="text-destructive">*</span>
              </label>
              <Input
                id="recipe-minutes"
                type="number"
                min={1}
                required
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value)}
                placeholder="30"
                className="rounded-xl bg-white border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Raciones base <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-1">
              Elige para cuántas raciones son las cantidades que vas a escribir en los ingredientes.
              Luego la app recalculará automáticamente las cantidades para 1, 2 o 4 personas.
            </p>
            <div className="flex gap-2">
              {[1, 2, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBaseServings(n as 1 | 2 | 4)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    baseServings === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {n} {n > 1 ? "raciones" : "ración"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Etiquetas (opcional)</label>
            <p className="text-xs text-muted-foreground">
              Añade etiquetas para facilitar la búsqueda de tus recetas.
            </p>
            <p className="text-xs text-muted-foreground">Dieta</p>
            <div className="flex flex-wrap gap-2">
              {DIET_TAGS.map((tag) => {
                const active = dietTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleDietTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Sabor</p>
            <div className="flex flex-wrap gap-2">
              {FLAVOR_TAGS.map((tag) => {
                const active = dietTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleDietTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="recipe-ingredients">
              Ingredientes <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-1">
              Escribe al menos un ingrediente por línea. Ejemplo:{" "}
              <em>200 g garbanzos cocidos</em>, <em>2 cdas tahini</em>…
            </p>
            <textarea
              id="recipe-ingredients"
              required
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-vertical"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="recipe-steps">
              Pasos de la preparación <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground mb-1">
              Escribe al menos un paso en cada línea.
            </p>
            <textarea
              id="recipe-steps"
              required
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-vertical"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Consejos prácticos (opcional)
            </label>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-vertical"
              placeholder={tipsPlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Conservación (opcional)
            </label>
            <textarea
              value={storage}
              onChange={(e) => setStorage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-vertical"
              placeholder={storagePlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Curiosidades y tradición (opcional)
            </label>
            <textarea
              value={curiosidades}
              onChange={(e) => setCuriosidades(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm resize-vertical"
              placeholder="Ej. Origen del plato, forma tradicional de servirlo, costumbres..."
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl font-semibold mt-2"
            disabled={submitting}
          >
            {submitting
              ? editId
                ? "Guardando cambios..."
                : "Guardando receta..."
              : editId
                ? "Guardar cambios"
                : "Guardar y compartir"}
          </Button>
        </form>
      </section>
    </main>
  );
}

export default function CompartirPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    }>
      <CompartirContent />
    </Suspense>
  );
}
