"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";

const SEEN_KEY = "taulapp_guest_login_prompt_seen";

export default function GuestLoginPrompt() {
  const { user, loading } = useSupabaseAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const hideOnRoute = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith("/login") ||
      pathname.startsWith("/registro") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/auth")
    );
  }, [pathname]);

  useEffect(() => {
    if (loading || user || hideOnRoute) return;

    const alreadySeen = window.sessionStorage.getItem(SEEN_KEY);
    if (alreadySeen === "1") return;

    setOpen(true);
    window.sessionStorage.setItem(SEEN_KEY, "1");
  }, [loading, user, hideOnRoute]);

  if (!open || loading || user || hideOnRoute) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/45"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
        <button
          type="button"
          aria-label="Cerrar"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold text-foreground pr-8">
          Inicia sesión y aumenta tus habilidades de cocinillas 🍳
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sube tus recetas, guarda tus favoritas y gestiona tu perfil culinario.
        </p>

        <div className="mt-4 grid gap-2">
          <Link
            href={`/login?redirectTo=${encodeURIComponent(pathname || "/")}`}
            className="h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold no-underline flex items-center justify-center hover:opacity-90"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="h-10 rounded-lg border border-border text-sm font-medium no-underline flex items-center justify-center hover:bg-accent"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
