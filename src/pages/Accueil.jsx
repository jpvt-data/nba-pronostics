import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'
import Navigation from '../components/Navigation'
import BandeMatchs from '../components/BandeMatchs'
import ClassementRapide from '../components/ClassementRapide'
import PronosAttente from '../components/PronosAttente'
import RunsPotes from '../components/RunsPotes'
import { useNavigate } from 'react-router-dom'
import { Zap, Calendar, EyeOff, Eye } from 'lucide-react'
import { useNoSpoil } from '../context/NoSpoilContext'

const GUTTER = '20px 16px'
const SEP = { borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)', margin: '20px 16px 0' }

function Accueil() {
  const [matchs, setMatchs]    = useState([])
  const [user, setUser]        = useState(null)
  const [pseudo, setPseudo]    = useState(null)
  const [chargement, setCharg] = useState(true)
  const navigate = useNavigate()
  const { noSpoil, toggleNoSpoil } = useNoSpoil()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data: profil } = await supabase
        .from('profils').select('pseudo').eq('id', user.id).single()
      setPseudo(profil?.pseudo || null)
      calculerPoints(user.id).catch(() => {})
      const m = await recupererMatchs3Jours()
      setMatchs(m)
      setCharg(false)
    }
    init()
  }, [])

  const faireProno = async (match, equipeChoisie) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id:          match.espn_id,
        date_match:       match.date,
        equipe_domicile:  match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut:           match.statut,
        type_saison:      match.typeSaisonNum ?? null,
        saison:           match.saisonNum ?? null,
      }, { onConflict: 'espn_id' })
      .select().single()
    if (!matchDB) return
    await supabase.from('pronos').upsert({
      user_id:       user.id,
      match_id:      matchDB.id,
      equipe_choisie: equipeChoisie,
      resultat:      'en_attente',
    }, { onConflict: 'user_id,match_id' })
  }

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: GUTTER }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0 }}>Bonjour {pseudo || ''}</h2>
              <Zap size={20} color="var(--accent)" strokeWidth={2} fill="var(--accent)" />
            </div>
            <button
              onClick={toggleNoSpoil}
              title={noSpoil ? 'No Spoil actif — cliquer pour désactiver' : 'Activer le mode No Spoil'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px',
                background: noSpoil ? 'rgba(99,102,241,0.15)' : 'transparent',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: noSpoil ? 'rgba(99,102,241,0.4)' : 'var(--border)',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                color: noSpoil ? 'var(--accent)' : 'var(--text-3)',
              }}
            >
              {noSpoil ? <Eye size={12} /> : <EyeOff size={12} />}
              {noSpoil ? 'No Spoil — actif' : 'No Spoil'}
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 0 }}>
            Tes pronos, ton classement, les runs de tes potes.
          </p>
        </div>

        <div style={SEP} />

        {/* ── Bande matchs ── */}
        <div style={{ padding: '20px 16px 8px' }}>
          <h3 style={{ marginBottom: 4 }}>Prochains matchs</h3>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            Clique sur une affiche pour pronostiquer et voir le détail
          </p>
        </div>

        {!chargement && <BandeMatchs matchs={matchs} userId={user?.id} onProno={faireProno} />}
        {!chargement && (
          <div style={{ padding: '10px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => navigate('/calendrier')}
              style={{
                fontSize: 12, color: 'var(--text-3)',
                background: 'none',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
                paddingTop: 5, paddingBottom: 5, paddingLeft: 12, paddingRight: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Calendar size={13} strokeWidth={1.5} /> Calendrier complet
            </button>
          </div>
        )}

        {chargement && (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '2rem 0' }}>
            Chargement…
          </p>
        )}

        {!chargement && <div style={SEP} />}

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