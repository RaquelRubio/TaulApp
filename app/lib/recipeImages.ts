/**
 * URL pública de una imagen de receta guardada en Supabase Storage (bucket recipe-images).
 */
export function getRecipeImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath?.trim()) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/recipe-images/${imagePath.trim()}`;
}

/**
 * URL pública de una imagen de perfil de usuaria.
 * Por ahora reutiliza el mismo bucket `recipe-images`, en la carpeta que elijas.
 */
export function getProfileImageUrl(imagePath: string | null | undefined): string | null {
  return getRecipeImageUrl(imagePath);
}

/** Máximo de fotos en el carrusel de una receta. */
export const MAX_RECIPE_IMAGES = 6;

type RecipeImagePaths = {
  image_path?: string | null;
  image_paths?: string[] | null;
};

/**
 * Devuelve un array de URLs de imagen para una receta (carrusel, máx. 6).
 * Usa image_paths si existe; si no, usa image_path como única imagen.
 */
export function getRecipeImageUrls(recipe: RecipeImagePaths | null | undefined): string[] {
  if (!recipe) return [];
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return [];
  const paths = Array.isArray(recipe.image_paths) && recipe.image_paths.length > 0
    ? recipe.image_paths.filter((p): p is string => typeof p === "string" && p.trim() !== "")
    : recipe.image_path?.trim()
      ? [recipe.image_path.trim()]
      : [];
  return paths
    .slice(0, MAX_RECIPE_IMAGES)
    .map((p) => `${base}/storage/v1/object/public/recipe-images/${p.trim()}`);
}
