import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import CarteCollection from '../components/CarteCollection'

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

const SousTitre = ({ label, couleur = 'var(--text-3)' }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: couleur, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
    {label}
  </div>
)

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

const trierSeries = (catalogue) => {
  const anneeParSerie = {}
  catalogue.forEach((c) => { if (!anneeParSerie[c.serie]) anneeParSerie[c.serie] = c.annee })
  return Object.keys(anneeParSerie).sort((a, b) => {
    const anA = parseInt((anneeParSerie[a].match(/\d+/) || ['0'])[0], 10)
    const anB = parseInt((anneeParSerie[b].match(/\d+/) || ['0'])[0], 10)
    return anA !== anB ? anA - anB : a.localeCompare(b)
  })
}

const trierParNumero = (a, b) => {
  const numA = (a.numero || '').match(/\d+/)
  const numB = (b.numero || '').match(/\d+/)
  if (numA && numB) return parseInt(numA[0], 10) - parseInt(numB[0], 10)
  return (a.numero || '').localeCompare(b.numero || '')
}

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
  const [cartesIntro, setCartesIntro] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    const gererResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', gererResize)
    return () => window.removeEventListener('resize', gererResize)
  }, [])

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser()
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

      // 2 cartes possédées au hasard pour l'éventail d'intro
      const possedees = cat.filter(c => compte[c.id] && c.url_front)
      const melange = [...possedees].sort(() => Math.random() - 0.5)
      setCartesIntro(melange.slice(0, 2))

      const seriesTri = trierSeries(cat)
      if (seriesTri.length > 0) setSerieActive(seriesTri[0])
      setChargement(false)
    }
    charger()
  }, [])

  const scrollSeries = (dir) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }

  const series = useMemo(() => trierSeries(catalogue), [catalogue])

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
    return catalogue.filter((c) => c.serie === serieActive).sort(trierParNumero)
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

      {/* ── Bloc intro : éventail cartes (gauche) + texte (droite) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        margin: '16px 16px 20px', minHeight: 110,
      }}>
        {/* Éventail — 2 cartes en position absolue dans un bloc relatif */}
        <div style={{ position: 'relative', width: 80, height: 110, flexShrink: 0 }}>
          {cartesIntro.length >= 2 ? (
            <>
              {/* Carte de derrière — légèrement à droite et inclinée */}
              <div style={{
                position: 'absolute', top: 8, left: 14,
                transform: 'rotate(10deg)', width: 58,
                borderRadius: 4, overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                opacity: 0.85,
              }}>
                <img src={cartesIntro[1].url_front} alt="" style={{ width: '100%', display: 'block' }} />
              </div>
              {/* Carte de devant — légèrement à gauche et inclinée en sens inverse */}
              <div style={{
                position: 'absolute', top: 0, left: 0,
                transform: 'rotate(-6deg)', width: 58,
                borderRadius: 4, overflow: 'hidden',
                boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
              }}>
                <img src={cartesIntro[0].url_front} alt="" style={{ width: '100%', display: 'block' }} />
              </div>
            </>
          ) : (
            // Fallback si pas encore de cartes
            <>
              <div style={{ position: 'absolute', top: 8, left: 14, width: 58, height: 82, background: 'var(--bg-2)', borderRadius: 4, transform: 'rotate(10deg)', opacity: 0.5 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: 58, height: 82, background: 'var(--bg-1)', borderRadius: 4, border: '1px solid var(--border)', transform: 'rotate(-6deg)' }} />
            </>
          )}
        </div>

        {/* Texte d'intro */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gold)', letterSpacing: '0.04em', marginBottom: 4 }}>
            {totalObtenu} / {totalCatalogue} cartes
          </div>
          <p style={{ fontSize: 11, lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
            Chaque série Topps représente un set différent — rookies, légendes, inserts. Les cartes se débloquent en jouant : connexion quotidienne, roue du jour, pronos réussis, fourchettes d'écart et passage de niveau.
          </p>
        </div>
      </div>

      {/* ── Sélecteur de séries — scroll horizontal + flèches ── */}
      <div style={{ position: 'relative', margin: '0 0 4px' }}>
        {/* Flèche gauche */}
        <button
          onClick={() => scrollSeries(-1)}
          style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 2, width: 28, height: '100%',
            background: 'linear-gradient(to right, var(--bg-0) 60%, transparent)',
            border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 4,
          }}
        >‹</button>

        {/* Piste scrollable */}
        <div
          ref={scrollRef}
          className="scroll-x"
          style={{ display: 'flex', gap: 6, padding: '4px 36px' }}
        >
          {series.map((s) => {
            const stat = statsParSerie[s] || { total: 0, obtenu: 0 }
            const pct = stat.total > 0 ? Math.round(stat.obtenu / stat.total * 100) : 0
            const actif = s === serieActive
            return (
              <button
                key={s}
                onClick={() => setSerieActive(s)}
                style={{
                  flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${actif ? 'var(--accent-border)' : 'var(--border-2)'}`,
                  background: actif ? 'var(--accent-dim)' : 'transparent',
                  color: actif ? 'var(--accent)' : 'var(--text-2)',
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <span>{s}</span>
                <span style={{ fontSize: 9, opacity: 0.75 }}>{stat.obtenu}/{stat.total} · {pct}%</span>
                {/* Mini barre de progression */}
                <div style={{ width: '100%', height: 2, background: 'var(--border-2)', borderRadius: 1 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: actif ? 'var(--accent)' : 'var(--gold)', borderRadius: 1, transition: 'width 0.3s' }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Flèche droite */}
        <button
          onClick={() => scrollSeries(1)}
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            zIndex: 2, width: 28, height: '100%',
            background: 'linear-gradient(to left, var(--bg-0) 60%, transparent)',
            border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4,
          }}
        >›</button>
      </div>

      {/* Grid des cartes de la serie active */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(4, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(95px, 1fr))',
        columnGap: 10, rowGap: 26,
        padding: '16px 16px 24px',
      }}>
        {cartesAffichees.map((carte) => {
          const possedee = Boolean(quantites[carte.id])
          return (
            <div key={carte.id} onClick={() => possedee && setCarteAgrandie(carte)} style={{ minWidth: 0 }}>
              <CarteCollection carte={carte} possedee={possedee} quantite={quantites[carte.id] || 0} />
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
