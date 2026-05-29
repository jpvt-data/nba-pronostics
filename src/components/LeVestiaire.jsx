import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LabelSection, Bloc } from '../components/UI'

async function genererEvenements(userId) {
  const evenements = []

  const { data: membres } = await supabase
    .from('membres_groupe')
    .select('groupe_id, groupes(nom)')
    .eq('user_id', userId)
    .eq('actif', true)
  if (!membres?.length) return []

  const groupeIds = membres.map(m => m.groupe_id)

  const { data: potes } = await supabase
    .from('membres_groupe')
    .select('user_id, groupe_id, profils(pseudo), cree_le')
    .in('groupe_id', groupeIds)
    .eq('actif', true)
    .neq('user_id', userId)
  if (!potes?.length) return []

  // Déduplication — priorité à l'occurrence qui a un pseudo
  const potesMap = new Map()
  for (const p of potes) {
    if (!potesMap.has(p.user_id) || (!potesMap.get(p.user_id).profils?.pseudo && p.profils?.pseudo)) {
      potesMap.set(p.user_id, p)
    }
  }
  const potesUniques = [...potesMap.values()]

  // Nouveaux membres récents (< 7 jours)
  const semaineDerniere = new Date()
  semaineDerniere.setDate(semaineDerniere.getDate() - 7)
  potes.forEach(p => {
    if (new Date(p.cree_le) > semaineDerniere) {
      const nomLigue = membres.find(m => m.groupe_id === p.groupe_id)?.groupes?.nom || 'une ligue'
      evenements.push({
        icone: '👋',
        texte: `${p.profils?.pseudo} a rejoint ${nomLigue}`,
        couleur: 'var(--accent)',
        date: new Date(p.cree_le),
      })
    }
  })

  // Séries des potes — seuil ≥ 2
  for (const pote of potesUniques) {
    const pseudo = pote.profils?.pseudo || 'Un pote'
    const { data: derniers } = await supabase
      .from('pronos')
      .select('resultat, cree_le')
      .eq('user_id', pote.user_id)
      .in('resultat', ['correct', 'incorrect'])
      .order('cree_le', { ascending: false })
      .limit(10)
    if (!derniers?.length) continue

    const typeStreak = derniers[0].resultat
    let count = 0
    for (const p of derniers) {
      if (p.resultat === typeStreak) count++
      else break
    }
    if (count < 2) continue

    const feu = typeStreak === 'correct'
    evenements.push({
      icone: feu ? '🔥' : '❄️',
      texte: feu
        ? `${pseudo} est sur une série de ${count} pronos réussis !`
        : `${pseudo} enchaîne ${count} ratés d'affilée...`,
      couleur: feu ? 'var(--success)' : 'var(--danger)',
      date: new Date(derniers[0].cree_le),
    })
  }

  return evenements.sort((a, b) => b.date - a.date).slice(0, 6)
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
