import { supabase } from '../lib/supabase'

// Taux de tirage - independant de la composition reelle du catalogue (cf decision produit)
const TAUX_RARETE = { legendary: 0.05, rare: 0.30, common: 0.65 }

// Tire une rarete au hasard selon TAUX_RARETE
const tirerRarete = () => {
  const r = Math.random()
  if (r < TAUX_RARETE.legendary) return 'legendary'
  if (r < TAUX_RARETE.legendary + TAUX_RARETE.rare) return 'rare'
  return 'common'
}

// Cache memoire (duree de vie de la session) pour eviter de refetcher le pool a chaque tirage
const poolCache = {}

const recupererPool = async (rarete) => {
  if (poolCache[rarete]) return poolCache[rarete]
  const { data } = await supabase
    .from('cartes_catalogue')
    .select('id, serie, annee, numero, nom_propre, rarete, url_front, url_back')
    .eq('rarete', rarete)
    .eq('actif', true)
  poolCache[rarete] = data || []
  return poolCache[rarete]
}

const tirerCarteParRarete = async (rarete) => {
  const pool = await recupererPool(rarete)
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

// Quantite totale possedee par le user pour une liste de carte_id (apres insertion)
const recupererQuantites = async (userId, carteIds) => {
  const { data } = await supabase
    .from('cartes_collection')
    .select('carte_id')
    .eq('user_id', userId)
    .in('carte_id', carteIds)
  const compte = {}
  ;(data || []).forEach((p) => { compte[p.carte_id] = (compte[p.carte_id] || 0) + 1 })
  return compte
}

// Donne `nombre` cartes (tirage pondere) a un user, insere en base, retourne le detail pour la popup
export const donnerCartes = async (userId, nombre, source) => {
  const cartesObtenues = []
  for (let i = 0; i < nombre; i++) {
    const carte = await tirerCarteParRarete(tirerRarete())
    if (carte) cartesObtenues.push(carte)
  }
  if (!cartesObtenues.length) return []

  await supabase.from('cartes_collection').insert(
    cartesObtenues.map((c) => ({ user_id: userId, carte_id: c.id, source }))
  )

  const idsUniques = [...new Set(cartesObtenues.map((c) => c.id))]
  const quantites = await recupererQuantites(userId, idsUniques)

  // Dedupe pour l'affichage popup (si la meme carte sort 2x dans le meme tirage)
  const vus = new Set()
  return cartesObtenues
    .filter((c) => {
      if (vus.has(c.id)) return false
      vus.add(c.id)
      return true
    })
    .map((c) => ({ carte: c, quantite: quantites[c.id] || 1 }))
}

// Donne 1 carte rare garantie (utilise pour le palier roue quotidienne)
export const donnerCarteRareGarantie = async (userId, source = 'roue_quotidienne') => {
  const carte = await tirerCarteParRarete('rare')
  if (!carte) return null
  await supabase.from('cartes_collection').insert({ user_id: userId, carte_id: carte.id, source })
  const quantites = await recupererQuantites(userId, [carte.id])
  return { carte, quantite: quantites[carte.id] || 1 }
}
