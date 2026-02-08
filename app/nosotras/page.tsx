"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/app/lib/utils";
import teamData from "@/app/data/team.json";
import recipesData from "@/app/data/recipes.json";
import { ChevronDown, ChevronRight } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  tagline?: string;
  image?: string;
  bio: string;
  recipeIds: string[];
};

type Recipe = { id: string; title: string };

const team = teamData as TeamMember[];
const recipes = recipesData as Recipe[];

const recipesById: Record<string, Recipe> = {};
recipes.forEach((r) => { recipesById[r.id] = r; });

function SobreTaulapp() {
  return (
    <article className="max-w-none text-foreground space-y-4 text-sm leading-relaxed font-normal">
      <p>
        <strong>Comer es un acto político</strong>, aunque durante años nos hayan intentado convencer de lo contrario. Cada ingrediente que eliges apoya un modelo de mundo. En Taulapp hemos decidido posicionarnos.
      </p>

      <p>
        En un contexto de colapso climático, desigualdad y violencia institucionalizada, apostamos de forma clara por la compra de producto local. Nuestro orden de preferencia es simple y no negociable:
      </p>

      <ul className="list-disc pl-5 space-y-1 my-4">
        <li><strong>Cercanía real:</strong> tu barrio, tu mercado, tus productores.</li>
        <li><strong>España,</strong> fortaleciendo economías locales y proyectos de aquí.</li>
        <li><strong>Europa,</strong> solo cuando no exista una alternativa más próxima.</li>
      </ul>

      <p>Y lo decimos sin rodeos:</p>
      <p>
        <strong>Taulapp no recomienda ni recomendará productos de productores estadounidenses ni israelíes.</strong><br />
        No colaboramos con gobiernos que sostienen guerras, ocupaciones y genocidios. La neutralidad, en estos casos, es complicidad.
      </p>

      <p>
        Defendemos una cocina diversa, global y abierta, sin fronteras culturales: platos de todo el mundo, para todas las personas. Opciones kosher, veganas, vegetarianas, halal, sin gluten y más.<br />
        La diversidad alimentaria no necesita explotación, colonialismo ni violencia para existir.
      </p>

      <p>
        Mirando al futuro, nuestro compromiso es aún mayor:<br />
        priorizar pequeños comercios, cooperativas, productores independientes y proyectos humanos, éticos y sostenibles. Queremos visibilizar a quienes cuidan la tierra, a las personas y al territorio, no a quienes maximizan beneficios a cualquier precio.
      </p>

      <p>
        También luchamos contra otro problema estructural: el desperdicio de comida.<br />
        Por eso Taulapp incluye un espacio de Ideas, para cocinar con lo que ya tienes en casa, aprovechar mejor los ingredientes y recibir consejos de conservación, especialmente si cocinas para ti sola o solo. Reducir residuos también es una forma de resistencia.
      </p>

      <p>
        Y aun así, no perdemos lo esencial:<br />
        <strong>La comida une, cuida y crea comunidad.</strong><br />
        <em>Compartir la taula és un dels majors plaers que existixen.</em>
      </p>

      <p>
        Taulapp no quiere gustar a todo el mundo.<br />
        Quiere ser coherente.
      </p>

      <p>
        Porque elegir qué comes<br />
        es elegir a quién apoyas<br />
        y qué mundo decides no alimentar.
      </p>
    </article>
  );
}

const SOBRE_SECTION_ID = "sobre";

export default function NosotrasPage() {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [failedTeamImageIds, setFailedTeamImageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const personId = hash.startsWith("person-") ? hash.replace("person-", "") : null;
    if (personId && team.some((p) => p.id === personId)) {
      setOpenSectionId(personId);
      const el = document.getElementById(`person-${personId}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, []);

  return (
    <main className="min-h-screen bg-background max-w-[520px] mx-auto pb-24">
      <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="Volver"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-primary">Nosotras</h1>
        <span className="w-10" aria-hidden />
      </header>

      <div className="px-4 py-6 space-y-4">
        <ul className="space-y-1">
          <li className="border border-border rounded-[var(--radius)] overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => setOpenSectionId(openSectionId === SOBRE_SECTION_ID ? null : SOBRE_SECTION_ID)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-4 py-3 text-left",
                  "hover:bg-muted/50 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                )}
                aria-expanded={openSectionId === SOBRE_SECTION_ID}
                aria-controls="sobre-content"
                id="sobre-trigger"
              >
                <span className="font-medium text-foreground inline-flex items-center gap-1.5">
                <span aria-hidden>🔥</span>
                Sobre Taulapp
              </span>
                <ChevronDown
                  className={cn(
                    "size-5 text-muted-foreground shrink-0 transition-transform",
                    openSectionId === SOBRE_SECTION_ID && "rotate-180"
                  )}
                />
              </button>
              <div
                id="sobre-content"
                role="region"
                aria-labelledby="sobre-trigger"
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  openSectionId === SOBRE_SECTION_ID ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="px-4 pb-4 pt-0 border-t border-border/60">
                    <div className="pt-3">
                      <SobreTaulapp />
                    </div>
                  </div>
                </div>
              </div>
            </li>

            <li className="pt-4 pb-1">
              <h2 className="text-sm font-semibold text-muted-foreground">Quiénes cocinan</h2>
            </li>

            {team.map((person) => {
              const isOpen = openSectionId === person.id;
              const personRecipes = person.recipeIds
                .map((id) => recipesById[id])
                .filter(Boolean);
              return (
                <li
                  key={person.id}
                  id={`person-${person.id}`}
                  className="border border-border rounded-[var(--radius)] overflow-hidden bg-card scroll-mt-4"
                >
                  <button
                    type="button"
                    onClick={() => setOpenSectionId(isOpen ? null : person.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-4 py-3 text-left",
                      "hover:bg-muted/50 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    )}
                    aria-expanded={isOpen}
                    aria-controls={`person-content-${person.id}`}
                    id={`person-trigger-${person.id}`}
                  >
                    <span className="font-medium text-foreground">{person.name}</span>
                    <span className="text-muted-foreground text-sm ml-auto flex items-center gap-1">
                      {personRecipes.length} receta{personRecipes.length !== 1 ? "s" : ""}
                      <ChevronDown
                        className={cn(
                          "size-5 text-muted-foreground shrink-0 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  <div
                    id={`person-content-${person.id}`}
                    role="region"
                    aria-labelledby={`person-trigger-${person.id}`}
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="px-4 pb-4 pt-0 border-t border-border/60 space-y-3">
                        <div className="pt-3 flex items-start gap-3">
                          <span className="relative w-14 h-14 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center text-3xl">
                            {person.image && !failedTeamImageIds.has(person.id) ? (
                              <img
                                src={person.image}
                                alt=""
                                width={56}
                                height={56}
                                className="w-full h-full object-cover object-center"
                                style={{ imageOrientation: "from-image" }}
                                onError={() => setFailedTeamImageIds((prev) => new Set(prev).add(person.id))}
                              />
                            ) : (
                              <span aria-hidden>{(person as { emoji?: string }).emoji ?? "👩🏻‍🍳"}</span>
                            )}
                          </span>
                          <p className="text-sm text-muted-foreground pt-1 flex-1">{person.bio}</p>
                        </div>
                        {personRecipes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Recetas</p>
                            <ul className="space-y-1">
                              {personRecipes.map((r) => (
                                <li key={r.id}>
                                  <Link
                                    href={`/recipe/${r.id}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-primary font-medium underline underline-offset-2 hover:opacity-80 cursor-pointer py-1 -mx-1 px-1 rounded"
                                  >
                                    <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                                    {r.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </main>
  );
}
