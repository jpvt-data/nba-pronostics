import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
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

// Recupere toutes les lignes de cartes_catalogue, en paginant pour contourner
// le plafond "Max Rows" cote Supabase (1000 par defaut, ignore un simple .limit())
const recupererCatalogueComplet = async () => {
  const taillePage = 1000
  let toutes = []
  let page = 0
  while (true) {
    const { data } = await supabase
      .from('cartes_catalogue')
      .select('id, serie, annee, numero, nom_propre, rarete, url_front, url_back')
      .eq('actif', true)
      .range(page * taillePage, (page + 1) * taillePage - 1)
    if (!data || data.length === 0) break
    toutes = toutes.concat(data)
    if (data.length < taillePage) break
    page += 1
  }
  return toutes
}

// Tri chronologique des series (annee croissante, puis nom en cas d'egalite)
const trierSeries = (catalogue) => {
  const anneeParSerie = {}
  catalogue.forEach((c) => { if (!anneeParSerie[c.serie]) anneeParSerie[c.serie] = c.annee })
  return Object.keys(anneeParSerie).sort((a, b) => {
    const anA = parseInt((anneeParSerie[a].match(/\d+/) || ['0'])[0], 10)
    const anB = parseInt((anneeParSerie[b].match(/\d+/) || ['0'])[0], 10)
    return anA !== anB ? anA - anB : a.localeCompare(b)
  })
}

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
      <CarteCollection carte={carte} possedee quantite={quantite} enModal />
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
      const [cat, collectionRes] = await Promise.all([
        recupererCatalogueComplet(),
        supabase.from('cartes_collection').select('carte_id').eq('user_id', user.id),
      ])

      setCatalogue(cat)

      const compte = {}
      ;(collectionRes.data || []).forEach((row) => {
        compte[row.carte_id] = (compte[row.carte_id] || 0) + 1
      })
      setQuantites(compte)

      const seriesTri = trierSeries(cat)
      if (seriesTri.length > 0) setSerieActive(seriesTri[0])

      setChargement(false)
    }
    charger()
  }, [])

  const series = useMemo(() => trierSeries(catalogue), [catalogue])

  // Stats obtenu/total par serie, pour affichage dans les chips
  const statsParSerie = useMemo(() => {
    const stats = {}
    catalogue.forEach((c) => {
      if (!stats[c.serie]) stats[c.serie] = { total: 0, obtenu: 0 }
      stats[c.serie].total += 1
      if (quantites[c.id]) stats[c.serie].obtenu += 1
    })
    return stats
  }, [catalogue, quantites])

  const cartesAffichees = useMemo(() => {
    return catalogue
      .filter((c) => c.serie === serieActive)
      .sort(trierParNumero)
  }, [catalogue, serieActive])

  const totalObtenu = Object.keys(quantites).length
  const totalCatalogue = catalogue.length

  if (chargement) {
    return (
      <div>
        <Navigation />
        <div style={{ padding: 16, color: 'var(--text-2)' }}>Chargement de la collection...</div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div style={{ marginTop: 20 }}>
        <TitreSection label="MA COLLECTION" />
      </div>

      <div style={{ margin: '16px 16px 0' }}>
        <SousTitre label={`${totalObtenu} / ${totalCatalogue} CARTES OBTENUES`} couleur="var(--gold)" />
      </div>

      {/* Texte d'intro - explique les series Topps + moyens d'obtention */}
      <div style={{
        margin: '8px 16px 16px',
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 12,
        lineHeight: 1.5,
        color: 'var(--text-2)',
      }}>
        Chaque série Topps représente un set de cartes différent (rookies, légendes, inserts spéciaux).
        Les cartes ci-dessous se débloquent en jouant : connexion quotidienne, roue du jour, pronos et
        fourchettes d'écart réussis, et passage de niveau.
      </div>

      {/* Chips de selection par serie - retour a la ligne, pas de scroll */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 16px 12px', justifyContent: 'center',
      }}>
        {series.map((s) => {
          const stat = statsParSerie[s] || { total: 0, obtenu: 0 }
          return (
            <button
              key={s}
              onClick={() => setSerieActive(s)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
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
              <span>{s}</span>
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.7 }}>
                {stat.obtenu} / {stat.total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid des cartes de la serie active */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(4, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(95px, 1fr))',
        columnGap: 10,
        rowGap: 26,
        padding: '0 16px 24px',
        marginTop: 18,
      }}>
        {cartesAffichees.map((carte) => {
          const possedee = Boolean(quantites[carte.id])
          return (
            <div
              key={carte.id}
              onClick={() => possedee && setCarteAgrandie(carte)}
              style={{ minWidth: 0 }}
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
