// src/services/arcade.js
import { supabase } from '../lib/supabase'
import { ajouterXP } from './xp'
import { donnerCartes } from './cartes'
import { lundiFin } from './points'

const XP_PAR_PANIER = 5
const CARTE_TOUS_LES_N_PANIERS = 5
const FAUTES_MAX = 3

const jourParis = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

/**
 * Calcule la difficulté du tir suivant à partir du nombre de paniers déjà
 * marqués dans la partie DU JOUR (pas cumulatif à vie — reset chaque jour).
 * Plus la partie avance, plus la zone verte se réduit et la vitesse augmente.
 */
export const recupererDifficulte = (paniersAujourdhui = 0) => {
  const zonePct = Math.max(8, 18 - Math.floor(paniersAujourdhui / 5))
  const vitesse = Math.min(2.2, 0.6 + paniersAujourdhui * 0.05)
  return { paniersAujourdhui, zonePct, vitesse }
}

/**
 * État de la partie du jour : combien de tirs déjà joués, paniers, fautes,
 * et si la partie du jour est terminée (3 fautes atteintes).
 */
export const recupererEtatJour = async (userId) => {
  const { data } = await supabase
    .from('arcade_tirs')
    .select('tir_numero, resultat')
    .eq('user_id', userId)
    .eq('date_jour', jourParis())
    .order('tir_numero', { ascending: true })

  const tirs = data || []
  const paniers = tirs.filter(t => t.resultat === 'panier').length
  const fautes  = tirs.filter(t => t.resultat === 'rate').length

  return {
    tirs,
    paniers,
    fautes,
    prochainTirNumero: tirs.length + 1,
    partieTerminee: fautes >= FAUTES_MAX,
  }
}

/**
 * Enregistre un tir, attribue XP si panier, déclenche une carte tous les
 * CARTE_TOUS_LES_N_PANIERS paniers dans la même partie.
 * Retourne l'état mis à jour + une éventuelle carte obtenue (pour popup).
 */
export const enregistrerTir = async (userId, tirNumero, resultat) => {
  const { error } = await supabase
    .from('arcade_tirs')
    .insert({ user_id: userId, date_jour: jourParis(), tir_numero: tirNumero, resultat })

  if (error) {
    console.error('[arcade] enregistrerTir échoué:', error.message)
    return null
  }

  let carteObtenue = null

  if (resultat === 'panier') {
    await ajouterXP(userId, XP_PAR_PANIER, 'arcade', `arcade_panier_${userId}_${jourParis()}_${tirNumero}`)

    const etat = await recupererEtatJour(userId)
    if (etat.paniers > 0 && etat.paniers % CARTE_TOUS_LES_N_PANIERS === 0) {
      try {
        const cartes = await donnerCartes(userId, 1, 'arcade')
        if (cartes.length) carteObtenue = cartes[0]
      } catch (e) {
        console.error('[arcade] donnerCartes échoué:', e.message)
      }
    }
  }

  return { carteObtenue }
}

/** Record absolu personnel (meilleur score d'une journée, toutes périodes confondues). */
export const recupererRecordPersonnel = async (userId) => {
  const { data } = await supabase
    .from('arcade_scores_jour')
    .select('paniers')
    .eq('user_id', userId)
    .order('paniers', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.paniers || 0
}

/** Record absolu, tous users confondus (pour affichage "Record depuis toujours"). */
export const recupererRecordAbsoluGlobal = async (userIds) => {
  if (!userIds?.length) return null
  const { data } = await supabase
    .from('arcade_scores_jour')
    .select('user_id, paniers, profils(pseudo)')
    .in('user_id', userIds)
    .order('paniers', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null
  return { user_id: data.user_id, paniers: data.paniers, pseudo: data.profils?.pseudo || '—' }
}

/**
 * Vérifie en fin de partie si le score du jour bat le record semaine et/ou
 * le record absolu (calculés sur l'état AVANT cette partie, donc à appeler
 * avec les records déjà connus en mémoire côté page, pas re-fetchés après coup).
 * Attribue un booster 3 cartes par record battu (cumulables).
 * Retourne la liste des boosters obtenus (pour popup), et les flags records.
 */
export const verifierRecordsFinPartie = async (userId, scoreDuJour, recordSemaineAvant, recordAbsoluAvant) => {
  const battuSemaine = scoreDuJour > recordSemaineAvant
  const battuAbsolu  = scoreDuJour > recordAbsoluAvant

  const boosters = []

  if (battuAbsolu) {
    try {
      const cartes = await donnerCartes(userId, 3, 'arcade_record_absolu')
      boosters.push(...cartes)
    } catch (e) { console.error('[arcade] booster record absolu échoué:', e.message) }
  } else if (battuSemaine) {
    try {
      const cartes = await donnerCartes(userId, 3, 'arcade_record_semaine')
      boosters.push(...cartes)
    } catch (e) { console.error('[arcade] booster record semaine échoué:', e.message) }
  }

  return { battuSemaine, battuAbsolu, boosters }
}

/** Historique des scores de la semaine en cours (perso). */
export const recupererHistoriquePerso = async (userId, depuis = lundiFin()) => {
  const { data } = await supabase
    .from('arcade_scores_jour')
    .select('date_jour, paniers')
    .eq('user_id', userId)
    .gte('date_jour', depuis)
    .order('date_jour', { ascending: true })
  return data || []
}

/**
 * Record de la semaine : meilleur score de chaque pote depuis lundi, classé.
 * userIds : liste des user_id du groupe (potes + soi-même).
 */
export const recupererRecordsSemaine = async (userIds, depuis = lundiFin()) => {
  if (!userIds?.length) return []

  const { data } = await supabase
    .from('arcade_scores_jour')
    .select('user_id, paniers, profils(pseudo, avatar_url)')
    .in('user_id', userIds)
    .gte('date_jour', depuis)

  const meilleurParUser = {}
  for (const row of (data || [])) {
    const actuel = meilleurParUser[row.user_id]
    if (!actuel || row.paniers > actuel.paniers) {
      meilleurParUser[row.user_id] = { paniers: row.paniers, pseudo: row.profils?.pseudo || '—', avatar_url: row.profils?.avatar_url }
    }
  }

  return Object.entries(meilleurParUser)
    .map(([user_id, v]) => ({ user_id, ...v }))
    .sort((a, b) => b.paniers - a.paniers)
}
