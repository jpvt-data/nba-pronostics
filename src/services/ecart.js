// src/services/ecart.js
import { supabase } from '../lib/supabase'
import { ajouterXP } from './xp'

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
  }

  return data
}