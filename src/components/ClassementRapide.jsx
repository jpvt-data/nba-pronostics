import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'

const MEDAILLES_STYLE = [
  { label: '#1', color: '#f59e0b' },
  { label: '#2', color: '#9ca3af' },
  { label: '#3', color: '#b45309' },
]

function labelAnneeNBA(estSummerLeague = false) {
  const d = new Date()
  let a = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
  if (estSummerLeague) a += 1 // SL de juillet appartient à la saison suivante (cf. espn_capacites)
  return `${String(a).slice(2)}-${String(a + 1).slice(2)}`
}

function ClassementRapide({ userId }) {
  const [groupeActif, setGroupeActif] = useState(null)
  const [classement, setClassement]   = useState([])
  const [modeGeneral, setModeGeneral] = useState(false)
  const [monRang, setMonRang]         = useState(null)
  const navigate                      = useNavigate()

  useEffect(() => {
    const init = async () => {
      const now = new Date()

      // Toutes les ligues de l'user
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom, date_debut, date_fin, tag)')
        .eq('user_id', userId).eq('actif', true)

      if (!membres?.length) return

      const GROUPE_GENERAL = 'aaaaaaaa-0000-0000-0000-000000000001'

      // Chercher une ligue en cours (hors groupe Général)
      const enCours = membres.filter(m => {
        if (m.groupe_id === GROUPE_GENERAL) return false
        const g = m.groupes
        if (!g) return false
        const apresDebut = !g.date_debut || new Date(g.date_debut) <= now
        const avantFin   = !g.date_fin   || new Date(g.date_fin)   >= now
        return apresDebut && avantFin
      })

      if (enCours.length > 0) {
        // ── Mode ligue active : points de la ligue ──
        const groupe = enCours[0].groupes
        setGroupeActif(groupe)
        setModeGeneral(false)

        const { data: tousMembers } = await supabase
          .from('membres_groupe')
          .select('user_id, points, profils(pseudo, avatar_url)')
          .eq('groupe_id', groupe.id).eq('actif', true)
          .order('points', { ascending: false })

        if (!tousMembers?.length) return
        setClassement(tousMembers)
        setMonRang(tousMembers.findIndex(m => m.user_id === userId) + 1)

      } else {
        // ── Mode général : somme de tous les points toutes ligues ──
        setGroupeActif(null)
        setModeGeneral(true)

        // Exclure le groupe Général (chat) du calcul des points
        const groupeIds = membres
          .map(m => m.groupe_id)
          .filter(id => id !== GROUPE_GENERAL)

        if (!groupeIds.length) return

        // Récupérer tous les membres de toutes les ligues (hors Général)
        const { data: tousMembers } = await supabase
          .from('membres_groupe')
          .select('user_id, points, profils(pseudo, avatar_url)')
          .in('groupe_id', groupeIds)
          .eq('actif', true)

        if (!tousMembers?.length) return

        // Agréger les points par user
        const agg = {}
        for (const m of tousMembers) {
          const uid = m.user_id
          if (!agg[uid]) agg[uid] = { user_id: uid, points: 0, profils: m.profils }
          agg[uid].points += (m.points || 0)
        }

        const liste = Object.values(agg).sort((a, b) => b.points - a.points)
        setClassement(liste)
        setMonRang(liste.findIndex(m => m.user_id === userId) + 1)
      }
    }
    if (userId) init()
  }, [userId])

  if (!classement.length) return (
    <div style={{
      padding: '16px',
      background: 'var(--bg-2)',
      borderLeft: '3px solid var(--border-2)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
        Pas de ligue en cours
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
        La prochaine ligue arrive bientôt — suivez l'actu et tenez-vous prêts !
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-1)' }}>
            {modeGeneral ? 'Classement général' : groupeActif?.nom}
          </h3>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
            {modeGeneral ? 'Tous temps confondus' : `Saison ${labelAnneeNBA(groupeActif?.tag === 'summer_league')}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {monRang > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Tu es #{monRang}</span>
          )}
          <button
            onClick={() => navigate('/classement')}
            style={{ fontSize: 11, color: 'var(--accent)', background: 'none', borderWidth: 0, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            Détails →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {classement.slice(0, 5).map((membre, i) => {
          const estMoi = membre.user_id === userId
          return (
            <div
              key={membre.user_id}
              onClick={() => navigate(`/mes-pronos?user_id=${membre.user_id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: estMoi ? 'rgba(99,102,241,0.08)' : 'transparent',
                borderLeft: estMoi ? '3px solid var(--accent)' : '3px solid transparent',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 13,
                fontFamily: 'var(--font-display)', fontWeight: 700,
                color: i < 3 ? MEDAILLES_STYLE[i].color : 'var(--text-3)',
                minWidth: 24, textAlign: 'center',
              }}>
                {i < 3 ? MEDAILLES_STYLE[i].label : `#${i + 1}`}
              </span>
              <Avatar url={membre.profils?.avatar_url} pseudo={membre.profils?.pseudo} taille={32} fontSize={11} />
              <span style={{
                flex: 1, fontSize: 14, fontWeight: estMoi ? 600 : 500,
                color: estMoi ? 'var(--text-1)' : 'var(--text-2)',
                minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {membre.profils?.pseudo}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>
                {membre.points}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>pts</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ClassementRapide