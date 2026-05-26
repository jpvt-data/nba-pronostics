import { supabase } from '../lib/supabase'
import { recupererGagnant } from './espn'

export const calculerPoints = async (userId) => {
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, equipe_choisie, match_id, matchs(id, espn_id, statut, gagnant, type_saison, saison)')
    .eq('user_id', userId)
    .eq('resultat', 'en_attente')

  if (!pronosEnAttente?.length) return

  // Toutes les ligues actives de l'user
  const { data: membres } = await supabase
    .from('membres_groupe')
    .select('id, points, groupes(id, type_saison, saison)')
    .eq('user_id', userId)
    .eq('actif', true)

  for (const prono of pronosEnAttente) {
    const match = prono.matchs
    if (!match) continue

    const resultatESPN = await recupererGagnant(match.espn_id)
    if (!resultatESPN) continue

    const { gagnant, type_saison, saison } = resultatESPN
    const correct = prono.equipe_choisie === gagnant
    const points  = correct ? 1 : 0

    // Mise à jour prono
    await supabase
      .from('pronos')
      .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
      .eq('id', prono.id)

    // Mise à jour match en cache avec type_saison + saison
    await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant, type_saison, saison })
      .eq('id', match.id)

    // Points par ligue selon type_saison + saison
    if (correct && membres?.length) {
      for (const membre of membres) {
        const ligue = membre.groupes
        if (!ligue) continue
        // type_saison null sur la ligue = ligue générale, compte tous les matchs
        const matcheLigue =
          !ligue.type_saison ||
          (ligue.type_saison === type_saison && ligue.saison === saison)
        if (matcheLigue) {
          await supabase
            .from('membres_groupe')
            .update({ points: membre.points + 1 })
            .eq('id', membre.id)
          membre.points += 1
        }
      }
    }
  }
}