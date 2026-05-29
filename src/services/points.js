import { supabase } from '../lib/supabase'
import { recupererGagnant } from './espn'

export const calculerPoints = async () => {
  // Tous les pronos en attente, tous users confondus
  const { data: pronosEnAttente } = await supabase
    .from('pronos')
    .select('id, equipe_choisie, user_id, match_id, matchs(id, espn_id, type_saison, saison)')
    .eq('resultat', 'en_attente')
    .not('matchs', 'is', null)

  console.log('pronos en attente:', pronosEnAttente)

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
  console.log('matchsUniques:', matchsUniques)
  console.log('resultatsESPN:', resultatsESPN)  

  for (const matchLocal of matchsUniques) {
    const resultatESPN = idxESPN[matchLocal.espn_id]
    if (!resultatESPN) continue // match pas encore terminé selon ESPN

    const { gagnant, type_saison, saison } = resultatESPN

    // Mettre à jour le match en cache
    await supabase
      .from('matchs')
      .update({ statut: 'termine', gagnant, type_saison, saison })
      .eq('id', matchLocal.id)

    // Tous les pronos en attente sur ce match
    const { data: tousLesPronos } = await supabase
      .from('pronos')
      .select('id, equipe_choisie, user_id')
      .eq('match_id', matchLocal.id)
      .eq('resultat', 'en_attente')

    console.log('tousLesPronos pour', matchLocal.espn_id, ':', tousLesPronos)

    if (!tousLesPronos?.length) continue

    for (const prono of tousLesPronos) {
      const correct = prono.equipe_choisie === gagnant
      const points  = correct ? 1 : 0

      const { error: errProno } = await supabase
        .from('pronos')
        .update({ resultat: correct ? 'correct' : 'incorrect', points_gagnes: points })
        .eq('id', prono.id)
      console.log('update prono', prono.id, '→ erreur:', errProno)

      if (!correct) continue

      const { data: membres, error: errMembres } = await supabase
        .from('membres_groupe')
        .select('id, points, groupes(type_saison, saison)')
        .eq('user_id', prono.user_id)
        .eq('actif', true)
      console.log('membres pour', prono.user_id, ':', membres, '→ erreur:', errMembres)

      for (const membre of (membres || [])) {
        const ligue = membre.groupes
        if (!ligue) continue
        const matcheLigue =
          !ligue.type_saison ||
          (ligue.type_saison === type_saison && ligue.saison === saison)
        if (matcheLigue) {
          const { error: errMembre } = await supabase
            .from('membres_groupe')
            .update({ points: membre.points + 1 })
            .eq('id', membre.id)
          console.log('update membre', membre.id, '→ erreur:', errMembre)
        }
      }
    }
  }
}