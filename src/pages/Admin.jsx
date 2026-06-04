import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Trash2, Plus, Pencil, Check, X, Eye, EyeOff } from 'lucide-react'

const ADMIN_ID = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'

/* ── Constantes ── */
const TYPE_TAGS = [
  { value: 'preseason',     label: 'Pré-saison' },
  { value: 'regular',       label: 'Saison régulière' },
  { value: 'nbacup',        label: 'NBA Cup' },
  { value: 'allstar',       label: 'All-Star' },
  { value: 'playin',        label: 'Play-In' },
  { value: 'playoffs',      label: 'Playoffs' },
  { value: 'finals',        label: 'NBA Finals' },
  { value: 'international', label: 'Matchs internationaux' },
  { value: 'summer_league', label: 'Summer League' },
]

const COULEURS_DEFAUT = {
  preseason:     '#6366f1',
  regular:       '#9090b0',
  nbacup:        '#f97316',
  allstar:       '#f59e0b',
  playin:        '#22c55e',
  playoffs:      '#ef4444',
  finals:        '#e11d48',
  international: '#8b5cf6',
  summer_league: '#06b6d4',
}

const FORM_VIDE = {
  saison: '2025-26',
  type_tag: 'regular',
  label_fr: '',
  couleur: '#6366f1',
  date_debut: '',
  date_fin: '',
  espn_season_type: '',
  espn_notes_pattern: '',
  espn_comp_type: '',
  actif: true,
  ordre: 0,
}

/* ── Composant titre bicolore ── */
const Titre = ({ mot1, mot2, couleur2 = 'var(--danger)', taille = 36 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

/* ── Badge phase ── */
const BadgePhase = ({ phase }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    background: phase.couleur + '22',
    color: phase.couleur,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: phase.couleur + '55',
    textTransform: 'uppercase',
  }}>
    {phase.label_fr}
  </span>
)

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
function Admin() {
  const navigate = useNavigate()
  const [onglet, setOnglet] = useState('moderation')
  const [autrise, setAutorise] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.id !== ADMIN_ID) navigate('/accueil')
      else setAutorise(true)
    })
  }, [])

  if (!autrise) return null

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--danger)' }} />
          <Titre mot1="ADMIN" mot2="🛡️" />
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Zone d'administration</p>
        </div>

        {/* ── Onglets ── */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px 16px' }}>
          {[
            { key: 'moderation', label: 'Modération' },
            { key: 'calendrier', label: 'Calendrier saison' },
          ].map(o => (
            <button
              key={o.key}
              onClick={() => setOnglet(o.key)}
              style={{
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                borderWidth: 1,
                borderStyle: 'solid',
                cursor: 'pointer',
                background: onglet === o.key ? 'var(--danger)' : 'transparent',
                color: onglet === o.key ? '#fff' : 'var(--text-3)',
                borderColor: onglet === o.key ? 'var(--danger)' : 'var(--border)',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* ── Contenu ── */}
        {onglet === 'moderation' && <OngletModeration />}
        {onglet === 'calendrier' && <OngletCalendrier />}

      </main>
    </>
  )
}

/* ══════════════════════════════════════════
   ONGLET MODÉRATION
══════════════════════════════════════════ */
function OngletModeration() {
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)

  const charger = async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, contenu, cree_le, user_id, groupe_id, profils(pseudo), groupes(nom)')
      .order('cree_le', { ascending: false })
      .limit(100)
    setMessages(data || [])
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  const supprimer = async (id) => {
    await supabase.from('messages').delete().eq('id', id)
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const formaterDate = (str) => {
    const d = new Date(str + 'Z')
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ background: 'var(--bg-1)', padding: '16px 16px 24px', borderLeft: '3px solid var(--danger)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>TOUS LES</span>
        <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--danger)', letterSpacing: '0.02em' }}>MESSAGES</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 4 }}>({messages.length})</span>
      </div>

      {chargement && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement…</p>}
      {!chargement && messages.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Aucun message.</p>}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px',
            borderBottom: '1px solid var(--border)',
            borderLeft: '3px solid var(--border-2)',
            marginLeft: -16,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {msg.groupes?.nom || '—'}
              </span>
              <div style={{ marginTop: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>
                  {msg.profils?.pseudo || '—'}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{msg.contenu}</span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, display: 'block' }}>
                {formaterDate(msg.cree_le)}
              </span>
            </div>
            <button
              onClick={() => supprimer(msg.id)}
              style={{ background: 'none', borderWidth: 0, color: 'var(--danger)', cursor: 'pointer', padding: 4, flexShrink: 0, opacity: 0.5 }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   ONGLET CALENDRIER SAISON
══════════════════════════════════════════ */
function OngletCalendrier() {
  const [phases, setPhases] = useState([])
  const [chargement, setChargement] = useState(true)
  const [filtreActif, setFiltreActif] = useState('tous')
  const [filtreSaison, setFiltreSaison] = useState('2025-26')
  const [formulaire, setFormulaire] = useState(null) // null = fermé, {} = nouveau, {id,...} = édition
  const [erreur, setErreur] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)

  const charger = async () => {
    setChargement(true)
    const { data } = await supabase
      .from('phases_saison')
      .select('*')
      .order('saison', { ascending: false })
      .order('ordre', { ascending: true })
    setPhases(data || [])
    setChargement(false)
  }

  useEffect(() => { charger() }, [])

  /* ── Filtres ── */
  const saisonsDispos = [...new Set(phases.map(p => p.saison))].sort().reverse()
  const phasesFiltrees = phases.filter(p => {
    if (p.saison !== filtreSaison) return false
    if (filtreActif === 'actif') return p.actif
    if (filtreActif === 'inactif') return !p.actif
    return true
  })

  /* ── Toggle actif ── */
  const toggleActif = async (phase) => {
    await supabase.from('phases_saison').update({ actif: !phase.actif }).eq('id', phase.id)
    setPhases(prev => prev.map(p => p.id === phase.id ? { ...p, actif: !p.actif } : p))
  }

  /* ── Supprimer ── */
  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette phase ?')) return
    await supabase.from('phases_saison').delete().eq('id', id)
    setPhases(prev => prev.filter(p => p.id !== id))
  }

  /* ── Ouvrir formulaire ── */
  const ouvrirNouveau = () => {
    setErreur('')
    setFormulaire({ ...FORM_VIDE })
  }

  const ouvrirEdition = (phase) => {
    setErreur('')
    setFormulaire({ ...phase })
  }

  const fermerFormulaire = () => { setFormulaire(null); setErreur('') }

  /* ── Champ formulaire change ── */
  const onChange = (champ, valeur) => {
    setFormulaire(prev => {
      const next = { ...prev, [champ]: valeur }
      // auto-remplir couleur et label si type_tag change et champs vides
      if (champ === 'type_tag') {
        if (!prev.couleur || prev.couleur === FORM_VIDE.couleur) {
          next.couleur = COULEURS_DEFAUT[valeur] || '#6366f1'
        }
        if (!prev.label_fr) {
          const tag = TYPE_TAGS.find(t => t.value === valeur)
          next.label_fr = tag?.label || ''
        }
      }
      return next
    })
  }

  /* ── Sauvegarder ── */
  const sauvegarder = async () => {
    setErreur('')
    const { saison, type_tag, label_fr, couleur, date_debut, date_fin, ordre } = formulaire
    if (!saison || !type_tag || !label_fr || !couleur || !date_debut || !date_fin) {
      setErreur('Tous les champs obligatoires (*) doivent être remplis.')
      return
    }
    if (date_fin < date_debut) {
      setErreur('La date de fin doit être après la date de début.')
      return
    }
    setSauvegarde(true)
    const payload = {
      saison,
      type_tag,
      label_fr,
      couleur,
      date_debut,
      date_fin,
      espn_season_type: formulaire.espn_season_type ? parseInt(formulaire.espn_season_type) : null,
      espn_notes_pattern: formulaire.espn_notes_pattern || null,
      espn_comp_type: formulaire.espn_comp_type || null,
      actif: formulaire.actif,
      ordre: parseInt(ordre) || 0,
    }
    if (formulaire.id) {
      await supabase.from('phases_saison').update(payload).eq('id', formulaire.id)
    } else {
      await supabase.from('phases_saison').insert(payload)
    }
    await charger()
    setSauvegarde(false)
    fermerFormulaire()
  }

  /* ── Render ── */
  return (
    <div style={{ padding: '0 16px 32px' }}>

      {/* Titre + bouton ajouter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>PHASES</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--accent)', letterSpacing: '0.02em' }}>SAISON</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
            Définit les types de matchs ESPN et les filtres du calendrier
          </p>
        </div>
        <button
          onClick={ouvrirNouveau}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', fontSize: 12, fontWeight: 600,
            background: 'var(--accent)', color: '#fff',
            borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Sélecteur saison */}
        <select
          value={filtreSaison}
          onChange={e => setFiltreSaison(e.target.value)}
          style={S.select}
        >
          {saisonsDispos.length === 0 && <option value="2025-26">2025-26</option>}
          {saisonsDispos.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Filtre actif */}
        {[
          { key: 'tous', label: 'Toutes' },
          { key: 'actif', label: 'Actives' },
          { key: 'inactif', label: 'Inactives' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltreActif(f.key)}
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500,
              borderRadius: 'var(--radius-sm)', borderWidth: 1, borderStyle: 'solid',
              cursor: 'pointer',
              background: filtreActif === f.key ? 'var(--accent-dim)' : 'transparent',
              color: filtreActif === f.key ? 'var(--accent)' : 'var(--text-3)',
              borderColor: filtreActif === f.key ? 'var(--accent-border)' : 'var(--border)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {chargement && <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Chargement…</p>}
      {!chargement && phasesFiltrees.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Aucune phase pour cette saison. Clique sur "Ajouter" pour commencer.
        </p>
      )}

      {!chargement && phasesFiltrees.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {phasesFiltrees.map(phase => (
            <LignePhase
              key={phase.id}
              phase={phase}
              onEdit={() => ouvrirEdition(phase)}
              onToggle={() => toggleActif(phase)}
              onDelete={() => supprimer(phase.id)}
            />
          ))}
        </div>
      )}

      {/* Résumé ESPN */}
      {!chargement && phasesFiltrees.length > 0 && (
        <div style={{ marginTop: 24, padding: '14px 16px', background: 'var(--bg-1)', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 16, color: 'var(--text-1)', letterSpacing: '0.02em' }}>DÉTECTION</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 16, color: 'var(--accent)', letterSpacing: '0.02em' }}>ESPN</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {phasesFiltrees.map(phase => (
              <div key={phase.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <BadgePhase phase={phase} />
                <span style={{ color: 'var(--text-3)' }}>
                  {phase.espn_season_type ? `type=${phase.espn_season_type}` : '—'}
                  {phase.espn_notes_pattern ? ` · notes="${phase.espn_notes_pattern}"` : ''}
                  {phase.espn_comp_type ? ` · comp_type="${phase.espn_comp_type}"` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire modal */}
      {formulaire && (
        <Formulaire
          formulaire={formulaire}
          onChange={onChange}
          onSave={sauvegarder}
          onClose={fermerFormulaire}
          erreur={erreur}
          sauvegarde={sauvegarde}
        />
      )}
    </div>
  )
}

/* ── Ligne phase ── */
function LignePhase({ phase, onEdit, onToggle, onDelete }) {
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px',
      background: 'var(--bg-1)',
      borderLeft: `3px solid ${phase.couleur}`,
      opacity: phase.actif ? 1 : 0.45,
    }}>
      {/* Couleur dot */}
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: phase.couleur, flexShrink: 0 }} />

      {/* Label + badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{phase.label_fr}</span>
          <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace', background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 3 }}>
            {phase.type_tag}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {formatDate(phase.date_debut)} → {formatDate(phase.date_fin)}
        </span>
      </div>

      {/* Ordre */}
      <span style={{ fontSize: 10, color: 'var(--text-3)', minWidth: 20, textAlign: 'center' }}>#{phase.ordre}</span>

      {/* Actions */}
      <button onClick={onToggle} title={phase.actif ? 'Désactiver' : 'Activer'} style={S.iconBtn}>
        {phase.actif ? <Eye size={14} color="var(--success)" /> : <EyeOff size={14} color="var(--text-3)" />}
      </button>
      <button onClick={onEdit} title="Éditer" style={S.iconBtn}>
        <Pencil size={14} color="var(--accent)" />
      </button>
      <button onClick={onDelete} title="Supprimer" style={S.iconBtn}>
        <Trash2 size={14} color="var(--danger)" />
      </button>
    </div>
  )
}

/* ── Formulaire ajout/édition ── */
function Formulaire({ formulaire, onChange, onSave, onClose, erreur, sauvegarde }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: '100%', maxWidth: 560,
        background: 'var(--bg-1)',
        borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
        padding: '20px 16px 32px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--text-1)', letterSpacing: '0.02em' }}>
              {formulaire.id ? 'ÉDITER' : 'NOUVELLE'}
            </span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 20, color: 'var(--accent)', letterSpacing: '0.02em' }}>
              PHASE
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', borderWidth: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Champs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Saison + Ordre */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
            <Champ label="Saison *" aide='ex: "2025-26"'>
              <input style={S.input} value={formulaire.saison} onChange={e => onChange('saison', e.target.value)} placeholder="2025-26" />
            </Champ>
            <Champ label="Ordre *">
              <input style={S.input} type="number" value={formulaire.ordre} onChange={e => onChange('ordre', e.target.value)} placeholder="0" />
            </Champ>
          </div>

          {/* Type tag */}
          <Champ label="Type *">
            <select style={S.input} value={formulaire.type_tag} onChange={e => onChange('type_tag', e.target.value)}>
              {TYPE_TAGS.map(t => <option key={t.value} value={t.value}>{t.label} ({t.value})</option>)}
            </select>
          </Champ>

          {/* Label FR + Couleur */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
            <Champ label="Label français *">
              <input style={S.input} value={formulaire.label_fr} onChange={e => onChange('label_fr', e.target.value)} placeholder="NBA Cup" />
            </Champ>
            <Champ label="Couleur *">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="color" value={formulaire.couleur} onChange={e => onChange('couleur', e.target.value)}
                  style={{ width: 36, height: 32, padding: 2, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-2)', cursor: 'pointer' }} />
                <input style={{ ...S.input, flex: 1, fontFamily: 'monospace', fontSize: 11 }} value={formulaire.couleur} onChange={e => onChange('couleur', e.target.value)} />
              </div>
            </Champ>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Champ label="Date début *">
              <input style={S.input} type="date" value={formulaire.date_debut} onChange={e => onChange('date_debut', e.target.value)} />
            </Champ>
            <Champ label="Date fin *">
              <input style={S.input} type="date" value={formulaire.date_fin} onChange={e => onChange('date_fin', e.target.value)} />
            </Champ>
          </div>

          {/* ESPN */}
          <div style={{ padding: '10px 12px', background: 'var(--bg-2)', borderLeft: '3px solid var(--accent)' }}>
            <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Détection ESPN
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8 }}>
              <Champ label="season.type" aide="1=pre 2=reg 3=post 5=playin">
                <input style={S.input} type="number" value={formulaire.espn_season_type || ''} onChange={e => onChange('espn_season_type', e.target.value)} placeholder="2" />
              </Champ>
              <Champ label="notes pattern" aide='ex: "NBA Cup"'>
                <input style={S.input} value={formulaire.espn_notes_pattern || ''} onChange={e => onChange('espn_notes_pattern', e.target.value)} placeholder="NBA Cup" />
              </Champ>
              <Champ label="comp_type" aide='ex: "ALLSTAR"'>
                <input style={S.input} value={formulaire.espn_comp_type || ''} onChange={e => onChange('espn_comp_type', e.target.value)} placeholder="ALLSTAR" />
              </Champ>
            </div>
          </div>

          {/* Actif */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="actif" checked={formulaire.actif} onChange={e => onChange('actif', e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }} />
            <label htmlFor="actif" style={{ fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
              Visible dans les filtres du calendrier
            </label>
          </div>

          {/* Erreur */}
          {erreur && (
            <p style={{ fontSize: 12, color: 'var(--danger)', background: 'var(--danger-dim)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', margin: 0 }}>
              {erreur}
            </p>
          )}

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, background: 'transparent', color: 'var(--text-3)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={onSave} disabled={sauvegarde} style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', borderWidth: 0, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Check size={14} /> {sauvegarde ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Champ wrapper ── */
function Champ({ label, aide, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
        {aide && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 4, opacity: 0.7 }}>— {aide}</span>}
      </label>
      {children}
    </div>
  )
}

/* ── Styles partagés ── */
const S = {
  select: {
    background: 'var(--bg-2)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-2)', fontSize: 12,
    padding: '6px 8px', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  input: {
    background: 'var(--bg-2)',
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)', fontSize: 12,
    padding: '7px 10px',
    fontFamily: 'var(--font-body)',
    width: '100%',
    boxSizing: 'border-box',
  },
  iconBtn: {
    background: 'none', borderWidth: 0, cursor: 'pointer', padding: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
  },
}

export default Admin
