/**
 * Lista de países con código ISO 3166-1 alpha-2 y nombre en español.
 * Usada para autocompletar nacionalidad en recetas y mostrar la bandera.
 */
export type Country = { code: string; name: string };

export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afganistán" },
  { code: "AL", name: "Albania" },
  { code: "DE", name: "Alemania" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua y Barbuda" },
  { code: "SA", name: "Arabia Saudita" },
  { code: "DZ", name: "Argelia" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaiyán" },
  { code: "BS", name: "Bahamas" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BH", name: "Baréin" },
  { code: "BE", name: "Bélgica" },
  { code: "BZ", name: "Belice" },
  { code: "BJ", name: "Benín" },
  { code: "BY", name: "Bielorrusia" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia y Herzegovina" },
  { code: "BW", name: "Botsuana" },
  { code: "BR", name: "Brasil" },
  { code: "BN", name: "Brunéi" },
  { code: "BG", name: "Bulgaria" },
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "BT", name: "Bután" },
  { code: "CV", name: "Cabo Verde" },
  { code: "KH", name: "Camboya" },
  { code: "CM", name: "Camerún" },
  { code: "CA", name: "Canadá" },
  { code: "QA", name: "Catar" },
  { code: "TD", name: "Chad" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CY", name: "Chipre" },
  { code: "CO", name: "Colombia" },
  { code: "KM", name: "Comoras" },
  { code: "KR", name: "Corea del Sur" },
  { code: "KP", name: "Corea del Norte" },
  { code: "CI", name: "Costa de Marfil" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croacia" },
  { code: "CU", name: "Cuba" },
  { code: "DK", name: "Dinamarca" },
  { code: "DM", name: "Dominica" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egipto" },
  { code: "SV", name: "El Salvador" },
  { code: "AE", name: "Emiratos Árabes Unidos" },
  { code: "ER", name: "Eritrea" },
  { code: "SK", name: "Eslovaquia" },
  { code: "SI", name: "Eslovenia" },
  { code: "ES", name: "España" },
  { code: "US", name: "Estados Unidos" },
  { code: "EE", name: "Estonia" },
  { code: "SZ", name: "Esuatini" },
  { code: "ET", name: "Etiopía" },
  { code: "PH", name: "Filipinas" },
  { code: "FI", name: "Finlandia" },
  { code: "FJ", name: "Fiyi" },
  { code: "FR", name: "Francia" },
  { code: "GA", name: "Gabón" },
  { code: "GM", name: "Gambia" },
  { code: "GE", name: "Georgia" },
  { code: "GH", name: "Ghana" },
  { code: "GD", name: "Granada" },
  { code: "GR", name: "Grecia" },
  { code: "GT", name: "Guatemala" },
  { code: "GN", name: "Guinea" },
  { code: "GQ", name: "Guinea Ecuatorial" },
  { code: "GW", name: "Guinea-Bisáu" },
  { code: "GY", name: "Guyana" },
  { code: "HT", name: "Haití" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungría" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IQ", name: "Irak" },
  { code: "IR", name: "Irán" },
  { code: "IE", name: "Irlanda" },
  { code: "IS", name: "Islandia" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italia" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japón" },
  { code: "JO", name: "Jordania" },
  { code: "KZ", name: "Kazajistán" },
  { code: "KE", name: "Kenia" },
  { code: "KG", name: "Kirguistán" },
  { code: "KI", name: "Kiribati" },
  { code: "XK", name: "Kosovo" },
  { code: "KW", name: "Kuwait" },
  { code: "LA", name: "Laos" },
  { code: "LS", name: "Lesoto" },
  { code: "LV", name: "Letonia" },
  { code: "LB", name: "Líbano" },
  { code: "LR", name: "Liberia" },
  { code: "LY", name: "Libia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lituania" },
  { code: "LU", name: "Luxemburgo" },
  { code: "MK", name: "Macedonia del Norte" },
  { code: "MG", name: "Madagascar" },
  { code: "MY", name: "Malasia" },
  { code: "MW", name: "Malaui" },
  { code: "MV", name: "Maldivas" },
  { code: "ML", name: "Malí" },
  { code: "MT", name: "Malta" },
  { code: "MA", name: "Marruecos" },
  { code: "MU", name: "Mauricio" },
  { code: "MR", name: "Mauritania" },
  { code: "MX", name: "México" },
  { code: "FM", name: "Micronesia" },
  { code: "MD", name: "Moldavia" },
  { code: "MC", name: "Mónaco" },
  { code: "MN", name: "Mongolia" },
  { code: "ME", name: "Montenegro" },
  { code: "MZ", name: "Mozambique" },
  { code: "MM", name: "Birmania" },
  { code: "NA", name: "Namibia" },
  { code: "NR", name: "Nauru" },
  { code: "NP", name: "Nepal" },
  { code: "NI", name: "Nicaragua" },
  { code: "NE", name: "Níger" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Noruega" },
  { code: "NZ", name: "Nueva Zelanda" },
  { code: "OM", name: "Omán" },
  { code: "NL", name: "Países Bajos" },
  { code: "PK", name: "Pakistán" },
  { code: "PW", name: "Palaos" },
  { code: "PS", name: "Palestina" },
  { code: "PA", name: "Panamá" },
  { code: "PG", name: "Papúa Nueva Guinea" },
  { code: "PY", name: "Paraguay" },
  { code: "PE", name: "Perú" },
  { code: "PL", name: "Polonia" },
  { code: "PT", name: "Portugal" },
  { code: "PR", name: "Puerto Rico" },
  { code: "GB", name: "Reino Unido" },
  { code: "CF", name: "República Centroafricana" },
  { code: "CD", name: "República Democrática del Congo" },
  { code: "DO", name: "República Dominicana" },
  { code: "CZ", name: "República Checa" },
  { code: "CG", name: "República del Congo" },
  { code: "RE", name: "Reunión" },
  { code: "RW", name: "Ruanda" },
  { code: "RO", name: "Rumanía" },
  { code: "RU", name: "Rusia" },
  { code: "WS", name: "Samoa" },
  { code: "SM", name: "San Marino" },
  { code: "LC", name: "Santa Lucía" },
  { code: "ST", name: "Santo Tomé y Príncipe" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Serbia" },
  { code: "SC", name: "Seychelles" },
  { code: "SL", name: "Sierra Leona" },
  { code: "SG", name: "Singapur" },
  { code: "SY", name: "Siria" },
  { code: "SO", name: "Somalia" },
  { code: "LK", name: "Sri Lanka" },
  { code: "ZA", name: "Sudáfrica" },
  { code: "SS", name: "Sudán del Sur" },
  { code: "SD", name: "Sudán" },
  { code: "SE", name: "Suecia" },
  { code: "CH", name: "Suiza" },
  { code: "SR", name: "Surinam" },
  { code: "TJ", name: "Tayikistán" },
  { code: "TH", name: "Tailandia" },
  { code: "TZ", name: "Tanzania" },
  { code: "TL", name: "Timor Oriental" },
  { code: "TG", name: "Togo" },
  { code: "TO", name: "Tonga" },
  { code: "TT", name: "Trinidad y Tobago" },
  { code: "TN", name: "Túnez" },
  { code: "TM", name: "Turkmenistán" },
  { code: "TR", name: "Turquía" },
  { code: "TV", name: "Tuvalu" },
  { code: "UA", name: "Ucrania" },
  { code: "UG", name: "Uganda" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistán" },
  { code: "VU", name: "Vanuatu" },
  { code: "VA", name: "Vaticano" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "DJ", name: "Yibuti" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabue" },
];

/** Convierte código ISO alpha-2 en emoji de bandera (ej. "ES" → "🇪🇸"). */
export function countryCodeToFlag(code: string): string {
  const c = (code || "").toUpperCase().trim();
  if (c.length !== 2) return "🌍";
  const a = c.charCodeAt(0);
  const b = c.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🌍";
  return String.fromCodePoint(
    0x1f1e6 - 65 + a,
    0x1f1e6 - 65 + b
  );
}

/** Normaliza texto para búsqueda (quitar acentos, minúsculas). */
function normalizeForSearch(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** Busca países por nombre (autocompletado). Devuelve hasta `limit` resultados. */
export function searchCountries(query: string, limit = 12): Country[] {
  const q = normalizeForSearch(query);
  if (!q) return COUNTRIES.slice(0, limit);
  const filtered = COUNTRIES.filter(
    (c) =>
      normalizeForSearch(c.name).includes(q) ||
      q.split(/\s+/).every((part) => normalizeForSearch(c.name).includes(part))
  );
  return filtered.slice(0, limit);
}

/** Mapeo legacy: valores guardados en recetas antiguas → código país (para bandera). */
const LEGACY_NATIONALITY_TO_CODE: Record<string, string> = {
  española: "ES",
  espanola: "ES",
  india: "IN",
  palestina: "PS",
  marroquí: "MA",
  marroqui: "MA",
  arabe: "MA",
  árabe: "MA",
};

/** Claves de filtro usadas en la home (pills). Permite que "España" y "española" coincidan. */
const NATIONALITY_FILTER_KEYS: Record<string, string> = {
  espana: "espanola",
  espanola: "espanola",
  india: "india",
  palestina: "palestina",
  marruecos: "marroqui",
  marroqui: "marroqui",
  arabe: "arabe",
};

/**
 * Normaliza una nacionalidad guardada a la clave de filtro (para comparar con los chips de la home).
 */
export function normalizeNationalityForFilter(nationality: string | null | undefined): string {
  const n = normalizeForSearch(nationality ?? "");
  if (!n) return "";
  return NATIONALITY_FILTER_KEYS[n] ?? n;
}

/**
 * Obtiene la bandera para una nacionalidad guardada (nombre de país o código).
 * Si no se encuentra, devuelve 🌍.
 */
export function getFlagForNationality(nationality: string | null | undefined): string {
  if (!nationality?.trim()) return "🌍";
  const n = nationality.trim();
  const norm = normalizeForSearch(n);
  const legacyCode = LEGACY_NATIONALITY_TO_CODE[norm];
  if (legacyCode) return countryCodeToFlag(legacyCode);
  const byCode = COUNTRIES.find((c) => c.code.toUpperCase() === n.toUpperCase());
  if (byCode) return countryCodeToFlag(byCode.code);
  const byName = COUNTRIES.find(
    (c) => normalizeForSearch(c.name) === normalizeForSearch(n)
  );
  if (byName) return countryCodeToFlag(byName.code);
  const partial = COUNTRIES.find((c) =>
    normalizeForSearch(c.name).includes(normalizeForSearch(n))
  );
  if (partial) return countryCodeToFlag(partial.code);
  return "🌍";
}
