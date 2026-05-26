import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../pages/Profil'

const formaterDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const LabelSection = ({ children }) => (
  <h3 style={{
    display: 'inline-block',
    background: 'linear-gradient(90deg, var(--accent), var(--orange))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: '0.1em', fontSize: 13, fontWeight: 700,
  }}>{children}</h3>
)

const BLOC = {
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
  borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
  padding: '16px',
}

function MesPronos() {
  const [pronos, setPronos]   = useState([])
  const [stats, setStats]     = useState({ total: 0, corrects: 0, incorrects: 0 })
  const [profil, setProfil]   = useState(null)
  const [formeRecente, setForme] = useState([])
  const [charg, setCharg]     = useState(true)
  const [estMoi, setEstMoi]   = useState(true)
  const navigate              = useNavigate()
  const location              = useLocation()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const params   = new URLSearchParams(location.search)
      const cibleId  = params.get('user_id') || user.id
      const vuParMoi = cibleId === user.id
      setEstMoi(vuParMoi)

      // Profil de la cible
      const { data: p } = await supabase
        .from('profils')
        .select('pseudo, avatar_url, description')
        .eq('id', cibleId)
        .single()
      setProfil(p)

      // Pronos — si autre user : uniquement matchs terminés
      let query = supabase
        .from('pronos')
        .select('equipe_choisie, resultat, points_gagnes, cree_le, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur, statut)')
        .eq('user_id', cibleId)
        .order('cree_le', { ascending: false })

      if (!vuParMoi) query = query.neq('resultat', 'en_attente')

      const { data } = await query
      setPronos(data || [])

      const termines  = data?.filter(p => p.resultat !== 'en_attente') || []
      const corrects  = termines.filter(p => p.resultat === 'correct').length
      const incorrects = termines.filter(p => p.resultat === 'incorrect').length
      setStats({ total: termines.length, corrects, incorrects })

      // Forme récente — 5 derniers pronos terminés
      setForme(termines.slice(0, 5))

      setCharg(false)
    }
    init()
  }, [location.search])

  const taux = stats.corrects + stats.incorrects > 0
    ? Math.round(stats.corrects / (stats.corrects + stats.incorrects) * 100)
    : 0

  const couleurResultat = (r) => {
    if (r === 'correct')   return { bg: 'var(--success-dim)', border: 'rgba(34,197,94,0.3)', txt: 'var(--success)' }
    if (r === 'incorrect') return { bg: 'var(--danger-dim)',  border: 'rgba(239,68,68,0.3)', txt: 'var(--danger)'  }
    return { bg: 'transparent', border: 'var(--border)', txt: 'var(--text-3)' }
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header profil ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{
            ...BLOC,
            display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            <Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={56} fontSize={18} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, lineHeight: 1.2 }}>{profil?.pseudo || '—'}</h2>
              {!estMoi && (
                <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
                  Profil public · pronos en attente masqués
                </div>
              )}
              {profil?.description && (
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
                  {profil.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}

        {!charg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 16px 24px' }}>

            {/* ── Stats globales ── */}
            <div style={{ ...BLOC }}>
              <LabelSection>Stats</LabelSection>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                {[
                  { label: 'Total',    val: stats.total,      color: 'var(--text-1)'  },
                  { label: 'Corrects', val: stats.corrects,   color: 'var(--success)' },
                  { label: 'Ratés',    val: stats.incorrects, color: 'var(--danger)'  },
                  { label: 'Réussite', val: `${taux}%`,       color: 'var(--accent)'  },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Forme récente ── */}
            {formeRecente.length > 0 && (
              <div style={{ ...BLOC }}>
                <LabelSection>Forme récente</LabelSection>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                  {formeRecente.map((p, i) => (
                    <div key={i} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: p.resultat === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      borderWidth: 1, borderStyle: 'solid',
                      borderColor: p.resultat === 'correct' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
                      fontSize: 13, fontWeight: 700,
                      color: p.resultat === 'correct' ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {p.resultat === 'correct' ? 'W' : 'L'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Historique ── */}
            <div style={{ ...BLOC }}>
              <LabelSection>Historique</LabelSection>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {pronos.map((p, i) => {
                  const c = couleurResultat(p.resultat)
                  const m = p.matchs
                  const cliquable = estMoi && !!m?.espn_id
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
                        {cliquable && <span style={{ fontSize: 14, color: 'var(--text-3)' }}>›</span>}
                      </div>
                    </div>
                  )
                })}
                {pronos.length === 0 && (
                  <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun prono terminé pour l'instant.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </>
  )
}

export default MesPronos
