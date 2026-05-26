import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import CreerGroupe from '../components/CreerGroupe'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'

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
    margin: '0', height: hauteur,
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

function Groupes() {
  const [ligues, setLigues]   = useState([])
  const [membres, setMembres] = useState({})
  const [charg, setCharg]     = useState(true)
  const [userId, setUserId]   = useState(null)
  const [creerOuvert, setCreerOuvert] = useState(false)

  const charger = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user.id)
    const { data: toutesLigues } = await supabase
      .from('groupes')
      .select('id, nom, date_fin, admin_id')
      .order('date_fin', { ascending: false, nullsFirst: false })
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

  const estFermee = (date_fin) => date_fin && new Date(date_fin) < new Date()

  // Trier : actives d'abord, fermées en bas
  const liguesTriees = [...ligues].sort((a, b) => {
    const aFermee = estFermee(a.date_fin) ? 1 : 0
    const bFermee = estFermee(b.date_fin) ? 1 : 0
    return aFermee - bFermee
  })

  const liguesActives = liguesTriees.filter(l => !estFermee(l.date_fin))
  const liguesTerminees = liguesTriees.filter(l => estFermee(l.date_fin))

  const CarteLigue = ({ ligue }) => {
    const membre  = membres[ligue.id]
    const dedans  = membre?.actif === true
    const fermee  = estFermee(ligue.date_fin)
    const dateFin = ligue.date_fin
      ? new Date(ligue.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : null

    return (
      <div style={{
        borderRadius: 'var(--radius-md)',
        background: dedans ? 'rgba(99,102,241,0.06)' : 'var(--bg-2)',
        borderWidth: 1, borderStyle: 'solid',
        borderColor: dedans ? 'var(--accent-border)' : 'rgba(99,102,241,0.08)',
        padding: '14px 16px',
        opacity: fermee ? 0.65 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)' }}>{ligue.nom}</span>
              {dedans && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 4, padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)' }}>✓ Inscrit</span>
              )}
              {fermee && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 4, padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)' }}>Terminée</span>
              )}
            </div>
            {dateFin && (
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {fermee ? 'Terminée le' : 'Jusqu\'au'} {dateFin}
              </div>
            )}
            {dedans && membre?.points != null && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>{membre.points}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
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
          </div>
        </div>
      </div>
    )
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
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
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
            Rejoins une ligue pour entrer en compétition avec tes potes. Chaque ligue a sa propre période — pronos comptabilisés uniquement pendant la ligue active.
          </p>
        </div>

        {/* ── Bannière ── */}
        <BanniereImage url="https://images.unsplash.com/photo-1563506644863-444710df1e03?w=800&q=60" />

        {/* ── Formulaire création (admin) ── */}
        {creerOuvert && userId === ADMIN_ID && (
          <div style={{ padding: '16px 16px 0' }}>
            <CreerGroupe onSuccess={() => { setCreerOuvert(false); charger() }} />
          </div>
        )}

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}

        {!charg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 24px' }}>

            {/* Ligues actives */}
            {liguesActives.length > 0 && (
              <div style={{ ...BLOC }}>
                <LabelSection>En cours</LabelSection>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {liguesActives.map(ligue => <CarteLigue key={ligue.id} ligue={ligue} />)}
                </div>
              </div>
            )}

            {/* Ligues terminées */}
            {liguesTerminees.length > 0 && (
              <div style={{ ...BLOC, opacity: 0.8 }}>
                <LabelSection>Terminées</LabelSection>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {liguesTerminees.map(ligue => <CarteLigue key={ligue.id} ligue={ligue} />)}
                </div>
              </div>
            )}

            {ligues.length === 0 && (
              <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>Aucune ligue disponible pour l'instant.</p>
            )}
          </div>
        )}

      </main>
    </>
  )
}

export default Groupes
