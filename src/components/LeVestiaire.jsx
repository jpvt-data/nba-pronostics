import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LabelSection, Bloc } from '../components/UI'

async function genererEvenements(userId) {
  const evenements = []

  const { data: membres } = await supabase
    .from('membres_groupe')
    .select('groupe_id')
    .eq('user_id', userId)
    .eq('actif', true)
  if (!membres?.length) return []

  const groupeIds = membres.map(m => m.groupe_id)

  const { data: potes } = await supabase
    .from('membres_groupe')
    .select('user_id, profils(pseudo)')
    .in('groupe_id', groupeIds)
    .eq('actif', true)
    .neq('user_id', userId)
  if (!potes?.length) return []

  const potesUniques = [...new Map(potes.map(p => [p.user_id, p])).values()]

  for (const pote of potesUniques) {
    const pseudo = pote.profils?.pseudo || 'Un pote'

    const { data: pronos } = await supabase
      .from('pronos')
      .select('resultat')
      .eq('user_id', pote.user_id)
      .in('resultat', ['correct', 'incorrect'])
      .order('cree_le', { ascending: false })
      .limit(20)

    if (!pronos?.length) continue

    const dernier = pronos[0].resultat
    let streak = 0
    for (const p of pronos) {
      if (p.resultat === dernier) streak++
      else break
    }

    if (streak < 2) continue

    const feu = dernier === 'correct'
    evenements.push({
      icone: feu ? '🔥' : '❄️',
      texte: feu
        ? `${pseudo} est sur une série de ${streak} pronos réussis !`
        : `${pseudo} est sur une série de ${streak} pronos ratés ! Aïe aïe !`,
      couleur: feu ? 'var(--success)' : 'var(--danger)',
    })
  }

  return evenements
}

function LeVestiaire({ userId }) {
  const [evenements, setEvenements] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    if (!userId) return
    genererEvenements(userId).then(evts => {
      setEvenements(evts)
      setChargement(false)
    })
  }, [userId])

  if (!chargement && !evenements.length) return null

  return (
    <Bloc>
      <LabelSection>Le Vestiaire</LabelSection>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {chargement ? (
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>…</p>
        ) : (
          evenements.map((evt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{evt.icone}</span>
              <span style={{ fontSize: 13, color: evt.couleur, fontWeight: 500, lineHeight: 1.4 }}>
                {evt.texte}
              </span>
            </div>
          ))
        )}
      </div>
    </Bloc>
  )
}

export default LeVestiaire
