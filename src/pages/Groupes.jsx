import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CreerGroupe from '../components/CreerGroupe'
import RejoindreGroupe from '../components/RejoindreGroupe'

function Groupes() {
  const [groupes, setGroupes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [vue, setVue] = useState(null)

  const chargerGroupes = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('membres_groupe')
      .select('id, groupe_id, points, actif, groupes(id, nom, code_invitation, admin_id)')
      .eq('user_id', user.id)
      .eq('actif', true)

    setGroupes(data || [])
    setChargement(false)
  }

  const quitterGroupe = async (membreId) => {
    console.log('membreId:', membreId)
    
    const { error } = await supabase
      .from('membres_groupe')
      .update({ actif: false })
      .eq('id', membreId)

    console.log('erreur quitter:', error)
    chargerGroupes()
  }

  useEffect(() => { chargerGroupes() }, [])

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 1rem' }}>
      <h1>🏀 Mes groupes</h1>

      {chargement && <p>Chargement...</p>}

      {!chargement && groupes.length === 0 && (
        <p>Tu n'es dans aucun groupe pour l'instant.</p>
      )}

      {groupes.map((m) => (
        <div key={m.groupe_id} style={{ border: '1px solid #333', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' }}>
          <strong>{m.groupes.nom}</strong>
          <p style={{ fontSize: 12, color: '#888' }}>Code : {m.groupes.code_invitation}</p>
          <p>Points : {m.points}</p>
          <button onClick={() => quitterGroupe(m.id)}>Quitter</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={() => setVue(vue === 'creer' ? null : 'creer')}>+ Créer un groupe</button>
        <button onClick={() => setVue(vue === 'rejoindre' ? null : 'rejoindre')}>Rejoindre un groupe</button>
      </div>

      {vue === 'creer' && <CreerGroupe onSuccess={() => { setVue(null); chargerGroupes() }} />}
      {vue === 'rejoindre' && <RejoindreGroupe onSuccess={() => { setVue(null); chargerGroupes() }} />}
    </div>
  )
}

export default Groupes