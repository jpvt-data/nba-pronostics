import { supabase } from '../lib/supabase'
import { recupererGagnant } from './espn'

export const calculerPoints = async (userId) => {
  // Pronos en attente de l'user connecté — pour récupérer les matchs à vérifier
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, match_id, matchs(id, espn_id, statut, gagnant, type_saison, saison)')
    .eq('user_id', userId)
    .eq('resultat', 'en_attente')

  if (!pronosEnAttente?.length) return

  // Dédupliquer les matchs
  const matchsUniques = [...new Map(
    pronosEnAttente
      .filter(p => p.matchs)
      .map(p => [p.matchs.espn_id, p.matchs])
  ).values()]

  // Résultats ESPN en parallèle
  const resultatsESPN = await Promise.all(
    matchsUniques.map(m => recupererGagnant(m.espn_id))
  )

  const idxESPN = {}
  matchsUniques.forEach((m, i) => { idxESPN[m.espn_id] = resultatsESPN[i] })

  for (const matchLocal of matchsUniques) {
    const resultatESPN = idxESPN[matchLocal.espn_id]
    if (!resultatESPN) continue

    const { gagnant, type_saison, saison } = resultatESPN

    // Mettre à jour le match en cache
    await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant, type_saison, saison })
      .eq('id', matchLocal.id)

    // Tous les pronos en attente sur ce match (tous users)
    const { data: tousLespronos } = await supabase
      .from('pronos')
      .select('id, equipe_choisie, user_id')
      .eq('match_id', matchLocal.id)
      .eq('resultat', 'en_attente')

    if (!tousLespronos?.length) continue

    for (const prono of tousLespronos) {
      const correct = prono.equipe_choisie === gagnant
      const points  = correct ? 1 : 0

      await supabase
        .from('pronos')
        .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
        .eq('id', prono.id)

      if (!correct) continue

      // Membres actifs de cet user
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('id, points, groupes(type_saison, saison)')
        .eq('user_id', prono.user_id)
        .eq('actif', true)

      for (const membre of (membres || [])) {
        const ligue = membre.groupes
        if (!ligue) continue
        const matcheLigue =
          !ligue.type_saison ||
          (ligue.type_saison === type_saison && ligue.saison === saison)
        if (matcheLigue) {
          await supabase
            .from('membres_groupe')
            .update({ points: membre.points + 1 })
            .eq('id', membre.id)
        }
      }
    }
  }
}