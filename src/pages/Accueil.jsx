import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'

function Accueil() {
  const [matchs, setMatchs]    = useState([])
  const [user, setUser]        = useState(null)
  const [chargement, setCharg] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      // calcul points en arrière-plan, sans bloquer l'affichage
      calculerPoints(user.id).catch(() => {})
      const m = await recupererMatchs3Jours()
      setMatchs(m)
      setCharg(false)
    }
    init()
  }, [])

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Bande scrollable 3 jours ── */}
        {!chargement && <BandeMatchs matchs={matchs} userId={user?.id} />}

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Chargement…
          </p>
        )}

        {/* ── Hub principal ── */}
        {!chargement && user && (
          <div style={{ padding: '20px 16px' }}>
            <ClassementRapide userId={user.id} />
            <PronosAttente userId={user.id} />
            <RunsPotes userId={user.id} />
          </div>
        )}

      </main>
    </>
  )
}

export default Accueil