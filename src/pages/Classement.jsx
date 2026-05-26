import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../pages/Profil'

function Classement() {
  const [groupes, setGroupes]       = useState([])
  const [groupeActif, setActif]     = useState(null)
  const [classement, setClassement] = useState([])
  const [chargement, setCharg]      = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
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
  }

  const changerGroupe = async (groupe) => {
    setActif(groupe)
    await chargerClassement(groupe.id)
  }

  const medaille = (i) => ['🥇','🥈','🥉'][i] || null

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, padding: '20px 16px' }}>
        <h2 style={{ marginBottom: 16 }}>Classement</h2>

        {/* Sélecteur groupes */}
        {groupes.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {groupes.map(m => {
              const actif = groupeActif?.id === m.groupes.id
              return (
                <button key={m.groupe_id} onClick={() => changerGroupe(m.groupes)} style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                  background: actif ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${actif ? 'var(--accent-border)' : 'var(--border)'}`,
                  color: actif ? 'var(--accent)' : 'var(--text-2)',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {m.groupes.nom}
                </button>
              )
            })}
          </div>
        )}

        {groupeActif && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
            {groupeActif.nom} · {classement.length} membre{classement.length > 1 ? 's' : ''}
          </div>
        )}

        {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}

        {/* Podium top 3 */}
        {classement.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {classement.slice(0, 3).map((m, i) => (
              <div key={m.user_id} style={{
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: i === 0 ? 'var(--accent-border)' : 'var(--border)',
                borderRadius: 'var(--radius-md)', padding: '14px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{medaille(i)}</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <Avatar url={m.profils?.avatar_url} pseudo={m.profils?.pseudo} taille={40} fontSize={13} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: i === 0 ? 'var(--accent)' : 'var(--text-1)' }}>
                  {m.points}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6, fontWeight: 500 }}>
                  {m.profils?.pseudo || '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste complète */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {classement.map((m, i) => (
            <div key={m.user_id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
                color: i < 3 ? 'var(--accent)' : 'var(--text-3)', minWidth: 22, textAlign: 'center',
              }}>#{i + 1}</span>
              <Avatar url={m.profils?.avatar_url} pseudo={m.profils?.pseudo} taille={32} fontSize={11} />
              <span style={{ flex: 1, fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>
                {m.profils?.pseudo || 'Inconnu'}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: i < 3 ? 'var(--accent)' : 'var(--text-2)' }}>
                {m.points}<span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
              </span>
            </div>
          ))}
        </div>

        {!chargement && classement.length === 0 && (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun membre dans ce groupe.</p>
        )}
      </main>
    </>
  )
}

export default Classement
