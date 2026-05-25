import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const formaterDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

function MesPronos() {
  const [pronos, setPronos] = useState([])
  const [stats, setStats] = useState({ total: 0, corrects: 0, incorrects: 0, enAttente: 0 })
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data } = await supabase
        .from('pronos')
        .select('equipe_choisie, resultat, points_gagnes, cree_le, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur, gagnant, statut)')
        .eq('user_id', user.id)
        .order('cree_le', { ascending: false })

      setPronos(data || [])

      // Calcul stats
      const total = data?.length || 0
      const corrects = data?.filter(p => p.resultat === 'correct').length || 0
      const incorrects = data?.filter(p => p.resultat === 'incorrect').length || 0
      const enAttente = data?.filter(p => p.resultat === 'en_attente').length || 0

      setStats({ total, corrects, incorrects, enAttente })
      setChargement(false)
    }
    init()
  }, [])

  const tauxReussite = stats.total > 0
    ? Math.round((stats.corrects / (stats.corrects + stats.incorrects || 1)) * 100)
    : 0

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
      <h1>Mes Pronos</h1>

      {/* Stats globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', margin: '1rem 0' }}>
        {[
          { label: 'Total', valeur: stats.total },
          { label: 'Corrects', valeur: stats.corrects },
          { label: 'Ratés', valeur: stats.incorrects },
          { label: 'Réussite', valeur: `${tauxReussite}%` },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a1a', borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{s.valeur}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {chargement && <p>Chargement...</p>}

      {/* Liste des pronos */}
      {pronos.map((prono, index) => {
        const match = prono.matchs
        const couleur = prono.resultat === 'correct' ? '#1a3a1a' : prono.resultat === 'incorrect' ? '#3a1a1a' : '#1a1a1a'
        const bordure = prono.resultat === 'correct' ? '#4CAF50' : prono.resultat === 'incorrect' ? '#f44336' : '#333'

        return (
          <div key={index} style={{ border: `1px solid ${bordure}`, background: couleur, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {match?.equipe_exterieur} @ {match?.equipe_domicile}
                </span>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  {match ? formaterDate(match.date_match) : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>→ {prono.equipe_choisie}</div>
                <div style={{ fontSize: 11, color: prono.resultat === 'correct' ? '#4CAF50' : prono.resultat === 'incorrect' ? '#f44336' : '#666', marginTop: 2 }}>
                  {prono.resultat === 'correct' ? `+${prono.points_gagnes} pt` : prono.resultat === 'incorrect' ? 'Raté' : 'En attente'}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {!chargement && pronos.length === 0 && (
        <p style={{ color: '#666' }}>Aucun prono pour l'instant.</p>
      )}
    </div>
  )
}

export default MesPronos