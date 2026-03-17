"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Share2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";
import { cn } from "../lib/utils";

export default function AccountMenu() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted animate-pulse" aria-hidden />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center w-9 h-9 rounded-full text-foreground hover:bg-muted no-underline"
        aria-label="Iniciar sesión"
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
      </Link>
    );
  }

  const emailLabel = user.email ?? "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-9 h-9 rounded-full text-foreground hover:bg-muted"
        aria-label="Cuenta"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
      </button>
      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-lg py-2 z-50"
          )}
        >
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-xs text-muted-foreground">Sesión iniciada</p>
            {emailLabel && (
              <p className="text-xs font-medium mt-0.5 truncate text-foreground" title={emailLabel}>
                {emailLabel}
              </p>
            )}
          </div>
          <div className="grid gap-0.5 pt-1">
            <Link
              href="/mi-usuario"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-accent no-underline text-foreground"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" />
              Mi usuario
            </Link>
            <Link
              href="/mis-recetas"
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-accent no-underline text-foreground"
              onClick={() => setOpen(false)}
            >
              <UtensilsIcon className="h-4 w-4" />
              Mis recetas
            </Link>
            <button
              type="button"
              onClick={async () => {
                const origin =
                  typeof window !== "undefined" ? window.location.origin : "";
                if (!origin) return;
                try {
                  await navigator.clipboard.writeText(origin);
                  alert("Link de TaulApp copiado ✅");
                } catch {
                  // si falla el portapapeles, no hacemos nada especial
                }
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium hover:bg-accent text-foreground"
            >
              <Share2 className="h-4 w-4" />
              Compartir TaulApp
            </button>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                setOpen(false);
                router.push("/");
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UtensilsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 3v8a2 2 0 0 0 2 2h0v8" />
      <path d="M10 3v8a2 2 0 0 1-2 2h0" />
      <path d="M14 3h5l-1 9h-3l-1-9Z" />
      <path d="M16 12v10" />
    </svg>
  );
}

