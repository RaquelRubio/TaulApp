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

type DietTag = "vegano" | "vegetariano" | "halal" | "kosher" | "sin_gluten" | "sin_lactosa";

const DIET_TAGS: { id: DietTag; label: string }[] = [
  { id: "vegano", label: "Vegano" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
  { id: "sin_gluten", label: "Sin gluten" },
  { id: "sin_lactosa", label: "Sin lactosa" },
];

function CompartirContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useSupabaseAuth();

  const [title, setTitle] = useState("");
  const [nationality, setNationality] = useState("");
  const [timeMinutes, setTimeMinutes] = useState<string>("");
  const [dietTags, setDietTags] = useState<DietTag[]>([]);
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [tips, setTips] = useState("");
  const [storage, setStorage] = useState("");
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const editId = searchParams.get("editar");

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
        setIngredientsText(
          Array.isArray(r.ingredients)
            ? r.ingredients.map((i: { name?: string }) => i?.name ?? "").join("\n")
            : ""
        );
        setStepsText(Array.isArray(r.steps) ? r.steps.join("\n") : "");
        setTips(r.tips ?? "");
        setStorage(r.storage ?? "");
        if (Array.isArray(r.image_paths) && r.image_paths.length > 0) {
          setExistingImagePaths(r.image_paths.filter((p: unknown) => typeof p === "string" && p.trim()));
        } else if (r.image_path?.trim()) {
          setExistingImagePaths([r.image_path.trim()]);
        }
        setLoadingEdit(false);
      });
  }, [user, editId]);

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

  function toggleDietTag(tag: DietTag) {
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
      .map((name) => ({ name }));

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

    const [{ data: existingProfile, error: profileSelectError }, { data: authData }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.auth.getUser(),
      ]);

    const metaDisplayName = (authData.user?.user_metadata as { display_name?: string } | null | undefined)
      ?.display_name;
    const emailFallback = authData.user?.email ?? user.email ?? null;
    const emailNamePart =
      emailFallback && emailFallback.includes("@")
        ? emailFallback.split("@")[0]
        : emailFallback;

    authorDisplayName =
      (existingProfile?.display_name ?? "").trim() ||
      (metaDisplayName ?? "").trim() ||
      (emailNamePart ?? "").trim() ||
      null;

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
          image_path: imagePath,
          image_paths: imagePaths,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editId)
        .eq("author_id", user.id);

      if (updateError) {
        setSubmitting(false);
        const um = (updateError.message ?? "").toLowerCase();
        const isMissingColumn = um.includes("image_paths") || um.includes("schema cache");
        setError(
          isMissingColumn
            ? "Falta la columna image_paths. En Supabase → SQL Editor ejecuta: alter table public.user_recipes add column if not exists image_paths text[] default '{}'; (ver docs/supabase.md)."
            : updateError.message ||
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
          image_path: imagePath,
          image_paths: imagePaths,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      setSubmitting(false);
      const msg = (insertError.message ?? "").toLowerCase();
      const isRls =
        msg.includes("row-level security") || msg.includes("policy");
      const isMissingColumn =
        msg.includes("image_paths") || msg.includes("schema cache");
      setError(
        isMissingColumn
          ? "Falta la columna image_paths. En Supabase → SQL Editor ejecuta: alter table public.user_recipes add column if not exists image_paths text[] default '{}'; (ver docs/supabase.md)."
          : isRls
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
        <p className="text-sm text-muted-foreground mb-4">
          {editId
            ? "Modifica los campos que quieras y guarda. Puedes tener hasta 6 fotos en la receta."
            : "Crea una receta sencilla para compartirla con otras personas en TaulApp. Puedes subir hasta 6 fotos."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            />
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
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Etiquetas (opcional)
            </label>
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
