import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { track } from '../services/tracker'

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

const IconTarget = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

const IconBarChart = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)

const IconCards = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="14" height="18" rx="2"/>
    <path d="M8 2h12a2 2 0 0 1 2 2v14"/>
  </svg>
)

const IconGamepad = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
    <circle cx="15" cy="13" r="1" fill="currentColor"/><circle cx="17" cy="11" r="1" fill="currentColor"/>
    <path d="M5 8a2 2 0 0 0-2 2v4a7 7 0 0 0 14 0v-4a2 2 0 0 0-2-2Z"/>
    <path d="M15 8v-.5a2.5 2.5 0 0 0-5 0V8"/>
  </svg>
)

const IconZap = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const SLIDES = [
  {
    icone: <IconTrophy />,
    couleurIcone: 'var(--gold)',
    titre1: 'BIENVENUE SUR',
    titre2: 'SWISH LEAGUE',
    couleur2: 'var(--accent)',
    contenu: [
      'Vis la Saison NBA autrement.',
      'Pronos, stats, classements, collection de cartes et mini-jeux — tout pour vivre la saison NBA avec tes potes, du tip-off de la Summer League jusqu\'aux Finals.',
    ],
  },
  {
    icone: <IconLayers />,
    couleurIcone: 'var(--accent)',
    titre1: 'LES',
    titre2: 'LIGUES',
    couleur2: 'var(--orange)',
    contenu: [
      'Chaque phase de la saison NBA a sa ligue dédiée dans Swish League.',
      'Tu es automatiquement inscrit à chaque nouvelle phase — rien à faire. Tu peux les visualiser dans le menu Ligues.',
    ],
    liste: [
      { label: 'Summer League', couleur: '#06b6d4' },
      { label: 'Pré-saison', couleur: '#6366f1' },
      { label: 'Saison régulière', couleur: '#9090b0' },
      { label: 'NBA Cup', couleur: '#f97316' },
      { label: 'Playoffs', couleur: '#ef4444' },
      { label: 'NBA Finals', couleur: '#e11d48' },
    ],
  },
  {
    icone: <IconTarget />,
    couleurIcone: 'var(--success)',
    titre1: 'POSE TON',
    titre2: 'PRONO',
    couleur2: 'var(--success)',
    contenu: [
      'Depuis l\'Accueil ou le Calendrier, clique sur un match pour accéder à sa fiche.',
      'Pose ton pronostic avant le tip-off. Ajoute une fourchette d\'écart (serré, modéré, large…) pour tenter des points bonus.',
      'Stats, cotes et prédictions ESPN sont disponibles dans chaque fiche match pour t\'aider à choisir.',
    ],
  },
  {
    icone: <IconBarChart />,
    couleurIcone: 'var(--accent)',
    titre1: 'SUIS TA',
    titre2: 'SAISON',
    couleur2: 'var(--accent)',
    contenu: [
      'La page Stats regroupe ton historique complet : pronos, taux de réussite, fourchettes, points par ligue.',
      'Le Classement te situe face aux autres participants en temps réel.',
      'Clique sur un profil pour déclencher un duel 1v1 — comparaison tête-à-tête de vos stats et performances.',
    ],
  },
  {
    icone: <IconCards />,
    couleurIcone: 'var(--gold)',
    titre1: 'TA',
    titre2: 'COLLECTION',
    couleur2: 'var(--gold)',
    contenu: [
      'Des cartes Topps NBA à débloquer au fil de ton parcours.',
      'Plus tu joues, plus ta collection s\'enrichit. Chaque carte a une rareté : Common, Rare, ou Legendary.',
    ],
    liste: [
      { label: 'Pronos réussis', couleur: '#22c55e' },
      { label: 'Fourchettes correctes', couleur: '#22c55e' },
      { label: 'Roue quotidienne', couleur: '#6366f1' },
      { label: 'Passage de niveau', couleur: '#f59e0b' },
      { label: 'Arcade', couleur: '#f97316' },
    ],
  },
  {
    icone: <IconGamepad />,
    couleurIcone: 'var(--orange)',
    titre1: 'L\'ARCADE —',
    titre2: 'CHAQUE JOUR',
    couleur2: 'var(--orange)',
    contenu: [
      'Un mini-jeu quotidien indépendant du calendrier NBA — jouable 365 jours par an.',
      'Lancer franc, mode survie : enchaîne les paniers sans rater 3 fois. Difficulté progressive, 1 partie par jour.',
      'Records perso, record de la semaine et record absolu entre vous. Bats un record → booster de 3 cartes.',
    ],
  },
  {
    icone: <IconZap />,
    couleurIcone: 'var(--gold)',
    titre1: 'TA',
    titre2: 'PROGRESSION',
    couleur2: 'var(--gold)',
    contenu: [
      'Chaque action rapporte de l\'XP : connexion quotidienne, pronos corrects, missions, roue du jour, Arcade.',
      'Monte de niveau — de Rookie à GOAT. Des badges se débloquent en chemin.',
      'Missions hebdo et permanentes pour accélérer ta progression. Consulte-les depuis ton profil.',
    ],
  },
]

export default function OnboardingTuto({ userId, onClose }) {
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()
  const total = SLIDES.length
  const estDerniere = slide === total - 1

  const marquerFait = async () => {
    if (!userId) return
    await supabase.from('profils').update({ onboarding_done: true }).eq('id', userId)
  }

  const fermer = async () => {
    await marquerFait()
    track(userId, 'onboarding_ferme', '/onboarding', { slide, total })
    onClose()
  }

  const terminer = async () => {
    await marquerFait()
    track(userId, 'onboarding_termine', '/onboarding', { total })
    onClose()
    navigate('/accueil')
  }

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
        display: 'flex', flexDirection: 'column', gap: 18,
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        minHeight: 440,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>

        {/* Bouton fermer */}
        <button onClick={fermer} style={{
          position: 'absolute', top: 12, right: 14,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-2)', padding: 4,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Compteur slide */}
        <div style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right', fontWeight: 600, letterSpacing: '0.08em', paddingRight: 28 }}>
          {slide + 1} / {total}
        </div>

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

          {/* Tags si présents */}
          {s.liste && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {s.liste.map((item) => (
                <span key={item.label} style={{
                  fontSize: 11, fontWeight: 600,
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
            <button key={i} onClick={() => setSlide(i)} style={{
              width: i === slide ? 20 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === slide ? 'var(--accent)' : 'var(--border-2)',
              transition: 'width 0.2s ease, background 0.2s ease',
              padding: 0,
            }} />
          ))}
        </div>

        {/* Boutons navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          {slide > 0 && (
            <button onClick={() => setSlide(s => s - 1)} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-2)', background: 'none',
              color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
            }}>
              Précédent
            </button>
          )}
          {!estDerniere ? (
            <button onClick={() => setSlide(s => s + 1)} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'var(--accent)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Suivant
            </button>
          ) : (
            <button onClick={terminer} style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-sm)',
              border: 'none', background: 'var(--accent)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              C'est parti
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
