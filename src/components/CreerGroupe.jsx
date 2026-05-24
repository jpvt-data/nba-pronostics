import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Génère un code d'invitation lisible ex: NBA-X7K2
const genererCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `NBA-${code}`
}

function CreerGroupe({ onSuccess }) {
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  const gererCreation = async (e) => {
    e.preventDefault()
    setChargement(true)
    setErreur(null)

    const { data: { user } } = await supabase.auth.getUser()
    const code = genererCode()

    // Création du groupe
    const { data: groupe, error } = await supabase
      .from('groupes')
      .insert({ nom, code_invitation: code, admin_id: user.id })
      .select()
      .single()

    if (error) {
      setErreur('Erreur lors de la création')
      setChargement(false)
      return
    }

    // Ajout du créateur comme membre
    await supabase
      .from('membres_groupe')
      .insert({ groupe_id: groupe.id, user_id: user.id })

    onSuccess()
    setChargement(false)
  }

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #444', borderRadius: 8 }}>
      <h3>Créer un groupe</h3>
      <form onSubmit={gererCreation}>
        <input
          type="text"
          placeholder="Nom du groupe"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
        />
        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
        <button type="submit" disabled={chargement}>
          {chargement ? 'Création...' : 'Créer'}
        </button>
      </form>
    </div>
  )
}

export default CreerGroupe