import { useState, useEffect } from 'react'

const RSS2JSON_KEY = '1o9jbu3uki4jnlechzpd32vgz2yqyxkfaufhepl0'
const FEED_URL     = 'https://www.basketusa.com/feed/'
const API_URL      = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}&api_key=${RSS2JSON_KEY}&count=6`

// Export du fetch pour que NewsNBA puisse réutiliser les données
export async function fetchFeedBasketUSA() {
  const res  = await fetch(API_URL)
  const data = await res.json()
  return (data.items || []).map(item => ({
    titre:     item.title || '',
    resume:    item.description?.replace(/<[^>]+>/g, '').slice(0, 120) || null,
    lien:      item.link || null,
    image:     item.thumbnail || item.enclosure?.link || null,
    date:      item.pubDate || null,
  }))
}

export default function BanniereFeed({ article }) {
  if (!article) return null

  return (
    <a
      href={article.lien || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', position: 'relative', overflow: 'hidden', height: 160, marginTop: 12 }}
    >
      {/* Photo de fond */}
      {article.image && (
        <img
          src={article.image}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }}
        />
      )}
      {!article.image && (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-1)' }} />
      )}

      {/* Dégradé bas */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

      {/* Barre accent gauche */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--orange)' }} />

      {/* Contenu */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px 10px 16px' }}>
        <span style={{
          display: 'inline-block', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.12em', color: 'var(--orange)',
          textTransform: 'uppercase', marginBottom: 4,
        }}>Basket USA</span>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 700,
          color: '#fff', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.titre}
        </p>
      </div>
    </a>
  )
}
