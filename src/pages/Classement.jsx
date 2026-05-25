import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Classement() {
  const [groupes, setGroupes] = useState([])
  const [groupeActif, setGroupeActif] = useState(null)
  const [classement, setClassement] = useState([])
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      // Récupère les groupes de l'user
      const { data } = await supabase
        .from('membres_groupe')
        .select('groupe_id, groupes(id, nom)')
        .eq('user_id', user.id)
        .eq('actif', true)

      setGroupes(data || [])
      if (data?.length > 0) {
        setGroupeActif(data[0].groupes)
        await chargerClassement(data[0].groupes.id)
      }
      setChargement(false)
    }
    init()
  }, [])

  const chargerClassement = async (groupeId) => {
    const { data } = await supabase
      .from('membres_groupe')
      .select('points, user_id, profils(pseudo)')
      .eq('groupe_id', groupeId)
      .eq('actif', true)
      .order('points', { ascending: false })

    setClassement(data || [])
  }

  const changerGroupe = async (groupe) => {
    setGroupeActif(groupe)
    await chargerClassement(groupe.id)
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>🏆 Classement</h1>
        <button onClick={() => navigate('/accueil')}>Accueil</button>
      </div>

      {chargement && <p>Chargement...</p>}

      {/* Sélecteur de groupe */}
      {groupes.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
          {groupes.map(m => (
            <button
              key={m.groupe_id}
              onClick={() => changerGroupe(m.groupes)}
              style={{ fontWeight: groupeActif?.id === m.groupes.id ? 'bold' : 'normal' }}
            >
              {m.groupes.nom}
            </button>
          ))}
        </div>
      )}

      {groupeActif && <h3>{groupeActif.nom}</h3>}

      {/* Tableau classement */}
      {classement.map((membre, index) => (
        <div key={membre.user_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', border: '1px solid #333', borderRadius: 8, marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, minWidth: 24 }}>#{index + 1}</span>
          <span style={{ flex: 1 }}>{membre.profils?.pseudo || 'Inconnu'}</span>
          <span style={{ fontWeight: 600 }}>{membre.points} pts</span>
        </div>
      ))}

      {!chargement && classement.length === 0 && (
        <p>Aucun membre dans ce groupe.</p>
      )}
    </div>
  )
}

export default Classement