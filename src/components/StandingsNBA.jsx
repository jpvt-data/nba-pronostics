import { useState, useEffect } from 'react'

const URL_STANDINGS = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/standings'

// Extrait rang, logo, trigramme, victoires, défaites depuis l'entrée ESPN
const parseEquipe = (entree, rang) => {
  const equipe = entree.team
  const stats  = entree.stats || []
  const wins   = stats.find(s => s.name === 'wins')?.value ?? '?'
  const losses = stats.find(s => s.name === 'losses')?.value ?? '?'
  return {
    rang,
    logo:      equipe.logos?.[0]?.href ?? null,
    trigramme: equipe.abbreviation ?? equipe.shortDisplayName ?? '???',
    nom:       equipe.displayName ?? '',
    bilan:     `${wins}-${losses}`,
  }
}

export default function StandingsNBA() {
  const [donnees, setDonnees]         = useState({ est: [], ouest: [] })
  const [onglet, setOnglet]           = useState('est')
  const [chargement, setChargement]   = useState(true)
  const [erreur, setErreur]           = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(URL_STANDINGS, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        // ESPN retourne children[] avec les 2 conférences
        const conferences = data.children ?? []
        const est   = []
        const ouest = []

        conferences.forEach(conf => {
          const nom       = conf.name ?? ''
          const equipes   = conf.standings?.entries ?? []
          const liste     = equipes.map((e, i) => parseEquipe(e, i + 1))
          if (nom.toLowerCase().includes('east')) est.push(...liste)
          else ouest.push(...liste)
        })

        setDonnees({ est, ouest })
        setChargement(false)
      })
      .catch(() => {
        setErreur(true)
        setChargement(false)
      })

    return () => controller.abort()
  }, [])

  if (erreur || (!chargement && donnees.est.length === 0 && donnees.ouest.length === 0)) return null

  const liste = onglet === 'est' ? donnees.est : donnees.ouest

  return (
    <div style={{
      margin: '12px 16px 0',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
      padding: '16px 16px 12px',
    }}>
      {/* Titre */}
      <h3 style={{
        display: 'inline-block',
        background: 'linear-gradient(90deg, var(--accent), var(--orange))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        letterSpacing: '0.1em', fontSize: 13, fontWeight: 700, margin: 0,
      }}>Classement NBA</h3>

      {/* Tabs Est / Ouest */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 10 }}>
        {['est', 'ouest'].map(tab => (
          <button
            key={tab}
            onClick={() => setOnglet(tab)}
            style={{
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              borderWidth: 1, borderStyle: 'solid',
              background:    onglet === tab ? 'rgba(99,102,241,0.18)' : 'transparent',
              borderColor:   onglet === tab ? 'rgba(99,102,241,0.5)'  : 'var(--border)',
              color:         onglet === tab ? 'var(--accent)'          : 'var(--text-3)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'est' ? 'Conférence Est' : 'Conférence Ouest'}
          </button>
        ))}
      </div>

      {/* Liste */}
      {chargement ? (
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '8px 0' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {liste.map(eq => (
            <div key={eq.trigramme} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 6px',
              borderRadius: 'var(--radius-sm)',
              background: eq.rang <= 6 ? 'rgba(99,102,241,0.06)' : 'transparent',
            }}>
              {/* Rang */}
              <span style={{
                width: 18, textAlign: 'right', flexShrink: 0,
                fontSize: 11, fontWeight: 700,
                color: eq.rang <= 6 ? 'var(--accent)' : 'var(--text-3)',
              }}>{eq.rang}</span>

              {/* Logo */}
              {eq.logo
                ? <img src={eq.logo} alt={eq.trigramme} style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
                : <span style={{ width: 20, flexShrink: 0 }} />
              }

              {/* Trigramme + nom */}
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', minWidth: 36 }}>{eq.trigramme}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.nom}</span>

              {/* Bilan */}
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>{eq.bilan}</span>
            </div>
          ))}
        </div>
      )}

      {/* Légende playoff */}
      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '10px 0 0' }}>
        <span style={{ color: 'var(--accent)' }}>■</span> Top 6 — qualifiés playoffs directs
      </p>
    </div>
  )
}