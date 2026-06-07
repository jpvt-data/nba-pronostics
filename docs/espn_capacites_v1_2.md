# ESPN API — CARTOGRAPHIE DES CAPACITÉS
## Swish League — Référentiel "est-ce que c'est possible ?"
> v1.2 — 2026-06-08 | Enrichi après exploration cotes/odds

---

## LÉGENDE

| Symbole | Signification |
|---|---|
| ✅ CONFIRMÉ | Endpoint validé terrain, CORS OK depuis navigateur |
| 🟡 À TESTER | Endpoint documenté, CORS non vérifié depuis France/navigateur |
| 🔴 BLOQUÉ | CORS bloqué ou inaccessible depuis France, proxy requis |
| ❌ IMPOSSIBLE | Donnée inexistante, endpoint mort, ou hors scope ESPN |
| 🔒 AUTH | Requiert cookies/tokens ESPN (non public) |

---

## SOMMAIRE THÉMATIQUE

1. [Matchs & Scores](#1-matchs--scores)
2. [Calendrier & Saisons](#2-calendrier--saisons)
3. [Équipes](#3-équipes)
4. [Joueurs & Stats](#4-joueurs--stats)
5. [Classements NBA](#5-classements-nba)
6. [Données match enrichies — cotes & prédictions](#6-données-match-enrichies--cotes--prédictions)
7. [News & Médias](#7-news--médias)
8. [Assets visuels](#8-assets-visuels)
9. [Données historiques](#9-données-historiques)
10. [Draft & Transactions](#10-draft--transactions)
11. [Hors scope ESPN — alternatives](#11-hors-scope-espn--alternatives)
12. [Comportements ESPN critiques documentés](#12-comportements-espn-critiques-documentés)

---

## 1. Matchs & Scores

### Ce qu'on fait déjà
| Endpoint | Statut | Usage actuel |
|---|---|---|
| `site.api.espn.com/.../nba/scoreboard?dates=YYYYMMDD` | ✅ CONFIRMÉ | Timeline (3 jours via `recupererTimeline`) |
| `site.api.espn.com/.../nba/scoreboard?dates=YYYYMMDD-YYYYMMDD&limit=500` | ✅ CONFIRMÉ | Scanner Admin, Calendrier, headlines MatchDetail |
| `site.web.api.espn.com/.../nba/summary?event={id}` | ✅ CONFIRMÉ | MatchDetail complet + pickcenter cotes |
| `site.api.espn.com/.../nba-summer-las-vegas/scoreboard?dates=...` | ✅ CONFIRMÉ | Scanner Admin + Calendrier juillet/août |
| `site.web.api.espn.com/.../nba-summer-las-vegas/summary?event={id}` | ✅ CONFIRMÉ | MatchDetail fallback Summer League |

---

## 2. Calendrier & Saisons

### Endpoints calendar — ATTENTION ❌ MORTS
```
❌ site.api.espn.com/.../nba/calendar              → 404
❌ site.api.espn.com/.../nba/calendar/regular-season → 404
❌ site.api.espn.com/.../nba/calendar/postseason     → 404
```
**Alternative validée :** scoreboard par plage mensuelle.

### Année NBA — convention
- NBA year : **1 septembre → 31 août**
- `SAISON_ESPN` = `anneeFin` (ex: 2026 pour la saison 2025-26)
- Summer League juillet 2025 appartient à la saison **2025-26**

---

## 3. Équipes

| Donnée | Endpoint | Statut |
|---|---|---|
| Liste complète 30 équipes | `site.api.espn.com/.../nba/teams` | ✅ CONFIRMÉ |
| Fiche équipe | `site.api.espn.com/.../nba/teams/{id}` | ✅ CONFIRMÉ |
| Roster | `site.api.espn.com/.../nba/teams/{id}/roster` | ✅ CONFIRMÉ |
| Calendrier équipe | `site.api.espn.com/.../nba/teams/{id}/schedule` | ✅ CONFIRMÉ |
| Blessés | `site.api.espn.com/.../nba/teams/{id}/injuries` | ✅ CONFIRMÉ |
| Transactions | `site.api.espn.com/.../nba/teams/{id}/transactions` | ✅ CONFIRMÉ |
| Historique franchise | `site.api.espn.com/.../nba/teams/{id}/history` | ✅ CONFIRMÉ |
| Depth chart | `site.api.espn.com/.../nba/teams/{id}/depthcharts` | ✅ CONFIRMÉ |
| Couleurs officielles | `teams/{id}` → `color` + `alternateColor` | ✅ CONFIRMÉ |

---

## 4. Joueurs & Stats

| Donnée | Endpoint | Statut |
|---|---|---|
| Stats moyennes saison | `site.web.api.espn.com/.../athletes/{id}/stats?season={year}&seasontype=2` | ✅ CONFIRMÉ |
| Stats playoffs | `...stats?season={year}&seasontype=3` | ✅ CONFIRMÉ |
| Stats pré-saison | `...stats?season={year}&seasontype=1` | ✅ CONFIRMÉ |
| Game log | `site.web.api.espn.com/.../athletes/{id}/gamelog` | ✅ CONFIRMÉ |
| Leaders stats NBA | `site.web.api.espn.com/apis/common/v3/.../statistics/byathlete?category=scoring` | ✅ CONFIRMÉ |

**Note :** `athletes/{id}` direct CORS bloqué depuis navigateur — passer par roster.

---

## 5. Classements NBA

| Donnée | Endpoint | Statut |
|---|---|---|
| Standings saison régulière | `site.api.espn.com/.../nba/standings?season={year}&seasontype=2` | ✅ CONFIRMÉ |
| Standings pré-saison | `...standings?season={year}&seasontype=1` | ✅ CONFIRMÉ |
| Standings playoffs | `...standings?season={year}&seasontype=3` | ✅ CONFIRMÉ |

---

## 6. Données match enrichies — cotes & prédictions

### Structure summary — champs cotes validés terrain (2026-06-08)

| Champ | Contenu | Disponibilité |
|---|---|---|
| `data.pickcenter` | Spread + Over/Under + Moneyline US + open/close | ✅ ~J-1/J-2 avant match |
| `data.predictor` | Win probability % home/away | ✅ Toujours présent pré-match |
| `data.odds` | ❌ Toujours vide | ❌ Ne pas utiliser |
| `data.winprobability` | Courbe probabilité par action | Live uniquement |
| `data.againstTheSpread` | Records ATS équipes | Partiel (records vides fin de saison) |

### `pickcenter` — structure détaillée

```js
const pc = data.pickcenter[0]  // Provider : DraftKings (priority 1)

pc.provider.name         // "DraftKings"
pc.details               // "NY -2.5" — spread texte lisible
pc.overUnder             // 215.5 — total points
pc.spread                // -2.5 (numérique)
pc.homeTeamOdds.moneyLine      // -130 (format américain)
pc.awayTeamOdds.moneyLine      // +110
pc.homeTeamOdds.favorite       // true/false
pc.homeTeamOdds.favoriteAtOpen // true/false (était-il favori à l'ouverture ?)

pc.pointSpread.home.close.line  // "-2.5" (ligne actuelle)
pc.pointSpread.home.open.line   // "-1.5" (ligne à l'ouverture — mouvement visible)
pc.pointSpread.home.close.odds  // "-105"

pc.total.over.close.line        // "o215.5"
pc.total.over.close.odds        // "-115"
pc.total.under.close.line       // "u215.5"
pc.total.under.close.odds       // "-105"

pc.moneyline.home.close.odds    // "-130"
pc.moneyline.away.close.odds    // "+110"
```

### Conversion moneyline US → décimal
```js
const mlEnDecimal = (ml) => ml > 0
  ? parseFloat((ml / 100 + 1).toFixed(2))
  : parseFloat((100 / Math.abs(ml) + 1).toFixed(2))
// -130 → 1.77 | +110 → 2.10
```

### Conversion décimal → probabilité implicite normalisée
```js
const coteEnPct = (coteEq1, coteEq2) => {
  const p1 = 1 / coteEq1
  const p2 = 1 / coteEq2
  const total = p1 + p2
  return { pct1: Math.round(p1 / total * 100), pct2: Math.round(p2 / total * 100) }
}
// Normalisation élimine la marge du bookmaker
```

### `predictor` dans le summary (vs endpoint core API)
```js
data.predictor.homeTeam.gameProjection  // "58.2" (%)
data.predictor.awayTeam.gameProjection  // "41.8"
// Identique au endpoint core API predictor — moins d'appels réseau
```

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Cotes live betting | ❌ ESPN ne met pas à jour pendant le match |
| Bookmakers FR (Unibet, Winamax, Betclic) | ❌ ESPN couvre partenaires US uniquement |
| `data.odds` | ❌ Toujours vide — ne pas utiliser |

---

## 7. News & Médias

| Donnée | Endpoint | Statut |
|---|---|---|
| News NBA générales | `site.api.espn.com/.../nba/news` | ✅ CONFIRMÉ |
| News par équipe | `site.api.espn.com/.../nba/news?team={id}` | ✅ CONFIRMÉ |
| News par joueur | `site.api.espn.com/.../nba/athletes/{id}/news` | ✅ CONFIRMÉ |
| Transactions ligue | `site.api.espn.com/.../nba/transactions` | ✅ CONFIRMÉ |

---

## 8. Assets visuels

| Asset | Source | Statut |
|---|---|---|
| Logo équipe HD | `teams/{id}` → `logos[0].href` | ✅ CONFIRMÉ |
| Logo fond sombre | `logos[1].href` | ✅ CONFIRMÉ |
| Couleur primaire hex | `teams/{id}` → `color` (sans #) | ✅ CONFIRMÉ |
| Photo joueur headshot | `athletes/{id}` → `headshot.href` | ✅ CONFIRMÉ |

---

## 9. Données historiques

| Donnée | Endpoint | Profondeur |
|---|---|---|
| Scores matchs passés | `scoreboard?dates=YYYYMMDD-YYYYMMDD` | Depuis ~2003 |
| Summary match passé | `summary?event={id}` | Depuis ~2003 |
| Stats saison joueur | `athletes/{id}/stats?season={year}&seasontype={n}` | Depuis ~2003 |
| Palmarès équipe | `teams/{id}/history` | Franchise complète |

---

## 10. Draft & Transactions

| Donnée | Endpoint | Statut |
|---|---|---|
| Transactions ligue | `site.api.espn.com/.../nba/transactions` | ✅ CONFIRMÉ |
| Transactions par équipe | `site.api.espn.com/.../nba/teams/{id}/transactions` | ✅ CONFIRMÉ |
| Draft par année | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/draft` | 🟡 À TESTER |

---

## 11. Hors scope ESPN — alternatives

| Donnée souhaitée | Pourquoi pas ESPN | Alternative | Faisabilité |
|---|---|---|---|
| Cotes bookmakers FR (Betclic, Unibet, Winamax) | ❌ Partenaires US uniquement | **The Odds API** `regions=eu` | ✅ Intégré |
| Stats avancées (PER, Win Shares) | ❌ Non exposées | Basketball Reference | 🟡 Complexe |
| Salaires / contrats | ❌ Hors ESPN | Spotrac | 🟡 Scraping |
| Highlights vidéo | 🔒 ESPN+ uniquement | YouTube Data API | 🟡 Possible |
| Standings NBA Cup | ❌ Non exposé ESPN | — | ❌ |

### The Odds API — bookmakers EU/FR disponibles (validé 2026-06-08)
`betclic_fr` | `unibet_fr` | `winamax_fr` | `pmu_fr` | `unibet_nl` | `unibet_se` | `pinnacle` | `betsson` | `nordicbet` | `williamhill` | `betfair_ex_eu` | `matchbook` + 10 autres

**Marchés free tier (500 req/mois) :** `h2h`, `spreads`, `totals`
**Bookmakers FR :** uniquement `h2h` — spreads et totals absents côté EU
**Pinnacle :** `h2h` + `spreads` + `totals` — référence sharp pour section 4

---

## 12. Comportements ESPN critiques documentés

### 12.1 Notes ESPN (`comp.notes[0].headline`)

| Contexte | Présence des notes |
|---|---|
| Scoreboard date unique `?dates=YYYYMMDD` | ❌ Absentes pour matchs passés |
| Scoreboard plage `?dates=YYYYMMDD-YYYYMMDD` | ✅ Présentes pour tous les matchs |
| Summary `summary?event={id}` | ❌ Absentes |

### 12.2 Décalage UTC / Paris
Matchs NBA la nuit en heure française → appel scoreboard `J-1 → J` pour garantir de trouver le match.

### 12.3 Détection Finals vs Playoffs
- `season.type = 3` pour TOUTE la post-season
- Patterns sûrs : `'nba finals'`, `'the finals'`
- Fallback : `data.seasonseries.find(s => s.type === 'playoff').description === 'NBA Finals'`

### 12.4 Summer League — endpoint séparé
```
site.api.espn.com/.../nba-summer-las-vegas/scoreboard
site.web.api.espn.com/.../nba-summer-las-vegas/summary
```
Matchs Summer League ont `season.type = 2` — détection via slug endpoint uniquement.

### 12.5 Type 5 = Play-In
ESPN encode le Play-In Tournament avec `season.type = 5`. Ce n'est PAS "International".

### 12.6 NBA Cup — détection
Via `notes[0].headline` dans scoreboard plage uniquement. Patterns : `'nba cup'`, `'in-season tournament'`.

### 12.7 `pickcenter` — disponibilité temporelle (validé 2026-06-08)
- Présent : ~J-1/J-2 avant le match (validé sur NBA Finals Game 3)
- Absent : matchs trop lointains (validé sur NBA Finals Game 4, plusieurs jours plus tard)
- Absent post-match : `pickcenter` se vide après le match (ou reste vide)
- **Conséquence :** fallback obligatoire. Afficher le predictor seul si `pickcenter` vide.

### 12.8 `data.odds` vs `data.pickcenter`
- `data.odds` → **toujours vide** en 2026. Ne jamais utiliser.
- `data.pickcenter` → source réelle des cotes ESPN. Toujours vérifier `pickcenter?.length > 0`.

---

## RÉCAPITULATIF DÉCISIONNEL

### ✅ Utilisé en production
- Scoreboard NBA + Summer League
- Summary NBA + fallback Summer League
- `data.pickcenter` → cotes ESPN (spread, O/U, moneyline US)
- `data.predictor` → win probability %
- Standings, Roster, Injuries, Stats joueur, Game log
- Assets visuels (logos, couleurs)
- Transactions

### ✅ Faisable immédiatement
- News NBA + par équipe + par joueur
- Calendrier équipe, Depth chart, Historique franchise
- Leaders stats NBA

### ❌ Hors de portée ESPN
- `data.odds` (toujours vide)
- Bookmakers FR
- Stats avancées, tracking data, salaires
- Endpoints `/calendar/*` (morts en 2026)

---

*Document v1.2 — 2026-06-08*
*Remplace espn_capacites_v1_1.md*
*Ajouts : exploration complète pickcenter/odds/predictor/winprobability + The Odds API bookmakers EU*
