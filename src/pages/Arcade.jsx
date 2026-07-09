import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import JoueurArcade from '../components/JoueurArcade'
import { track } from '../services/tracker'
import {
  recupererDifficulte,
  recupererEtatJour,
  enregistrerTir,
  recupererRecordPersonnel,
  recupererRecordAbsoluGlobal,
  recupererRecordsSemaine,
  verifierRecordsApresPanier,
} from '../services/arcade'
import PopupOuvertureBooster from '../components/PopupOuvertureBooster'
import { marquerCartesRevelees } from '../services/cartes'
import { Trophy, Flame, Crown } from 'lucide-react'

const GROUPE_GENERAL_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

// Titre section — identique au composant standard de l'app (copié localement, cf règle socle)
const TitreSection = ({ label, couleur = 'var(--orange)' }) => (
  <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', position: 'relative', height: 'clamp(38px, 6vw, 46px)', overflow: 'hidden' }}>
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 500 46">
      <polygon points="0,0 260,0 240,46 0,46" fill={couleur} />
      <polygon points="248,0 274,0 254,46 228,46" fill={couleur} />
      <polygon points="282,0 304,0 284,46 262,46" fill={couleur} />
      <polygon points="312,0 330,0 310,46 292,46" fill={couleur} />
      <polygon points="338,0 353,0 333,46 318,46" fill={couleur} />
      <polygon points="361,0 374,0 354,46 341,46" fill={couleur} />
      <polygon points="382,0 393,0 373,46 362,46" fill={couleur} />
      <polygon points="401,0 410,0 390,46 381,46" fill={couleur} />
      <polygon points="418,0 426,0 406,46 398,46" fill={couleur} />
    </svg>
    <span style={{
      position: 'absolute', top: '50%', left: 16, transform: 'translateY(-46%)',
      fontFamily: "'Teko', system-ui, sans-serif", fontWeight: 700,
      fontSize: 'clamp(22px, 5vw, 36px)', color: '#fff',
      letterSpacing: '0.02em', lineHeight: 1, fontStyle: 'italic', zIndex: 1,
    }}>{label}</span>
  </div>
)

const SousTitre = ({ label, couleur = 'var(--text-3)' }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: couleur, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
    {label}
  </div>
)

const SousTitreGros = ({ label, couleur = 'var(--text-1)' }) => (
  <div style={{ fontFamily: 'var(--font-title)', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(20px, 4vw, 28px)', color: couleur, marginBottom: 4 }}>
    {label}
  </div>
)

// Récupère les potes (même pattern que genererEvenements d'Accueil.jsx)
async function recupererPotes(userId) {
  const { data: membres } = await supabase
    .from('membres_groupe')
    .select('groupe_id')
    .eq('user_id', userId)
    .eq('actif', true)
    .neq('groupe_id', GROUPE_GENERAL_ID)
  if (!membres?.length) return [userId]

  const groupeIds = membres.map(m => m.groupe_id)
  const { data: potes } = await supabase
    .from('membres_groupe')
    .select('user_id')
    .in('groupe_id', groupeIds)
    .eq('actif', true)
  const idsUniques = [...new Set((potes || []).map(p => p.user_id))]
  return idsUniques.length ? idsUniques : [userId]
}

function Arcade() {
  const [user, setUser] = useState(null)
  const [chargement, setChargement] = useState(true)

  const [difficulte, setDifficulte] = useState({ zonePct: 18, vitesse: 0.6 })
  const [etatJour, setEtatJour] = useState({ paniers: 0, fautes: 0, prochainTirNumero: 1, partieTerminee: false })
  const [record, setRecord] = useState(0)
  const [recordAbsoluGlobal, setRecordAbsoluGlobal] = useState(null)
  const [recordsSemaine, setRecordsSemaine] = useState([])
  const [boosterOuverture, setBoosterOuverture] = useState(null)
  const [enAttente, setEnAttente] = useState(false)
  const [banniereRecord, setBanniereRecord] = useState(null) // 'semaine' | 'absolu' | null

  const potesIdsRef = useRef([])
  // Seuils figés au début de la partie du jour — ne JAMAIS les remonter pendant la partie
  // (sinon le score qui grimpe à chaque panier dépasse à nouveau le seuil au panier suivant).
  const recordsAvantPartieRef = useRef({ semaine: 0, absolu: 0 })
  // Flags "déjà obtenu cette partie" — utilisés pour transformer le seuil en Infinity
  // (cf handleResultat) afin qu'un record déjà acquis devienne mathématiquement
  // imbattable pour le reste de la partie, donc plus aucun risque de redonner un booster.
  const recordsDejaBattusRef = useRef({ semaine: false, absolu: false })

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { setChargement(false); return }
      setUser(u)
      track(u.id, 'page_view', '/arcade')

      const potes = await recupererPotes(u.id)
      potesIdsRef.current = potes

      const [etat, rec, recAbsoluGlobal, recsSemaine] = await Promise.all([
        recupererEtatJour(u.id),
        recupererRecordPersonnel(u.id),
        recupererRecordAbsoluGlobal(potes),
        recupererRecordsSemaine(potes),
      ])

      setDifficulte(recupererDifficulte(etat.paniers))
      setEtatJour(etat)
      setRecord(rec)
      setRecordAbsoluGlobal(recAbsoluGlobal)
      setRecordsSemaine(recsSemaine)

      const monRecordSemaineAvant = recsSemaine.find(r => r.user_id === u.id)?.paniers || 0
      recordsAvantPartieRef.current = {
        semaine: monRecordSemaineAvant,
        absolu: recAbsoluGlobal?.paniers || 0,
      }
      recordsDejaBattusRef.current = { semaine: false, absolu: false }

      setChargement(false)
    }
    init()
  }, [])

  const handleResultat = useCallback(async (resultat) => {
    if (!user || enAttente) return
    setEnAttente(true)

    const numero = etatJour.prochainTirNumero
    const res = await enregistrerTir(user.id, numero, resultat)
    track(user.id, 'clic_tir', '/arcade', { resultat, numero })

    const nouvelEtat = await recupererEtatJour(user.id)
    setEtatJour(nouvelEtat)

    let carteAAfficher = res?.carteObtenue ? [res.carteObtenue] : null

    if (resultat === 'panier') {
      const nouveauRecord = await recupererRecordPersonnel(user.id)
      setRecord(nouveauRecord)
      setDifficulte(recupererDifficulte(nouvelEtat.paniers))

      // Vérifie les records à CHAQUE panier (pas seulement en fin de partie) —
      // sinon un joueur qui bat un record puis arrête sans faire sa 3e faute
      // ne recevait jamais son booster.
      const { semaine, absolu } = recordsAvantPartieRef.current
      const dejaAbsolu  = recordsDejaBattusRef.current.absolu
      const dejaSemaine = recordsDejaBattusRef.current.semaine

      // Seuil Infinity = mathématiquement imbattable. C'est CA qui empêche
      // verifierRecordsApresPanier de redonner un booster pour un record déjà
      // acquis cette partie — pas un masquage de l'affichage après coup
      // (verifierRecordsApresPanier distribue elle-même les cartes en interne,
      // donc il faut l'empêcher de détecter un "battu" à la source).
      const seuilSemaine = dejaSemaine ? Infinity : semaine
      const seuilAbsolu  = dejaAbsolu  ? Infinity : absolu

      let battuAbsolu = false
      let battuSemaine = false
      let boosters = []

      if (!dejaAbsolu || !dejaSemaine) {
        const verif = await verifierRecordsApresPanier(user.id, nouvelEtat.paniers, seuilSemaine, seuilAbsolu)
        battuAbsolu  = verif.battuAbsolu
        battuSemaine = verif.battuSemaine
        boosters = verif.boosters
      }

      if (battuAbsolu) {
        setBanniereRecord('absolu')
        track(user.id, 'record_battu', '/arcade', { type: 'absolu', paniers: nouvelEtat.paniers })
        // Battre l'absolu implique mécaniquement avoir battu la semaine.
        recordsDejaBattusRef.current = { semaine: true, absolu: true }
      } else if (battuSemaine) {
        setBanniereRecord('semaine')
        track(user.id, 'record_battu', '/arcade', { type: 'semaine', paniers: nouvelEtat.paniers })
        recordsDejaBattusRef.current.semaine = true
      }

      if (boosters.length) {
        carteAAfficher = [...(carteAAfficher || []), ...boosters]
      }

      if (battuAbsolu || battuSemaine) {
        const [recAbsoluGlobal, recsSemaine] = await Promise.all([
          recupererRecordAbsoluGlobal(potesIdsRef.current),
          recupererRecordsSemaine(potesIdsRef.current),
        ])
        setRecordAbsoluGlobal(recAbsoluGlobal)
        setRecordsSemaine(recsSemaine)
      }
    }

    if (carteAAfficher?.length) setBoosterOuverture(carteAAfficher)

    setEnAttente(false)
  }, [user, etatJour, enAttente])

  if (chargement) {
    return (
      <>
        <Navigation />
        <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '4rem 0' }}>Chargement…</p>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '4rem 0' }}>Connecte-toi pour accéder à l'arcade.</p>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main style={{ paddingBottom: 60 }}>

        <div style={{ marginTop: 20 }}>
          <TitreSection label="ARCADE" couleur="var(--orange)" />
        </div>

        <div style={{ padding: '24px 16px 0' }}>
          <SousTitreGros label="Lancer franc" couleur="var(--orange)" />
          <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, margin: '0 0 16px' }}>
            Enchaîne les paniers sans rater 3 fois. Chaque panier vaut <strong style={{ color: 'var(--text-2)' }}>+5 XP</strong>, et une carte tombe tous les 5 paniers.
            Bats le record de la semaine ou le record absolu pour décrocher un booster de 3 cartes.
          </p>

          {banniereRecord && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 14,
              background: banniereRecord === 'absolu' ? 'var(--gold-dim)' : 'var(--accent-dim)',
              border: `1px solid ${banniereRecord === 'absolu' ? 'var(--gold)' : 'var(--accent-border)'}`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <Crown size={16} strokeWidth={2} color={banniereRecord === 'absolu' ? 'var(--gold)' : 'var(--accent)'} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>
                {banniereRecord === 'absolu' ? 'Nouveau record absolu ! Booster débloqué.' : 'Nouveau record de la semaine ! Booster débloqué.'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--gold)' }}>{etatJour.paniers}</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 2 }}>PANIERS AUJOURD'HUI</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: etatJour.fautes >= 3 ? 'var(--danger)' : 'var(--text-1)' }}>{etatJour.fautes}/3</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 2 }}>FAUTES</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: 'var(--accent)' }}>{record}</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', marginTop: 2 }}>MON RECORD</div>
            </div>
          </div>

          {etatJour.partieTerminee ? (
            <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderTop: '3px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '24px 20px', textAlign: 'center' }}>
              <Flame size={28} strokeWidth={1.5} color="var(--danger)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Partie terminée pour aujourd'hui</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{etatJour.paniers} paniers marqués — reviens demain !</div>
            </div>
          ) : (
            <JoueurArcade
              zonePct={difficulte.zonePct}
              vitesse={difficulte.vitesse}
              onResultat={handleResultat}
              verrouille={enAttente}
            />
          )}
        </div>

        {recordAbsoluGlobal && (
          <div style={{ padding: '28px 16px 0' }}>
            <SousTitre label="Record depuis toujours" couleur="var(--gold)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--gold-dim)', border: '1px solid var(--gold)', borderRadius: 'var(--radius-sm)' }}>
              <Crown size={16} strokeWidth={2} color="var(--gold)" />
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{recordAbsoluGlobal.pseudo}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--gold)' }}>{recordAbsoluGlobal.paniers}</div>
            </div>
          </div>
        )}

        <div style={{ padding: '20px 16px 0' }}>
          <SousTitre label="Record de la semaine" couleur="var(--accent)" />
          {recordsSemaine.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Pas encore de scores cette semaine.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recordsSemaine.map((c, i) => (
                <div key={c.user_id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: c.user_id === user.id ? 'var(--accent-dim)' : 'var(--bg-1)',
                  border: '1px solid', borderColor: c.user_id === user.id ? 'var(--accent-border)' : 'var(--border)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <div style={{ width: 22, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: i === 0 ? 'var(--gold)' : 'var(--text-3)' }}>
                    {i === 0 ? <Trophy size={14} strokeWidth={2} color="var(--gold)" /> : i + 1}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{c.pseudo}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-1)' }}>{c.paniers}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {boosterOuverture && (
        <PopupOuvertureBooster
          cartes={boosterOuverture}
          onFermer={() => {
            setBoosterOuverture(null)
            setBanniereRecord(null)
            marquerCartesRevelees(user.id).catch(() => {})
          }}
        />
      )}
    </>
  )
}

export default Arcade
