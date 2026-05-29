import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'
import { LabelSection, Bloc } from '../components/UI'
import { ArrowLeft } from 'lucide-react'

const formaterDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function H2H() {
  const [searchParams]                 = useSearchParams()
  const navigate                       = useNavigate()
  const [moi, setMoi]                  = useState(null)
  const [potes, setPotes]              = useState([]) // tous les users de mes ligues
  const [adversaire, setAdversaire]    = useState(null) // { user_id, pseudo, avatar_url }
  const [profilMoi, setProfilMoi]      = useState(null)
  const [matchs, setMatchs]            = useState([]) // comparaison match par match
  const [bilan, setBilan]              = useState({ moi: 0, eux: 0, nul: 0 })
  const [charg, setCharg]              = useState(false)

  // Init — charger moi + liste potes
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMoi(user.id)

      const { data: profil } = await supabase
        .from('profils').select('pseudo, avatar_url').eq('id', user.id).single()
      setProfilMoi(profil)

      // Tous les membres de mes ligues sauf moi
      const { data: membres } = await supabase
        .from('membres_groupe')
        .select('groupe_id')
        .eq('user_id', user.id).eq('actif', true)

      if (!membres?.length) return
      const groupeIds = membres.map(m => m.groupe_id)

      const { data: potesBrut } = await supabase
        .from('membres_groupe')
        .select('user_id, profils(pseudo, avatar_url)')
        .in('groupe_id', groupeIds)
        .eq('actif', true)
        .neq('user_id', user.id)

      // Déduplication
      const map = new Map()
      potesBrut?.forEach(p => {
        if (!map.has(p.user_id)) map.set(p.user_id, { user_id: p.user_id, pseudo: p.profils?.pseudo, avatar_url: p.profils?.avatar_url })
      })
      const liste = [...map.values()].sort((a, b) => (a.pseudo || '').localeCompare(b.pseudo || ''))
      setPotes(liste)

      // Si user2 passé en param → pré-sélectionner
      const user2 = searchParams.get('user2')
      if (user2) {
        const trouve = liste.find(p => p.user_id === user2)
        if (trouve) setAdversaire(trouve)
      }
    }
    init()
  }, [])

  // Charger le H2H quand adversaire change
  useEffect(() => {
    if (!moi || !adversaire) return
    chargerH2H()
  }, [adversaire, moi])

  const chargerH2H = async () => {
    setCharg(true)

    // Pronos des deux users sur les mêmes matchs
    const { data: pronosMoi } = await supabase
      .from('pronos')
      .select('match_id, equipe_choisie, resultat, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur)')
      .eq('user_id', moi)
      .neq('resultat', 'en_attente')

    const { data: pronosEux } = await supabase
      .from('pronos')
      .select('match_id, equipe_choisie, resultat')
      .eq('user_id', adversaire.user_id)
      .neq('resultat', 'en_attente')

    // Index pronos adversaire par match_id
    const indexEux = {}
    pronosEux?.forEach(p => { indexEux[p.match_id] = p })

    // Matchs en commun
    const communs = (pronosMoi || [])
      .filter(p => indexEux[p.match_id])
      .map(p => ({
        match_id:        p.match_id,
        espn_id:         p.matchs?.espn_id,
        date_match:      p.matchs?.date_match,
        dom:             p.matchs?.equipe_domicile,
        ext:             p.matchs?.equipe_exterieur,
        pick_moi:        p.equipe_choisie,
        resultat_moi:    p.resultat,
        pick_eux:        indexEux[p.match_id].equipe_choisie,
        resultat_eux:    indexEux[p.match_id].resultat,
      }))
      .sort((a, b) => new Date(b.date_match) - new Date(a.date_match))

    setMatchs(communs)

    // Bilan
    let moiW = 0, euxW = 0, nul = 0
    communs.forEach(m => {
      if (m.resultat_moi === 'correct' && m.resultat_eux === 'incorrect') moiW++
      else if (m.resultat_moi === 'incorrect' && m.resultat_eux === 'correct') euxW++
      else nul++
    })
    setBilan({ moi: moiW, eux: euxW, nul })
    setCharg(false)
  }

  const couleur = (r) => r === 'correct' ? 'var(--success)' : 'var(--danger)'

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* Header */}
        <div style={{
          padding: '20px 16px 16px',
          background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
        }}>
          <button onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', borderWidth: 0, color: 'var(--text-3)',
            fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16,
          }}>
            <ArrowLeft size={15} /> Retour
          </button>
          <h2 style={{ margin: '0 0 4px' }}>1v1</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
            Compare tes pronos face à un pote.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 16px 24px' }}>

          {/* Picker adversaire */}
          <Bloc>
            <LabelSection>Ton adversaire</LabelSection>
            <select
              value={adversaire?.user_id || ''}
              onChange={e => {
                const trouve = potes.find(p => p.user_id === e.target.value)
                setAdversaire(trouve || null)
              }}
              style={{
                marginTop: 10, width: '100%',
                background: 'var(--bg-2)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-1)',
                fontSize: 13, padding: '10px 12px', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="">— Choisir un pote —</option>
              {potes.map(p => (
                <option key={p.user_id} value={p.user_id}>{p.pseudo || 'Inconnu'}</option>
              ))}
            </select>
          </Bloc>

          {/* Bilan */}
          {adversaire && !charg && matchs.length > 0 && (
            <Bloc>
              <LabelSection>Bilan face à {adversaire.pseudo}</LabelSection>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginTop: 12, alignItems: 'center' }}>

                {/* Moi */}
                <div style={{ textAlign: 'center' }}>
                  <Avatar url={profilMoi?.avatar_url} pseudo={profilMoi?.pseudo} taille={44} fontSize={15} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginTop: 6 }}>{profilMoi?.pseudo}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: bilan.moi >= bilan.eux ? 'var(--success)' : 'var(--text-3)', lineHeight: 1, marginTop: 4 }}>
                    {bilan.moi}
                  </div>
                </div>

                {/* VS */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-3)', letterSpacing: '0.1em' }}>VS</div>
                  {bilan.nul > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{bilan.nul} nul{bilan.nul > 1 ? 's' : ''}</div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{matchs.length} matchs</div>
                </div>

                {/* Adversaire */}
                <div style={{ textAlign: 'center' }}>
                  <Avatar url={adversaire.avatar_url} pseudo={adversaire.pseudo} taille={44} fontSize={15} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginTop: 6 }}>{adversaire.pseudo}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: bilan.eux > bilan.moi ? 'var(--success)' : 'var(--text-3)', lineHeight: 1, marginTop: 4 }}>
                    {bilan.eux}
                  </div>
                </div>

              </div>

              {/* Verdict */}
              <div style={{
                marginTop: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: bilan.moi > bilan.eux ? 'rgba(34,197,94,0.08)' : bilan.eux > bilan.moi ? 'rgba(239,68,68,0.08)' : 'var(--bg-2)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: bilan.moi > bilan.eux ? 'rgba(34,197,94,0.2)' : bilan.eux > bilan.moi ? 'rgba(239,68,68,0.2)' : 'var(--border)',
                textAlign: 'center', fontSize: 13, fontWeight: 600,
                color: bilan.moi > bilan.eux ? 'var(--success)' : bilan.eux > bilan.moi ? 'var(--danger)' : 'var(--text-2)',
              }}>
                {bilan.moi > bilan.eux && `🏆 Tu mènes ${bilan.moi} - ${bilan.eux}`}
                {bilan.eux > bilan.moi && `😤 ${adversaire.pseudo} mène ${bilan.eux} - ${bilan.moi}`}
                {bilan.moi === bilan.eux && `🤝 Égalité parfaite`}
              </div>
            </Bloc>
          )}

          {/* Match par match */}
          {adversaire && !charg && matchs.length > 0 && (
            <Bloc>
              <LabelSection>Match par match</LabelSection>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {matchs.map((m, i) => {
                  const moiGagne = m.resultat_moi === 'correct' && m.resultat_eux === 'incorrect'
                  const euxGagne = m.resultat_eux === 'correct' && m.resultat_moi === 'incorrect'
                  return (
                    <div
                      key={i}
                      onClick={() => m.espn_id && navigate(`/match/${m.espn_id}`)}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                        background: moiGagne ? 'rgba(34,197,94,0.05)' : euxGagne ? 'rgba(239,68,68,0.05)' : 'var(--bg-2)',
                        borderWidth: 1, borderStyle: 'solid',
                        borderColor: moiGagne ? 'rgba(34,197,94,0.2)' : euxGagne ? 'rgba(239,68,68,0.2)' : 'var(--border)',
                        cursor: m.espn_id ? 'pointer' : 'default',
                      }}
                    >
                      {/* Match */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
                        {m.ext} @ {m.dom}
                        <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 8 }}>{formaterDate(m.date_match)}</span>
                      </div>
                      {/* Picks */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div style={{
                          padding: '4px 8px', borderRadius: 4,
                          background: `rgba(${m.resultat_moi === 'correct' ? '34,197,94' : '239,68,68'},0.08)`,
                          fontSize: 11,
                        }}>
                          <span style={{ color: 'var(--text-3)' }}>{profilMoi?.pseudo} : </span>
                          <span style={{ fontWeight: 600, color: couleur(m.resultat_moi) }}>{m.pick_moi}</span>
                          <span style={{ marginLeft: 4 }}>{m.resultat_moi === 'correct' ? '✅' : '❌'}</span>
                        </div>
                        <div style={{
                          padding: '4px 8px', borderRadius: 4,
                          background: `rgba(${m.resultat_eux === 'correct' ? '34,197,94' : '239,68,68'},0.08)`,
                          fontSize: 11,
                        }}>
                          <span style={{ color: 'var(--text-3)' }}>{adversaire.pseudo} : </span>
                          <span style={{ fontWeight: 600, color: couleur(m.resultat_eux) }}>{m.pick_eux}</span>
                          <span style={{ marginLeft: 4 }}>{m.resultat_eux === 'correct' ? '✅' : '❌'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Bloc>
          )}

          {adversaire && !charg && matchs.length === 0 && (
            <Bloc>
              <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>
                Aucun match en commun avec {adversaire.pseudo} pour l'instant.
              </p>
            </Bloc>
          )}

          {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>Chargement…</p>}

        </div>
      </main>
    </>
  )
}

export default H2H