"use client";

import { useState, useRef, useEffect } from "react";
import { searchCountries, countryCodeToFlag, getFlagForNationality } from "../data/countries";

type NationalityAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
};

export function NationalityAutocomplete({
  value,
  onChange,
  id,
  placeholder = "Ej. España, India...",
  className = "",
}: NationalityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = searchCountries(value, 12);
  const showDropdown = open && suggestions.length > 0;

  useEffect(() => {
    setHighlightIndex(0);
  }, [value, suggestions.length]);

  useEffect(() => {
    if (!showDropdown) return;
    const el = listRef.current?.querySelector(`[data-index="${highlightIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, showDropdown]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCountry(name: string) {
    onChange(name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) {
      if (e.key === "ArrowDown" || e.key === "Escape") setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
      return;
    }
    if (e.key === "Enter" && suggestions[highlightIndex]) {
      e.preventDefault();
      selectCountry(suggestions[highlightIndex].name);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const flag = value.trim() ? getFlagForNationality(value) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        {flag && flag !== "🌍" && (
          <span className="absolute left-3 text-lg pointer-events-none" aria-hidden>
            {flag}
          </span>
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-xl border border-border bg-card px-3 py-2 text-sm ${
            flag && flag !== "🌍" ? "pl-10" : ""
          }`}
        />
      </div>
      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 w-full mt-1 py-1 rounded-xl border border-border bg-card shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((country, i) => (
            <li
              key={country.code}
              data-index={i}
              role="option"
              aria-selected={i === highlightIndex}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer ${
                i === highlightIndex ? "bg-accent" : "hover:bg-muted/70"
              }`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCountry(country.name);
              }}
            >
              <span className="text-lg shrink-0" aria-hidden>
                {countryCodeToFlag(country.code)}
              </span>
              <span>{country.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
