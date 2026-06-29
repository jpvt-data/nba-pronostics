import { useState, useEffect, useRef, useCallback } from 'react'

// Panneau + arceau + filet réaliste en SVG, ballon en trajectoire d'arc (offset-path).
// Mécanique inchangée : 2 barres de précision séquentielles (horizontale puis verticale).
// Trajectoires calibrées et validées dans Admin > Animations avant intégration ici.

const STYLE_ANIM_LANCER = `
@keyframes swl-tir-reussi {
  0%   { offset-distance: 0%; opacity: 1; }
  70%  { offset-distance: 100%; opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes swl-tir-rate {
  0%   { offset-distance: 0%; opacity: 1; }
  85%  { offset-distance: 100%; opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
`
if (typeof document !== 'undefined' && !document.getElementById('swl-anim-lancer-style')) {
  const el = document.createElement('style')
  el.id = 'swl-anim-lancer-style'
  el.textContent = STYLE_ANIM_LANCER
  document.head.appendChild(el)
}

const TRAJECTOIRE_REUSSI = 'M 55 330 C 50 210, 70 95, 130 75 C 150 68, 158 95, 155 128 C 153 150, 155 165, 155 185'
const TRAJECTOIRE_RATE   = 'M 55 330 C 50 200, 75 90, 140 75 C 165 70, 195 85, 215 115 C 228 135, 232 155, 222 175'

const PanneauEtArceau = () => (
  <g>
    <rect x="148" y="160" width="14" height="160" fill="#9a9a9a" />
    <rect x="148" y="160" width="5" height="160" fill="#c4c4c4" />
    <ellipse cx="155" cy="320" rx="22" ry="6" fill="#000" opacity="0.2" />

    <g transform="translate(155,60)">
      <rect x="-95" y="0" width="190" height="78" rx="3" fill="#e9e9ec" stroke="#1a1a1a" strokeWidth="3" />
      <rect x="-83" y="10" width="166" height="58" fill="none" stroke="#d23b1f" strokeWidth="3" />
      <rect x="-30" y="36" width="60" height="32" fill="none" stroke="#d23b1f" strokeWidth="3" />
      <rect x="-95" y="68" width="190" height="10" fill="#1a1a1a" />
    </g>

    <g stroke="#f5f5f5" strokeWidth="1.3" fill="none" opacity="0.95">
      <path d="M-34 1 L-12 56" transform="translate(155,128)" />
      <path d="M-22 3 L-7 58" transform="translate(155,128)" />
      <path d="M-9 4 L-2 59" transform="translate(155,128)" />
      <path d="M9 4 L2 59" transform="translate(155,128)" />
      <path d="M22 3 L7 58" transform="translate(155,128)" />
      <path d="M34 1 L12 56" transform="translate(155,128)" />
      <ellipse cx="155" cy="142" rx="33" ry="6.3" />
      <ellipse cx="155" cy="156" rx="24" ry="4.6" />
      <ellipse cx="155" cy="168" rx="15" ry="2.9" />
      <ellipse cx="155" cy="178" rx="7" ry="1.4" />
    </g>
  </g>
)

const Arceau = () => (
  <g>
    <ellipse cx="155" cy="128" rx="42" ry="9" fill="none" stroke="#1a1a1a" strokeWidth="4" />
    <ellipse cx="155" cy="128" rx="38" ry="7.2" fill="none" stroke="#e8501f" strokeWidth="2.2" />
  </g>
)

const JoueurArcade = ({ zonePct = 18, vitesse = 2.5, onResultat, verrouille = false }) => {
  const [etape, setEtape] = useState('horizontale')
  const [posH, setPosH] = useState(0)
  const [posV, setPosV] = useState(0)
  const [dirH, setDirH] = useState(1)
  const [dirV, setDirV] = useState(1)
  const [reussiH, setReussiH] = useState(null)
  const [resultatFinal, setResultatFinal] = useState(null)
  const [animKey, setAnimKey] = useState(0)

  const rafRef = useRef(null)
  const zoneDebut = (100 - zonePct) / 2
  const zoneFin = zoneDebut + zonePct

  useEffect(() => {
    if (verrouille || etape === 'resultat') return

    const tick = () => {
      if (etape === 'horizontale') {
        setPosH(prev => {
          let next = prev + dirH * vitesse
          if (next >= 100) { next = 100; setDirH(-1) }
          if (next <= 0)   { next = 0;   setDirH(1) }
          return next
        })
      } else if (etape === 'verticale') {
        setPosV(prev => {
          let next = prev + dirV * vitesse
          if (next >= 100) { next = 100; setDirV(-1) }
          if (next <= 0)   { next = 0;   setDirV(1) }
          return next
        })
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [etape, dirH, dirV, vitesse, verrouille])

  const arreterBarre = useCallback(() => {
    if (verrouille) return

    if (etape === 'horizontale') {
      const dansLaZone = posH >= zoneDebut && posH <= zoneFin
      setReussiH(dansLaZone)
      setEtape('verticale')
      return
    }

    if (etape === 'verticale') {
      const dansLaZone = posV >= zoneDebut && posV <= zoneFin
      const panier = reussiH && dansLaZone
      setResultatFinal(panier ? 'panier' : 'rate')
      setAnimKey(k => k + 1)
      setEtape('resultat')
    }
  }, [etape, posH, posV, reussiH, zoneDebut, zoneFin, verrouille])

  useEffect(() => {
    if (etape !== 'resultat' || !resultatFinal) return
    const t = setTimeout(() => {
      onResultat?.(resultatFinal)
      setEtape('horizontale')
      setPosH(0); setPosV(0); setDirH(1); setDirV(1)
      setReussiH(null); setResultatFinal(null)
    }, 1500)
    return () => clearTimeout(t)
  }, [etape, resultatFinal, onResultat])

  const trajectoire = resultatFinal === 'panier' ? TRAJECTOIRE_REUSSI : TRAJECTOIRE_RATE
  const animation = resultatFinal === 'panier' ? 'swl-tir-reussi' : 'swl-tir-rate'

  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12 }}>

      {/* Layout 2 colonnes : animation gauche, contrôles droite */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>

        {/* Colonne gauche — animation SVG, hauteur fixe */}
        <div style={{ flexShrink: 0, width: 160 }}>
          <svg key={animKey} width="160" height="220" viewBox="0 0 320 360" style={{ display: 'block', background: '#1a2e3d', borderRadius: 'var(--radius-sm)' }}>
            <rect x="0" y="320" width="320" height="40" fill="#2a3f4f" />
            <ellipse cx="160" cy="320" rx="140" ry="8" fill="#000" opacity="0.15" />
            <PanneauEtArceau />
            {resultatFinal && (
              <g style={{
                offsetPath: `path('${trajectoire}')`,
                offsetDistance: '0%',
                animation: `${animation} 1.5s ${resultatFinal === 'panier' ? 'ease-in-out' : 'linear'} 1`,
              }}>
                <circle cx="0" cy="0" r="15" fill="#e8731f" stroke="#1a1a1a" strokeWidth="1.5" />
                <path d="M-15 0 L15 0 M0 -15 L0 15 M-10.5 -10.5 Q0 0 -10.5 10.5 M10.5 -10.5 Q0 0 10.5 10.5" stroke="#1a1a1a" strokeWidth="1" fill="none" />
              </g>
            )}
            <Arceau />
          </svg>
        </div>

        {/* Colonne droite — barres de précision + feedback + bouton */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>

          {/* Barre horizontale */}
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Gauche / Droite
            </div>
            <div style={{ position: 'relative', height: 14, background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: `${zoneDebut}%`, width: `${zonePct}%`, height: '100%', background: 'var(--success-dim)', borderLeft: '1px solid var(--success)', borderRight: '1px solid var(--success)' }} />
              {etape === 'horizontale' && (
                <div style={{ position: 'absolute', left: `${posH}%`, top: 0, width: 3, height: '100%', background: 'var(--text-1)', transform: 'translateX(-1.5px)' }} />
              )}
              {etape !== 'horizontale' && (
                <div style={{ position: 'absolute', left: `${posH}%`, top: 0, width: 3, height: '100%', background: reussiH ? 'var(--success)' : 'var(--danger)', transform: 'translateX(-1.5px)' }} />
              )}
            </div>
          </div>

          {/* Barre verticale + feedback — centré horizontalement */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Force</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 14, height: 80, background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: `${zoneDebut}%`, height: `${zonePct}%`, width: '100%', background: 'var(--success-dim)', borderTop: '1px solid var(--success)', borderBottom: '1px solid var(--success)' }} />
                {etape === 'verticale' && (
                  <div style={{ position: 'absolute', top: `${posV}%`, left: 0, height: 3, width: '100%', background: 'var(--text-1)', transform: 'translateY(-1.5px)' }} />
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                {resultatFinal === 'panier' && (
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--success)' }}>PANIER !</span>
                )}
                {resultatFinal === 'rate' && (
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--danger)' }}>RATÉ</span>
                )}
                {!resultatFinal && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {etape === 'horizontale' ? 'Stoppe la barre' : 'Encore une fois !'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton TIRER */}
          <button
            onClick={arreterBarre}
            disabled={verrouille || etape === 'resultat'}
            style={{
              width: '100%', padding: '14px 0',
              background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)',
              color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-body)',
              cursor: verrouille || etape === 'resultat' ? 'default' : 'pointer',
              opacity: verrouille || etape === 'resultat' ? 0.5 : 1,
              letterSpacing: '0.05em',
            }}
          >
            TIRER
          </button>
        </div>
      </div>
    </div>
  )
}

export default JoueurArcade
