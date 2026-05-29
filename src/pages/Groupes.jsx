import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import CreerGroupe from '../components/CreerGroupe'
import { LabelSection, BanniereImage, Bloc } from '../components/UI'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'
const ONGLETS  = ['en_cours', 'a_venir', 'terminees']
const LABELS   = { en_cours: 'En cours', a_venir: 'À venir', terminees: 'Terminées' }

function Groupes() {
  const [ligues, setLigues]             = useState([])
  const [membres, setMembres]           = useState({})
  const [charg, setCharg]               = useState(true)
  const [userId, setUserId]             = useState(null)
  const [creerOuvert, setCreerOuvert]   = useState(false)
  const [ligueEnModif, setLigueEnModif] = useState(null)
  const [onglet, setOnglet]             = useState('en_cours')
  const navigate                        = useNavigate()

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user.id)
    const { data: toutesLigues } = await supabase
      .from('groupes')
      .select('id, nom, date_debut, date_fin, admin_id, type_saison, saison')
      .order('date_debut', { ascending: false, nullsFirst: false })
    setLigues(toutesLigues || [])
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

  const supprimer = async (groupeId) => {
    if (!confirm('Supprimer cette ligue ? Cette action est irréversible.')) return
    await supabase.from('membres_groupe').delete().eq('groupe_id', groupeId)
    await supabase.from('groupes').delete().eq('id', groupeId)
    charger()
  }

  const maintenant = new Date()

  const categoriser = (l) => {
    const debut = l.date_debut ? new Date(l.date_debut) : null
    const fin   = l.date_fin   ? new Date(l.date_fin)   : null
    if (fin && fin < maintenant)               return 'terminees'
    if (debut && debut > maintenant)           return 'a_venir'
    return 'en_cours'
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const CarteLigue = ({ ligue }) => {
    const membre   = membres[ligue.id]
    const dedans   = membre?.actif === true
    const cat      = categoriser(ligue)
    const fermee   = cat === 'terminees'
    const aVenir   = cat === 'a_venir'

    return (
      <div style={{
        borderRadius: 'var(--radius-md)',
        background: dedans ? 'rgba(99,102,241,0.06)' : 'var(--bg-2)',
        borderWidth: 1, borderStyle: 'solid',
        borderColor: dedans ? 'var(--accent-border)' : 'rgba(99,102,241,0.08)',
        padding: '14px 16px',
        opacity: fermee ? 0.7 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Nom + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>{ligue.nom}</span>
              {dedans && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 4, padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)' }}>✓ Inscrit</span>
              )}
              {fermee && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 4, padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)' }}>Terminée</span>
              )}
              {aVenir && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', borderRadius: 4, padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(245,158,11,0.3)' }}>À venir</span>
              )}
            </div>

            {/* Dates */}
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              {ligue.date_debut && <span>Du {fmt(ligue.date_debut)}</span>}
              {ligue.date_fin   && <span> au {fmt(ligue.date_fin)}</span>}
            </div>

            {/* Points si inscrit */}
            {dedans && membre?.points != null && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--gold)' }}>{membre.points}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12, flexShrink: 0 }}>
            {!fermee && !dedans && (
              <button onClick={() => rejoindre(ligue.id)} style={{ fontSize: 12, fontWeight: 600, background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)', color: '#fff', paddingTop: 7, paddingBottom: 7, paddingLeft: 14, paddingRight: 14, cursor: 'pointer' }}>
                Rejoindre
              </button>
            )}
            {dedans && !fermee && (
              <button onClick={() => quitter(ligue.id)} style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}>
                Quitter
              </button>
            )}
            {/* Voir classement — en cours et terminées */}
            {(cat === 'en_cours' || cat === 'terminees') && (
              <button onClick={() => navigate(`/classement?ligue=${ligue.id}`)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)', borderRadius: 'var(--radius-sm)', paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}>
                Classement
              </button>
            )}
            {userId === ADMIN_ID && (
              <>
                <button onClick={() => { setLigueEnModif(ligue); setCreerOuvert(false) }} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)', borderRadius: 'var(--radius-sm)', paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}>
                  Modifier
                </button>
                <button onClick={() => supprimer(ligue.id)} style={{ fontSize: 11, color: 'var(--danger)', background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}>
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const liguesFiltrees = ligues.filter(l => categoriser(l) === onglet)

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        <div style={{
          padding: '20px 16px',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
          borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ margin: 0 }}>Ligues</h2>
            {userId === ADMIN_ID && (
              <button
                onClick={() => { setCreerOuvert(v => !v); setLigueEnModif(null) }}
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
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Rejoins une ligue pour entrer en compétition avec tes potes.
          </p>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 6 }}>
            {ONGLETS.map(o => (
              <button key={o} onClick={() => setOnglet(o)} style={{
                padding: '6px 14px',
                background: onglet === o ? 'var(--accent)' : 'var(--bg-2)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: onglet === o ? 'var(--accent)' : 'var(--border)',
                borderRadius: 99, color: onglet === o ? '#fff' : 'var(--text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                {LABELS[o]}
              </button>
            ))}
          </div>
        </div>

        {creerOuvert && userId === ADMIN_ID && (
          <div style={{ padding: '16px 16px 0' }}>
            <CreerGroupe onSuccess={() => { setCreerOuvert(false); charger() }} />
          </div>
        )}

        {ligueEnModif && userId === ADMIN_ID && (
          <div style={{ padding: '16px 16px 0' }}>
            <CreerGroupe ligueExistante={ligueEnModif} onSuccess={() => { setLigueEnModif(null); charger() }} />
          </div>
        )}

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}

        {!charg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 16px 24px' }}>
            {liguesFiltrees.length > 0
              ? liguesFiltrees.map(ligue => <CarteLigue key={ligue.id} ligue={ligue} />)
              : <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
                  Aucune ligue {LABELS[onglet].toLowerCase()} pour l'instant.
                </p>
            }
          </div>
        )}

      </main>
    </>
  )
}

export default Groupes