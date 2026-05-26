import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import CreerGroupe from '../components/CreerGroupe'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'

function Groupes() {
  const [ligues, setLigues]   = useState([])
  const [membres, setMembres] = useState({}) // { groupe_id: membre }
  const [charg, setCharg]     = useState(true)
  const [userId, setUserId]   = useState(null)
  const [creerOuvert, setCreerOuvert] = useState(false)

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user.id)

    // Toutes les ligues
    const { data: toutesLigues } = await supabase
      .from('groupes')
      .select('id, nom, date_fin, admin_id')
      .order('date_fin', { ascending: false, nullsFirst: false })
    setLigues(toutesLigues || [])

    // Mes appartenances
    const { data: mesMembres } = await supabase
      .from('membres_groupe')
      .select('id, groupe_id, points, actif')
      .eq('user_id', user.id)
    const idx = {}
    mesMembres?.forEach(m => { idx[m.groupe_id] = m })
    setMembres(idx)

    setCharg(false)
  }

  useEffect(() => { charger() }, [])

  const rejoindre = async (groupeId) => {
    const existant = membres[groupeId]
    if (existant) {
      if (existant.actif) return
      await supabase.from('membres_groupe').update({ actif: true }).eq('id', existant.id)
    } else {
      await supabase.from('membres_groupe').insert({ groupe_id: groupeId, user_id: userId })
    }
    charger()
  }

  const quitter = async (groupeId) => {
    const m = membres[groupeId]
    if (!m) return
    await supabase.from('membres_groupe').update({ actif: false }).eq('id', m.id)
    charger()
  }

  const estFermee = (date_fin) => date_fin && new Date(date_fin) < new Date()

  return (
    <>
      <Navigation />
      <main style={{ flex: 1, padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Ligues</h2>
          {userId === ADMIN_ID && (
            <button
              onClick={() => setCreerOuvert(v => !v)}
              style={{
                fontSize: 12, fontWeight: 600,
                background: creerOuvert ? 'var(--accent-dim)' : 'transparent',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: creerOuvert ? 'var(--accent-border)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: creerOuvert ? 'var(--accent)' : 'var(--text-2)',
                paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12,
                cursor: 'pointer',
              }}
            >
              + Nouvelle ligue
            </button>
          )}
        </div>

        {creerOuvert && userId === ADMIN_ID && (
          <div style={{ marginBottom: 20 }}>
            <CreerGroupe onSuccess={() => { setCreerOuvert(false); charger() }} />
          </div>
        )}

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ligues.map(ligue => {
            const membre    = membres[ligue.id]
            const dedans    = membre?.actif === true
            const fermee    = estFermee(ligue.date_fin)
            const dateFin   = ligue.date_fin
              ? new Date(ligue.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : null

            return (
              <div key={ligue.id} style={{
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: dedans ? 'var(--accent-border)' : 'var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                opacity: fermee ? 0.65 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>{ligue.nom}</span>
                      {dedans && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          background: 'var(--accent-dim)', color: 'var(--accent)',
                          borderRadius: 4, padding: '2px 6px',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)',
                        }}>✓ Inscrit</span>
                      )}
                      {fermee && (
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                          borderRadius: 4, padding: '2px 6px',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)',
                        }}>Fermée</span>
                      )}
                    </div>
                    {dateFin && (
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {fermee ? 'Terminée le' : 'Jusqu\'au'} {dateFin}
                      </div>
                    )}
                    {dedans && membre?.points != null && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-1)' }}>
                          {membre.points}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
                    {!fermee && !dedans && (
                      <button
                        onClick={() => rejoindre(ligue.id)}
                        style={{
                          fontSize: 12, fontWeight: 600,
                          background: 'var(--accent)',
                          borderWidth: 0, borderRadius: 'var(--radius-sm)',
                          color: '#fff',
                          paddingTop: 7, paddingBottom: 7, paddingLeft: 14, paddingRight: 14,
                          cursor: 'pointer',
                        }}
                      >
                        Rejoindre
                      </button>
                    )}
                    {dedans && !fermee && (
                      <button
                        onClick={() => quitter(ligue.id)}
                        style={{
                          fontSize: 11, color: 'var(--text-3)',
                          background: 'none',
                          borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10,
                          cursor: 'pointer',
                        }}
                      >
                        Quitter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {!charg && ligues.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '2rem 1rem',
              background: 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-3)', fontSize: 14,
            }}>
              Aucune ligue disponible pour l'instant.
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default Groupes