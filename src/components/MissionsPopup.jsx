// src/components/MissionsPopup.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--gold)', taille = 22 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

const BarreProgression = ({ progression, objectif, completee }) => {
  const pct = completee ? 100 : Math.min(100, Math.round((progression / objectif) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <div style={{
        flex: 1, height: 5, background: 'var(--bg-0)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: completee ? 'var(--success)' : 'var(--gold)',
          borderRadius: 3, transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, color: completee ? 'var(--success)' : 'var(--text-3)',
        fontFamily: 'var(--font-display)', flexShrink: 0,
      }}>
        {completee ? '✓' : `${progression}/${objectif}`}
      </span>
    </div>
  )
}

const CarteMission = ({ mission, progression, completee }) => (
  <div style={{
    padding: '12px 14px',
    background: completee ? 'var(--bg-0)' : 'var(--bg-2)',
    borderLeft: `3px solid ${completee ? 'var(--success)' : 'var(--gold)'}`,
    opacity: completee ? 0.5 : 1,
    marginBottom: 8,
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
          {mission.titre}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
          {mission.description}
        </div>
      </div>
      <div style={{
        flexShrink: 0, marginLeft: 12,
        fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 14, color: 'var(--gold)',
      }}>
        +{mission.xp_recompense} XP
      </div>
    </div>
    <BarreProgression
      progression={progression}
      objectif={mission.condition_valeur}
      completee={completee}
    />
  </div>
)

export default function MissionsPopup({ userId, onClose }) {
  const [onglet, setOnglet]       = useState('permanente')
  const [missions, setMissions]   = useState([])
  const [progMap, setProgMap]     = useState({})
  const [charg, setCharg]         = useState(true)

  useEffect(() => {
    const charger = async () => {
      const { data: missionsList } = await supabase
        .from('missions')
        .select('*')
        .eq('actif', true)
        .order('condition_valeur', { ascending: true })

      if (!missionsList) { setCharg(false); return }

      const { data: progressions } = await supabase
        .from('missions_utilisateurs')
        .select('mission_id, progression, completee')
        .eq('user_id', userId)

      const map = {}
      for (const p of (progressions || [])) {
        // Garder la progression la plus élevée (missions hebdo peuvent avoir plusieurs périodes)
        if (!map[p.mission_id] || p.progression > map[p.mission_id].progression) {
          map[p.mission_id] = { progression: p.progression, completee: p.completee }
        }
      }

      setMissions(missionsList)
      setProgMap(map)
      setCharg(false)
    }
    charger()
  }, [userId])

  const filtrees = missions.filter(m => m.type === onglet)
  const enCours  = filtrees.filter(m => !progMap[m.id]?.completee)
  const termines = filtrees.filter(m => progMap[m.id]?.completee)

  const onglets = [
    { key: 'permanente',   label: 'PERMANENTES' },
    { key: 'hebdomadaire', label: 'HEBDO' },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        zIndex: 1500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--bg-1)', borderTop: '3px solid var(--gold)',
          borderRadius: '14px 14px 0 0',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 16px 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <TitreSection mot1="MES" mot2="MISSIONS" />
          <button
            onClick={onClose}
            style={{
              background: 'none', borderWidth: 0, cursor: 'pointer',
              fontSize: 20, color: 'var(--text-3)', padding: 4, lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {onglets.map(o => (
            <button
              key={o.key}
              onClick={() => setOnglet(o.key)}
              style={{
                flex: 1, padding: '10px 0',
                background: 'none', borderWidth: 0, cursor: 'pointer',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                color: onglet === o.key ? 'var(--gold)' : 'var(--text-3)',
                borderBottom: onglet === o.key ? '2px solid var(--gold)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Contenu scrollable */}
        <div style={{ overflowY: 'auto', padding: '14px 16px 24px', flex: 1 }}>
          {charg && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>
              Chargement…
            </p>
          )}

          {!charg && filtrees.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>
              Aucune mission disponible.
            </p>
          )}

          {!charg && enCours.length > 0 && (
            <>
              {enCours.map(m => (
                <CarteMission
                  key={m.id}
                  mission={m}
                  progression={progMap[m.id]?.progression || 0}
                  completee={false}
                />
              ))}
            </>
          )}

          {!charg && termines.length > 0 && (
            <>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                letterSpacing: '0.06em', marginTop: 16, marginBottom: 8,
              }}>
                COMPLÉTÉES
              </div>
              {termines.map(m => (
                <CarteMission
                  key={m.id}
                  mission={m}
                  progression={m.condition_valeur}
                  completee={true}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
