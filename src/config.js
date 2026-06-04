// Saison ESPN courante — se met à jour automatiquement chaque année
// Logique : après septembre, on bascule sur la saison suivante
// Ex: oct 2026 → ESPN 2027 (saison 2026-27) | jan-sept 2026 → ESPN 2026 (saison 2025-26)
export const SAISON_ESPN = new Date().getMonth() >= 9
  ? new Date().getFullYear() + 1
  : new Date().getFullYear()

export const XP_BASE = 300
export const XP_COEFFICIENT = 1.06

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL