import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'
import { LabelSection, BanniereImage, Bloc } from '../components/UI'

const MEDAILLES = ['🥇', '🥈', '🥉']

const calcTaux = (s) => {
  if (!s) return null
  const total = s.corrects + s.incorrects
  return total > 0 ? Math.round(s.corrects / total * 100) : null
}

const LigneUser = ({ m, i, statsUser, moi, navigate }) => {
  const estMoi = m.user_id === moi
  const t = calcTaux(statsUser)
  return (
    <div
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
      <span style={{
        fontSize: i < 3 ? 16 : 13, fontFamily: 'var(--font-display)', fontWeight: 700,
        color: i < 3 ? 'var(--accent)' : 'var(--text-3)', minWidth: 24, textAlign: 'center',
      }}>
        {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
      </span>
      <Avatar url={m.profils?.avatar_url} pseudo={m.profils?.pseudo} taille={32} fontSize={11} />
      <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {m.profils?.pseudo || 'Inconnu'}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--accent)' : 'var(--text-2)' }}>
          {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
        </span>
        {statsUser && (statsUser.corrects + statsUser.incorrects) > 0 && (
          <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--success)' }}>{statsUser.corrects}✓</span>
            {' '}
            <span style={{ color: 'var(--danger)' }}>{statsUser.incorrects}✗</span>
            {t !== null && <span> · {t}%</span>}
          </span>
        )}
      </div>
    </div>
  )
}

function Classement() {
  const [groupes, setGroupes]           = useState([])
  const [classements, setClassements]   = useState({})
  const [statsParLigue, setStatsLigue]  = useState({}) // { groupe_id: { user_id: {corrects, incorrects} } }
  const [statsGlobales, setStatsGlob]   = useState({}) // { user_id: {corrects, incorrects} }
  const [classementGlobal, setGlobal]   = useState([]) // liste triée par points totaux
  const [chargement, setCharg]          = useState(true)
  const [moi, setMoi]                   = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMoi(user.id)

      // Ligues de l'user
      const { data: mesGroupes } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom)')
        .eq('user_id', user.id).eq('actif', true)
      setGroupes(mesGroupes || [])

      const tousClassements = {}
      const tousIds         = new Set()
      const tousGroupeIds   = []

      for (const mg of mesGroupes || []) {
        const { data } = await supabase
          .from('membres_groupe')
          .select('points, user_id, profils(pseudo, avatar_url)')
          .eq('groupe_id', mg.groupes.id).eq('actif', true)
          .order('points', { ascending: false })
        tousClassements[mg.groupes.id] = data || []
        data?.forEach(m => tousIds.add(m.user_id))
        tousGroupeIds.push(mg.groupes.id)
      }
      setClassements(tousClassements)

      if (tousIds.size === 0) { setCharg(false); return }

      // Pronos avec groupe_id pour filtrage par ligue
      const { data: pronos } = await supabase
        .from('pronos')
        .select('user_id, groupe_id, resultat')
        .in('user_id', [...tousIds])
        .in('groupe_id', tousGroupeIds)
        .neq('resultat', 'en_attente')

      // Stats par ligue
      const parLigue = {}
      tousGroupeIds.forEach(gid => { parLigue[gid] = {} })
      pronos?.forEach(p => {
        if (!parLigue[p.groupe_id]) return
        if (!parLigue[p.groupe_id][p.user_id]) parLigue[p.groupe_id][p.user_id] = { corrects: 0, incorrects: 0 }
        if (p.resultat === 'correct')   parLigue[p.groupe_id][p.user_id].corrects++
        if (p.resultat === 'incorrect') parLigue[p.groupe_id][p.user_id].incorrects++
      })
      setStatsLigue(parLigue)

      // Stats globales (tous pronos terminés toutes ligues)
      const { data: pronosGlob } = await supabase
        .from('pronos')
        .select('user_id, resultat, points_gagnes')
        .in('user_id', [...tousIds])
        .neq('resultat', 'en_attente')

      const glob = {}
      tousIds.forEach(id => { glob[id] = { corrects: 0, incorrects: 0, points: 0, pseudo: null, avatar_url: null } })

      // Récupère pseudo/avatar depuis les classements existants
      Object.values(tousClassements).forEach(liste => {
        liste.forEach(m => {
          if (glob[m.user_id]) {
            glob[m.user_id].pseudo     = m.profils?.pseudo
            glob[m.user_id].avatar_url = m.profils?.avatar_url
          }
        })
      })

      pronosGlob?.forEach(p => {
        if (!glob[p.user_id]) return
        if (p.resultat === 'correct')   { glob[p.user_id].corrects++; glob[p.user_id].points += (p.points_gagnes || 1) }
        if (p.resultat === 'incorrect') glob[p.user_id].incorrects++
      })
      setStatsGlob(glob)

      // Classement global trié par points
      const listeGlob = [...tousIds].map(id => ({ user_id: id, ...glob[id] }))
        .sort((a, b) => b.points - a.points)
      setGlobal(listeGlob)

      setCharg(false)
    }
    init()
  }, [])

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

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

        <BanniereImage url="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60" />

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>
        )}

        {!chargement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 24px' }}>

            {/* ── Classement par ligue ── */}
            {groupes.map(mg => {
              const liste  = classements[mg.groupes.id] || []
              const sligue = statsParLigue[mg.groupes.id] || {}
              return (
                <Bloc key={mg.groupes.id}>
                  <LabelSection>{mg.groupes.nom}</LabelSection>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    {liste.map((m, i) => (
                      <LigneUser
                        key={m.user_id} m={m} i={i}
                        statsUser={sligue[m.user_id]}
                        moi={moi} navigate={navigate}
                      />
                    ))}
                    {liste.length === 0 && (
                      <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun membre.</p>
                    )}
                  </div>
                </Bloc>
              )
            })}

            {/* ── Classement général ── */}
            {classementGlobal.length > 0 && (
              <Bloc>
                <LabelSection>Classement général</LabelSection>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 12px' }}>
                  Total toutes ligues confondues
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {classementGlobal.map((m, i) => {
                    const estMoi = m.user_id === moi
                    const t = calcTaux(m)
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
                        <span style={{
                          fontSize: i < 3 ? 16 : 13, fontFamily: 'var(--font-display)', fontWeight: 700,
                          color: i < 3 ? 'var(--accent)' : 'var(--text-3)', minWidth: 24, textAlign: 'center',
                        }}>
                          {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
                        </span>
                        <Avatar url={m.avatar_url} pseudo={m.pseudo} taille={32} fontSize={11} />
                        <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.pseudo || 'Inconnu'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--accent)' : 'var(--text-2)' }}>
                            {m.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
                          </span>
                          {(m.corrects + m.incorrects) > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                              <span style={{ color: 'var(--success)' }}>{m.corrects}✓</span>
                              {' '}
                              <span style={{ color: 'var(--danger)' }}>{m.incorrects}✗</span>
                              {t !== null && <span> · {t}%</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Bloc>
            )}

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