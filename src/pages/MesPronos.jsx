import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'

const formaterDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function MesPronos() {
  const [pronos, setPronos]  = useState([])
  const [stats, setStats]    = useState({ total: 0, corrects: 0, incorrects: 0 })
  const [charg, setCharg]    = useState(true)
  const navigate             = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, resultat, points_gagnes, cree_le, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur, statut)')
        .eq('user_id', user.id)
        .order('cree_le', { ascending: false })

      setPronos(data || [])
      const corrects   = data?.filter(p => p.resultat === 'correct').length   || 0
      const incorrects = data?.filter(p => p.resultat === 'incorrect').length || 0
      setStats({ total: data?.length || 0, corrects, incorrects })
      setCharg(false)
    }
    init()
  }, [])

  const taux = stats.corrects + stats.incorrects > 0
    ? Math.round(stats.corrects / (stats.corrects + stats.incorrects) * 100)
    : 0

  const couleurResultat = (r) => {
    if (r === 'correct')    return { bg: 'var(--success-dim)', border: 'rgba(34,197,94,0.3)',  txt: 'var(--success)' }
    if (r === 'incorrect')  return { bg: 'var(--danger-dim)',  border: 'rgba(239,68,68,0.3)',  txt: 'var(--danger)'  }
    return { bg: 'transparent', border: 'var(--border)', txt: 'var(--text-3)' }
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, padding: '20px 16px' }}>
        <h2 style={{ marginBottom: 20 }}>Mes stats</h2>

        {/* Stats globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 28 }}>
          {[
            { label: 'Total',    val: stats.total,      color: 'var(--text-1)'  },
            { label: 'Corrects', val: stats.corrects,   color: 'var(--success)' },
            { label: 'Ratés',    val: stats.incorrects, color: 'var(--danger)'  },
            { label: 'Réussite', val: `${taux}%`,       color: 'var(--accent)'  },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-md)', padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}

        {/* Historique */}
        <h3 style={{ marginBottom: 12 }}>Historique</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {pronos.map((p, i) => {
            const c = couleurResultat(p.resultat)
            const m = p.matchs
            const cliquable = !!m?.espn_id

            return (
              <div
                key={i}
                onClick={() => cliquable && navigate(`/match/${m.espn_id}`)}
                style={{
                  background: c.bg,
                  borderWidth: 1, borderStyle: 'solid', borderColor: c.border,
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: cliquable ? 'pointer' : 'default',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                    {m?.equipe_exterieur} @ {m?.equipe_domicile}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {m ? formaterDate(m.date_match) : ''} · → {p.equipe_choisie}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.txt }}>
                    {p.resultat === 'correct'    && `+${p.points_gagnes} pt`}
                    {p.resultat === 'incorrect'  && 'Raté'}
                    {p.resultat === 'en_attente' && 'En attente'}
                  </span>
                  {cliquable && (
                    <span style={{ fontSize: 14, color: 'var(--text-3)' }}>›</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {!charg && pronos.length === 0 && (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun prono pour l'instant.</p>
        )}
      </main>
    </>
  )
}

export default MesPronos