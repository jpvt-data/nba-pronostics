import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'
const ONGLETS  = ['en_cours', 'a_venir', 'terminees']
const LABELS   = { en_cours: 'En cours', a_venir: 'À venir', terminees: 'Terminées' }

const TitreSection = ({ label, couleur = 'var(--accent)' }) => (
  <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 500 46">
      <polygon points="0,0 260,0 240,46 0,46" fill={couleur} />
      <polygon points="248,0 274,0 254,46 228,46" fill={couleur} />
      <polygon points="282,0 304,0 284,46 262,46" fill={couleur} />
      <polygon points="312,0 330,0 310,46 292,46" fill={couleur} />
      <polygon points="338,0 353,0 333,46 318,46" fill={couleur} />
      <polygon points="361,0 374,0 354,46 341,46" fill={couleur} />
      <polygon points="382,0 393,0 373,46 362,46" fill={couleur} />
      <polygon points="401,0 410,0 390,46 381,46" fill={couleur} />
      <polygon points="418,0 426,0 406,46 398,46" fill={couleur} />
    </svg>
    <span style={{
      position: 'absolute', top: '50%', left: 16, transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
  </div>
)


const TAG_CONFIG = {
  preseason:    { label: 'Pré-saison',       couleur: '#6366f1' },
  regular:      { label: 'Saison régulière', couleur: '#9090b0' },
  nbacup:       { label: 'NBA Cup',          couleur: '#f97316' },
  allstar:      { label: 'All-Star',         couleur: '#f59e0b' },
  playin:       { label: 'Play-In',          couleur: '#22c55e' },
  playoffs:     { label: 'Playoffs',         couleur: '#ef4444' },
  finals:       { label: 'NBA Finals',       couleur: '#e11d48' },
  summer_league:{ label: 'Summer League',    couleur: '#06b6d4' },
}

function Groupes() {
  const [ligues, setLigues]             = useState([])
  const [membres, setMembres]           = useState({})
  const [charg, setCharg]               = useState(true)
  const [userId, setUserId]             = useState(null)
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

  const maintenant = new Date()

  const categoriser = (l) => {
    const debut = l.date_debut ? new Date(l.date_debut) : null
    const fin   = l.date_fin   ? new Date(l.date_fin)   : null
    if (fin && fin < maintenant)     return 'terminees'
    if (debut && debut > maintenant) return 'a_venir'
    return 'en_cours'
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  const CarteLigue = ({ ligue }) => {
    const membre = membres[ligue.id]
    const dedans = membre?.actif === true
    const cat    = categoriser(ligue)
    const fermee = cat === 'terminees'
    const aVenir = cat === 'a_venir'

    return (
      <div style={{
        background: dedans ? 'rgba(99,102,241,0.06)' : 'var(--bg-1)',
        borderLeft: dedans ? '3px solid var(--accent)' : '3px solid var(--border)',
        padding: '14px 16px',
        opacity: fermee ? 0.75 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Nom + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 18, color: 'var(--text-1)', letterSpacing: '0.02em' }}>{ligue.nom}</span>
              {ligue.tag && TAG_CONFIG[ligue.tag] && (
                <span style={{ fontSize: 10, fontWeight: 700, background: TAG_CONFIG[ligue.tag].couleur + '22', color: TAG_CONFIG[ligue.tag].couleur, padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: TAG_CONFIG[ligue.tag].couleur + '44', borderRadius: 3 }}>
                  {TAG_CONFIG[ligue.tag].label}
                </span>
              )}
              {dedans && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)' }}>Inscrit</span>
              )}
              {fermee && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.3)' }}>Terminée</span>
              )}
              {aVenir && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: 'var(--gold)', padding: '2px 6px', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(245,158,11,0.3)' }}>À venir</span>
              )}
            </div>

            {/* Dates */}
            <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
              {ligue.date_debut && <span>Du {fmt(ligue.date_debut)}</span>}
              {ligue.date_fin   && <span> au {fmt(ligue.date_fin)}</span>}
            </div>
            {/* Description */}
            {ligue.description && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5, fontStyle: 'italic' }}>
                {ligue.description}
              </div>
            )}

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
            {(cat === 'en_cours' || cat === 'terminees') && (
              <button onClick={() => navigate(`/classement?ligue=${ligue.id}`)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)', borderRadius: 'var(--radius-sm)', paddingTop: 5, paddingBottom: 5, paddingLeft: 10, paddingRight: 10, cursor: 'pointer' }}>
                Classement
              </button>
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

        {/* ── Header ── */}
        <div style={{ marginTop: 20 }}>
          <TitreSection label="MES LIGUES" couleur="var(--accent)" />
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '10px 16px 16px', lineHeight: 1.5 }}>
            Rejoins une ligue pour entrer en compétition avec tes potes.
          </p>

          {/* Onglets */}
          <div style={{ display: 'flex', gap: 4, margin: '0 16px 16px' }}>
            {ONGLETS.map(o => (
              <button key={o} onClick={() => setOnglet(o)} style={{
                padding: '6px 14px',
                background: onglet === o ? 'var(--accent)' : 'transparent',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: onglet === o ? 'var(--accent)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: onglet === o ? '#fff' : 'var(--text-3)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                {LABELS[o]}
              </button>
            ))}
          </div>
        </div>

        {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, padding: '2rem', textAlign: 'center' }}>Chargement…</p>}

        {!charg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 0 24px' }}>
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