import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MD_PATH = path.join(ROOT, "docs", "recetas.md");
const OUT_PATH = path.join(ROOT, "app", "data", "recipes.json");

// Util: normaliza espacios
const clean = (s) => s.replace(/\r/g, "").trim();

// Convierte "1/2" -> 0.5, "1/4" -> 0.25, "15" -> 15
function parseQty(raw) {
  const v = clean(raw);
  if (!v) return null;

  if (v.toLowerCase() === "al gusto") return null;

  // fracción tipo 1/2
  const frac = v.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (b === 0) return null;
    return a / b;
  }

  // decimal o entero
  const num = Number(v.replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

// Parsea una línea: "Tomate – 250 g" o "Sal – al gusto"
function parseIngredientLine(line) {
  // separador largo "–" (en dash) o "-"
  const m = line.replace(/^\-\s*/, "").split("–").map((x) => clean(x));
  if (m.length < 2) return null;

  const name = m[0];
  const right = m.slice(1).join("–").trim();

  // Caso "al gusto"
  if (right.toLowerCase() === "al gusto") {
    return { name, qty: null, unit: "al gusto" };
  }

  // Intento: "250 g" o "1/2 ud" o "25 ml"
  const parts = right.split(" ").filter(Boolean);
  if (parts.length === 1) {
    // raro, pero aceptamos como unit
    return { name, qty: parseQty(parts[0]), unit: "" };
  }
  const qtyRaw = parts[0];
  const unit = parts.slice(1).join(" ");

  return { name, qty: parseQty(qtyRaw), unit };
}

// Extrae campo tipo "**id:** xyz"
function extractField(block, label) {
  const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, "i");
  const m = block.match(re);
  return m ? clean(m[1]) : "";
}

function extractSection(block, title) {
  // Extrae texto entre "**Title:**" y el siguiente "**Algo:**" o fin
  const re = new RegExp(`\\*\\*${title}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*\\w|$)`, "i");
  const m = block.match(re);
  return m ? clean(m[1]) : "";
}

function parseSteps(text) {
  // líneas tipo "1. ..." "2. ..."
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const steps = [];
  for (const l of lines) {
    const m = l.match(/^\d+\.\s+(.*)$/);
    if (m) steps.push(clean(m[1]));
  }
  return steps;
}

function parseNotes(text) {
  // líneas "- ..."
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .filter((l) => l.startsWith("- "))
    .map((l) => clean(l.replace(/^\-\s*/, "")));
}

function parseIngredients(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const out = [];
  for (const l of lines) {
    if (!l.startsWith("- ")) continue;
    const ing = parseIngredientLine(l);
    if (ing) out.push(ing);
  }
  return out;
}

function parseRecipesFromMd(md) {
  // Cada receta empieza por "### 🍽️ "
  const parts = md.split("\n### 🍽️ ").slice(1);
  const recipes = [];

  for (const part of parts) {
    const block = "### 🍽️ " + part;

    // Nombre = primera línea después del encabezado
    const titleLine = clean(part.split("\n")[0]);
    const title = titleLine;

    const id = extractField(block, "id");
    const nationality = extractField(block, "nacionalidad");
    const timeRaw = extractField(block, "tiempo");
    const tagsRaw = extractField(block, "tags");

    const time = Number(timeRaw) || 0;
    const tags = tagsRaw
      ? tagsRaw.split(",").map((t) => clean(t)).filter(Boolean)
      : [];

    const ingredientsText = extractSection(block, "Ingredientes \\(1 ración\\)");
    const stepsText = extractSection(block, "Pasos");
    const storageText = extractSection(block, "Modo de conservación");
    const notesText = extractSection(block, "Notas");

    const ingredients = parseIngredients(ingredientsText);
    const steps = parseSteps(stepsText);
    const notes = parseNotes(notesText);

    // Validaciones mínimas
    if (!id) {
      console.warn(`⚠️ Receta sin id: "${title}" (se omite)`);
      continue;
    }
    if (!ingredients.length) {
      console.warn(`⚠️ Receta "${id}" sin ingredientes (se incluye igual)`);
    }
    if (!steps.length) {
      console.warn(`⚠️ Receta "${id}" sin pasos (se incluye igual)`);
    }

    recipes.push({
      id,
      title,
      nationality: nationality || "",
      time,
      tags,
      baseServings: 1,
      ingredients,
      steps,
      storage: storageText || "",
      notes,
    });
  }

  return recipes;
}

function main() {
  const md = fs.readFileSync(MD_PATH, "utf8");
  const recipes = parseRecipesFromMd(md);

  const json = JSON.stringify(recipes, null, 2) + "\n";
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, json, "utf8");

  console.log(`✅ Generadas ${recipes.length} recetas -> ${path.relative(ROOT, OUT_PATH)}`);
}

main();
