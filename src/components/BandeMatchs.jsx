import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL' || statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

const formaterHeure = (dateStr) =>
  new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formaterJour = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function BandeMatchs({ matchs, userId }) {
  const [pronos, setPronos] = useState({})

  useEffect(() => {
    const charger = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, matchs(espn_id)')
        .eq('user_id', userId)
      const idx = {}
      data?.forEach(p => { if (p.matchs) idx[p.matchs.espn_id] = p.equipe_choisie })
      setPronos(idx)
    }
    charger()
  }, [userId])

  const faireProno = async (match, equipe) => {
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
      .select().single()
    if (!matchDB) return
    await supabase.from('pronos').upsert({
      user_id: userId,
      match_id: matchDB.id,
      equipe_choisie: equipe,
      resultat: 'en_attente',
    }, { onConflict: 'user_id,match_id' })
    setPronos(prev => ({ ...prev, [match.espn_id]: equipe }))
  }

  if (!matchs.length) return null

  return (
    /* wrapper : overflow-x ici, pas sur l'enfant */
    <div style={{
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none',
      borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)',
      paddingTop: 12, paddingBottom: 12,
    }}>
      {/* enfant : largeur naturelle — force le scroll */}
      <div style={{
        display: 'flex',
        gap: 10,
        paddingLeft: 16, paddingRight: 16,
        width: 'max-content',
      }}>
        {matchs.map(match => {
          const verrou = estVerrouille(match.date, match.statut)
          const pronoActuel = pronos[match.espn_id]

          return (
            <div key={match.espn_id} style={{
              background: 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 10px 8px',
              width: 156, flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>
                {formaterJour(match.date)} · {formaterHeure(match.date)}
              </div>

              {[
                { tri: match.exterieur.trigramme, logo: match.exterieur.logo, score: match.exterieur.score },
                { tri: match.domicile.trigramme,  logo: match.domicile.logo,  score: match.domicile.score  },
              ].map(({ tri, logo, score }) => {
                const selec = pronoActuel === tri
                return (
                  <button
                    key={tri}
                    onClick={() => faireProno(match, tri)}
                    disabled={verrou}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: selec ? 'var(--accent-dim)' : 'transparent',
                      borderWidth: 1, borderStyle: 'solid',
                      borderColor: selec ? 'var(--accent-border)' : 'var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      paddingTop: 7, paddingBottom: 7, paddingLeft: 8, paddingRight: 8,
                      cursor: verrou ? 'default' : 'pointer',
                      marginBottom: 4,
                    }}
                  >
                    <img src={logo} alt={tri} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                      color: selec ? 'var(--accent)' : 'var(--text-1)',
                      letterSpacing: '0.04em', flex: 1, textAlign: 'left',
                    }}>{tri}</span>
                    {score != null && (
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-2)' }}>{score}</span>
                    )}
                  </button>
                )
              })}

              {/* statut */}
              <div style={{ fontSize: 10, textAlign: 'center', marginTop: 4,
                color: match.statut === 'STATUS_IN_PROGRESS' ? 'var(--success)' : 'var(--text-3)',
                fontWeight: match.statut === 'STATUS_IN_PROGRESS' ? 600 : 400,
              }}>
                {match.statut === 'STATUS_FINAL'       && 'Terminé'}
                {match.statut === 'STATUS_IN_PROGRESS' && '● Live'}
              </div>

              {pronoActuel && !verrou && (
                <div style={{ fontSize: 10, color: 'var(--accent)', textAlign: 'center', marginTop: 2 }}>✓ Prono ok</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BandeMatchs