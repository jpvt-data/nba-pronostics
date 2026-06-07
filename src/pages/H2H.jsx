import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { track } from '../services/tracker'
import Navigation from '../components/Navigation'
import { Avatar } from '../components/Avatar'
import { ArrowLeft } from 'lucide-react'

const formaterDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)', taille = 20 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

function H2H() {
  const [searchParams]              = useSearchParams()
  const navigate                    = useNavigate()
  const [moi, setMoi]               = useState(null)
  const [potes, setPotes]           = useState([])
  const [adversaire, setAdversaire] = useState(null)
  const [profilMoi, setProfilMoi]   = useState(null)
  const [matchs, setMatchs]         = useState([])
  const [bilan, setBilan]           = useState({ moi: 0, eux: 0, nul: 0 })
  const [bilanEcart, setBilanEcart] = useState({ moi: 0, eux: 0 })
  const [ecartsMap, setEcartsMap]   = useState({}) // match_id → { moi, eux }
  const [charg, setCharg]           = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      track(user?.id, 'page_view', '/h2h')
      setMoi(user.id)
      const { data: profil } = await supabase
        .from('profils').select('pseudo, avatar_url').eq('id', user.id).single()
      setProfilMoi(profil)
      const { data: membres } = await supabase
        .from('membres_groupe').select('groupe_id')
        .eq('user_id', user.id).eq('actif', true)
      if (!membres?.length) return
      const groupeIds = membres.map(m => m.groupe_id)
      const { data: potesBrut } = await supabase
        .from('membres_groupe')
        .select('user_id, profils(pseudo, avatar_url)')
        .in('groupe_id', groupeIds).eq('actif', true).neq('user_id', user.id)
      const map = new Map()
      potesBrut?.forEach(p => {
        if (!map.has(p.user_id)) map.set(p.user_id, { user_id: p.user_id, pseudo: p.profils?.pseudo, avatar_url: p.profils?.avatar_url })
      })
      const liste = [...map.values()].sort((a, b) => (a.pseudo || '').localeCompare(b.pseudo || ''))
      setPotes(liste)
      const user2 = searchParams.get('user2')
      if (user2) {
        const trouve = liste.find(p => p.user_id === user2)
        if (trouve) setAdversaire(trouve)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!moi || !adversaire) return
    chargerH2H()
  }, [adversaire, moi])

  const chargerH2H = async () => {
    setCharg(true)
    const { data: pronosMoi } = await supabase
      .from('pronos')
      .select('match_id, equipe_choisie, resultat, matchs(espn_id, date_match, equipe_domicile, equipe_exterieur)')
      .eq('user_id', moi).neq('resultat', 'en_attente')
    const { data: pronosEux } = await supabase
      .from('pronos').select('match_id, equipe_choisie, resultat')
      .eq('user_id', adversaire.user_id).neq('resultat', 'en_attente')
    const indexEux = {}
    pronosEux?.forEach(p => { indexEux[p.match_id] = p })
    const communs = (pronosMoi || [])
      .filter(p => indexEux[p.match_id])
      .map(p => ({
        match_id:     p.match_id, espn_id: p.matchs?.espn_id,
        date_match:   p.matchs?.date_match, dom: p.matchs?.equipe_domicile, ext: p.matchs?.equipe_exterieur,
        pick_moi:     p.equipe_choisie, resultat_moi: p.resultat,
        pick_eux:     indexEux[p.match_id].equipe_choisie, resultat_eux: indexEux[p.match_id].resultat,
      }))
      .sort((a, b) => new Date(b.date_match) - new Date(a.date_match))
    setMatchs(communs)
    let moiW = 0, euxW = 0, nul = 0
    communs.forEach(m => {
      if (m.resultat_moi === 'correct' && m.resultat_eux === 'incorrect') moiW++
      else if (m.resultat_moi === 'incorrect' && m.resultat_eux === 'correct') euxW++
      else nul++
    })
    setBilan({ moi: moiW, eux: euxW, nul })

    // Charger pronos_ecart pour les matchs en commun
    const matchIds = communs.map(m => m.match_id).filter(Boolean)
    if (matchIds.length > 0) {
      const [{ data: ecartsMoi }, { data: ecartsEux }] = await Promise.all([
        supabase.from('pronos_ecart').select('match_id, fourchette_choisie, fourchette_reelle, correct')
          .eq('user_id', moi).in('match_id', matchIds),
        supabase.from('pronos_ecart').select('match_id, fourchette_choisie, fourchette_reelle, correct')
          .eq('user_id', adversaire.user_id).in('match_id', matchIds),
      ])
      const map = {}
      ecartsMoi?.forEach(e => { if (!map[e.match_id]) map[e.match_id] = {}; map[e.match_id].moi = e })
      ecartsEux?.forEach(e => { if (!map[e.match_id]) map[e.match_id] = {}; map[e.match_id].eux = e })
      setEcartsMap(map)

      const ecartMoiCorrects = ecartsMoi?.filter(e => e.correct === true).length || 0
      const ecartEuxCorrects = ecartsEux?.filter(e => e.correct === true).length || 0
      setBilanEcart({ moi: ecartMoiCorrects, eux: ecartEuxCorrects })
    }

    setCharg(false)
  }

  const couleur = (r) => r === 'correct' ? 'var(--success)' : 'var(--danger)'

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
          <button onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', borderWidth: 0, color: 'var(--text-3)',
            fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12,
          }}>
            <ArrowLeft size={15} /> Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>1</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 36, color: 'var(--accent)', letterSpacing: '0.02em', lineHeight: 1 }}>v1</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Compare tes pronos face à un pote.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 32 }}>

          {/* ── Picker adversaire ── */}
          <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--accent)' }}>
            <TitreSection mot1="TON" mot2="ADVERSAIRE" />
            <select
              value={adversaire?.user_id || ''}
              onChange={e => setAdversaire(potes.find(p => p.user_id === e.target.value) || null)}
              style={{
                width: '100%', background: 'var(--bg-0)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-1)',
                fontSize: 13, padding: '10px 12px', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="">— Choisir un pote —</option>
              {potes.map(p => (
                <option key={p.user_id} value={p.user_id}>{p.pseudo || 'Inconnu'}</option>
              ))}
            </select>
          </div>

          {charg && <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '16px' }}>Chargement…</p>}

          {/* ── Bilan ── */}
          {adversaire && !charg && matchs.length > 0 && (
            <div style={{ background: 'var(--bg-0)', padding: '16px 16px 20px', borderLeft: '3px solid var(--gold)' }}>
              <TitreSection mot1="BILAN" couleur2="var(--gold)" />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 14 }}>
                {/* Moi */}
                <div style={{ textAlign: 'center' }}>
                  <Avatar url={profilMoi?.avatar_url} pseudo={profilMoi?.pseudo} taille={44} fontSize={15} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginTop: 6 }}>{profilMoi?.pseudo}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, color: bilan.moi >= bilan.eux ? 'var(--success)' : 'var(--text-3)', lineHeight: 1, marginTop: 4 }}>
                    {bilan.moi}
                  </div>
                </div>

                {/* VS */}
                <div style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-3)', lineHeight: 1 }}>VS</div>
                  {bilan.nul > 0 && <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{bilan.nul} nul{bilan.nul > 1 ? 's' : ''}</div>}
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{matchs.length} matchs</div>
                </div>

                {/* Adversaire */}
                <div style={{ textAlign: 'center' }}>
                  <Avatar url={adversaire.avatar_url} pseudo={adversaire.pseudo} taille={44} fontSize={15} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginTop: 6 }}>{adversaire.pseudo}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, color: bilan.eux > bilan.moi ? 'var(--success)' : 'var(--text-3)', lineHeight: 1, marginTop: 4 }}>
                    {bilan.eux}
                  </div>
                </div>
              </div>

              {/* Verdict */}
              <div style={{
                padding: '10px 14px',
                background: bilan.moi > bilan.eux ? 'rgba(34,197,94,0.06)' : bilan.eux > bilan.moi ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: bilan.moi > bilan.eux ? 'rgba(34,197,94,0.2)' : bilan.eux > bilan.moi ? 'rgba(239,68,68,0.2)' : 'var(--border)',
                borderLeft: `3px solid ${bilan.moi > bilan.eux ? 'var(--success)' : bilan.eux > bilan.moi ? 'var(--danger)' : 'var(--border)'}`,
                textAlign: 'center', fontSize: 13, fontWeight: 700,
                color: bilan.moi > bilan.eux ? 'var(--success)' : bilan.eux > bilan.moi ? 'var(--danger)' : 'var(--text-2)',
              }}>
                {bilan.moi > bilan.eux && `🏆 Tu mènes ${bilan.moi} - ${bilan.eux}`}
                {bilan.eux > bilan.moi && `😤 ${adversaire.pseudo} mène ${bilan.eux} - ${bilan.moi}`}
                {bilan.moi === bilan.eux && `🤝 Égalité parfaite`}
              </div>

              {/* Fourchettes bilan */}
              {(bilanEcart.moi > 0 || bilanEcart.eux > 0) && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-2)', borderLeft: '3px solid var(--gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '0.05em' }}>FOURCHETTES CORRECTES</span>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: bilanEcart.moi >= bilanEcart.eux ? 'var(--gold)' : 'var(--text-3)' }}>
                      {bilanEcart.moi}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>toi</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>vs</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: bilanEcart.eux > bilanEcart.moi ? 'var(--gold)' : 'var(--text-3)' }}>
                      {bilanEcart.eux}<span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>{adversaire.pseudo}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Match par match ── */}
          {adversaire && !charg && matchs.length > 0 && (
            <div style={{ background: 'var(--bg-1)', padding: '16px 16px 20px', borderLeft: '3px solid var(--border-2)' }}>
              <TitreSection mot1="MATCH PAR" mot2="MATCH" couleur2="var(--text-2)" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {matchs.map((m, i) => {
                  const FL = { serre: 'Serré', modere: 'Modéré', net: 'Net', large: 'Large', domination: 'Domination' }
                  const ecart = ecartsMap[m.match_id]
                  const ecartMoi = ecart?.moi
                  const ecartEux = ecart?.eux
                  const moiGagne = m.resultat_moi === 'correct' && m.resultat_eux === 'incorrect'
                  const euxGagne = m.resultat_eux === 'correct' && m.resultat_moi === 'incorrect'
                  return (
                    <div
                      key={i}
                      onClick={() => m.espn_id && navigate(`/match/${m.espn_id}`)}
                      style={{
                        padding: '10px 12px',
                        background: moiGagne ? 'rgba(34,197,94,0.04)' : euxGagne ? 'rgba(239,68,68,0.04)' : 'transparent',
                        borderLeft: `3px solid ${moiGagne ? 'var(--success)' : euxGagne ? 'var(--danger)' : 'var(--border)'}`,
                        borderBottom: '1px solid var(--border)',
                        marginLeft: -16,
                        cursor: m.espn_id ? 'pointer' : 'default',
                      }}
                    >
                      {/* Match */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span>{m.ext} @ {m.dom}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{formaterDate(m.date_match)}</span>
                      </div>
                      {/* Picks */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <div style={{
                          padding: '5px 8px',
                          background: m.resultat_moi === 'correct' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          borderWidth: 1, borderStyle: 'solid',
                          borderColor: m.resultat_moi === 'correct' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          fontSize: 11,
                        }}>
                          <span style={{ color: 'var(--text-3)' }}>{profilMoi?.pseudo} </span>
                          <span style={{ fontWeight: 700, color: couleur(m.resultat_moi) }}>{m.pick_moi}</span>
                          <span style={{ marginLeft: 4 }}>{m.resultat_moi === 'correct' ? '✅' : '❌'}</span>
                        </div>
                        <div style={{
                          padding: '5px 8px',
                          background: m.resultat_eux === 'correct' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                          borderWidth: 1, borderStyle: 'solid',
                          borderColor: m.resultat_eux === 'correct' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          fontSize: 11,
                        }}>
                          <span style={{ color: 'var(--text-3)' }}>{adversaire.pseudo} </span>
                          <span style={{ fontWeight: 700, color: couleur(m.resultat_eux) }}>{m.pick_eux}</span>
                          <span style={{ marginLeft: 4 }}>{m.resultat_eux === 'correct' ? '✅' : '❌'}</span>
                        </div>
                      </div>

                      {/* Fourchettes si posées */}
                      {(ecartMoi || ecartEux) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', padding: '4px 8px', background: 'var(--bg-2)' }}>
                            {ecartMoi
                              ? <>🎯 <span style={{ fontWeight: 600, color: ecartMoi.fourchette_reelle == null ? 'var(--gold)' : ecartMoi.correct ? 'var(--success)' : 'var(--danger)' }}>
                                  {FL[ecartMoi.fourchette_choisie]}
                                </span>
                                {ecartMoi.fourchette_reelle != null && (ecartMoi.correct ? ' ✓' : ' ✗')}
                              </>
                              : <span style={{ color: 'var(--border-2)' }}>— pas de fourchette</span>
                            }
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', padding: '4px 8px', background: 'var(--bg-2)' }}>
                            {ecartEux
                              ? <>🎯 <span style={{ fontWeight: 600, color: ecartEux.fourchette_reelle == null ? 'var(--gold)' : ecartEux.correct ? 'var(--success)' : 'var(--danger)' }}>
                                  {FL[ecartEux.fourchette_choisie]}
                                </span>
                                {ecartEux.fourchette_reelle != null && (ecartEux.correct ? ' ✓' : ' ✗')}
                              </>
                              : <span style={{ color: 'var(--border-2)' }}>— pas de fourchette</span>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {adversaire && !charg && matchs.length === 0 && (
            <div style={{ background: 'var(--bg-1)', padding: '16px', borderLeft: '3px solid var(--border)' }}>
              <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>
                Aucun match en commun avec {adversaire.pseudo} pour l'instant.
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

export default H2H