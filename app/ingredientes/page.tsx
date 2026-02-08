"use client";

import { useMemo, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";
import ingredientesData from "@/app/data/ingredientes_marcas_seguras_es.json";
import { ChevronDown, Search } from "lucide-react";

type BrandOption = {
  brand_origin: string;
  product: string;
};

type IngredienteItem = {
  ingredient: string;
  note?: string;
  options: BrandOption[];
};

const data = ingredientesData as IngredienteItem[];

export default function IngredientesPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) =>
      item.ingredient.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto pb-24">
      <header className="h-14 flex items-center px-4 border-b border-border/60 shrink-0">
        <h1 className="text-xl font-bold text-primary">Ingredientes</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-snug">
          Ingredientes de origen europeo, con prioridad para España, apostando por la cercanía, el comercio justo y los productores locales siempre que sea posible.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Buscar ingredientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar ingredientes"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center">
            No hay ingredientes que coincidan con &quot;{search}&quot;.
          </p>
        ) : (
          <ul className="space-y-1">
            {filtered.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <li
                  key={`${item.ingredient}-${index}`}
                  className="border border-border rounded-[var(--radius)] overflow-hidden bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-4 py-3 text-left",
                      "hover:bg-muted/50 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    )}
                    aria-expanded={isOpen}
                    aria-controls={`ingrediente-content-${index}`}
                    id={`ingrediente-trigger-${index}`}
                  >
                    <span className="font-medium text-foreground">
                      {item.ingredient}
                    </span>
                    <span className="text-muted-foreground text-sm ml-auto flex items-center gap-1">
                      {item.options.length}
                      <ChevronDown
                        className={cn(
                          "size-5 text-muted-foreground shrink-0 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  <div
                    id={`ingrediente-content-${index}`}
                    role="region"
                    aria-labelledby={`ingrediente-trigger-${index}`}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="px-4 pb-4 pt-0 border-t border-border/60 space-y-3">
                        {item.note && (
                          <p className="text-sm text-muted-foreground italic pt-3">
                            {item.note}
                          </p>
                        )}
                        <ul className="space-y-2">
                          {item.options.map((opt, optIndex) => (
                            <li
                              key={`${opt.brand_origin}-${optIndex}`}
                              className="text-sm rounded-md bg-muted/50 p-3 space-y-1"
                            >
                              <p className="font-medium text-foreground">
                                {opt.brand_origin}
                              </p>
                              {opt.product !== opt.brand_origin && (
                                <p className="text-muted-foreground">
                                  {opt.product}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
