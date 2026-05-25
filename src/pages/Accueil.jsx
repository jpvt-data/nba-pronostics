import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'

function Accueil() {
  const [matchs, setMatchs] = useState([])
  const [user, setUser] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await calculerPoints(user.id)
      const matchsESPN = await recupererMatchs3Jours()
      setMatchs(matchsESPN)
      setChargement(false)
    }
    init()
  }, [])

  if (chargement) return <div style={{ padding: '2rem', color: '#555' }}>Chargement...</div>

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <BandeMatchs matchs={matchs} userId={user?.id} />
      <div style={{ padding: '0 1rem' }}>
        <ClassementRapide userId={user?.id} />
        <PronosAttente matchs={matchs} userId={user?.id} />
        <RunsPotes userId={user?.id} />
      </div>
    </div>
  )
}

export default Accueil