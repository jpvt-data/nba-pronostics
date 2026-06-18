import { useState } from 'react'

// Habillage par rarete - outline hors box model (ne deforme pas la grille)
const STYLE_RARETE = {
  common:    { outline: '1px solid var(--border-2)', outlineOffset: 0,  glow: 'none',                                    badgeCouleur: 'var(--text-3)' },
  rare:      { outline: '2px solid var(--accent)',   outlineOffset: 2,  glow: '0 0 16px rgba(99,102,241,0.55)',          badgeCouleur: 'var(--accent)' },
  legendary: { outline: '3px solid var(--gold)',     outlineOffset: 3,  glow: '0 0 22px rgba(245,158,11,0.75)',          badgeCouleur: 'var(--gold)' },
}

// Animation pulse pour legendary
const STYLE_PULSE = `
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 22px rgba(245,158,11,0.75); }
  50%       { box-shadow: 0 0 36px rgba(245,158,11,1); }
}
`
if (!document.getElementById('carte-pulse-style')) {
  const el = document.createElement('style')
  el.id = 'carte-pulse-style'
  el.textContent = STYLE_PULSE
  document.head.appendChild(el)
}

// Labels rareté
const LABEL_RARETE = { common: 'COMMON', rare: 'RARE', legendary: 'LEGENDARY' }

// Legende partagee - meme empreinte verticale revelee ou non, pour ne jamais
// deformer la grille au moment du reveal (cf bug grille mobile)
const Legende = ({ ligne1, ligne2, rarete, visible }) => (
  <div style={{ marginTop: 4, textAlign: 'center', visibility: visible ? 'visible' : 'hidden', minWidth: 0 }}>
    <div style={{
      fontFamily: "'Outfit', system-ui, sans-serif",
      fontSize: 11, fontWeight: 600, color: 'var(--text-1)',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
    }}>
      {ligne1 || '\u00A0'}
    </div>
    <div style={{
      fontFamily: "'Outfit', system-ui, sans-serif",
      fontSize: 9, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {ligne2 || '\u00A0'}
    </div>
    <div style={{
      fontFamily: "'Barlow Condensed', sans-serif",
      fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
      color: rarete ? (STYLE_RARETE[rarete]?.badgeCouleur || 'var(--text-3)') : 'transparent',
      textTransform: 'uppercase', marginTop: 1,
    }}>
      {rarete ? (LABEL_RARETE[rarete] || '\u00A0') : '\u00A0'}
    </div>
  </div>
)

// Styles image paysage en grille (rotation 90° dans conteneur portrait)
// Les ratios TOPPS 2.5/3.5 et 3.5/2.5 sont exactement inverses → rotation sans crop
const STYLE_RECTO_PAYSAGE_GRILLE = {
  position: 'absolute', objectFit: 'cover', backfaceVisibility: 'hidden',
  width: '140%', height: '71.43%', left: '-20%', top: '14.28%',
  transform: 'rotate(90deg)',
}
const STYLE_VERSO_PAYSAGE_GRILLE = {
  ...STYLE_RECTO_PAYSAGE_GRILLE,
  transform: 'rotateY(180deg) rotate(90deg)',
}
const STYLE_RECTO_PORTRAIT = {
  position: 'absolute', width: '100%', height: '100%',
  objectFit: 'cover', backfaceVisibility: 'hidden',
}
const STYLE_VERSO_PORTRAIT = { ...STYLE_RECTO_PORTRAIT, transform: 'rotateY(180deg)' }
const STYLE_RECTO_MODAL   = { ...STYLE_RECTO_PORTRAIT }
const STYLE_VERSO_MODAL   = { ...STYLE_VERSO_PORTRAIT }

// enModal : affiche la carte dans son orientation naturelle (paysage si paysage)
const CarteCollection = ({ carte, possedee = false, quantite = 0, onClick, enModal = false }) => {
  const [retournee, setRetournee]   = useState(false)
  const [estPaysage, setEstPaysage] = useState(false)

  const detecterOrientation = (e) => {
    if (e.target.naturalWidth > e.target.naturalHeight) setEstPaysage(true)
  }

  const gererClic = () => {
    if (!possedee) return
    setRetournee((prev) => !prev)
    if (onClick) onClick(carte)
  }

  // Carte non possedee : silhouette pure, aucune info, aucune image chargee
  // mais meme empreinte verticale que la carte revelee (image + legende invisible)
  if (!possedee) {
    return (
      <div style={{ width: '100%', minWidth: 0 }}>
        <div
          style={{
            width: '100%',
            aspectRatio: '2.5 / 3.5',
            background: 'var(--bg-1)',
            border: '1px solid var(--border)',
          }}
        />
        <Legende visible={false} rarete={null} />
      </div>
    )
  }

  const style = STYLE_RARETE[carte.rarete] || STYLE_RARETE.common
  const nomAffiche = carte.nom_propre || 'Carte speciale'

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div
        onClick={gererClic}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: (enModal && estPaysage) ? '3.5 / 2.5' : '2.5 / 3.5',
          cursor: 'pointer',
          perspective: 1000,
          outline: style.outline,
          outlineOffset: style.outlineOffset,
          boxShadow: style.glow,
          animation: carte.rarete === 'legendary' ? 'glowPulse 2.5s ease-in-out infinite' : 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            transition: 'transform 0.5s',
            transformStyle: 'preserve-3d',
            transform: retournee ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Recto */}
          <img
            src={carte.url_front}
            alt={nomAffiche}
            onLoad={detecterOrientation}
            style={enModal ? STYLE_RECTO_MODAL : (estPaysage ? STYLE_RECTO_PAYSAGE_GRILLE : STYLE_RECTO_PORTRAIT)}
          />
          {/* Verso */}
          <img
            src={carte.url_back}
            alt={`${nomAffiche} - verso`}
            style={enModal ? STYLE_VERSO_MODAL : (estPaysage ? STYLE_VERSO_PAYSAGE_GRILLE : STYLE_VERSO_PORTRAIT)}
          />
        </div>

        {/* Badge doublon - affiche xN si quantite > 1 */}
        {quantite > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              background: 'var(--bg-0)',
              border: '1px solid var(--border-2)',
              color: 'var(--text-1)',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            x{quantite}
          </div>
        )}
      </div>

      <Legende
        visible
        ligne1={`${carte.numero ? `#${carte.numero} · ` : ''}${nomAffiche}`}
        ligne2={`${carte.serie} ${carte.annee}`}
        rarete={carte.rarete}
      />
    </div>
  )
}

export default CarteCollection
