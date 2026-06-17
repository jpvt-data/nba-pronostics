import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import CarteCollection from '../components/CarteCollection'

// Bandeau oblique titre de page - cf socle section 3
const TitreSection = ({ label, couleur = 'var(--gold)' }) => (
  <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 500 46">
      <polygon points="0,0 260,0 240,46 0,46" fill={couleur} />
    </svg>
    <span style={{
      position: 'absolute', top: '50%', left: 16, transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
  </div>
)

// Sous-titre sobre - cf socle section 3
const SousTitre = ({ label, couleur = 'var(--text-3)' }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: couleur, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
    {label}
  </div>
)

// Tri naturel par numero (gere les formats mixtes type "AC-15", "271")
const trierParNumero = (a, b) => {
  const numA = (a.numero || '').match(/\d+/)
  const numB = (b.numero || '').match(/\d+/)
  if (numA && numB) return parseInt(numA[0], 10) - parseInt(numB[0], 10)
  return (a.numero || '').localeCompare(b.numero || '')
}

// Modal carte agrandie - composant a part, jamais imbrique
const ModalCarteAgrandie = ({ carte, quantite, onFermer }) => (
  <div
    onClick={onFermer}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(13,13,18,0.9)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}
  >
    <div onClick={(e) => e.stopPropagation()} style={{ width: 220 }}>
      <CarteCollection carte={carte} possedee quantite={quantite} />
    </div>
  </div>
)

const MaCollection = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const [catalogue, setCatalogue] = useState([])
  const [quantites, setQuantites] = useState({})
  const [serieActive, setSerieActive] = useState(null)
  const [carteAgrandie, setCarteAgrandie] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const gererResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', gererResize)
    return () => window.removeEventListener('resize', gererResize)
  }, [])

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // Requetes independantes en parallele - cf regle socle section 14
      const [catalogueRes, collectionRes] = await Promise.all([
        supabase.from('cartes_catalogue').select('id, serie, annee, numero, nom_propre, rarete, url_front, url_back').eq('actif', true).limit(2000),
        supabase.from('cartes_collection').select('carte_id').eq('user_id', user.id),
      ])

      const cat = catalogueRes.data || []
      setCatalogue(cat)

      const compte = {}
      ;(collectionRes.data || []).forEach((row) => {
        compte[row.carte_id] = (compte[row.carte_id] || 0) + 1
      })
      setQuantites(compte)

      const series = [...new Set(cat.map((c) => c.serie))].sort()
      if (series.length > 0) setSerieActive(series[0])

      setChargement(false)
    }
    charger()
  }, [])

  const series = useMemo(() => [...new Set(catalogue.map((c) => c.serie))].sort(), [catalogue])

  const cartesAffichees = useMemo(() => {
    return catalogue
      .filter((c) => c.serie === serieActive)
      .sort(trierParNumero)
  }, [catalogue, serieActive])

  const totalObtenu = Object.keys(quantites).length
  const totalCatalogue = catalogue.length

  if (chargement) {
    return <div style={{ padding: 16, color: 'var(--text-2)' }}>Chargement de la collection...</div>
  }

  return (
    <div>
      <div style={{ marginTop: 20 }}>
        <TitreSection label="MA COLLECTION" />
      </div>

      <div style={{ margin: '16px 16px 0' }}>
        <SousTitre label={`${totalObtenu} / ${totalCatalogue} CARTES OBTENUES`} couleur="var(--gold)" />
      </div>

      {/* Chips de selection par serie */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {series.map((s) => (
          <button
            key={s}
            onClick={() => setSerieActive(s)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${s === serieActive ? 'var(--accent-border)' : 'var(--border-2)'}`,
              background: s === serieActive ? 'var(--accent-dim)' : 'transparent',
              color: s === serieActive ? 'var(--accent)' : 'var(--text-2)',
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid des cartes de la serie active */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 12,
        padding: '0 16px 24px',
      }}>
        {cartesAffichees.map((carte) => {
          const possedee = Boolean(quantites[carte.id])
          return (
            <div
              key={carte.id}
              onClick={() => possedee && setCarteAgrandie(carte)}
            >
              <CarteCollection
                carte={carte}
                possedee={possedee}
                quantite={quantites[carte.id] || 0}
              />
            </div>
          )
        })}
      </div>

      {carteAgrandie && (
        <ModalCarteAgrandie
          carte={carteAgrandie}
          quantite={quantites[carteAgrandie.id]}
          onFermer={() => setCarteAgrandie(null)}
        />
      )}
    </div>
  )
}

export default MaCollection
