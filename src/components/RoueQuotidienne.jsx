import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

// Segments de la roue — ordre affiché, couleurs, probabilités cumulées
const SEGMENTS = [
  { label: 'Rien',      xp: 0,   couleur: '#2a2a3e', textCouleur: '#9090b0', prob: 0.30 },
  { label: '+15 XP',   xp: 15,  couleur: '#1e1e3a', textCouleur: '#c0c0d8', prob: 0.30 },
  { label: '+30 XP',   xp: 30,  couleur: '#1a1a4a', textCouleur: '#8b8cf8', prob: 0.20 },
  { label: '+75 XP',   xp: 75,  couleur: '#1e2a1a', textCouleur: '#f97316', prob: 0.15 },
  { label: 'JACKPOT',  xp: 150, couleur: '#2a2000', textCouleur: '#f59e0b', prob: 0.05 },
]

// Tirage pondéré
const tirer = () => {
  const r = Math.random()
  let cumul = 0
  for (const seg of SEGMENTS) {
    cumul += seg.prob
    if (r <= cumul) return seg
  }
  return SEGMENTS[0]
}

// Angle de départ de chaque segment sur la roue (en degrés)
const NB = SEGMENTS.length
const ANGLE_SEG = 360 / NB // 72° par segment

// Chemin SVG d'un secteur (angles en degrés)
const secteurPath = (cx, cy, r, startDeg, endDeg) => {
  const rad = (a) => (a * Math.PI) / 180
  const x1 = cx + r * Math.cos(rad(startDeg))
  const y1 = cy + r * Math.sin(rad(startDeg))
  const x2 = cx + r * Math.cos(rad(endDeg))
  const y2 = cy + r * Math.sin(rad(endDeg))
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`
}

function RoueQuotidienne({ userId, onClose, onGain }) {
  const [phase, setPhase]         = useState('idle') // idle | spin | result
  const [rotation, setRotation]   = useState(0)
  const [resultat, setResultat]   = useState(null)
  const [erreur, setErreur]       = useState(null)
  const rouéRef                   = useRef(null)

  // Bloquer le scroll pendant le modal
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const lancer = async () => {
    if (phase !== 'idle') return
    setPhase('spin')

    const segment = tirer()

    // Index du segment gagnant
    const idx = SEGMENTS.indexOf(segment)

    // Angle du centre du segment gagnant (depuis le haut, sens horaire)
    // L'aiguille est en haut (270° en coords SVG standard)
    // On veut que le segment idx arrive sous l'aiguille
    const centreSegment = idx * ANGLE_SEG + ANGLE_SEG / 2
    // Tours complets (4) + ajustement pour amener le bon segment sous l'aiguille
    const toursComplets = 4 * 360
    const angleArrêt = toursComplets + (360 - centreSegment)
    const nouvelleRotation = rotation + angleArrêt

    setRotation(nouvelleRotation)

    // Attendre la fin de l'animation (3.5s)
    setTimeout(async () => {
      setResultat(segment)
      setPhase('result')

      // Enregistrer en base si XP gagné
      if (segment.xp > 0) {
        try {
          const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
          await supabase.from('xp_log').insert({
            user_id:   userId,
            source:    'roue_quotidienne',
            source_id: `roue_${jourParis}`,
            xp_gagne:  segment.xp,
            meta:      { gain: segment.label },
            date_jour: jourParis,
          })
          // Mise à jour xp_total dans profils
          const { data: profil } = await supabase
            .from('profils').select('xp_total').eq('id', userId).single()
          await supabase.from('profils')
            .update({ xp_total: (profil?.xp_total || 0) + segment.xp })
            .eq('id', userId)
        } catch (e) {
          setErreur('Erreur lors de l\'enregistrement XP')
        }
      }

      // Marquer la roue comme jouée aujourd'hui
      const jourParis = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
      localStorage.setItem(`swish_roue_${userId}_${jourParis}`, '1')
      onGain(segment.xp)
    }, 3600)
  }

  const cx = 150, cy = 150, r = 130

  return (
    <div
      onClick={phase === 'result' ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: 'var(--bg-1)',
          borderTop: '3px solid var(--accent)',
          padding: '24px 20px 28px',
          position: 'relative',
          textAlign: 'center',
        }}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 12,
            background: 'none', borderWidth: 0, cursor: 'pointer',
            color: 'var(--text-3)', padding: 4,
          }}
        >
          <X size={16} />
        </button>

        {/* Titre */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 28, color: 'var(--text-1)', letterSpacing: '0.02em' }}>ROUE</span>
          {' '}
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 28, color: 'var(--accent)', letterSpacing: '0.02em' }}>DU JOUR</span>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.05em' }}>1 tirage par jour</div>
        </div>

        {/* Aiguille */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={{
            position: 'absolute', top: -10, left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: 0, height: 0,
            borderLeft: '9px solid transparent',
            borderRight: '9px solid transparent',
            borderTop: '22px solid var(--accent)',
            filter: 'drop-shadow(0 0 6px var(--accent))',
          }} />

          {/* Roue SVG */}
          <svg
            ref={rouéRef}
            width={300} height={300}
            viewBox="0 0 300 300"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: phase === 'spin'
                ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none',
              display: 'block',
            }}
          >
            {/* Dégradé radial global — effet lumière centre */}
            <defs>
              <radialGradient id="lumierecentre" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.08)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              {SEGMENTS.map((seg, i) => (
                <linearGradient
                  key={`grad${i}`}
                  id={`grad${i}`}
                  x1="0%" y1="0%" x2="100%" y2="100%"
                >
                  <stop offset="0%" stopColor={seg.couleur} stopOpacity="1" />
                  <stop offset="100%" stopColor={seg.xp > 0 ? seg.textCouleur : seg.couleur} stopOpacity="0.3" />
                </linearGradient>
              ))}
            </defs>

            {/* Bordure externe */}
            <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="var(--border-2)" strokeWidth={2} />

            {/* Secteurs */}
            {SEGMENTS.map((seg, i) => {
              const startAngle = i * ANGLE_SEG - 90
              const endAngle   = startAngle + ANGLE_SEG
              const midAngle   = startAngle + ANGLE_SEG / 2
              const midRad     = (midAngle * Math.PI) / 180
              const textR      = r * 0.65
              const tx         = cx + textR * Math.cos(midRad)
              const ty         = cy + textR * Math.sin(midRad)

              return (
                <g key={i}>
                  {/* Secteur rempli */}
                  <path
                    d={secteurPath(cx, cy, r, startAngle, endAngle)}
                    fill={`url(#grad${i})`}
                    stroke="var(--bg-0)"
                    strokeWidth={1.5}
                  />
                  {/* Label texte */}
                  <text
                    x={tx} y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                    fill={seg.textCouleur}
                    fontSize={seg.xp === 150 ? 11 : 12}
                    fontWeight={700}
                    fontFamily="'Barlow Condensed', sans-serif"
                    letterSpacing="0.05em"
                    style={{ userSelect: 'none' }}
                  >
                    {seg.label}
                  </text>
                </g>
              )
            })}

            {/* Effet lumière centre */}
            <circle cx={cx} cy={cy} r={r} fill="url(#lumierecentre)" />

            {/* Centre hub */}
            <circle cx={cx} cy={cy} r={14} fill="var(--bg-0)" stroke="var(--border-2)" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={6}  fill="var(--accent)" />
          </svg>
        </div>

        {/* Bouton lancer / résultat */}
        <div style={{ marginTop: 20 }}>
          {phase === 'idle' && (
            <button
              onClick={lancer}
              style={{
                width: '100%', padding: '13px',
                background: 'var(--accent)',
                borderWidth: 0, borderRadius: 'var(--radius-sm)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', letterSpacing: '0.05em',
                boxShadow: '0 0 16px rgba(99,102,241,0.4)',
              }}
            >
              LANCER
            </button>
          )}

          {phase === 'spin' && (
            <div style={{ fontSize: 13, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
              La roue tourne…
            </div>
          )}

          {phase === 'result' && resultat && (
            <div>
              {/* Flash résultat */}
              <div style={{
                padding: '16px',
                background: resultat.xp === 0 ? 'var(--bg-2)' : resultat.xp === 150 ? 'var(--gold-dim)' : 'var(--accent-dim)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: resultat.xp === 0 ? 'var(--border)' : resultat.xp === 150 ? 'var(--gold)' : 'var(--accent-border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 12,
              }}>
                <div style={{
                  fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: 32,
                  color: resultat.xp === 0 ? 'var(--text-3)' : resultat.xp === 150 ? 'var(--gold)' : 'var(--accent)',
                  letterSpacing: '0.03em',
                }}>
                  {resultat.label}
                </div>
                {resultat.xp > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                    XP ajouté à ton profil
                  </div>
                )}
              </div>
              {erreur && <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8 }}>{erreur}</div>}
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '11px',
                  background: 'var(--bg-2)',
                  borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-3)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoueQuotidienne
