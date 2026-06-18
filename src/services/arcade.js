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
 * Calcule la difficulté du jour à partir du total de paniers marqués à vie.
 * Plus le total est élevé, plus la zone verte se réduit et la vitesse augmente.
 * Retourne des valeurs utilisables directement par le composant (largeur % zone, vitesse).
 */
export const recupererDifficulte = async (userId) => {
  const { count } = await supabase
    .from('arcade_tirs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('resultat', 'panier')

  const totalPaniers = count || 0

  // Palier progressif — zone verte rétrécit, vitesse augmente, plafonné pour rester jouable
  const zonePct   = Math.max(10, 18 - Math.floor(totalPaniers / 20))
  const vitesse   = Math.min(1.8, 0.6 + totalPaniers / 150)

  return { totalPaniers, zonePct, vitesse }
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

/** Record personnel (meilleur score d'une journée, à vie). */
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
 * Classement hebdomadaire entre potes : meilleur score de chacun depuis lundi.
 * userIds : liste des user_id du groupe (potes + soi-même).
 */
export const recupererClassementSemaine = async (userIds, depuis = lundiFin()) => {
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
