import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../pages/Profil'

const LabelSection = ({ children }) => (
  <h3 style={{
    display: 'inline-block',
    background: 'linear-gradient(90deg, var(--accent), var(--orange))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: '0.1em', fontSize: 13, fontWeight: 700,
  }}>{children}</h3>
)

const BanniereImage = ({ url, hauteur = 110 }) => (
  <div style={{
    margin: '20px 0 0', height: hauteur,
    backgroundImage: `linear-gradient(to right, rgba(13,13,18,0.75), rgba(13,13,18,0.35), rgba(13,13,18,0.75)), url(${url})`,
    backgroundSize: 'cover', backgroundPosition: 'center',
    borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(99,102,241,0.2)',
    borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(99,102,241,0.2)',
  }} />
)

const BLOC = {
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
  borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
  padding: '16px',
}

const MEDAILLES = ['🥇', '🥈', '🥉']

function Classement() {
  const [groupes, setGroupes]       = useState([])
  const [classements, setClassements] = useState({}) // { groupe_id: [] }
  const [statsUsers, setStatsUsers]   = useState({}) // { user_id: {...} }
  const [chargement, setCharg]        = useState(true)
  const [moi, setMoi]                 = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMoi(user.id)

      const { data: mesGroupes } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom)')
        .eq('user_id', user.id).eq('actif', true)
      setGroupes(mesGroupes || [])

      // Charger classement pour chaque ligue
      const tousClassements = {}
      const tousIds = new Set()

      for (const mg of mesGroupes || []) {
        const { data } = await supabase
          .from('membres_groupe')
          .select('points, user_id, profils(pseudo, avatar_url)')
          .eq('groupe_id', mg.groupes.id).eq('actif', true)
          .order('points', { ascending: false })
        tousClassements[mg.groupes.id] = data || []
        data?.forEach(m => tousIds.add(m.user_id))
      }
      setClassements(tousClassements)

      // Stats pronos — une seule requête pour tous les users
      if (tousIds.size > 0) {
        const { data: pronos } = await supabase
          .from('pronos')
          .select('user_id, resultat')
          .in('user_id', [...tousIds])
          .neq('resultat', 'en_attente')

        const stats = {}
        tousIds.forEach(id => { stats[id] = { corrects: 0, incorrects: 0 } })
        pronos?.forEach(p => {
          if (!stats[p.user_id]) return
          if (p.resultat === 'correct') stats[p.user_id].corrects++
          if (p.resultat === 'incorrect') stats[p.user_id].incorrects++
        })
        setStatsUsers(stats)
      }

      setCharg(false)
    }
    init()
  }, [])

  const taux = (s) => {
    if (!s) return null
    const total = s.corrects + s.incorrects
    return total > 0 ? Math.round(s.corrects / total * 100) : null
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header plein bord ── */}
        <div style={{
          padding: '20px 16px',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}>
          <h2 style={{ margin: '0 0 8px' }}>Classement</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
            Chaque bon pronostic rapporte <strong style={{ color: 'var(--accent)' }}>1 point</strong>.
            Bonus score exact et série à venir.
          </p>
        </div>

        {/* ── Bannière tribune ── */}
        <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" />

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>
        )}

        {/* ── Une liste par ligue ── */}
        {!chargement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 24px' }}>
            {groupes.map(mg => {
              const liste = classements[mg.groupes.id] || []
              return (
                <div key={mg.groupes.id} style={{ ...BLOC }}>
                  <LabelSection>{mg.groupes.nom}</LabelSection>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    {liste.map((m, i) => {
                      const s = statsUsers[m.user_id]
                      const t = taux(s)
                      const estMoi = m.user_id === moi
                      return (
                        <div
                          key={m.user_id}
                          onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            background: estMoi ? 'rgba(99,102,241,0.08)' : 'var(--bg-2)',
                            borderWidth: 1, borderStyle: 'solid',
                            borderColor: estMoi ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          {/* Rang / médaille */}
                          <span style={{
                            fontSize: i < 3 ? 16 : 13,
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            color: i < 3 ? 'var(--accent)' : 'var(--text-3)',
                            minWidth: 24, textAlign: 'center',
                          }}>
                            {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
                          </span>

                          {/* Avatar */}
                          <Avatar url={m.profils?.avatar_url} pseudo={m.profils?.pseudo} taille={32} fontSize={11} />

                          {/* Pseudo */}
                          <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.profils?.pseudo || 'Inconnu'}
                          </span>

                          {/* Stats — 2 lignes centrées */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                            <span style={{
                              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
                              color: i < 3 ? 'var(--accent)' : 'var(--text-2)',
                            }}>
                              {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                            </span>
                            {s && (s.corrects + s.incorrects) > 0 && (
                              <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'var(--success)' }}>{s.corrects}✓</span>
                                {' '}
                                <span style={{ color: 'var(--danger)' }}>{s.incorrects}✗</span>
                                {t !== null && <span> · {t}%</span>}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {liste.length === 0 && (
                      <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun membre.</p>
                    )}
                  </div>
                </div>
              )
            })}

            {groupes.length === 0 && (
              <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                Rejoins une ligue pour voir le classement.
              </p>
            )}
          </div>
        )}

      </main>
    </>
  )
}

export default Classement
