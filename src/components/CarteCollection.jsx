import { useState } from 'react'

// Habillage par rarete - mappe sur les tokens existants (index.css)
const STYLE_RARETE = {
  common: { bordure: 'var(--border-2)', glow: 'none' },
  rare: { bordure: 'var(--accent)', glow: '0 0 12px rgba(99,102,241,0.35)' },
  legendary: { bordure: 'var(--gold)', glow: '0 0 16px rgba(245,158,11,0.45)' },
}

const CarteCollection = ({ carte, possedee = false, quantite = 0, onClick }) => {
  const [retournee, setRetournee] = useState(false)

  const gererClic = () => {
    if (!possedee) return
    setRetournee((prev) => !prev)
    if (onClick) onClick(carte)
  }

  // Carte non possedee : silhouette pure, aucune info, aucune image chargee
  if (!possedee) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '2.5 / 3.5',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
        }}
      />
    )
  }

  const style = STYLE_RARETE[carte.rarete] || STYLE_RARETE.common
  const nomAffiche = carte.nom_propre || 'Carte speciale'

  return (
    <div style={{ width: '100%' }}>
      <div
        onClick={gererClic}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2.5 / 3.5',
          cursor: 'pointer',
          perspective: 1000,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transition: 'transform 0.5s',
            transformStyle: 'preserve-3d',
            transform: retournee ? 'rotateY(180deg)' : 'rotateY(0deg)',
            border: `1px solid ${style.bordure}`,
            boxShadow: style.glow,
          }}
        >
          {/* Recto */}
          <img
            src={carte.url_front}
            alt={nomAffiche}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backfaceVisibility: 'hidden',
            }}
          />
          {/* Verso */}
          <img
            src={carte.url_back}
            alt={`${nomAffiche} - verso`}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
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

      {/* Legende : numero, nom joueur, serie, annee */}
      <div style={{ marginTop: 4, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {carte.numero ? `#${carte.numero} · ` : ''}{nomAffiche}
        </div>
        <div
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 9,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {carte.serie} {carte.annee}
        </div>
      </div>
    </div>
  )
}

export default CarteCollection
