// src/services/ecart.js
import { supabase } from '../lib/supabase'

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
  const { data, error } = await supabase
    .from('pronos_ecart')
    .upsert(
      { user_id: userId, match_id: matchId, fourchette_choisie: fourchetteChoisie },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()
  if (error) { console.error('Erreur poserFourchetteEcart:', error); return null }
  return data
}