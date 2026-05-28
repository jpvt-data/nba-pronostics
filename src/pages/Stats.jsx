import { useState, useEffect, useCallback } from 'react'
import Navigation from '../components/Navigation'
import { BanniereImage, LabelSection, Bloc } from '../components/UI'
import { Search, ChevronRight, ArrowLeft } from 'lucide-react'

// ── Constantes ESPN ──────────────────────────────────────────────────────────
const BASE      = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const BASE_WEB  = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba'
const URL_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026&seasontype=2'
const TIMEOUT   = 8000

const fetchAvecTimeout = (url) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT)
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const couleurEquipe = (hex) => hex ? `#${hex}` : 'var(--accent)'

// Logo avec fallback initiales
function LogoEquipe({ url, trigramme, taille = 32, couleur }) {
  const [erreur, setErreur] = useState(false)
  if (url && !erreur) {
    return <img src={url} alt={trigramme} onError={() => setErreur(true)}
      style={{ width: taille, height: taille, objectFit: 'contain', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: taille, height: taille, borderRadius: '50%', flexShrink: 0,
      background: couleur || 'var(--accent-dim)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: taille * 0.3, fontWeight: 800, color: '#fff',
    }}>{trigramme?.slice(0, 3)}</div>
  )
}

// Photo joueur avec fallback
function PhotoJoueur({ url, nom, taille = 48 }) {
  const [erreur, setErreur] = useState(false)
  if (url && !erreur) {
    return <img src={url} alt={nom} onError={() => setErreur(true)}
      style={{ width: taille, height: taille, objectFit: 'cover', objectPosition: 'top',
        borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: taille, height: taille, borderRadius: 'var(--radius-sm)', flexShrink: 0,
      background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: taille * 0.35, color: 'var(--text-3)',
    }}>?</div>
  )
}

// ── ONGLET CLASSEMENTS ───────────────────────────────────────────────────────
function OngletClassements() {
  const [donnees, setDonnees]       = useState({ est: [], ouest: [] })
  const [onglet, setOnglet]         = useState('est')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState(false)

  useEffect(() => {
    fetchAvecTimeout(URL_STANDINGS)
      .then(r => r.json())
      .then(data => {
        const conferences = data.children ?? []
        const est = [], ouest = []
        conferences.forEach(conf => {
          const nom   = conf.name ?? ''
          const liste = (conf.standings?.entries ?? []).map((e, i) => {
            const eq    = e.team
            const stats = e.stats || []
            const v = (n) => stats.find(s => s.name === n)?.value ?? '?'
            return {
              rang:       i + 1,
              id:         eq.id,
              logo:       eq.logos?.[0]?.href ?? null,
              trigramme:  eq.abbreviation ?? '???',
              nom:        eq.displayName ?? '',
              couleur:    eq.color ?? null,
              bilan:      `${v('wins')}-${v('losses')}`,
              domicile:   stats.find(s => s.name === 'Home')?.displayValue ?? '?',
              exterieur:  stats.find(s => s.name === 'Road')?.displayValue ?? '?',
              serie:      stats.find(s => s.name === 'streak')?.displayValue ?? '?',
              pct:        stats.find(s => s.name === 'winPercent')?.displayValue ?? '?',
            }
          })
          if (nom.toLowerCase().includes('east')) est.push(...liste)
          else ouest.push(...liste)
        })
        setDonnees({ est, ouest })
        setChargement(false)
      })
      .catch(() => { setErreur(true); setChargement(false) })
  }, [])

  const liste = onglet === 'est' ? donnees.est : donnees.ouest

  return (
    <div>
      <LabelSection>Classement NBA</LabelSection>

      {/* Onglets conférence */}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        {['est', 'ouest'].map(tab => (
          <button key={tab} onClick={() => setOnglet(tab)} style={{
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            paddingTop: 6, paddingBottom: 6, paddingLeft: 16, paddingRight: 16,
            borderRadius: 'var(--radius-sm)',
            borderWidth: 1, borderStyle: 'solid',
            background:  onglet === tab ? 'rgba(99,102,241,0.18)' : 'transparent',
            borderColor: onglet === tab ? 'rgba(99,102,241,0.5)'  : 'var(--border)',
            color:       onglet === tab ? 'var(--accent)'          : 'var(--text-3)',
          }}>
            {tab === 'est' ? 'Conférence Est' : 'Conférence Ouest'}
          </button>
        ))}
      </div>

      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}
      {erreur && <p style={{ color: 'var(--danger)', fontSize: 13 }}>Erreur ESPN</p>}

      {!chargement && !erreur && (
        <>
          {/* En-tête colonnes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 28px 1fr 52px 60px 60px 48px',
            gap: 4, padding: '4px 8px',
            fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>#</span>
            <span />
            <span>Équipe</span>
            <span style={{ textAlign: 'center' }}>Bilan</span>
            <span style={{ textAlign: 'center' }}>Dom.</span>
            <span style={{ textAlign: 'center' }}>Ext.</span>
            <span style={{ textAlign: 'center' }}>Série</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {liste.map((eq, idx) => (
              <div key={eq.trigramme} style={{
                display: 'grid',
                gridTemplateColumns: '28px 28px 1fr 52px 60px 60px 48px',
                gap: 4, alignItems: 'center',
                padding: '7px 8px',
                borderRadius: 'var(--radius-sm)',
                background: eq.rang <= 6
                  ? `linear-gradient(90deg, rgba(99,102,241,0.08), transparent)`
                  : idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderLeftWidth: eq.rang <= 6 ? 2 : 0,
                borderLeftStyle: 'solid',
                borderLeftColor: couleurEquipe(eq.couleur),
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, textAlign: 'center',
                  color: eq.rang <= 6 ? 'var(--accent)' : 'var(--text-3)',
                }}>{eq.rang}</span>

                <LogoEquipe url={eq.logo} trigramme={eq.trigramme} taille={22} couleur={couleurEquipe(eq.couleur)} />

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eq.trigramme}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eq.nom}
                  </div>
                </div>

                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)', textAlign: 'center', fontFamily: 'var(--font-display)' }}>
                  {eq.bilan}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center' }}>{eq.domicile}</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center' }}>{eq.exterieur}</span>
                <span style={{ fontSize: 11, textAlign: 'center',
                  color: eq.serie?.startsWith('W') ? 'var(--success)' : eq.serie?.startsWith('L') ? 'var(--danger)' : 'var(--text-3)',
                  fontWeight: 700,
                }}>{eq.serie}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 10 }}>
            <span style={{ color: 'var(--accent)' }}>■</span> Top 6 — qualifiés playoffs directs
          </p>
        </>
      )}
    </div>
  )
}

// ── ONGLET ÉQUIPES ───────────────────────────────────────────────────────────
function OngletEquipes() {
  const [equipes, setEquipes]       = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState(false)
  const [equipeChoisie, setEquipeChoisie] = useState(null)

  useEffect(() => {
    fetchAvecTimeout(`${BASE}/teams?limit=30`)
      .then(r => r.json())
      .then(data => {
        const liste = (data.sports?.[0]?.leagues?.[0]?.teams ?? []).map(({ team: t }) => ({
          id:            t.id,
          trigramme:     t.abbreviation,
          nom:           t.displayName,
          nomCourt:      t.shortDisplayName,
          couleur:       t.color ?? null,
          couleurAlt:    t.alternateColor ?? null,
          logo:          t.logos?.[0]?.href ?? null,
          logoSombre:    t.logos?.[1]?.href ?? t.logos?.[0]?.href ?? null,
        }))
        // Tri alphabétique
        liste.sort((a, b) => a.nom.localeCompare(b.nom))
        setEquipes(liste)
        setChargement(false)
      })
      .catch(() => { setErreur(true); setChargement(false) })
  }, [])

  if (equipeChoisie) {
    return <FicheEquipe equipe={equipeChoisie} onRetour={() => setEquipeChoisie(null)} />
  }

  return (
    <div>
      <LabelSection>30 Franchises NBA</LabelSection>

      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 12 }}>Chargement…</p>}
      {erreur && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>Erreur ESPN</p>}

      {!chargement && !erreur && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10, marginTop: 12,
        }}>
          {equipes.map(eq => {
            const couleur = couleurEquipe(eq.couleur)
            return (
              <button
                key={eq.id}
                onClick={() => setEquipeChoisie(eq)}
                style={{
                  background: `linear-gradient(135deg, ${couleur}18, ${couleur}06)`,
                  borderWidth: 1, borderStyle: 'solid', borderColor: `${couleur}40`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'transform 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = couleur; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${couleur}40`; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <LogoEquipe url={eq.logoSombre} trigramme={eq.trigramme} taille={44} couleur={couleur} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.05em' }}>{eq.trigramme}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.3, marginTop: 2 }}>{eq.nomCourt}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── FICHE ÉQUIPE ─────────────────────────────────────────────────────────────
function FicheEquipe({ equipe, onRetour }) {
  const [onglet, setOnglet]   = useState('roster')
  const [roster, setRoster]   = useState([])
  const [blessés, setBlessés] = useState([])
  const [chargement, setChargement] = useState(true)
  const [joueurChoisi, setJoueurChoisi] = useState(null)

  const couleur = couleurEquipe(equipe.couleur)

  useEffect(() => {
    setChargement(true)
    Promise.allSettled([
      fetchAvecTimeout(`${BASE}/teams/${equipe.id}/roster`).then(r => r.json()),
      fetchAvecTimeout(`${BASE}/teams/${equipe.id}/injuries`).then(r => r.json()),
    ]).then(([resRoster, resBlessés]) => {
      if (resRoster.status === 'fulfilled') {
        const athletes = resRoster.value.athletes ?? []
        // Roster ESPN : tableau de groupes par position
        const joueurs = athletes.flatMap(groupe =>
          (groupe.items ?? []).map(j => ({
            id:       j.id,
            nom:      j.fullName,
            prenom:   j.firstName,
            nomFam:   j.lastName,
            numero:   j.jersey ?? '—',
            position: j.position?.abbreviation ?? '?',
            photo:    j.headshot?.href ?? null,
            taille:   j.displayHeight ?? '—',
            poids:    j.displayWeight ?? '—',
          }))
        )
        setRoster(joueurs)
      }
      if (resBlessés.status === 'fulfilled') {
        const injuries = resBlessés.value.injuries ?? []
        setBlessés(injuries.map(b => ({
          id:     b.athlete?.id,
          nom:    b.athlete?.displayName ?? '?',
          statut: b.status ?? '?',
          detail: b.details?.detail ?? '',
        })))
      }
      setChargement(false)
    })
  }, [equipe.id])

  if (joueurChoisi) {
    return <FicheJoueur joueur={joueurChoisi} equipe={equipe} onRetour={() => setJoueurChoisi(null)} />
  }

  return (
    <div>
      {/* Bouton retour */}
      <button onClick={onRetour} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', borderWidth: 0, color: 'var(--text-3)',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0,
      }}>
        <ArrowLeft size={16} /> Toutes les équipes
      </button>

      {/* Header équipe */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${couleur}20, ${couleur}06)`,
        borderRadius: 'var(--radius-lg)',
        borderWidth: 1, borderStyle: 'solid', borderColor: `${couleur}40`,
        marginBottom: 16,
      }}>
        <LogoEquipe url={equipe.logoSombre} trigramme={equipe.trigramme} taille={56} couleur={couleur} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            {equipe.nom}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{equipe.trigramme}</div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { val: 'roster', label: 'Effectif' },
          { val: 'blessés', label: `Blessés${blessés.length > 0 ? ` (${blessés.length})` : ''}` },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setOnglet(val)} style={{
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 14,
            borderRadius: 'var(--radius-sm)',
            borderWidth: 1, borderStyle: 'solid',
            background:  onglet === val ? `${couleur}20` : 'transparent',
            borderColor: onglet === val ? `${couleur}80` : 'var(--border)',
            color:       onglet === val ? couleur : 'var(--text-3)',
          }}>{label}</button>
        ))}
      </div>

      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}

      {/* Roster */}
      {!chargement && onglet === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {roster.map(j => (
            <button key={j.id} onClick={() => setJoueurChoisi(j)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-md)', padding: '8px 12px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${couleur}60`}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <PhotoJoueur url={j.photo} nom={j.nom} taille={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {j.nom}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>#{j.numero} · {j.position}</div>
              </div>
              <ChevronRight size={14} color="var(--text-3)" />
            </button>
          ))}
        </div>
      )}

      {/* Blessés */}
      {!chargement && onglet === 'blessés' && (
        <div>
          {blessés.length === 0
            ? <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun blessé répertorié.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blessés.map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: 'rgba(239,68,68,0.06)',
                    borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.15)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{b.nom}</div>
                      {b.detail && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{b.detail}</div>}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--danger)',
                      background: 'rgba(239,68,68,0.12)', borderRadius: 4,
                      paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6,
                    }}>{b.statut}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

// ── ONGLET JOUEURS ───────────────────────────────────────────────────────────
function OngletJoueurs() {
  const [equipes, setEquipes]       = useState([])
  const [equipeChoisie, setEquipeChoisie] = useState(null)
  const [recherche, setRecherche]   = useState('')
  const [roster, setRoster]         = useState([])
  const [chargement, setChargement] = useState(false)
  const [joueurChoisi, setJoueurChoisi] = useState(null)
  const [chargementEquipes, setChargementEquipes] = useState(true)

  // Charger la liste des équipes pour le sélecteur
  useEffect(() => {
    fetchAvecTimeout(`${BASE}/teams?limit=30`)
      .then(r => r.json())
      .then(data => {
        const liste = (data.sports?.[0]?.leagues?.[0]?.teams ?? []).map(({ team: t }) => ({
          id: t.id, trigramme: t.abbreviation, nom: t.displayName,
          couleur: t.color ?? null, logo: t.logos?.[0]?.href ?? null,
        }))
        liste.sort((a, b) => a.nom.localeCompare(b.nom))
        setEquipes(liste)
        setChargementEquipes(false)
      })
      .catch(() => setChargementEquipes(false))
  }, [])

  // Charger le roster quand une équipe est choisie
  useEffect(() => {
    if (!equipeChoisie) return
    setChargement(true)
    setRoster([])
    fetchAvecTimeout(`${BASE}/teams/${equipeChoisie.id}/roster`)
      .then(r => r.json())
      .then(data => {
        const joueurs = (data.athletes ?? []).flatMap(groupe =>
          (groupe.items ?? []).map(j => ({
            id:       j.id,
            nom:      j.fullName,
            numero:   j.jersey ?? '—',
            position: j.position?.abbreviation ?? '?',
            photo:    j.headshot?.href ?? null,
          }))
        )
        setRoster(joueurs)
        setChargement(false)
      })
      .catch(() => setChargement(false))
  }, [equipeChoisie])

  if (joueurChoisi) {
    return <FicheJoueur joueur={joueurChoisi} equipe={equipeChoisie} onRetour={() => setJoueurChoisi(null)} />
  }

  const rosterFiltré = roster.filter(j =>
    j.nom.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div>
      <LabelSection>Joueurs NBA</LabelSection>

      {/* Sélecteur équipe */}
      <div style={{ marginTop: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
          ÉQUIPE
        </label>
        <select
          value={equipeChoisie?.id ?? ''}
          onChange={e => {
            const eq = equipes.find(x => x.id === e.target.value)
            setEquipeChoisie(eq ?? null)
            setRecherche('')
          }}
          style={{
            width: '100%', fontSize: 13, fontWeight: 600,
            color: 'var(--text-1)', background: 'var(--bg-1)',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          <option value="">— Choisir une équipe —</option>
          {equipes.map(eq => (
            <option key={eq.id} value={eq.id}>{eq.nom} ({eq.trigramme})</option>
          ))}
        </select>
      </div>

      {/* Recherche dans le roster */}
      {equipeChoisie && (
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un joueur…"
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingTop: 8, paddingBottom: 8, paddingLeft: 32, paddingRight: 12,
              fontSize: 13, color: 'var(--text-1)', background: 'var(--bg-1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          />
        </div>
      )}

      {chargementEquipes && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>}
      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement du roster…</p>}

      {!chargement && equipeChoisie && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rosterFiltré.map(j => {
            const couleur = couleurEquipe(equipeChoisie.couleur)
            return (
              <button key={j.id} onClick={() => setJoueurChoisi(j)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--bg-1)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-md)', padding: '8px 12px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${couleur}60`}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <PhotoJoueur url={j.photo} nom={j.nom} taille={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {j.nom}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>#{j.numero} · {j.position}</div>
                </div>
                <ChevronRight size={14} color="var(--text-3)" />
              </button>
            )
          })}
          {rosterFiltré.length === 0 && recherche && (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucun joueur trouvé.</p>
          )}
        </div>
      )}

      {!equipeChoisie && !chargementEquipes && (
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Sélectionne une équipe pour voir son roster.</p>
      )}
    </div>
  )
}

// ── FICHE JOUEUR ─────────────────────────────────────────────────────────────
function FicheJoueur({ joueur, equipe, onRetour }) {
  const [profil, setProfil]   = useState(null)
  const [stats, setStats]     = useState(null)
  const [chargement, setChargement] = useState(true)

  const couleur = equipe ? couleurEquipe(equipe.couleur) : 'var(--accent)'

  useEffect(() => {
    setChargement(true)
    Promise.allSettled([
      fetchAvecTimeout(`${BASE}/athletes/${joueur.id}`).then(r => r.json()),
      fetchAvecTimeout(`${BASE_WEB}/athletes/${joueur.id}/stats`).then(r => r.json()),
    ]).then(([resProfil, resStats]) => {
      if (resProfil.status === 'fulfilled') {
        const a = resProfil.value.athlete ?? resProfil.value
        setProfil({
          nom:       a.fullName ?? joueur.nom,
          photo:     a.headshot?.href ?? joueur.photo ?? null,
          numero:    a.jersey ?? joueur.numero ?? '—',
          position:  a.position?.displayName ?? joueur.position ?? '—',
          age:       a.age ?? '—',
          taille:    a.displayHeight ?? '—',
          poids:     a.displayWeight ?? '—',
          experience: a.experience?.years ?? '—',
        })
      }
      if (resStats.status === 'fulfilled') {
        // Structure ESPN stats : categories avec splits
        const splits = resStats.value.splits
        const categs = splits?.categories ?? []
        const general = categs.find(c => c.name === 'general' || c.displayName?.toLowerCase().includes('général'))
          ?? categs[0]
        const entries = general?.stats ?? []
        const v = (n) => entries.find(s => s.name === n)?.displayValue ?? '—'
        setStats({
          pts:  v('avgPoints'),
          reb:  v('avgRebounds'),
          ast:  v('avgAssists'),
          stl:  v('avgSteals'),
          blk:  v('avgBlocks'),
          fg:   v('fieldGoalPct'),
          fg3:  v('threePointFieldGoalPct'),
          ft:   v('freeThrowPct'),
          gp:   v('gamesPlayed'),
          min:  v('avgMinutes'),
        })
      }
      setChargement(false)
    })
  }, [joueur.id])

  const statItems = stats ? [
    { label: 'PPG',   val: stats.pts },
    { label: 'RPG',   val: stats.reb },
    { label: 'APG',   val: stats.ast },
    { label: 'SPG',   val: stats.stl },
    { label: 'BPG',   val: stats.blk },
    { label: 'Min',   val: stats.min },
    { label: 'FG%',   val: stats.fg },
    { label: '3P%',   val: stats.fg3 },
    { label: 'FT%',   val: stats.ft },
    { label: 'Matchs', val: stats.gp },
  ] : []

  return (
    <div>
      <button onClick={onRetour} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', borderWidth: 0, color: 'var(--text-3)',
        fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0,
      }}>
        <ArrowLeft size={16} />
        {equipe ? `Retour — ${equipe.trigramme}` : 'Retour'}
      </button>

      {/* Header joueur */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'flex-start',
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${couleur}18, ${couleur}06)`,
        borderRadius: 'var(--radius-lg)',
        borderWidth: 1, borderStyle: 'solid', borderColor: `${couleur}40`,
        marginBottom: 16,
      }}>
        <PhotoJoueur url={profil?.photo ?? joueur.photo} nom={joueur.nom} taille={72} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
            {profil?.nom ?? joueur.nom}
          </div>
          <div style={{ fontSize: 12, color: couleur, fontWeight: 700, marginTop: 4 }}>
            {equipe && `${equipe.trigramme} · `}#{profil?.numero ?? joueur.numero} · {profil?.position ?? joueur.position}
          </div>
          {profil && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Âge', val: profil.age },
                { label: 'Taille', val: profil.taille },
                { label: 'Poids', val: profil.poids },
                { label: 'Exp.', val: profil.experience !== '—' ? `${profil.experience} ans` : '—' },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {chargement && <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement des stats…</p>}

      {/* Stats saison */}
      {!chargement && stats && (
        <div>
          <LabelSection>Stats saison</LabelSection>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8, marginTop: 10,
          }}>
            {statItems.map(({ label, val }) => (
              <div key={label} style={{
                background: 'var(--bg-1)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 6px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>{val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontWeight: 700 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!chargement && !stats && (
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Stats indisponibles.</p>
      )}
    </div>
  )
}

// ── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const ONGLETS = [
  { val: 'classements', label: 'Classements' },
  { val: 'equipes',     label: 'Équipes' },
  { val: 'joueurs',     label: 'Joueurs' },
]

export default function Stats() {
  const [onglet, setOnglet] = useState('classements')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-0)', paddingBottom: 80 }}>
      <Navigation />

      {/* Header plein bord */}
      <div className="nav-desktop-full nav-mobile-logo" style={{ paddingTop: 52 }}>
        {/* spacer desktop */}
      </div>
      <div style={{ height: 52, display: 'none' }} className="nav-desktop-spacer" />

      {/* Espaceur pour la nav */}
      <div style={{ height: 52 }} className="nav-desktop-full" />
      <div style={{ height: 40 }} className="nav-mobile-logo" />

      <BanniereImage
        src="https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60"
        alt="Explorer NBA"
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, letterSpacing: '0.08em', color: '#fff' }}>
          EXPLORER
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
          Classements · Équipes · Joueurs
        </div>
      </BanniereImage>

      {/* Onglets principaux */}
      <div style={{
        display: 'flex', gap: 0,
        margin: '0 16px 0',
        borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border)',
      }}>
        {ONGLETS.map(({ val, label }) => (
          <button key={val} onClick={() => setOnglet(val)} style={{
            flex: 1, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            paddingTop: 12, paddingBottom: 12,
            background: 'none', borderWidth: 0,
            color: onglet === val ? 'var(--text-1)' : 'var(--text-3)',
            boxShadow: onglet === val ? 'inset 0 -2px 0 var(--accent)' : 'none',
            transition: 'color 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* Contenu onglet */}
      <div style={{ padding: '16px 16px 0' }}>
        {onglet === 'classements' && <OngletClassements />}
        {onglet === 'equipes'     && <OngletEquipes />}
        {onglet === 'joueurs'     && <OngletJoueurs />}
      </div>
    </div>
  )
}