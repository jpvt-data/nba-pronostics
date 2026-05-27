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

  // Dédupliquer les matchs à vérifier — un seul appel ESPN par espn_id
  const matchsUniques = [...new Map(
    pronosEnAttente
      .filter(p => p.matchs)
      .map(p => [p.matchs.espn_id, p.matchs])
  ).values()]

  // Récupérer tous les résultats ESPN en parallèle
  const resultatsESPN = await Promise.all(
    matchsUniques.map(m => recupererGagnant(m.espn_id))
  )

  // Index espn_id → résultat ESPN
  const idxESPN = {}
  matchsUniques.forEach((m, i) => { idxESPN[m.espn_id] = resultatsESPN[i] })

  for (const prono of pronosEnAttente) {
    const match = prono.matchs
    if (!match) continue

    const resultatESPN = idxESPN[match.espn_id]
    if (!resultatESPN) continue

    const { gagnant, type_saison, saison } = resultatESPN
    const correct = prono.equipe_choisie === gagnant
    const points  = correct ? 1 : 0

    // Mise à jour prono
    const { error: errProno } = await supabase
      .from('pronos')
      .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
      .eq('id', prono.id)
    if (errProno) console.error('Erreur update prono', prono.id, errProno.message)

    // Mise à jour match en cache avec type_saison + saison
    const { error: errMatch } = await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant, type_saison, saison })
      .eq('id', match.id)
    if (errMatch) console.error('Erreur update match', match.id, errMatch.message)

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
          const { error: errMembre } = await supabase
            .from('membres_groupe')
            .update({ points: membre.points + 1 })
            .eq('id', membre.id)
          if (errMembre) console.error('Erreur update membre', membre.id, errMembre.message)
          else membre.points += 1
        }
      }
    }
  }
}
