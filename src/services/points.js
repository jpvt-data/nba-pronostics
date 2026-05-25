import { supabase } from '../lib/supabase'
import { recupererGagnant } from './espn'

// Calcule et attribue les points pour les matchs terminés non traités
export const calculerPoints = async (userId) => {
  // Récupère les pronos en attente avec les infos du match
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, equipe_choisie, match_id, matchs(espn_id, statut, gagnant)')
    .eq('user_id', userId)
    .eq('resultat', 'en_attente')

  if (!pronosEnAttente?.length) return

  for (const prono of pronosEnAttente) {
    const match = prono.matchs
    if (!match) continue

    // Vérifie le gagnant depuis ESPN
    const gagnant = await recupererGagnant(match.espn_id)
    if (!gagnant) continue // match pas encore terminé

    const correct = prono.equipe_choisie === gagnant
    const points = correct ? 1 : 0

    // Met à jour le prono
    await supabase
      .from('pronos')
      .update({
        resultat: correct ? 'correct' : 'incorrect',
        points_gagnes: points,
      })
      .eq('id', prono.id)

    // Met à jour le match en cache
    await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant })
      .eq('id', match.match_id)

    // Met à jour les points dans tous les groupes de l'user
    if (correct) {
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('id, points')
        .eq('user_id', userId)
        .eq('actif', true)

      for (const membre of membres) {
        await supabase
          .from('membres_groupe')
          .update({ points: membre.points + 1 })
          .eq('id', membre.id)
      }
    }
  }
}