import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recupererMatchs3Jours } from '../services/espn'
import { calculerPoints } from '../services/points'

// Formate la date pour affichage
const formaterDateAffichage = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Vérifie si le match est verrouillé (déjà commencé)
const estVerrouille = (dateStr, statut) => {
  if (statut === 'STATUS_FINAL') return true
  if (statut === 'STATUS_IN_PROGRESS') return true
  return new Date() >= new Date(dateStr)
}

function Accueil() {
  const [matchs, setMatchs] = useState([])
  const [pronos, setPronos] = useState({}) // { espn_id: equipe_choisie }
  const [chargement, setChargement] = useState(true)
  const [user, setUser] = useState(null)


  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      await calculerPoints(user.id) // ← ici

      // Chargement matchs ESPN
      const matchsESPN = await recupererMatchs3Jours()
      setMatchs(matchsESPN)

      // Chargement pronos existants de l'user
      const { data: pronosexistants } = await supabase
        .from('pronos')
        .select('match_id, equipe_choisie, matchs(espn_id)')
        .eq('user_id', user.id)

      // Index par espn_id pour accès rapide
      const indexPronos = {}
      pronosexistants?.forEach(p => {
        if (p.matchs) indexPronos[p.matchs.espn_id] = p.equipe_choisie
      })
      setPronos(indexPronos)

      setChargement(false)
    }
    init()
  }, [])

  const faireProno = async (match, equipeChoisie) => {
    if (estVerrouille(match.date, match.statut)) return

    // Upsert du match en cache local Supabase
    const { data: matchDB } = await supabase
      .from('matchs')
      .upsert({
        espn_id: match.espn_id,
        date_match: match.date,
        equipe_domicile: match.domicile.trigramme,
        equipe_exterieur: match.exterieur.trigramme,
        statut: match.statut,
      }, { onConflict: 'espn_id' })
      .select()
      .single()

    if (!matchDB) return

    // Upsert du prono
    await supabase
      .from('pronos')
      .upsert({
        user_id: user.id,
        match_id: matchDB.id,
        equipe_choisie: equipeChoisie,
        resultat: 'en_attente',
      }, { onConflict: 'user_id,match_id' })

    setPronos(prev => ({ ...prev, [match.espn_id]: equipeChoisie }))
  }

  // Groupe les matchs par jour
  const matchsParJour = matchs.reduce((acc, match) => {
    const jour = new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    if (!acc[jour]) acc[jour] = []
    acc[jour].push(match)
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h1>NBA Pronos</h1>
      </div>

      {chargement && <p>Chargement des matchs...</p>}

      {/* Matchs par jour */}
      {Object.entries(matchsParJour).map(([jour, matchsDuJour]) => (
        <div key={jour}>
          <h3 style={{ color: '#888', fontSize: 13, textTransform: 'uppercase', margin: '1.5rem 0 0.5rem' }}>{jour}</h3>

          {matchsDuJour.map((match) => {
            const verrou = estVerrouille(match.date, match.statut)
            const pronoActuel = pronos[match.espn_id]

            return (
              <div key={match.espn_id} style={{ border: '1px solid #333', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: 11, color: '#666', marginBottom: '0.5rem' }}>{formaterDateAffichage(match.date)}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Équipe extérieure */}
                  <button
                    onClick={() => faireProno(match, match.exterieur.trigramme)}
                    disabled={verrou}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: pronoActuel === match.exterieur.trigramme ? '2px solid #4CAF50' : '1px solid #444',
                      borderRadius: 8,
                      background: pronoActuel === match.exterieur.trigramme ? '#1a3a1a' : 'transparent',
                      cursor: verrou ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <img src={match.exterieur.logo} alt={match.exterieur.trigramme} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    <span style={{ fontWeight: 600 }}>{match.exterieur.trigramme}</span>
                    {match.exterieur.score && <span>{match.exterieur.score}</span>}
                  </button>

                  <span style={{ color: '#666', fontSize: 12 }}>@</span>

                  {/* Équipe domicile */}
                  <button
                    onClick={() => faireProno(match, match.domicile.trigramme)}
                    disabled={verrou}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: pronoActuel === match.domicile.trigramme ? '2px solid #4CAF50' : '1px solid #444',
                      borderRadius: 8,
                      background: pronoActuel === match.domicile.trigramme ? '#1a3a1a' : 'transparent',
                      cursor: verrou ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <img src={match.domicile.logo} alt={match.domicile.trigramme} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                    <span style={{ fontWeight: 600 }}>{match.domicile.trigramme}</span>
                    {match.domicile.score && <span>{match.domicile.score}</span>}
                  </button>
                </div>

                {verrou && <p style={{ fontSize: 11, color: '#666', marginTop: '0.5rem' }}>
                  {match.statut === 'STATUS_FINAL' ? '✅ Terminé' : '🔒 En cours'}
                </p>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default Accueil