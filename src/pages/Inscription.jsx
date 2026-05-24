import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

function Inscription() {
  const [email, setEmail] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const navigate = useNavigate()

const gererInscription = async (e) => {
    e.preventDefault()
    setChargement(true)
    setErreur(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
    })

    console.log('data:', data)
    console.log('error:', error)

    if (error) {
      setErreur(error.message)
      setChargement(false)
      return
    }

    const { error: erreurProfil } = await supabase
      .from('profils')
      .insert({ id: data.user.id, pseudo })

    console.log('erreurProfil:', erreurProfil)

    if (erreurProfil) {
      setErreur('Ce pseudo est déjà pris')
      setChargement(false)
      return
    }

    navigate('/accueil')
    setChargement(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 1rem' }}>
      <h1>Inscription</h1>
      <form onSubmit={gererInscription}>
        <div>
          <label>Pseudo</label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Mot de passe</label>
          <input
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
        <button type="submit" disabled={chargement}>
          {chargement ? 'Inscription...' : "S'inscrire"}
        </button>
      </form>
      <p>Déjà un compte ? <Link to="/connexion">Se connecter</Link></p>
    </div>
  )
}

export default Inscription