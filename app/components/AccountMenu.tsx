"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSupabaseAuth } from "../lib/useSupabaseAuth";
import { cn } from "../lib/utils";

export default function AccountMenu() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🥦");

  useEffect(() => {
    if (!user) {
      setDisplayName("");
      return;
    }

    let cancelled = false;

    async function loadDisplayName() {
      if (!user) return;
      try {
        const [{ data: profileData }, { data: authData }] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle<{ display_name: string | null }>(),
          supabase.auth.getUser(),
        ]);

        if (cancelled) return;

        const meta = (authData.user?.user_metadata ??
          {}) as { display_name?: string | null; avatar_emoji?: string | null };
        const profileName = profileData?.display_name ?? null;
        const metaName = meta.display_name ?? null;

        const finalName =
          profileName?.trim() ||
          metaName?.trim() ||
          user.email ||
          "";

        setDisplayName(finalName);
        setAvatarEmoji((meta.avatar_emoji ?? "🥦") || "🥦");
      } catch {
        if (!cancelled) {
          setDisplayName(user.email ?? "");
          setAvatarEmoji("🥦");
        }
      }
    }

    void loadDisplayName();

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const headerLabel = displayName || user.email || "";

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
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/mi-usuario");
            }}
            className="w-full text-left px-3 py-2 border-b border-border/60 hover:bg-accent/60"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-base bg-muted">
                <span aria-hidden>{avatarEmoji || "🥦"}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Mi perfil</p>
                {headerLabel && (
                  <p
                    className="text-xs font-medium mt-0.5 truncate text-foreground"
                    title={headerLabel}
                  >
                    {headerLabel}
                  </p>
                )}
              </div>
            </div>
          </button>
          <div className="grid gap-0.5 pt-1">
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
              onClick={() => {
                setOpen(false);
                setConfirmSignOutOpen(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
      {confirmSignOutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar modal"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!signingOut) setConfirmSignOutOpen(false);
            }}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-4 shadow-xl">
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
              disabled={signingOut}
              onClick={() => setConfirmSignOutOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold text-foreground text-center">Hasa luego</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Estás apunto de cerrar sesión. ¡Nos vemos pronto!
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-accent disabled:opacity-60"
                disabled={signingOut}
                onClick={() => setConfirmSignOutOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="h-10 px-4 rounded-lg bg-destructive text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                disabled={signingOut}
                onClick={async () => {
                  try {
                    setSigningOut(true);
                    await supabase.auth.signOut();
                    setConfirmSignOutOpen(false);
                    router.push("/");
                  } finally {
                    setSigningOut(false);
                  }
                }}
              >
                {signingOut ? "Cerrando..." : "Aceptar"}
              </button>
            </div>
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

