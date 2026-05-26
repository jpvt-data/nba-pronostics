import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { Camera, Check, X } from 'lucide-react'

const couleurAvatar = (pseudo) => {
  const couleurs = ['#6366f1','#f97316','#22c55e','#ef4444','#a855f7','#06b6d4','#f59e0b','#ec4899']
  const idx = (pseudo?.charCodeAt(0) || 0) % couleurs.length
  return couleurs[idx]
}

export function Avatar({ url, pseudo, taille = 40, fontSize = 14 }) {
  if (url) return (
    <img src={url} alt={pseudo} style={{
      width: taille, height: taille, borderRadius: '50%',
      objectFit: 'cover', flexShrink: 0, background: 'var(--bg-2)',
    }} />
  )
  return (
    <div style={{
      width: taille, height: taille, borderRadius: '50%',
      background: couleurAvatar(pseudo),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      {(pseudo || '?').slice(0, 2).toUpperCase()}
    </div>
  )
}

const LabelSection = ({ children }) => (
  <h3 style={{
    display: 'inline-block',
    background: 'linear-gradient(90deg, var(--accent), var(--orange))',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    letterSpacing: '0.1em', fontSize: 13, fontWeight: 700,
  }}>{children}</h3>
)

const BanniereImage = ({ url, hauteur = 110 }) => (
  <div style={{
    margin: '20px 0 0', height: hauteur,
    backgroundImage: `linear-gradient(to right, rgba(13,13,18,0.75), rgba(13,13,18,0.35), rgba(13,13,18,0.75)), url(${url})`,
    backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(99,102,241,0.2)',
    borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(99,102,241,0.2)',
  }} />
)

const BLOC = {
  borderRadius: 'var(--radius-lg)',
  background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
  borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
  padding: '16px',
}

function ChampEditable({ label, valeur, onSave, multiline = false, placeholder = '' }) {
  const [edit, setEdit]  = useState(false)
  const [val, setVal]    = useState(valeur || '')
  const [saving, setSav] = useState(false)
  const ref = useRef()

  useEffect(() => { if (edit) ref.current?.focus() }, [edit])
  useEffect(() => { setVal(valeur || '') }, [valeur])

  const sauver = async () => {
    setSav(true)
    await onSave(val.trim())
    setSav(false)
    setEdit(false)
  }
  const annuler = () => { setVal(valeur || ''); setEdit(false) }

  if (edit) return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {multiline
        ? <textarea ref={ref} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} rows={3}
            style={{ width: '100%', background: 'var(--bg-0)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-1)', fontSize: 14, padding: '8px 10px', resize: 'vertical', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
        : <input ref={ref} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder}
            onKeyDown={e => { if (e.key === 'Enter') sauver(); if (e.key === 'Escape') annuler() }}
            style={{ width: '100%', background: 'var(--bg-0)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--accent-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-1)', fontSize: 14, padding: '8px 10px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} />
      }
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={sauver} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--accent)', borderWidth: 0, borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 14px', cursor: 'pointer' }}>
          <Check size={13} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button onClick={annuler} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>
          <X size={13} /> Annuler
        </button>
      </div>
    </div>
  )

  return (
    <div onClick={() => setEdit(true)} style={{ cursor: 'pointer' }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 14, color: val ? 'var(--text-1)' : 'var(--text-3)', padding: '8px 10px', borderWidth: 1, borderStyle: 'dashed', borderColor: 'transparent', borderRadius: 'var(--radius-sm)', transition: 'border-color 0.15s, background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-2)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
      >
        {val || <span style={{ fontStyle: 'italic', fontSize: 13 }}>{placeholder || 'Cliquer pour renseigner…'}</span>}
      </div>
    </div>
  )
}

function Profil() {
  const [profil, setProfil]        = useState(null)
  const [ligues, setLigues]        = useState([])
  const [stats, setStats]          = useState({ total: 0, corrects: 0, incorrects: 0 })
  const [charg, setCharg]          = useState(true)
  const [uploadEnCours, setUpload] = useState(false)
  const inputFichier               = useRef()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: p } = await supabase.from('profils').select('id, pseudo, avatar_url, description, cree_le').eq('id', user.id).single()
      setProfil(p)
      const { data: pronos } = await supabase.from('pronos').select('resultat').eq('user_id', user.id)
      const corrects   = pronos?.filter(p => p.resultat === 'correct').length || 0
      const incorrects = pronos?.filter(p => p.resultat === 'incorrect').length || 0
      setStats({ total: pronos?.length || 0, corrects, incorrects })
      const { data: membres } = await supabase.from('membres_groupe').select('points, groupes(id, nom, date_fin)').eq('user_id', user.id).eq('actif', true).order('points', { ascending: false })
      setLigues(membres || [])
      setCharg(false)
    }
    init()
  }, [])

  const sauverChamp = async (champ, valeur) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profils').update({ [champ]: valeur }).eq('id', user.id)
    setProfil(prev => ({ ...prev, [champ]: valeur }))
  }

  const changerAvatar = async (e) => {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    if (fichier.size > 2 * 1024 * 1024) { alert('Fichier trop lourd (max 2 Mo)'); return }
    setUpload(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = fichier.name.split('.').pop()
    const chemin = `${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(chemin, fichier, { upsert: true, contentType: fichier.type })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(chemin)
      const urlAvecCache = `${publicUrl}?t=${Date.now()}`
      await supabase.from('profils').update({ avatar_url: urlAvecCache }).eq('id', user.id)
      setProfil(prev => ({ ...prev, avatar_url: urlAvecCache }))
    }
    setUpload(false)
  }

  const taux = stats.corrects + stats.incorrects > 0
    ? Math.round(stats.corrects / (stats.corrects + stats.incorrects) * 100) : 0
  const estFermee = (date_fin) => date_fin && new Date(date_fin) < new Date()

  if (charg) return (
    <>
      <Navigation />
      <main style={{ flex: 1, padding: '20px 16px' }}>
        <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Chargement…</p>
      </main>
    </>
  )

  return (
    <>
      <Navigation />
      <main style={{ flex: 1 }}>

        {/* ── Bloc 1 : Header avatar — arrondi comme les autres ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ ...BLOC, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Avatar + bouton camera */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {profil?.avatar_url
                ? <img src={profil.avatar_url} alt={profil.pseudo} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-2)' }} />
                : <div style={{ width: 72, height: 72, borderRadius: '50%', background: couleurAvatar(profil?.pseudo), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>
                    {(profil?.pseudo || '?').slice(0, 2).toUpperCase()}
                  </div>
              }
              <button onClick={() => inputFichier.current?.click()} disabled={uploadEnCours}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                {uploadEnCours ? <span style={{ fontSize: 8, color: '#fff' }}>…</span> : <Camera size={11} color="#fff" />}
              </button>
              <input ref={inputFichier} type="file" accept="image/*" onChange={changerAvatar} style={{ display: 'none' }} />
            </div>
            {/* Pseudo + date */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-1)', marginBottom: 4 }}>
                {profil?.pseudo}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Membre depuis {new Date(profil?.cree_le).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bannière ballon ── */}
        <BanniereImage url="https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=800&q=60" />

        {/* ── Blocs éditables + stats + ligues ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 16px 24px' }}>

          {/* Infos éditables */}
          <div style={{ ...BLOC, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <LabelSection>Mon profil</LabelSection>
            <ChampEditable label="Pseudo" valeur={profil?.pseudo} placeholder="Ton pseudo" onSave={(v) => sauverChamp('pseudo', v)} />
            <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(99,102,241,0.1)' }} />
            <ChampEditable label="Ta bio" valeur={profil?.description} placeholder="Dis un truc sur toi… ton équipe favorite, ton niveau de trash talk, etc." multiline onSave={(v) => sauverChamp('description', v)} />
          </div>

          {/* Stats pronos */}
          <div style={{ ...BLOC }}>
            <LabelSection>Stats pronos</LabelSection>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
              {[
                { label: 'Total',    val: stats.total,      color: 'var(--text-1)'  },
                { label: 'Corrects', val: stats.corrects,   color: 'var(--success)' },
                { label: 'Ratés',    val: stats.incorrects, color: 'var(--danger)'  },
                { label: 'Réussite', val: `${taux}%`,       color: 'var(--accent)'  },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ligues */}
          {ligues.length > 0 && (
            <div style={{ ...BLOC }}>
              <LabelSection>Mes ligues</LabelSection>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {ligues.map((m, i) => {
                  const fermee = estFermee(m.groupes?.date_fin)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', opacity: fermee ? 0.6 : 1 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{m.groupes?.nom}</div>
                        {fermee && <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2 }}>Terminée</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>{m.points}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}

export default Profil
