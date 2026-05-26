import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../pages/Profil'

/* ── Styles partagés avec Accueil ── */
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
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
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

function Classement() {
  const [groupes, setGroupes]       = useState([])
  const [groupeActif, setActif]     = useState(null)
  const [classement, setClassement] = useState([])
  const [statsUsers, setStatsUsers] = useState({}) // { user_id: { corrects, incorrects, total } }
  const [chargement, setCharg]      = useState(true)
  const [moi, setMoi]               = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMoi(user.id)
      const { data } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom)')
        .eq('user_id', user.id).eq('actif', true)
      setGroupes(data || [])
      if (data?.length > 0) {
        setActif(data[0].groupes)
        await chargerClassement(data[0].groupes.id)
      }
      setCharg(false)
    }
    init()
  }, [])

  const chargerClassement = async (groupeId) => {
    const { data } = await supabase
      .from('membres_groupe')
      .select('points, user_id, profils(pseudo, avatar_url)')
      .eq('groupe_id', groupeId).eq('actif', true)
      .order('points', { ascending: false })
    setClassement(data || [])

    // Stats pronos pour tous les users du classement en une requête
    if (data?.length > 0) {
      const ids = data.map(m => m.user_id)
      const { data: pronos } = await supabase
        .from('pronos')
        .select('user_id, resultat')
        .in('user_id', ids)
        .neq('resultat', 'en_attente')

      const stats = {}
      ids.forEach(id => { stats[id] = { corrects: 0, incorrects: 0, total: 0 } })
      pronos?.forEach(p => {
        if (!stats[p.user_id]) return
        stats[p.user_id].total++
        if (p.resultat === 'correct') stats[p.user_id].corrects++
        if (p.resultat === 'incorrect') stats[p.user_id].incorrects++
      })
      setStatsUsers(stats)
    }
  }

  const changerGroupe = async (groupe) => {
    setActif(groupe)
    await chargerClassement(groupe.id)
  }

  const taux = (s) => s.corrects + s.incorrects > 0
    ? Math.round(s.corrects / (s.corrects + s.incorrects) * 100)
    : null

  const medailles = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Bloc intro ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ ...BLOC }}>
            <LabelSection>Classement</LabelSection>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.6 }}>
              Chaque bon pronostic rapporte <strong style={{ color: 'var(--accent)' }}>1 point</strong>.
              Le classement est calculé par ligue — rejoins une ligue pour apparaître ici.
              Bonus score exact et série à venir.
            </p>
          </div>
        </div>

        {/* ── Bannière tribune ── */}
        <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" />

        {/* ── Filtre ligues ── */}
        {groupes.length > 1 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {groupes.map(m => {
                const actif = groupeActif?.id === m.groupes.id
                return (
                  <button key={m.groupe_id} onClick={() => changerGroupe(m.groupes)} style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                    background: actif ? 'var(--accent-dim)' : 'transparent',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: actif ? 'var(--accent-border)' : 'var(--border)',
                    color: actif ? 'var(--accent)' : 'var(--text-2)',
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {m.groupes.nom}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}

        {!chargement && classement.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 24px' }}>

            {/* ── Podium adaptatif ── */}
            <div style={{ ...BLOC }}>
              <LabelSection>{groupeActif?.nom || 'Ligue'} · {classement.length} membre{classement.length > 1 ? 's' : ''}</LabelSection>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(classement.length, 3)}, 1fr)`,
                gap: 8, marginTop: 12,
              }}>
                {classement.slice(0, 3).map((m, i) => {
                  const s = statsUsers[m.user_id] || { corrects: 0, incorrects: 0, total: 0 }
                  const t = taux(s)
                  const estMoi = m.user_id === moi
                  return (
                    <div
                      key={m.user_id}
                      onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
                      style={{
                        background: estMoi ? 'rgba(99,102,241,0.12)' : 'var(--bg-2)',
                        borderWidth: 1, borderStyle: 'solid',
                        borderColor: i === 0 ? 'var(--accent-border)' : estMoi ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '14px 8px', textAlign: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 8 }}>{medailles[i]}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                        <Avatar url={m.profils?.avatar_url} pseudo={m.profils?.pseudo} taille={40} fontSize={13} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: i === 0 ? 'var(--accent)' : 'var(--text-1)' }}>
                        {m.points}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontWeight: 600 }}>
                        {m.profils?.pseudo || '—'}
                      </div>
                      {t !== null && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                          {t}% réussite
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Liste complète ── */}
            <div style={{ ...BLOC }}>
              <LabelSection>Détail</LabelSection>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {classement.map((m, i) => {
                  const s = statsUsers[m.user_id] || { corrects: 0, incorrects: 0, total: 0 }
                  const t = taux(s)
                  const estMoi = m.user_id === moi
                  return (
                    <div
                      key={m.user_id}
                      onClick={() => navigate(`/mes-pronos?user_id=${m.user_id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: estMoi ? 'rgba(99,102,241,0.08)' : 'var(--bg-2)',
                        borderWidth: 1, borderStyle: 'solid',
                        borderColor: estMoi ? 'rgba(99,102,241,0.3)' : 'var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                        color: i < 3 ? 'var(--accent)' : 'var(--text-3)', minWidth: 22, textAlign: 'center',
                      }}>#{i + 1}</span>
                      <Avatar url={m.profils?.avatar_url} pseudo={m.profils?.pseudo} taille={32} fontSize={11} />
                      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>
                        {m.profils?.pseudo || 'Inconnu'}
                      </span>
                      {/* Stats inline */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--accent)' : 'var(--text-2)' }}>
                          {m.points}<span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                        </span>
                        {s.total > 0 && (
                          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                            <span style={{ color: 'var(--success)' }}>{s.corrects}✓</span>
                            {' '}<span style={{ color: 'var(--danger)' }}>{s.incorrects}✗</span>
                            {t !== null && <span style={{ color: 'var(--text-3)' }}> · {t}%</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {!chargement && classement.length === 0 && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>
            Rejoins une ligue pour voir le classement.
          </p>
        )}

      </main>
    </>
  )
}

export default Classement
