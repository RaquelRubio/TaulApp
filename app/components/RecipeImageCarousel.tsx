"use client";

import { useState, useCallback } from "react";

type RecipeImageCarouselProps = {
  urls: string[];
  alt: string;
  className?: string;
};

export function RecipeImageCarousel({ urls, alt, className = "" }: RecipeImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = urls.length;

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? count - 1 : i - 1));
  }, [count]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= count - 1 ? 0 : i + 1));
  }, [count]);

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className={`relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-b-2xl ${className}`}>
        <img
          src={urls[0]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-[4/3] bg-muted overflow-hidden rounded-b-2xl ${className}`}>
      <img
        key={urls[index]}
        src={urls[index]}
        alt={`${alt} (${index + 1} de ${count})`}
        className="w-full h-full object-cover block"
      />

      <button
        type="button"
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Foto anterior"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Foto siguiente"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {urls.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-transparent ${
              i === index ? "bg-white" : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Ir a foto ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
