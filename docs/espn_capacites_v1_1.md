# ESPN API — CARTOGRAPHIE DES CAPACITÉS
## Swish League — Référentiel "est-ce que c'est possible ?"
> v1.1 — 2026-06-04 | Enrichi après session terrain complète

---

## LÉGENDE

| Symbole | Signification |
|---|---|
| ✅ CONFIRMÉ | Endpoint validé terrain, CORS OK depuis navigateur |
| 🟡 À TESTER | Endpoint documenté, CORS non vérifié depuis France/navigateur |
| 🔴 BLOQUÉ | CORS bloqué ou inaccessible depuis France, proxy requis |
| ❌ IMPOSSIBLE | Donnée inexistante, endpoint mort, ou hors scope ESPN |
| 🔒 AUTH | Requiert cookies/tokens ESPN (non public) |

**Domaines et leur statut CORS connu :**
- `site.api.espn.com` → ✅ CORS OK (scoreboard, standings, teams, roster, injuries)
- `site.web.api.espn.com` → ✅ CORS OK (summary, stats joueur, gamelog)
- `sports.core.api.espn.com` → ✅ CORS OK confirmé terrain (predictor validé en production)
- `cdn.espn.com` → 🟡 À TESTER
- `now.core.api.espn.com` → 🟡 À TESTER
- `fantasy.espn.com` → 🔒 AUTH (ligues privées) / 🟡 public partiel

---

## SOMMAIRE THÉMATIQUE

1. [Matchs & Scores](#1-matchs--scores)
2. [Calendrier & Saisons](#2-calendrier--saisons)
3. [Équipes](#3-équipes)
4. [Joueurs & Stats](#4-joueurs--stats)
5. [Classements NBA](#5-classements-nba)
6. [Données match enrichies (live & pré-match)](#6-données-match-enrichies-live--pré-match)
7. [News & Médias](#7-news--médias)
8. [Assets visuels](#8-assets-visuels)
9. [Données historiques](#9-données-historiques)
10. [Cotes & Prédictions](#10-cotes--prédictions)
11. [Draft & Transactions](#11-draft--transactions)
12. [Hors scope ESPN — alternatives](#12-hors-scope-espn--alternatives)
13. [Comportements ESPN critiques documentés](#13-comportements-espn-critiques-documentés)

---

## 1. Matchs & Scores

### Ce qu'on fait déjà
| Endpoint | Statut | Usage actuel |
|---|---|---|
| `site.api.espn.com/.../nba/scoreboard?dates=YYYYMMDD` | ✅ CONFIRMÉ | Timeline (3 jours via `recupererTimeline`) |
| `site.api.espn.com/.../nba/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=500` | ✅ CONFIRMÉ | Scanner Admin (plages mensuelles), Calendrier, headlines MatchDetail |
| `site.web.api.espn.com/.../nba/summary?event={id}` | ✅ CONFIRMÉ | MatchDetail complet |
| `site.api.espn.com/.../nba-summer-las-vegas/scoreboard?dates=...` | ✅ CONFIRMÉ | Scanner Admin + Calendrier juillet/août |
| `site.web.api.espn.com/.../nba-summer-las-vegas/summary?event={id}` | ✅ CONFIRMÉ | MatchDetail fallback Summer League |

### Slugs basketball ESPN confirmés CORS OK
- `nba` — ligue principale
- `nba-summer-las-vegas` — Summer League Las Vegas (league id 63)
- `nba-development` — G League
- `wnba` — WNBA
- `mens-college-basketball` — NCAA hommes
- `womens-college-basketball` — NCAA femmes
- `nba-summer-las-vegas` — Summer League

### Ce qu'on peut faire en plus
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Statut live temps réel (optimisé) | `cdn.espn.com/core/nba/scoreboard?xhr=1` | 🟡 À TESTER | Polling Board sans surcharger ESPN |
| Package match complet (plays, odds, win prob) | `cdn.espn.com/core/nba/game?xhr=1&gameId={id}` | 🟡 À TESTER | Remplacement de summary pour les matchs live |
| Boxscore seul | `cdn.espn.com/core/nba/boxscore?xhr=1&gameId={id}` | 🟡 À TESTER | Chargement rapide |
| Play-by-play seul | `cdn.espn.com/core/nba/playbyplay?xhr=1&gameId={id}` | 🟡 À TESTER | Mode "suivi live" dans MatchDetail |
| Arbitres du match | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/officials` | 🟡 À TESTER | Anecdote dans MatchDetail |
| Diffuseurs TV | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/broadcasts` | 🟡 À TESTER | Info "où regarder" dans MatchDetail |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Scores temps réel sub-seconde (push) | ❌ ESPN ne propose pas de WebSocket public — polling uniquement |
| Accès au stream vidéo | 🔒 Derrière ESPN+ auth |
| Historique matchs avant 2003 | ❌ ESPN n'a pas de données fiables avant cette date |

---

## 2. Calendrier & Saisons

### Ce qu'on fait déjà
Calendrier via scoreboard par plage de dates — Calendrier.jsx charge à la demande, mois par mois. Summer League via endpoint séparé sur juillet + août.

### Endpoints calendar — ATTENTION ❌ MORTS
Les endpoints `/calendar`, `/calendar/regular-season`, `/calendar/postseason` retournent **404** en 2026. Ne pas utiliser.

```
❌ site.api.espn.com/.../nba/calendar              → 404
❌ site.api.espn.com/.../nba/calendar/regular-season → 404
❌ site.api.espn.com/.../nba/calendar/postseason     → 404
```

**Alternative validée :** utiliser le scoreboard par plage mensuelle pour détecter les dates de chaque phase.

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Scoreboard multi-dates (plage mensuelle) | `scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=500` | ✅ CONFIRMÉ | Scanner Admin, Calendrier, détection phases |
| Summer League Las Vegas | `scoreboard` avec slug `nba-summer-las-vegas` | ✅ CONFIRMÉ | Calendrier juillet/août, Scanner Admin |
| G League | `scoreboard` avec slug `nba-development` | ✅ CONFIRMÉ | Extension scope si intérêt |
| Saison courante (metadata) | `sports.core.api.espn.com/v2/.../nba/season` | 🟡 À TESTER | Savoir automatiquement dans quel type de saison on est |
| Liste de toutes les saisons disponibles | `sports.core.api.espn.com/v2/.../nba/seasons` | 🟡 À TESTER | Sélecteur d'historique saisons |

### Année NBA — convention
- NBA year : **1 septembre → 31 août**
- Saison "2025-26" = anneeDebut 2025, anneeFin 2026
- Summer League juillet 2025 appartient à la saison **2025-26** (prépare la saison suivante)
- `SAISON_ESPN` = `anneeFin` (ex: 2026 pour la saison 2025-26)

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Calendrier NBA futur non publié | ❌ ESPN ne publie pas les matchs avant qu'ils soient officialisés |
| Endpoints /calendar/* | ❌ Morts en 2026 — retournent 404 |

---

## 3. Équipes

### Ce qu'on fait déjà
Trigrammes, logos, couleurs récupérés via scoreboard. Roster + blessés via endpoints dédiés.

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Liste complète 30 équipes (noms, logos, couleurs, IDs) | `site.api.espn.com/.../nba/teams` | ✅ CONFIRMÉ | Données ESPN directes, toujours à jour |
| Fiche équipe complète | `site.api.espn.com/.../nba/teams/{id}` | ✅ CONFIRMÉ | Page fiche équipe |
| Roster complet | `site.api.espn.com/.../nba/teams/{id}/roster` | ✅ CONFIRMÉ | Explorer — Équipes, FicheJoueur |
| Calendrier de l'équipe | `site.api.espn.com/.../nba/teams/{id}/schedule` | ✅ CONFIRMÉ | Filtre Calendrier par équipe |
| Blessés de l'équipe | `site.api.espn.com/.../nba/teams/{id}/injuries` | ✅ CONFIRMÉ | Explorer — Équipes |
| Transactions récentes | `site.api.espn.com/.../nba/teams/{id}/transactions` | ✅ CONFIRMÉ | Bloc "mouvements" |
| Historique franchise | `site.api.espn.com/.../nba/teams/{id}/history` | ✅ CONFIRMÉ | Palmarès, records |
| Depth chart | `site.api.espn.com/.../nba/teams/{id}/depthcharts` | ✅ CONFIRMÉ | Fiche équipe avancée |
| Couleurs officielles | `teams/{id}` → champs `color` et `alternateColor` | ✅ CONFIRMÉ | Theming dynamique BandeMatchs, MatchDetail |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Données financières (masse salariale, contrats) | ❌ Hors ESPN — Spotrac uniquement |
| Ownership / structure propriétaire | ❌ Non disponible ESPN |

---

## 4. Joueurs & Stats

### Ce qu'on fait déjà
- Stats moyennes saison par `seasontype` et `season` (historique depuis 2003)
- Game log via `gamelog`
- Profil depuis roster (athletes/{id} CORS bloqué depuis navigateur — passer par roster)

### Points critiques validés terrain
- `statistics[0]` retourne la saison la plus ancienne — filtrer par `season.year === SAISON_ESPN`
- `athletes/{id}` direct : CORS bloqué depuis navigateur — utiliser les données du roster
- Paramètre `?season=YYYY&seasontype=N` : fonctionne pour stats historiques depuis ~2003

### Ce qu'on peut faire
#### Stats joueur — utilisé en production
| Donnée | Endpoint | Statut | Notes |
|---|---|---|---|
| Stats moyennes saison courante | `site.web.api.espn.com/.../athletes/{id}/stats?season={year}&seasontype=2` | ✅ CONFIRMÉ | Saison régulière |
| Stats moyennes playoffs | `...stats?season={year}&seasontype=3` | ✅ CONFIRMÉ | Utilisé dans FicheJoueur Explorer |
| Stats moyennes pré-saison | `...stats?season={year}&seasontype=1` | ✅ CONFIRMÉ | Utilisé dans FicheJoueur Explorer |
| Stats historiques (toutes saisons) | `...stats?season={year}` depuis 2003 | ✅ CONFIRMÉ | Sélecteur saison FicheJoueur |
| Game log | `site.web.api.espn.com/.../athletes/{id}/gamelog` | ✅ CONFIRMÉ | 15 derniers matchs, tous types |

#### Stats joueur — à explorer
| Donnée | Endpoint | Statut | Cas d'usage |
|---|---|---|---|
| Stats career complètes | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/statistics` | 🟡 À TESTER | Carrière complète |
| Records de carrière | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/records` | 🟡 À TESTER | Records perso |
| Palmarès / Awards | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/awards` | 🟡 À TESTER | MVP, All-Star, titres |
| Head-to-head vs adversaire | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/vsathlete/{opponentId}` | 🟡 À TESTER | Stats face-à-face |

#### Leaderboards
| Donnée | Endpoint | Statut | Cas d'usage |
|---|---|---|---|
| Leaders stats NBA (scoring, assists, rebounds...) | `site.web.api.espn.com/apis/common/v3/.../statistics/byathlete?category=scoring&sort=points` | ✅ CONFIRMÉ | Page Leaders NBA |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Stats avancées (PER, Win Shares, VORP, BPM) | ❌ Non disponibles ESPN — Basketball Reference uniquement |
| Shooting charts | ❌ Données NBA tracking, non publiques ESPN |
| Tracking data (vitesse, distance) | ❌ NBA propriétaire |
| Salaires détaillés | ❌ ESPN ne les publie pas — Spotrac |

---

## 5. Classements NBA

### Ce qu'on fait déjà
Standings par conférence avec `seasontype` dynamique : 1 (pré-saison), 2 (régulière), 3 (playoffs — BracketPlayoffs utilisé à la place).

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Standings saison régulière | `site.api.espn.com/.../nba/standings?season={year}&seasontype=2` | ✅ CONFIRMÉ | StandingsNBA, Explorer |
| Standings pré-saison | `...standings?season={year}&seasontype=1` | ✅ CONFIRMÉ | Explorer onglet Classements |
| Standings playoffs | `...standings?season={year}&seasontype=3` | ✅ CONFIRMÉ | Explorer (BracketPlayoffs préféré) |
| Divisions | `site.api.espn.com/.../nba/groups` | ✅ CONFIRMÉ | Filtre par division |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Standings NBA Cup | ❌ ESPN ne les expose pas séparément — inclus dans régulière |
| Standings Summer League | ❌ Format tournoi, pas de standings par conférence |
| Standings temps réel mid-game | ❌ Mise à jour en fin de match uniquement |

---

## 6. Données match enrichies (live & pré-match)

### Ce qu'on fait déjà
Via `summary` : score, quart-temps, stats équipes, leaders, L5, blessés, série playoff, predictor ESPN, headlines via scoreboard J-1→J.

### Structure summary — champs disponibles confirmés
```
data.boxscore       → stats équipes, leaders
data.gameInfo       → venue, stade
data.leaders        → top performers par équipe
data.injuries       → blessés
data.seasonseries   → série entre les deux équipes (régulière + playoff)
data.header.competitions[0].competitors → scores, linescores
data.header.season  → year, type
data.pickcenter     → predictor ESPN (win probability)
data.odds           → cotes (si disponibles)
data.winprobability → courbe probabilité live
data.plays          → play-by-play
data.standings      → classements contextuels
data.format         → structure quart-temps (quarters/overtime)
```

### Ce qu'on ne trouve PAS dans le summary
- `data.header.competitions[0].notes` → **absent** — les headlines sont dans le **scoreboard** uniquement
- `data.header.competitions[0].type` → absent pour les matchs NBA Cup
- Pas de champ dédié NBA Cup dans le summary → détection impossible a posteriori sans scoreboard

### Ce qu'on peut faire en plus
| Donnée | Endpoint | Statut | Cas d'usage |
|---|---|---|---|
| Win probability (courbe live) | `data.winprobability` dans summary | ✅ CONFIRMÉ | Déjà dans summary |
| Game Predictor ESPN | `data.pickcenter` dans summary | ✅ CONFIRMÉ | "ESPN prédit X% pour [équipe]" |
| Cotes bookmakers | `data.odds` dans summary | ✅ CONFIRMÉ | Contexte prono — post-Sprint 4 |
| Play-by-play | `data.plays` dans summary | ✅ CONFIRMÉ | Mode suivi live |

---

## 7. News & Médias

### Ce qu'on fait déjà
Actus NBA en français via Basket USA RSS (rss2json proxy) — pas via ESPN.

### Ce qu'on peut faire avec ESPN
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| News NBA générales | `site.api.espn.com/.../nba/news` | ✅ CONFIRMÉ | Alternative à Basket USA (en anglais) |
| News par équipe | `site.api.espn.com/.../nba/news?team={id}` | ✅ CONFIRMÉ | News dans fiche équipe |
| News par joueur | `site.api.espn.com/.../nba/athletes/{id}/news` | ✅ CONFIRMÉ | News dans fiche joueur |
| Transactions ligue | `site.api.espn.com/.../nba/transactions` | ✅ CONFIRMÉ | Bloc "Mouvements" |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Articles complets ESPN | ❌ API retourne titres + résumés seulement (paywall ESPN) |
| Vidéos highlights | 🔒 Derrière ESPN+ auth |

---

## 8. Assets visuels

### Ce qu'on fait déjà
Logos via scoreboard (`team.logo`), photos joueurs via `headshot.href` du summary.

### Ce qu'on peut faire
| Asset | Source | Statut | Notes |
|---|---|---|---|
| Logo équipe HD | `teams/{id}` → `logos[0].href` | ✅ CONFIRMÉ | PNG transparent, `?scale=small/medium/large` |
| Logo fond sombre | `logos[1].href` dans fiche équipe | ✅ CONFIRMÉ | Variante dark |
| Couleur primaire hex | `teams/{id}` → `color` (sans #) | ✅ CONFIRMÉ | Theming dynamique BandeMatchs |
| Couleur secondaire hex | `teams/{id}` → `alternateColor` | ✅ CONFIRMÉ | Dégradés gradient |
| Photo joueur headshot | `athletes/{id}` → `headshot.href` | ✅ CONFIRMÉ | JPG ESPN CDN |
| Photo joueur action | Non disponible ESPN | ❌ | Getty Images uniquement |
| Image bannière équipe | Non disponible ESPN | ❌ | Unsplash |

### Bonnes pratiques assets ESPN
- URLs de logos stables mais non garanties → prévoir fallback initiales
- Couleurs hex ESPN : préfixer `#` si absent
- Headshoots joueurs : format portrait variable selon ancienneté

---

## 9. Données historiques

### Ce qu'on fait déjà
Stats joueur historiques depuis 2003 via `?season=YYYY&seasontype=N` (utilisé dans FicheJoueur Explorer).

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Profondeur |
|---|---|---|---|
| Scores matchs passés | `scoreboard?dates=YYYYMMDD-YYYYMMDD` | ✅ CONFIRMÉ | Depuis ~2003 |
| Summary match passé | `summary?event={id}` | ✅ CONFIRMÉ | Depuis ~2003 |
| Stats saison joueur historiques | `athletes/{id}/stats?season={year}&seasontype={n}` | ✅ CONFIRMÉ | Depuis ~2003 |
| Game log joueur | `athletes/{id}/gamelog` | ✅ CONFIRMÉ | ~15 derniers matchs |
| Palmarès équipe | `teams/{id}/history` | ✅ CONFIRMÉ | Franchise complète |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Matchs avant 2003 | ❌ ESPN non fiable avant cette date |
| Stats 1990s/1980s | ❌ Basketball Reference pour cette période |
| Play-by-play historique | ❌ Récents uniquement |

---

## 10. Cotes & Prédictions

### Ce qu'on peut faire
| Donnée | Source | Statut | Cas d'usage |
|---|---|---|---|
| Game Predictor ESPN | `data.pickcenter` dans summary | ✅ CONFIRMÉ | Déjà utilisé dans MatchDetail |
| Win probability pré-match | `data.winprobability` dans summary | ✅ CONFIRMÉ | Déjà dans summary |
| Cotes bookmakers | `data.odds` dans summary | ✅ CONFIRMÉ | Post-Sprint 4 — contexte prono |
| Futures (champion, MVP) | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/futures` | 🟡 À TESTER | Section paris long terme |

**IDs bookmakers ESPN :**
Caesars : 38 | FanDuel : 37 | DraftKings : 41 | BetMGM : 58 | ESPN BET : 68 | Bet365 : 2000

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Cotes live betting | ❌ ESPN ne met pas à jour pendant le match |
| Bookmakers FR (Unibet, Winamax) | ❌ ESPN couvre partenaires US uniquement |

> ⚠️ **Note légale France :** Afficher des cotes de bookmakers est encadré par l'ANJ. Ne pas intégrer dans le flow prono.

---

## 11. Draft & Transactions

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage |
|---|---|---|---|
| Transactions ligue | `site.api.espn.com/.../nba/transactions` | ✅ CONFIRMÉ | Bloc "mouvements" Accueil |
| Transactions par équipe | `site.api.espn.com/.../nba/teams/{id}/transactions` | ✅ CONFIRMÉ | Fiche équipe |
| Draft par année | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/draft` | 🟡 À TESTER | Page draft historique |
| Free agents | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/freeagents` | 🟡 À TESTER | Off-season |

---

## 12. Hors scope ESPN — alternatives

| Donnée souhaitée | Pourquoi pas ESPN | Alternative | Faisabilité |
|---|---|---|---|
| Stats avancées (PER, Win Shares, RAPTOR) | ❌ Non exposées | Basketball Reference | 🟡 Complexe |
| Shooting charts | ❌ NBA tracking, non public | NBA Stats API (bloquée FR) | 🔴 BLOQUÉ |
| Données biométriques | ❌ Propriétaire NBA | Second Spectrum | ❌ |
| Salaires / contrats | ❌ Hors ESPN | Spotrac, HoopsHype | 🟡 Scraping |
| Highlights vidéo | 🔒 ESPN+ uniquement | YouTube Data API | 🟡 Possible |
| Réactions sociales | ❌ Twitter/X payant | RSS alternatifs | 🔴 Instable |
| Standings NBA Cup | ❌ Non exposé ESPN | — | ❌ |
| Standings Summer League | ❌ Format tournoi | Bracket custom depuis headlines | 🟡 Buildable |
| Odds FR | ❌ Partenaires US uniquement | Odds API (freemium) | 🟡 Clé API |

---

## 13. Comportements ESPN critiques documentés

Validés terrain lors du développement Swish League. À consulter avant tout nouveau développement ESPN.

### 13.1 Notes ESPN (`comp.notes[0].headline`)

| Contexte | Présence des notes | Exemple |
|---|---|---|
| Scoreboard date unique `?dates=YYYYMMDD` | ❌ Absentes pour les matchs passés | — |
| Scoreboard plage `?dates=YYYYMMDD-YYYYMMDD` | ✅ Présentes pour tous les matchs | `"NBA Cup - Group Play"` |
| Summary `summary?event={id}` | ❌ Absentes — `comp.notes` undefined | — |
| Summary champ `format` | ✅ Présent mais inutile | Quarters/overtime uniquement |

**Conséquence :** pour détecter le type d'un match (NBA Cup, Play-In...) depuis MatchDetail, il faut un appel scoreboard séparé avec plage de dates.

### 13.2 Décalage UTC / Paris

Les matchs NBA se jouent la nuit en heure française. Un match à 23h UTC = 1h du matin Paris = ESPN l'indexe sur la date UTC, pas la date Paris.

**Solution :** appel scoreboard sur `J-1 → J` (plage de 2 jours) pour garantir de trouver le match quelle que soit son heure UTC.

```js
const dateStr    = comp.date.slice(0, 10).replace(/-/g, '')  // date UTC
const dateObjM1  = new Date(comp.date)
dateObjM1.setDate(dateObjM1.getDate() - 1)
const dateMinus1 = dateObjM1.toISOString().slice(0, 10).replace(/-/g, '')
fetch(`scoreboard?dates=${dateMinus1}-${dateStr}&limit=200`)
```

### 13.3 Détection des Finals vs Playoffs

- `season.type = 3` pour **tous** les matchs de post-season (1er tour, conférences, Finals)
- "East Finals" / "West Finals" → `playoffs` (Conference Finals)
- "NBA Finals" → `finals`
- Pattern `'finals - game'` trop générique — matche "East Finals - Game 1" → **à éviter**
- Patterns sûrs : `'nba finals'`, `'the finals'`
- Fallback fiable : `data.seasonseries.find(s => s.type === 'playoff').description === 'NBA Finals'`

### 13.4 Summer League — endpoint séparé

La Summer League n'est **jamais** dans le scoreboard NBA standard. Endpoint dédié obligatoire :
```
site.api.espn.com/.../nba-summer-las-vegas/scoreboard
site.web.api.espn.com/.../nba-summer-las-vegas/summary
```

Les matchs Summer League ont `season.type = 2` (saison régulière) côté ESPN — la détection se fait via le slug de l'endpoint, pas via `season.type`.

Summer League juillet 2025 = saison **2025-26** (prépare la saison suivante, après la draft de fin juin).

### 13.5 Type 5 = Play-In (pas International)

ESPN encode le Play-In Tournament avec `season.type = 5`. Ce n'est PAS "International" — ce code (erroné dans certaines docs) a été corrigé.

### 13.6 NBA Cup — détection

| Endpoint | Détection possible |
|---|---|
| Summary | ❌ Aucun champ dédié |
| Scoreboard plage | ✅ Via `notes[0].headline` : `"NBA Cup - Group Play"`, `"NBA Cup - Knockout"`, `"NBA Cup Championship"` |

Patterns à tester (lowercase) : `'nba cup'`, `'in-season tournament'`, `'nba cup - group'`, `'nba cup - knockout'`, `'nba cup - semifinal'`, `'nba cup - final'`, `'nba cup championship'`

### 13.7 seasonseries dans le summary

Présent pour la plupart des matchs, y compris la pré-saison. ESPN fournit le bilan de saison régulière entre les deux équipes même pour un match de pré-saison — c'est voulu par ESPN, pas un bug.

```js
data.seasonseries = [
  { type: 'season',  description: 'Regular Season Series', summary: 'LAL win series 3-1' },
  { type: 'playoff', description: 'NBA Finals',            summary: 'NY leads series 1-0' },
]
```

---

## RÉCAPITULATIF DÉCISIONNEL

### ✅ Utilisé en production (CORS confirmé, validé terrain)
- Scoreboard NBA + Summer League (plages mensuelles)
- Summary NBA + fallback Summer League
- Standings `seasontype=1/2/3`
- Roster, injuries par équipe
- Stats joueur par saison + seasontype (historique 2003→)
- Game log joueur
- Predictor ESPN (`data.pickcenter`)
- Win probability (`data.winprobability`)
- Assets visuels (logos, couleurs)
- Transactions ligue + par équipe

### ✅ Faisable immédiatement (CORS confirmé, pas encore utilisé)
- News NBA + par équipe + par joueur
- Table équipes complète (noms, logos, IDs)
- Calendrier équipe (schedule)
- Depth chart, historique franchise
- Leaders stats NBA (leaderboard)
- Cotes bookmakers (`data.odds` dans summary)

### 🟡 Faisable après test CORS
- Win probability core API, Game Predictor core API
- Play-by-play core API
- Stats carrière joueur, records, awards
- Futures, ATS records
- Draft, free agents

### ❌ Hors de portée ESPN
- Stats avancées (PER, Win Shares, RAPTOR)
- Shooting charts / tracking data
- Salaires / contrats
- Vidéos highlights
- Scores push temps réel (WebSocket)
- Standings NBA Cup / Summer League dédiés
- Endpoints `/calendar/*` (morts en 2026)

---

*Document v1.1 — 2026-06-04*
*Remplace espn_capacites_v1_0.md*
*Source terrain : validation projet Swish League + github.com/pseudo-r/Public-ESPN-API*
*Prochaine révision : après test CORS `cdn.espn.com` et exploration cotes/odds*
