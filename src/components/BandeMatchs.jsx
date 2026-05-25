import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL' || statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

const formaterHeure = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const formaterJour = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function BandeMatchs({ matchs, userId }) {
  const [pronos, setPronos] = useState({})

  useEffect(() => {
    const chargerPronos = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, matchs(espn_id)')
        .eq('user_id', userId)

      const index = {}
      data?.forEach(p => {
        if (p.matchs) index[p.matchs.espn_id] = p.equipe_choisie
      })
      setPronos(index)
    }
    chargerPronos()
  }, [userId])

  const faireProno = async (match, equipeChoisie) => {
    if (estVerrouille(match.date, match.statut)) return

    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id: match.espn_id,
        date_match: match.date,
        equipe_domicile: match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut: match.statut,
      }, { onConflict: 'espn_id' })
      .select()
      .single()

    if (!matchDB) return

    await supabase
      .from('pronos')
      .upsert({
        user_id: userId,
        match_id: matchDB.id,
        equipe_choisie: equipeChoisie,
        resultat: 'en_attente',
      }, { onConflict: 'user_id,match_id' })

    setPronos(prev => ({ ...prev, [match.espn_id]: equipeChoisie }))
  }

  return (
    <div style={{ overflowX: 'auto', padding: '1rem 0', borderBottom: '1px solid #1f1f1f' }}>
      <div style={{ display: 'flex', gap: '0.75rem', padding: '0 1rem', minWidth: 'max-content' }}>
        {matchs.map(match => {
          const verrou = estVerrouille(match.date, match.statut)
          const pronoActuel = pronos[match.espn_id]

          return (
            <div key={match.espn_id} style={{
              background: '#111',
              border: '1px solid #1f1f1f',
              borderRadius: 10,
              padding: '0.75rem',
              width: 160,
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: '#444', marginBottom: '0.5rem', textAlign: 'center' }}>
                {formaterJour(match.date)} · {formaterHeure(match.date)}
              </div>

              {/* Équipe extérieure */}
              <button
                onClick={() => faireProno(match, match.exterieur.trigramme)}
                disabled={verrou}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: pronoActuel === match.exterieur.trigramme ? '#1a3a1a' : 'transparent',
                  border: pronoActuel === match.exterieur.trigramme ? '1px solid #4CAF50' : '1px solid transparent',
                  borderRadius: 6, padding: '0.4rem 0.5rem', cursor: verrou ? 'default' : 'pointer',
                  marginBottom: 4,
                }}
              >
                <img src={match.exterieur.logo} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>{match.exterieur.trigramme}</span>
                {match.exterieur.score !== null && (
                  <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{match.exterieur.score}</span>
                )}
              </button>

              {/* Équipe domicile */}
              <button
                onClick={() => faireProno(match, match.domicile.trigramme)}
                disabled={verrou}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: pronoActuel === match.domicile.trigramme ? '#1a3a1a' : 'transparent',
                  border: pronoActuel === match.domicile.trigramme ? '1px solid #4CAF50' : '1px solid transparent',
                  borderRadius: 6, padding: '0.4rem 0.5rem', cursor: verrou ? 'default' : 'pointer',
                }}
              >
                <img src={match.domicile.logo} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ccc' }}>{match.domicile.trigramme}</span>
                {match.domicile.score !== null && (
                  <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>{match.domicile.score}</span>
                )}
              </button>

              <div style={{ fontSize: 10, color: '#333', textAlign: 'center', marginTop: '0.4rem' }}>
                {match.statut === 'STATUS_FINAL' ? 'Terminé' : match.statut === 'STATUS_IN_PROGRESS' ? 'En cours' : ''}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BandeMatchs