"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";
import { Button } from "../components/ui/button";

type UserRecipe = {
  id: string;
  title: string | null;
  time_minutes: number | null;
  created_at: string;
};

export default function MisRecetasPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirectTo=/mis-recetas");
      return;
    }

    setLoadingRecipes(true);
    supabase
      .from("user_recipes")
      .select("id, title, time_minutes, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRecipes((data as UserRecipe[]) || []);
        setLoadingRecipes(false);
      })
      .catch(() => {
        setRecipes([]);
        setLoadingRecipes(false);
      });
  }, [user, loading, router]);

  async function handleDelete(recipeId: string) {
    if (!user || !confirm("¿Eliminar esta receta? No se puede deshacer.")) return;
    setDeletingId(recipeId);
    const { error } = await supabase
      .from("user_recipes")
      .delete()
      .eq("id", recipeId)
      .eq("author_id", user.id);
    setDeletingId(null);
    if (error) {
      alert("No se pudo eliminar. Inténtalo de nuevo.");
      return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground no-underline"
          >
            &larr; Inicio
          </Link>
          <h1 className="text-base font-semibold text-foreground">Mis recetas</h1>
          <div className="w-10" aria-hidden />
        </header>
        <section className="flex-1 px-4 py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando tus recetas…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground no-underline"
        >
          &larr; Inicio
        </Link>
        <h1 className="text-base font-semibold text-foreground">Mis recetas</h1>
        <div className="w-10" aria-hidden />
      </header>

      <section className="px-4 py-4 space-y-4 flex-1 overflow-y-auto pb-8">
        <p className="text-sm text-muted-foreground">
          Aquí verás las recetas que vayas creando. Para empezar, puedes crear una nueva receta:
        </p>

        <Button
          type="button"
          className="w-full h-11 rounded-xl font-semibold"
          onClick={() => router.push("/compartir")}
        >
          Compartir nueva receta
        </Button>

        <div className="mt-4">
          <h2 className="text-sm font-bold text-foreground mb-2">Recetas creadas por ti</h2>
          {loadingRecipes && (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          )}
          {!loadingRecipes && recipes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aún no has creado ninguna receta. Cuando guardes una, aparecerá aquí.
            </p>
          )}
          {!loadingRecipes && recipes.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card mt-1">
              {recipes.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/recipe/${r.id}`)}
                    className="flex-1 min-w-0 text-left px-3 py-3 flex items-center justify-between gap-3 hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {r.title || "Receta sin título"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {typeof r.time_minutes === "number" && r.time_minutes > 0
                          ? `${r.time_minutes} min`
                          : "Tiempo no indicado"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">&rarr;</span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/compartir?editar=${r.id}`);
                    }}
                    aria-label="Editar receta"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(r.id);
                    }}
                    disabled={deletingId === r.id}
                    aria-label="Eliminar receta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

