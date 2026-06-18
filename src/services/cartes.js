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

// Verifie et attribue les badges collection (100 / 500 / 1000 cartes)
// Appele apres chaque insertion - silencieux en cas d'erreur
const SEUILS_BADGES_COLLECTION = [
  { seuil: 100,  slug: '100_cartes' },
  { seuil: 500,  slug: '500_cartes' },
  { seuil: 1000, slug: '1000_cartes' },
]

const verifierBadgesCollection = async (userId) => {
  try {
    const [{ count }, { data: profil }] = await Promise.all([
      supabase.from('cartes_collection').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('profils').select('badges').eq('id', userId).single(),
    ])
    if (count === null || !profil) return
    const badgesActuels = profil.badges || []
    const nouveaux = SEUILS_BADGES_COLLECTION
      .filter(({ seuil, slug }) => count >= seuil && !badgesActuels.includes(slug))
      .map(({ slug }) => slug)
    if (!nouveaux.length) return
    await supabase.from('profils').update({ badges: [...badgesActuels, ...nouveaux] }).eq('id', userId)
  } catch (e) { /* silencieux */ }
}

// Donne `nombre` cartes (tirage pondere) a un user, insere en base, retourne le detail pour la popup
export const donnerCartes = async (userId, nombre, source) => {
  const cartesObtenues = []
  for (let i = 0; i < nombre; i++) {
    const carte = await tirerCarteParRarete(tirerRarete())
    if (carte) cartesObtenues.push(carte)
  }
  if (!cartesObtenues.length) return []

  const { error: errInsert } = await supabase.from('cartes_collection').insert(
    cartesObtenues.map((c) => ({ user_id: userId, carte_id: c.id, source }))
  )
  if (errInsert) console.error('[cartes] insert échoué:', errInsert.message)
  else verifierBadgesCollection(userId)

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
  const { error: errInsert } = await supabase.from('cartes_collection').insert({ user_id: userId, carte_id: carte.id, source })
  if (errInsert) console.error('[cartes] insert rare garanti échoué:', errInsert.message)
  else verifierBadgesCollection(userId)
  const quantites = await recupererQuantites(userId, [carte.id])
  return { carte, quantite: quantites[carte.id] || 1 }
}

// Recupere les cartes obtenues mais jamais montrees a l'utilisateur (popup tap-to-reveal)
// Couvre tous les triggers, y compris ceux attribues en arriere-plan (prono/fourchette
// resolus par calculerPoints, qui peut tourner alors que ce n'est pas ce user qui est actif)
export const recupererCartesNonRevelees = async (userId) => {
  const { data } = await supabase
    .from('cartes_collection')
    .select('carte_id, cartes_catalogue(id, serie, annee, numero, nom_propre, rarete, url_front, url_back)')
    .eq('user_id', userId)
    .eq('revelee', false)
  if (!data || !data.length) return []

  const idsUniques = [...new Set(data.map((r) => r.carte_id))]
  const quantites = await recupererQuantites(userId, idsUniques)

  const vus = new Set()
  const resultat = []
  data.forEach((row) => {
    if (vus.has(row.carte_id) || !row.cartes_catalogue) return
    vus.add(row.carte_id)
    resultat.push({ carte: row.cartes_catalogue, quantite: quantites[row.carte_id] || 1 })
  })
  return resultat
}

// Marque toutes les cartes en attente de revelation comme vues (appele a la fermeture de la popup)
export const marquerCartesRevelees = async (userId) => {
  await supabase
    .from('cartes_collection')
    .update({ revelee: true })
    .eq('user_id', userId)
    .eq('revelee', false)
}
