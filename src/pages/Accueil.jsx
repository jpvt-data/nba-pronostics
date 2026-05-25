import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'

function Accueil() {
  const [matchs, setMatchs]       = useState([])
  const [user, setUser]           = useState(null)
  const [chargement, setCharg]    = useState(true)
  const [refreshKey, setRefresh]  = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      calculerPoints(user.id).catch(() => {})
      const m = await recupererMatchs3Jours()
      setMatchs(m)
      setCharg(false)
    }
    init()
  }, [])

  // appelé par BandeMatchs après chaque prono — force PronosAttente à se recharger
  const onPronoFait = useCallback(() => {
    setRefresh(k => k + 1)
  }, [])

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {!chargement && (
          <BandeMatchs matchs={matchs} userId={user?.id} onPronoFait={onPronoFait} />
        )}

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Chargement…
          </p>
        )}

        {!chargement && user && (
          <div style={{ padding: '20px 16px' }}>
            <ClassementRapide userId={user.id} />
            <PronosAttente userId={user.id} refreshKey={refreshKey} />
            <RunsPotes userId={user.id} />
          </div>
        )}

      </main>
    </>
  )
}

export default Accueil