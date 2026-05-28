import { useState, useEffect } from 'react'
import { useNoSpoil } from '../context/NoSpoilContext'
import { EyeOff } from 'lucide-react'

const URL_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=5'

export default function NewsNBA({ typeSaison }) {
  const [news, setNews]             = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur]         = useState(false)
  const { noSpoil }                 = useNoSpoil()

  useEffect(() => {
    if (typeSaison === null) return
    const controller = new AbortController()
    fetch(URL_NEWS, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        const articles = (data.articles ?? []).slice(0, 5).map(a => ({
          titre:  a.headline ?? '',
          resume: a.description ?? null,
          lien:   a.links?.web?.href ?? null,
        }))
        setNews(articles)
        setChargement(false)
      })
      .catch(() => {
        setErreur(true)
        setChargement(false)
      })
    return () => controller.abort()
  }, [typeSaison])

  if (typeSaison === null) return null
  if (erreur || (!chargement && news.length === 0)) return null

  return (
    <div style={{
      margin: '12px 16px 0',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)',
      borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.08)',
      padding: '16px 16px 12px',
    }}>

      {noSpoil ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 12, padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(99,102,241,0.06)',
          borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(99,102,241,0.15)',
        }}>
          <EyeOff size={14} color="var(--text-3)" />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Actus masquées — mode No Spoil activé
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 12 }}>
          {chargement ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Chargement…</p>
          ) : (
            news.map((article, i) => (
              <a
                key={i}
                href={article.lien ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '9px 6px',
                  borderBottomWidth: i < news.length - 1 ? 1 : 0,
                  borderBottomStyle: 'solid',
                  borderBottomColor: 'var(--border)',
                  textDecoration: 'none',
                }}
              >
                <span style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--text-1)',
                  lineHeight: 1.4, display: 'block',
                }}>
                  {article.titre}
                </span>
                {article.resume && (
                  <span style={{
                    fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4,
                    display: 'block', marginTop: 2,
                  }}>
                    {article.resume}
                  </span>
                )}
              </a>
            ))
          )}
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '10px 0 0' }}>
        Source : ESPN
      </p>
    </div>
  )
}