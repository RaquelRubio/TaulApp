"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";

function DashboardContent() {
  const router = useRouter();
  const { user, loading } = useSupabaseAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const redirectTo = "/dashboard";
      router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground no-underline"
          >
            &larr; Inicio
          </Link>
          <h1 className="text-base font-semibold text-foreground">Dashboard</h1>
          <div className="w-10" aria-hidden />
        </header>
        <section className="flex-1 px-4 py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando tu cuenta…</p>
        </section>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground no-underline"
        >
          &larr; Inicio
        </Link>
        <h1 className="text-base font-semibold text-foreground">Dashboard</h1>
        <div className="w-10" aria-hidden />
      </header>

      <section className="flex-1 px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Bienvenido/a{user.email ? `, ${user.email}` : ""}.
        </p>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">Accesos rápidos</p>
          <Link
            href="/mi-usuario"
            className="block text-sm text-primary underline underline-offset-2 hover:underline"
          >
            Ir a Mi usuario
          </Link>
          <Link
            href="/mis-recetas"
            className="block text-sm text-primary underline underline-offset-2 hover:underline"
          >
            Ir a Mis recetas
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background max-w-[520px] mx-auto flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

