import { supabase } from '../lib/supabase'

/* ── Récupère les ligues actives correspondant au type du match ── */
export const recupererLiguesCibles = async (userId, typeSaisonMatch) => {
  const { data: ligues } = await supabase
    .from('membres_groupe')
    .select('groupe_id, groupes(type_saison, saison, date_fin)')
    .eq('user_id', userId)
    .eq('actif', true)

  return (ligues || []).filter(m => {
    // Ligue fermée → on ignore
    const dateFin = m.groupes?.date_fin
    if (dateFin && new Date(dateFin) < new Date()) return false
    // Ligue générale (type_saison null) → compte tous les matchs
    // Sinon doit correspondre au type du match
    const typeLigue = m.groupes?.type_saison
    return typeLigue === null || typeLigue === typeSaisonMatch
  })
}
