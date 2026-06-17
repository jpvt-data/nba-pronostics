// src/services/ecart.js
import { supabase } from '../lib/supabase'
import { ajouterXP, verifierMissions } from './xp'
import { lundiFin } from './points'
import { donnerCartes } from './cartes'

// Récupère la fourchette posée par l'user sur un match (null si aucune)
export const recupererFourchetteEcart = async (userId, matchId) => {
  const { data } = await supabase
    .from('pronos_ecart')
    .select('id, fourchette_choisie, fourchette_reelle, correct, points_gagnes')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle()
  return data || null
}

// Pose ou modifie la fourchette (UPSERT — unique user+match)
export const poserFourchetteEcart = async (userId, matchId, fourchetteChoisie) => {
  // Vérifier si c'est la première fourchette posée sur ce match (anti-doublon XP)
  const { data: existante } = await supabase
    .from('pronos_ecart')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle()
  const estPremiereFourchette = !existante

  const { data, error } = await supabase
    .from('pronos_ecart')
    .upsert(
      { user_id: userId, match_id: matchId, fourchette_choisie: fourchetteChoisie },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()
  if (error) { console.error('Erreur poserFourchetteEcart:', error); return null }

  // +5 XP uniquement à la première pose (pas au changement d'avis)
  if (estPremiereFourchette) {
    await ajouterXP(userId, 5, 'passif', 'fourchette_posee')
    await verifierMissions(userId, 'fourchette_posee', 1, lundiFin(), 'increment')
  }

  // Si le match est déjà terminé en base, résoudre immédiatement la fourchette
  const { data: match } = await supabase
    .from('matchs')
    .select('statut, score_domicile, score_exterieur')
    .eq('id', matchId)
    .maybeSingle()

  if (match?.statut === 'termine' && match.score_domicile != null && match.score_exterieur != null) {
    const ecartFinal = Math.abs(match.score_domicile - match.score_exterieur)
    const fourchetteReelle =
      ecartFinal <= 5  ? 'serre'     :
      ecartFinal <= 10 ? 'modere'    :
      ecartFinal <= 20 ? 'net'       :
      ecartFinal <= 30 ? 'large'     : 'domination'

    const correctEcart = fourchetteChoisie === fourchetteReelle
    // Vérifier si le prono du même match est correct
    const { data: pronoUser } = await supabase
      .from('pronos').select('resultat')
      .eq('user_id', userId).eq('match_id', matchId).maybeSingle()
    const pronoCorrect = pronoUser?.resultat === 'correct'
    const pointsEcart  = correctEcart ? (pronoCorrect ? 2 : 1) : 0

    await supabase
      .from('pronos_ecart')
      .update({ fourchette_reelle: fourchetteReelle, correct: correctEcart, points_gagnes: pointsEcart })
      .eq('user_id', userId)
      .eq('match_id', matchId)

    if (correctEcart) {
      await ajouterXP(userId, 30, 'passif', 'fourchette_correcte')
      await verifierMissions(userId, 'fourchette_correcte', 1, lundiFin(), 'increment')
      await donnerCartes(userId, 1, 'fourchette')
    }

    return { ...data, fourchette_reelle: fourchetteReelle, correct: correctEcart, points_gagnes: pointsEcart }
  }

  return data
}
