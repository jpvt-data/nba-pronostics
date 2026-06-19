import { useState } from 'react'
import { X } from 'lucide-react'

// Habillage par rarete - identique a CarteCollection.jsx
const STYLE_RARETE = {
  common: { bordure: 'var(--border-2)', glow: 'none' },
  rare: { bordure: 'var(--accent)', glow: '0 0 12px rgba(99,102,241,0.35)' },
  legendary: { bordure: 'var(--gold)', glow: '0 0 16px rgba(245,158,11,0.45)' },
}

// Dos de carte "mystere" avant revelation - composant a part, jamais imbrique
const CarteMystere = ({ onClick }) => (
  <div
    onClick={onClick}
    className="swl-carte-mystere"
    style={{
      width: '100%',
      aspectRatio: '2.5 / 3.5',
      background: 'var(--bg-1)',
      border: '1px solid var(--accent-border)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <span
      style={{
        fontFamily: "'Teko', system-ui, sans-serif",
        fontStyle: 'italic',
        fontWeight: 700,
        fontSize: 'clamp(16px, 4vw, 22px)',
        color: 'var(--accent)',
        letterSpacing: '0.02em',
      }}
    >
      SWISH
    </span>
  </div>
)

// Carte revelee - front + legende, reutilise l'habillage de rarete
const CarteRevelee = ({ carte, quantite }) => {
  const style = STYLE_RARETE[carte.rarete] || STYLE_RARETE.common
  const nomAffiche = carte.nom_propre || 'Carte speciale'

  return (
    <div className="swl-carte-revelee" style={{ width: '100%' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '2.5 / 3.5',
          border: `1px solid ${style.bordure}`,
          boxShadow: style.glow,
        }}
      >
        <img
          src={carte.url_front}
          alt={nomAffiche}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
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
      <div style={{ marginTop: 4, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Outfit', system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-1)',
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

// Popup principal - gere 1 a 3 cartes (booster ou recompense unique)
const PopupOuvertureBooster = ({ cartes, onFermer }) => {
  const [revelees, setRevelees] = useState(() => cartes.map(() => false))

  const revelerCarte = (index) => {
    setRevelees((prev) => prev.map((v, i) => (i === index ? true : v)))
  }

  const toutesRevelees = revelees.every((v) => v)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,13,18,0.92)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '24px 24px 40px',
        overflowY: 'auto',
      }}
    >
      {/* Croix de fermeture — toujours accessible, n'apparaît cliquable qu'une fois tout révélé */}
      <button
        onClick={toutesRevelees ? onFermer : undefined}
        disabled={!toutesRevelees}
        aria-label="Fermer"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: toutesRevelees ? 'pointer' : 'default',
          opacity: toutesRevelees ? 1 : 0.35,
          zIndex: 1001,
        }}
      >
        <X size={18} strokeWidth={2} color="var(--text-1)" />
      </button>

      <div
        style={{
          fontFamily: "'Teko', system-ui, sans-serif",
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 'clamp(24px, 6vw, 34px)',
          color: '#fff',
          marginBottom: 24,
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        {cartes.length > 1 ? 'NOUVELLES CARTES' : 'NOUVELLE CARTE'}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
          maxWidth: cartes.length > 1 ? 560 : 200,
        }}
      >
        {cartes.map((item, i) => (
          <div key={item.carte.id} style={{ width: cartes.length > 1 ? 130 : 180 }}>
            {revelees[i] ? (
              <CarteRevelee carte={item.carte} quantite={item.quantite} />
            ) : (
              <CarteMystere onClick={() => revelerCarte(i)} />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onFermer}
        disabled={!toutesRevelees}
        style={{
          marginTop: 28,
          padding: '10px 28px',
          background: toutesRevelees ? 'var(--accent)' : 'var(--bg-1)',
          color: toutesRevelees ? '#fff' : 'var(--text-3)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontFamily: "'Outfit', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: 13,
          cursor: toutesRevelees ? 'pointer' : 'default',
          transition: 'background 0.2s',
        }}
      >
        {toutesRevelees ? 'Continuer' : `Touche les cartes pour les reveler`}
      </button>

      <style>{`
        .swl-carte-mystere {
          animation: swl-pulse 1.8s ease-in-out infinite;
        }
        @keyframes swl-pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(99,102,241,0.25); }
          50% { box-shadow: 0 0 16px rgba(99,102,241,0.5); }
        }
        .swl-carte-revelee {
          animation: swl-apparition 0.4s ease-out;
        }
        @keyframes swl-apparition {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default PopupOuvertureBooster
