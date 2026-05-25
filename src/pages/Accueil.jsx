import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'
import { Zap } from 'lucide-react'

const GUTTER = '20px 16px'
const SEP = { borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', margin: '20px 16px 0' }

function Accueil() {
  const [matchs, setMatchs]    = useState([])
  const [user, setUser]        = useState(null)
  const [pseudo, setPseudo]    = useState(null)
  const [chargement, setCharg] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // Récupère le pseudo depuis le profil
      const { data: profil } = await supabase
        .from('profils')
        .select('pseudo')
        .eq('id', user.id)
        .single()
      setPseudo(profil?.pseudo || null)

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

        {/* ── Header ── */}
        <div style={{ padding: GUTTER }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>
              Bonjour {pseudo || ''}
            </h2>
            <Zap size={20} color="var(--accent)" strokeWidth={2} fill="var(--accent)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 0 }}>
            Tes pronos, ton classement, les runs de tes potes.
          </p>
        </div>

        {/* ── Séparateur ── */}
        <div style={SEP} />

        {/* ── Bande matchs ── */}
        <div style={{ padding: '20px 16px 8px' }}>
          <h3 style={{ marginBottom: 4 }}>Prochains matchs</h3>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Clique sur une affiche pour pronostiquer et voir le détail
          </p>
        </div>

        {!chargement && <BandeMatchs matchs={matchs} userId={user?.id} />}

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Chargement…
          </p>
        )}

        {/* ── Séparateur ── */}
        {!chargement && <div style={SEP} />}

        {/* ── Hub ── */}
        {!chargement && user && (
          <div style={{ padding: GUTTER, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ClassementRapide userId={user.id} />
            <div style={SEP} />
            <PronosAttente userId={user.id} />
            <div style={SEP} />
            <RunsPotes userId={user.id} />
          </div>
        )}

      </main>
    </>
  )
}

export default Accueil