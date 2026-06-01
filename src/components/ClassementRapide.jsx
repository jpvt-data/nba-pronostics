import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'

const MEDAILLES = ['🥇', '🥈', '🥉']

// Année NBA courante : 1 sept → 31 août
function anneNBACourante() {
  const d = new Date()
  return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1
}

function debutAnneeNBA() {
  const annee = anneNBACourante()
  return new Date(`${annee}-09-01T00:00:00`)
}

function labelAnneeNBA() {
  const a = anneNBACourante()
  return `${String(a).slice(2)}-${String(a + 1).slice(2)}`
}

function ClassementRapide({ userId }) {
  const [groupeActif, setGroupeActif] = useState(null)
  const [classement, setClassement]   = useState([])
  const [monRang, setMonRang]         = useState(null)
  const navigate                      = useNavigate()

  useEffect(() => {
    const init = async () => {
      // Ligue en cours uniquement (date_debut ≤ aujourd'hui ≤ date_fin)
      const maintenant = new Date().toISOString()
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom, date_debut, date_fin)')
        .eq('user_id', userId).eq('actif', true)

      if (!membres?.length) return

      // Filtrer ligues en cours
      const enCours = membres.filter(m => {
        const g = m.groupes
        if (!g) return false
        const apresDebut = !g.date_debut || new Date(g.date_debut) <= new Date()
        const avantFin   = !g.date_fin   || new Date(g.date_fin)   >= new Date()
        return apresDebut && avantFin
      })
      if (!enCours.length) return

      const groupe = enCours[0].groupes
      setGroupeActif(groupe)

      // Membres du groupe
      const { data: tousMembers } = await supabase
        .from('membres_groupe')
        .select('user_id, profils(pseudo, avatar_url)')
        .eq('groupe_id', groupe.id).eq('actif', true)

      if (!tousMembers?.length) return

      const userIds = tousMembers.map(m => m.user_id)

      // Points année NBA uniquement
      const debut = debutAnneeNBA()
      const { data: pronos } = await supabase
        .from('pronos')
        .select('user_id, points_gagnes')
        .eq('groupe_id', groupe.id)
        .eq('resultat', 'correct')
        .in('user_id', userIds)
        .gte('cree_le', debut.toISOString())

      // Agréger points
      const pointsMap = {}
      userIds.forEach(id => { pointsMap[id] = 0 })
      pronos?.forEach(p => { pointsMap[p.user_id] = (pointsMap[p.user_id] || 0) + (p.points_gagnes || 1) })

      const liste = tousMembers
        .map(m => ({ ...m, points: pointsMap[m.user_id] || 0 }))
        .sort((a, b) => b.points - a.points)

      setClassement(liste)
      setMonRang(liste.findIndex(m => m.user_id === userId) + 1)
    }
    if (userId) init()
  }, [userId])

  if (!groupeActif || !classement.length) return null

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{groupeActif.nom}</h3>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Saison {labelAnneeNBA()}</span>
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
                borderRight: 0, borderTop: 0,
                borderBottom: '1px solid var(--border)',
                borderRadius: 0,
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: i < 3 ? 16 : 13,
                fontFamily: 'var(--font-display)', fontWeight: 700,
                color: i < 3 ? 'var(--gold)' : 'var(--text-3)',
                minWidth: 24, textAlign: 'center',
              }}>
                {i < 3 ? MEDAILLES[i] : `#${i + 1}`}
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