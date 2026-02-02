"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Lightbulb, Heart, Users } from "lucide-react";
import { cn } from "../lib/utils";

const tabs = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/nosotras", label: "Nosotras", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[520px] mx-auto border-t border-border/60 bg-[var(--nav-bg)] p-3 flex justify-around items-center gap-1 safe-area-pb">
      {tabs.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors no-underline min-w-[64px]",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-6 w-6", active && "fill-primary")} strokeWidth={active ? 2.5 : 1.5} />
            <span className={cn("text-xs font-medium", active && "font-semibold")}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
