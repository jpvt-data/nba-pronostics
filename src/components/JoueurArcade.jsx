import { useState, useEffect, useRef, useCallback } from 'react'

// Joueur chibi + panneau + arceau — esthétique flat retro, tokens CSS de l'app.
// Mécanique : 2 barres de précision séquentielles (horizontale puis verticale).
// Vert + Vert = panier. Toute autre combinaison = raté.

const JoueurArcade = ({ zonePct = 18, vitesse = 2.5, onResultat, verrouille = false }) => {
  const [etape, setEtape] = useState('horizontale') // 'horizontale' | 'verticale' | 'resultat'
  const [posH, setPosH] = useState(0)
  const [posV, setPosV] = useState(0)
  const [dirH, setDirH] = useState(1)
  const [dirV, setDirV] = useState(1)
  const [reussiH, setReussiH] = useState(null)
  const [resultatFinal, setResultatFinal] = useState(null) // 'panier' | 'rate'
  const [ballonAnim, setBallonAnim] = useState(null) // 'tir' | 'rebond' | null

  const rafRef = useRef(null)
  const zoneDebut = (100 - zonePct) / 2
  const zoneFin = zoneDebut + zonePct

  // Boucle d'oscillation — une seule barre active à la fois
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
      setBallonAnim(panier ? 'tir' : 'rebond')
      setEtape('resultat')
    }
  }, [etape, posH, posV, reussiH, zoneDebut, zoneFin, verrouille])

  // Notifie le parent une fois l'animation jouée, puis reset pour le tir suivant
  useEffect(() => {
    if (etape !== 'resultat' || !resultatFinal) return
    const t = setTimeout(() => {
      onResultat?.(resultatFinal)
      setEtape('horizontale')
      setPosH(0); setPosV(0); setDirH(1); setDirV(1)
      setReussiH(null); setResultatFinal(null); setBallonAnim(null)
    }, 1100)
    return () => clearTimeout(t)
  }, [etape, resultatFinal, onResultat])

  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>

      <svg width="100%" viewBox="0 0 320 200" style={{ display: 'block', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)' }}>
        {/* Sol */}
        <rect x="0" y="170" width="320" height="30" fill="var(--bg-0)" />

        {/* Panneau + arceau */}
        <g transform="translate(220,20)">
          <rect x="0" y="0" width="60" height="42" fill="var(--text-1)" opacity="0.9" rx="2" />
          <rect x="4" y="4" width="52" height="34" fill="none" stroke="var(--text-3)" strokeWidth="2" />
          <ellipse cx="30" cy="48" rx="22" ry="5" fill="none" stroke="var(--orange)" strokeWidth="3" />
          <path d="M10 50 L14 80 M20 51 L22 82 M30 52 L30 84 M40 51 L38 82 M50 50 L46 80"
            stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1" />
        </g>

        {/* Joueur chibi */}
        <g transform="translate(60,110)">
          <ellipse cx="20" cy="78" rx="22" ry="5" fill="#000" opacity="0.15" />
          <circle cx="20" cy="14" r="11" fill="#fbc89a" />
          <path d="M9 11 Q20 0 31 11 L31 7 Q20 -3 9 7 Z" fill="var(--text-1)" opacity="0.7" />
          <rect x="8" y="26" width="24" height="28" fill="var(--accent)" rx="4" />
          <rect x="12" y="60" width="8" height="22" fill="var(--bg-0)" rx="3" />
          <rect x="20" y="60" width="8" height="22" fill="var(--bg-0)" rx="3" />
        </g>

        {/* Ballon — position selon étape de l'animation */}
        <g style={{
          transform: ballonAnim === 'tir'
            ? 'translate(220px, 40px)'
            : ballonAnim === 'rebond'
              ? 'translate(130px, 150px)'
              : 'translate(95px, 95px)',
          transition: 'transform 0.9s cubic-bezier(0.3, 0, 0.7, 1)',
        }}>
          <circle cx="0" cy="0" r="9" fill="var(--orange)" />
          <path d="M-9 0 L9 0 M0 -9 L0 9" stroke="var(--bg-0)" strokeWidth="1" />
        </g>
      </svg>

      {/* Barre horizontale */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Visée gauche / droite
        </div>
        <div style={{ position: 'relative', height: 16, background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: `${zoneDebut}%`, width: `${zonePct}%`, height: '100%', background: 'var(--success-dim)', borderLeft: '1px solid var(--success)', borderRight: '1px solid var(--success)' }} />
          {etape === 'horizontale' && (
            <div style={{ position: 'absolute', left: `${posH}%`, top: 0, width: 3, height: '100%', background: 'var(--text-1)', transform: 'translateX(-1.5px)' }} />
          )}
          {etape !== 'horizontale' && (
            <div style={{ position: 'absolute', left: `${posH}%`, top: 0, width: 3, height: '100%', background: reussiH ? 'var(--success)' : 'var(--danger)', transform: 'translateX(-1.5px)' }} />
          )}
        </div>
      </div>

      {/* Barre verticale */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', width: 70 }}>
          Visée force
        </div>
        <div style={{ position: 'relative', width: 16, height: 70, background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: `${zoneDebut}%`, height: `${zonePct}%`, width: '100%', background: 'var(--success-dim)', borderTop: '1px solid var(--success)', borderBottom: '1px solid var(--success)' }} />
          {etape === 'verticale' && (
            <div style={{ position: 'absolute', top: `${posV}%`, left: 0, height: 3, width: '100%', background: 'var(--text-1)', transform: 'translateY(-1.5px)' }} />
          )}
        </div>

        {/* Résultat */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          {resultatFinal === 'panier' && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--success)' }}>PANIER !</span>
          )}
          {resultatFinal === 'rate' && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--danger)' }}>RATÉ</span>
          )}
          {!resultatFinal && (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {etape === 'horizontale' ? 'Tape pour stopper' : 'Encore une fois !'}
            </span>
          )}
        </div>
      </div>

      {/* Bouton d'action */}
      <button
        onClick={arreterBarre}
        disabled={verrouille || etape === 'resultat'}
        className="btn-tap"
        style={{
          marginTop: 16, width: '100%', padding: '12px 0',
          background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)',
          color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-body)',
          cursor: verrouille || etape === 'resultat' ? 'default' : 'pointer',
          opacity: verrouille || etape === 'resultat' ? 0.5 : 1,
        }}
      >
        TIRER
      </button>
    </div>
  )
}

export default JoueurArcade
