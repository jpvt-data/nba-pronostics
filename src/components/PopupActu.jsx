// src/components/PopupActu.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

const TYPES_LABEL = {
  cloture_ligue:   'Fin de ligue',
  ouverture_ligue: 'Nouvelle ligue',
  message_libre:   'Actu',
}

// Calcule les 5 stats KPI pour une ligue donnée
async function calculerStatsLigue(groupeId) {
  // Membres + points
  const { data: membres } = await supabase
    .from('membres_groupe')
    .select('user_id, points, profils(pseudo)')
    .eq('groupe_id', groupeId)
    .eq('actif', true)
    .order('points', { ascending: false })

  if (!membres?.length) return null

  const userIds = membres.map(m => m.user_id)

  // Pronos de tous les membres
  const { data: pronos } = await supabase
    .from('pronos')
    .select('user_id, resultat')
    .in('user_id', userIds)
    .in('resultat', ['correct', 'incorrect'])

  // Fourchettes correctes
  const { data: fourchettes } = await supabase
    .from('pronos_ecart')
    .select('user_id, correct')
    .in('user_id', userIds)
    .eq('correct', true)

  // Calculs par user
  const stats = {}
  for (const m of membres) {
    stats[m.user_id] = {
      pseudo:     m.profils?.pseudo || '?',
      points:     m.points || 0,
      pronos:     0,
      corrects:   0,
      fourchettes: 0,
      serie:      0,
    }
  }

  // Pronos posés + corrects + taux
  for (const p of (pronos || [])) {
    if (!stats[p.user_id]) continue
    stats[p.user_id].pronos++
    if (p.resultat === 'correct') stats[p.user_id].corrects++
  }

  // Fourchettes correctes
  for (const f of (fourchettes || [])) {
    if (!stats[f.user_id]) continue
    stats[f.user_id].fourchettes++
  }

  // Meilleure série correcte consécutive sur toute la durée de la ligue
  for (const uid of userIds) {
    const { data: tousPronosUser } = await supabase
      .from('pronos')
      .select('resultat, cree_le')
      .eq('user_id', uid)
      .in('resultat', ['correct', 'incorrect'])
      .order('cree_le', { ascending: true })
    let meilleureS = 0, sEnCours = 0
    for (const p of (tousPronosUser || [])) {
      if (p.resultat === 'correct') {
        sEnCours++
        if (sEnCours > meilleureS) meilleureS = sEnCours
      } else {
        sEnCours = 0
      }
    }
    if (stats[uid]) stats[uid].serie = meilleureS
  }

  const liste = Object.values(stats)

  // Champion = plus de points
  const champion = [...liste].sort((a, b) => b.points - a.points)[0]

  // Meilleur taux (min 5 pronos)
  const meilleurTaux = [...liste]
    .filter(u => u.pronos >= 5)
    .sort((a, b) => (b.corrects / b.pronos) - (a.corrects / a.pronos))[0]

  // Sniper = plus de fourchettes correctes
  const sniper = [...liste].sort((a, b) => b.fourchettes - a.fourchettes)[0]

  // Plus assidu = plus de pronos
  const assidu = [...liste].sort((a, b) => b.pronos - a.pronos)[0]

  // Meilleure série
  const enFeu = [...liste].sort((a, b) => b.serie - a.serie)[0]

  return { champion, meilleurTaux, sniper, assidu, enFeu, podium: liste.slice(0, 3) }
}

export default function PopupActu({ actu, onClose }) {
  const [slide, setSlide]   = useState(0)
  const [stats, setStats]   = useState(null)
  const [charg, setCharg]   = useState(false)

  useEffect(() => {
    if (actu.type === 'cloture_ligue' && actu.groupe_id) {
      setCharg(true)
      calculerStatsLigue(actu.groupe_id).then(s => {
        setStats(s)
        setCharg(false)
      })
    }
  }, [actu])

  const aSlide2 = actu.slide2_titre || actu.slide2_message
  const nbSlides = aSlide2 ? 2 : 1

  const fermer = () => {
    localStorage.setItem(`swish_actu_${actu.id}`, '1')
    onClose()
  }

  const MEDAILLES = ['#1', '#2', '#3']
  const MEDAILLES_COULEURS = ['var(--gold)', '#9ca3af', '#b45309']

  return (
    <div
      onClick={fermer}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        zIndex: 1800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--bg-1)',
          borderTop: '3px solid var(--accent)',
          borderRadius: '0 0 var(--radius-md) var(--radius-md)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Bouton fermer */}
        <button onClick={fermer} style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', borderWidth: 0, cursor: 'pointer',
          color: 'var(--text-3)', padding: 4,
          display: 'flex', alignItems: 'center',
        }}>
          <X size={16} />
        </button>

        {/* Tag type */}
        <div style={{ padding: '16px 16px 0' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--accent)', textTransform: 'uppercase',
            fontFamily: 'var(--font-display)',
          }}>
            {TYPES_LABEL[actu.type] || 'Actu'}
          </span>
        </div>

        {/* ── SLIDE 1 ── */}
        {slide === 0 && (
          <div style={{ padding: '8px 16px 20px' }}>
            <div style={{
              fontFamily: 'var(--font-title)', fontWeight: 700,
              fontSize: 28, color: 'var(--text-1)',
              letterSpacing: '0.02em', lineHeight: 1.1,
              marginBottom: 10,
            }}>
              {actu.titre}
            </div>

            {actu.message && (
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
                {actu.message}
              </p>
            )}

            {/* Stats ligue auto */}
            {actu.type === 'cloture_ligue' && (
              <div>
                {charg && (
                  <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                    Chargement des stats…
                  </p>
                )}

                {!charg && stats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Podium */}
                    <div style={{
                      background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px', marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', marginBottom: 8 }}>
                        CLASSEMENT FINAL
                      </div>
                      {stats.podium.map((u, i) => (
                        <div key={u.pseudo} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '5px 0',
                          borderBottom: i < stats.podium.length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            fontSize: 13, color: MEDAILLES_COULEURS[i], flexShrink: 0, width: 20,
                          }}>
                            {MEDAILLES[i]}
                          </span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                            {u.pseudo}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            fontSize: 14, color: 'var(--gold)',
                          }}>
                            {u.points} pts
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* KPIs */}
                    {[
                      { label: 'Meilleur taux de réussite', user: stats.meilleurTaux, valeur: stats.meilleurTaux ? `${Math.round(stats.meilleurTaux.corrects / stats.meilleurTaux.pronos * 100)}%` : '—' },
                      { label: 'Sniper', user: stats.sniper, valeur: `${stats.sniper?.fourchettes || 0} fourchettes réussies` },
                      { label: 'Le plus assidu', user: stats.assidu, valeur: `${stats.assidu?.pronos || 0} pronos` },
                      { label: 'En feu', user: stats.enFeu, valeur: stats.enFeu?.serie ? `meilleure série : ${stats.enFeu.serie}` : '—' },
                    ].map(kpi => (
                      <div key={kpi.label} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                      }}>
                        <div>
                          <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.08em', fontWeight: 700 }}>
                            {kpi.label.toUpperCase()}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginTop: 1 }}>
                            {kpi.user?.pseudo || '—'}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-display)', fontWeight: 700,
                          fontSize: 14, color: 'var(--accent)',
                        }}>
                          {kpi.valeur}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SLIDE 2 ── */}
        {slide === 1 && (
          <div style={{ padding: '8px 16px 24px' }}>
            <div style={{
              fontFamily: 'var(--font-title)', fontWeight: 700,
              fontSize: 28, color: 'var(--accent)',
              letterSpacing: '0.02em', lineHeight: 1.1,
              marginBottom: 10,
            }}>
              {actu.slide2_titre || 'Coming Soon'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {actu.slide2_message || ''}
            </p>
          </div>
        )}

        {/* Navigation bas */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px 16px', gap: 12,
        }}>
          {/* Dots */}
          {nbSlides > 1 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: nbSlides }).map((_, i) => (
                <div key={i} onClick={() => setSlide(i)} style={{
                  width: i === slide ? 16 : 6, height: 6,
                  borderRadius: 3,
                  background: i === slide ? 'var(--accent)' : 'var(--border-2)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }} />
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {slide > 0 && (
              <button onClick={() => setSlide(s => s - 1)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid',
                borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)',
                padding: '8px 14px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
              }}>
                <ChevronLeft size={14} /> Retour
              </button>
            )}
            {slide < nbSlides - 1 ? (
              <button onClick={() => setSlide(s => s + 1)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'var(--accent)', borderWidth: 0,
                borderRadius: 'var(--radius-sm)',
                padding: '8px 16px', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                Suivant <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={fermer} style={{
                background: 'var(--accent)', borderWidth: 0,
                borderRadius: 'var(--radius-sm)',
                padding: '8px 16px', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
