import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

// Icônes SVG inline Lucide-style
const IconTrophy = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
)

const IconLayers = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
  </svg>
)

const IconStar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const IconTarget = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

const IconSearch = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

const IconBarChart = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

const IconZap = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

// Données des slides
const SLIDES = [
  {
    icone: <IconTrophy />,
    couleurIcone: 'var(--gold)',
    titre1: 'BIENVENUE SUR',
    titre2: 'SWISH LEAGUE',
    couleur2: 'var(--accent)',
    contenu: [
      'Pronostique les matchs NBA, grimpe au classement, et flambe face à tes potes.',
      '"Pronostique. Flambe. Règne." — chaque action compte, chaque prono fait la différence.',
    ],
    tag: null,
  },
  {
    icone: <IconLayers />,
    couleurIcone: 'var(--accent)',
    titre1: 'UNE SAISON,',
    titre2: 'DES LIGUES',
    couleur2: 'var(--orange)',
    contenu: [
      'Chaque phase NBA = une ligue dédiée dans Swish League.',
      'Rejoins une ligue depuis le menu Ligues pour participer au classement et affronter les autres.',
    ],
    tag: null,
  },
  {
    icone: <IconStar />,
    couleurIcone: 'var(--gold)',
    titre1: 'LIGUES',
    titre2: 'PRINCIPALES',
    couleur2: 'var(--gold)',
    contenu: [
      'Saison régulière — le socle. Des centaines de matchs, tout le monde participe.',
      'Playoffs et NBA Finals — l\'intensité monte. Chaque prono pèse lourd.',
    ],
    liste: [
      { label: 'Saison régulière', couleur: '#9090b0' },
      { label: 'Playoffs', couleur: '#ef4444' },
      { label: 'NBA Finals', couleur: '#e11d48' },
    ],
  },
  {
    icone: <IconStar />,
    couleurIcone: 'var(--orange)',
    titre1: 'LIGUES',
    titre2: 'BONUS',
    couleur2: 'var(--orange)',
    contenu: [
      'Des ligues courtes et intenses tout au long de l\'année pour ne jamais s\'ennuyer.',
    ],
    liste: [
      { label: 'Summer League', couleur: '#06b6d4' },
      { label: 'Pré-saison', couleur: '#6366f1' },
      { label: 'NBA Cup', couleur: '#f97316' },
      { label: 'All-Star Game', couleur: '#f59e0b' },
    ],
  },
  {
    icone: <IconTarget />,
    couleurIcone: 'var(--success)',
    titre1: 'POSE TON',
    titre2: 'PRONO',
    couleur2: 'var(--success)',
    contenu: [
      'Sur l\'accueil ou dans le Calendrier, clique sur un match pour accéder au détail.',
      'Pose ton prono avant le tip-off. Ajoute une fourchette d\'écart pour tenter des points bonus.',
      'Stats, prédictions et cotes sont disponibles dans le détail du match pour t\'aider à choisir.',
    ],
    tag: null,
  },
  {
    icone: <IconSearch />,
    couleurIcone: 'var(--orange)',
    titre1: 'EXPLORE &',
    titre2: 'COMPARE',
    couleur2: 'var(--orange)',
    contenu: [
      'Explorer — stats joueurs, classements NBA, infos équipes. Tout pour préparer tes pronos.',
      'Stats — ton historique de pronos, tes performances, tes résultats.',
      'Classement — vois où tu en es. Clique sur un profil pour un duel 1v1.',
    ],
    tag: null,
  },
  {
    icone: <IconZap />,
    couleurIcone: 'var(--gold)',
    titre1: 'PROGRESSE &',
    titre2: 'FLAMBE',
    couleur2: 'var(--gold)',
    contenu: [
      'Chaque action rapporte de l\'XP : connexion, pronos corrects, missions complétées.',
      'Missions hebdo et permanentes. Roue quotidienne pour de l\'XP bonus.',
      'Monte de niveau, débloque des titres. De Rookie à GOAT.',
    ],
    tag: null,
  },
]

export default function OnboardingTuto({ userId, onClose }) {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()
  const total = SLIDES.length
  const estDerniere = slide === total - 1

  // Marque onboarding_done à la fermeture
  const marquerFait = async () => {
    if (!userId) return
    await supabase
      .from('profils')
      .update({ onboarding_done: true })
      .eq('id', userId)
  }

  const fermer = async () => {
    await marquerFait()
    onClose()
  }

  const terminer = async () => {
    await marquerFait()
    onClose()
    navigate('/accueil')
  }

  // Fermeture clavier Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') fermer() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const s = SLIDES[slide]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-md)',
        width: '100%', maxWidth: 420,
        padding: '28px 24px 24px',
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        minHeight: 420,
      }}>

        {/* Bouton fermer */}
        <button
          onClick={fermer}
          style={{
            position: 'absolute', top: 12, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-2)', fontSize: 20, lineHeight: 1, padding: 4,
          }}
        >
          {/* X SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Icône */}
        <div style={{ color: s.couleurIcone, display: 'flex', justifyContent: 'center' }}>
          {s.icone}
        </div>

        {/* Titre bicolore Teko */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 26, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>
            {s.titre1}
          </span>
          <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 26, color: s.couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>
            {s.titre2}
          </span>
        </div>

        {/* Contenu texte */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {s.contenu.map((ligne, i) => (
            <p key={i} style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, textAlign: 'center' }}>
              {ligne}
            </p>
          ))}

          {/* Liste tags si présente */}
          {s.liste && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {s.liste.map((item) => (
                <span key={item.label} style={{
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)',
                  color: item.couleur,
                  background: item.couleur + '1a',
                  border: `1px solid ${item.couleur}44`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '3px 10px',
                }}>
                  {item.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dots navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 20 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: i === slide ? 'var(--accent)' : 'var(--border-2)',
                transition: 'width 0.2s ease, background 0.2s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Boutons navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          {slide > 0 && (
            <button
              onClick={() => setSlide(s => s - 1)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-2)', background: 'none',
                color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Précédent
            </button>
          )}
          {!estDerniere ? (
            <button
              onClick={() => setSlide(s => s + 1)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'var(--accent)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={terminer}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
                border: 'none', background: 'var(--accent)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              C'est parti
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
