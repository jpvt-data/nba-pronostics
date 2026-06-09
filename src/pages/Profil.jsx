import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Navigation from '../components/Navigation'
import { track } from '../services/tracker'
import { Camera, Check, X, Pencil } from 'lucide-react'
import { couleurAvatar } from '../components/Avatar'

// Charge les 30 équipes NBA depuis ESPN
const chargerEquipesESPN = async () => {
  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=40')
  const json = await res.json()
  return (json.sports?.[0]?.leagues?.[0]?.teams || [])
    .map(t => t.team)
    .filter(Boolean)
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(t => ({
      id: t.id,
      nom: t.displayName,
      abr: t.abbreviation,
      logo: t.logos?.[0]?.href || '',
    }))
}

const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)', taille = 24 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)

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
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
        fontSize: 14, color: val ? 'var(--text-1)' : 'var(--text-3)',
        padding: '8px 10px',
        borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
        background: 'var(--bg-0)',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <span style={{ flex: 1 }}>
          {val || <span style={{ fontStyle: 'italic', fontSize: 13 }}>{placeholder || 'Cliquer pour renseigner…'}</span>}
        </span>
        <Pencil size={12} color="var(--text-3)" style={{ flexShrink: 0, marginTop: 2 }} />
      </div>
    </div>
  )
}

function Profil() {
  const [profil, setProfil]              = useState(null)
  const [charg, setCharg]                = useState(true)
  const [uploadEnCours, setUpload]       = useState(false)
  const [equipesESPN, setEquipesESPN]    = useState([])
  const [selecteurOuvert, setSelecteur] = useState(false)
  const inputFichier                     = useRef()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      track(user.id, 'page_view', '/profil')
      const { data: p } = await supabase
        .from('profils')
        .select('id, pseudo, avatar_url, description, cree_le, equipes_favorites')
        .eq('id', user.id).single()
      setProfil(p)
      setCharg(false)
      // Charger les équipes ESPN en parallèle (non bloquant)
      chargerEquipesESPN().then(setEquipesESPN).catch(() => {})
    }
    init()
  }, [])

  const toggleEquipe = async (equipe) => {
    const { data: { user } } = await supabase.auth.getUser()
    const actuelles = profil?.equipes_favorites || []
    const dejaPresente = actuelles.find(e => e.id === equipe.id)
    let nouvelles
    if (dejaPresente) {
      // Retirer
      nouvelles = actuelles.filter(e => e.id !== equipe.id)
    } else {
      // Ajouter si < 3
      if (actuelles.length >= 3) return
      nouvelles = [...actuelles, equipe]
    }
    await supabase.from('profils').update({ equipes_favorites: nouvelles }).eq('id', user.id)
    setProfil(prev => ({ ...prev, equipes_favorites: nouvelles }))
  }

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
    const ext    = fichier.name.split('.').pop()
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

        {/* ── Header identité — bg-1 + barre accent ── */}
        <div style={{ background: 'var(--bg-1)', padding: '20px 16px 24px', borderLeft: '3px solid var(--accent)', marginBottom: 2 }}>
          <TitreSection mot1="MON" mot2="PROFIL" />

          {/* Avatar + infos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {profil?.avatar_url
                ? <img src={profil.avatar_url} alt={profil.pseudo} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-2)' }} />
                : <div style={{ width: 72, height: 72, borderRadius: '50%', background: couleurAvatar(profil?.pseudo), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff' }}>
                    {(profil?.pseudo || '?').slice(0, 2).toUpperCase()}
                  </div>
              }
              <button
                onClick={() => inputFichier.current?.click()}
                disabled={uploadEnCours}
                style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
              >
                {uploadEnCours ? <span style={{ fontSize: 8, color: '#fff' }}>…</span> : <Camera size={11} color="#fff" />}
              </button>
              <input ref={inputFichier} type="file" accept="image/*" onChange={changerAvatar} style={{ display: 'none' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: 28, color: 'var(--text-1)', lineHeight: 1.1, letterSpacing: '0.02em' }}>
                {profil?.pseudo}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                Membre depuis {new Date(profil?.cree_le).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Champs éditables */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChampEditable label="Pseudo" valeur={profil?.pseudo} placeholder="Ton pseudo" onSave={(v) => sauverChamp('pseudo', v)} />
            <div style={{ borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'var(--border)' }} />
            <ChampEditable label="Ta bio" valeur={profil?.description} placeholder="Dis un truc sur toi…" multiline onSave={(v) => sauverChamp('description', v)} />
          </div>
        </div>

        {/* ── Bloc fan — bg-0 + barre orange ── */}
        <div style={{ background: 'var(--bg-0)', padding: '20px 16px 24px', borderLeft: '3px solid var(--orange)' }}>
          <TitreSection mot1="MES" mot2="ÉQUIPES" couleur2="var(--orange)" />

          {/* Logos des équipes sélectionnées */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, minHeight: 56, alignItems: 'center' }}>
            {(profil?.equipes_favorites || []).length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic', margin: 0 }}>
                Aucune équipe sélectionnée
              </p>
            )}
            {(profil?.equipes_favorites || []).map(eq => (
              <div key={eq.id} style={{ position: 'relative' }}>
                <img
                  src={eq.logo} alt={eq.nom}
                  style={{ width: 52, height: 52, objectFit: 'contain' }}
                  onError={e => { e.target.style.opacity = '0.3' }}
                />
                {/* Bouton retirer */}
                <button
                  onClick={() => toggleEquipe(eq)}
                  style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'var(--danger)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Bouton ouvrir sélecteur */}
          {(profil?.equipes_favorites || []).length < 3 && (
            <button
              onClick={() => setSelecteur(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-1)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '7px 12px',
                fontSize: 12, fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer',
                marginBottom: selecteurOuvert ? 12 : 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter une équipe {(profil?.equipes_favorites || []).length > 0 && `(${(profil?.equipes_favorites || []).length}/3)`}
            </button>
          )}

          {/* Liste des 30 équipes */}
          {selecteurOuvert && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
              maxHeight: 320, overflowY: 'auto',
              background: 'var(--bg-1)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: 10,
            }}>
              {equipesESPN.length === 0 && (
                <p style={{ gridColumn: '1/-1', fontSize: 12, color: 'var(--text-3)', textAlign: 'center', margin: 0 }}>Chargement…</p>
              )}
              {equipesESPN.map(eq => {
                const selectionnee = (profil?.equipes_favorites || []).find(e => e.id === eq.id)
                return (
                  <button
                    key={eq.id}
                    onClick={() => { toggleEquipe(eq); if (!selectionnee && (profil?.equipes_favorites || []).length >= 2) setSelecteur(false) }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '8px 4px',
                      background: selectionnee ? 'var(--accent-dim)' : 'transparent',
                      border: `1px solid ${selectionnee ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: selectionnee ? 'pointer' : (profil?.equipes_favorites || []).length >= 3 ? 'not-allowed' : 'pointer',
                      opacity: !selectionnee && (profil?.equipes_favorites || []).length >= 3 ? 0.4 : 1,
                    }}
                  >
                    <img src={eq.logo} alt={eq.nom} style={{ width: 32, height: 32, objectFit: 'contain' }} onError={e => { e.target.style.opacity = '0.2' }} />
                    <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{eq.abr}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

      </main>
    </>
  )
}

export default Profil