"use client";

import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto flex items-center justify-center px-4">
      <section className="w-full max-w-sm p-6 text-center">
        <p className="text-5xl font-black tracking-tight text-foreground">4🍳4</p>
        <h1 className="mt-3 text-lg font-semibold text-foreground">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta receta se nos ha quemado un poco. Vuelve al inicio para seguir cocinando.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold no-underline hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
