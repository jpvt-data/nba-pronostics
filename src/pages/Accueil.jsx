import { supabase } from '../lib/supabase'

function Accueil() {
  const gererDeconnexion = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 1rem' }}>
      <h1>🏀 Bienvenue !</h1>
      <p>Tu es connecté.</p>
      <button onClick={gererDeconnexion}>Se déconnecter</button>
    </div>
  )
}

export default Accueil