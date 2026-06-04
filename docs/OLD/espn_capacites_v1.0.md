# ESPN API — CARTOGRAPHIE DES CAPACITÉS
## Swish League — Référentiel "est-ce que c'est possible ?"
> v1.0 — 2026-05-27 | Source : github.com/pseudo-r/Public-ESPN-API (mars 2026)

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
- `site.api.espn.com` → ✅ CORS OK (utilisé pour scoreboard)
- `site.web.api.espn.com` → ✅ CORS OK (utilisé pour summary)
- `sports.core.api.espn.com` → 🟡 À TESTER (jamais appelé depuis ce projet)
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

---

## 1. Matchs & Scores

### Ce qu'on fait déjà
| Endpoint | Statut | Usage actuel |
|---|---|---|
| `site.api.espn.com/.../nba/scoreboard?dates=YYYYMMDD` | ✅ CONFIRMÉ | BandeMatchs (3 jours) |
| `site.web.api.espn.com/.../nba/summary?event={id}` | ✅ CONFIRMÉ | MatchDetail complet |

### Ce qu'on peut faire en plus
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Scoreboard multi-dates (plage) | `scoreboard?dates=20260101-20260131` | ✅ CONFIRMÉ | Calendrier mensuel sans N requêtes |
| Statut live temps réel (optimisé) | `cdn.espn.com/core/nba/scoreboard?xhr=1` | 🟡 À TESTER | Polling Board sans surcharger ESPN |
| Package match complet (plays, odds, win prob) | `cdn.espn.com/core/nba/game?xhr=1&gameId={id}` | 🟡 À TESTER | Remplacement de summary pour les matchs live |
| Boxscore seul | `cdn.espn.com/core/nba/boxscore?xhr=1&gameId={id}` | 🟡 À TESTER | Chargement rapide sans données superflues |
| Play-by-play seul | `cdn.espn.com/core/nba/playbyplay?xhr=1&gameId={id}` | 🟡 À TESTER | Mode "suivi live" dans MatchDetail |
| Arbitres du match | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/officials` | 🟡 À TESTER | Anecdote dans MatchDetail |
| Diffuseurs TV | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/broadcasts` | 🟡 À TESTER | Info "où regarder" dans MatchDetail |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Scores temps réel sub-seconde (push) | ESPN ne propose pas de WebSocket public — polling uniquement |
| Accès au stream vidéo | 🔒 Derrière ESPN+ auth |
| Historique matchs avant 2003 | ❌ ESPN n'a pas de données fiables avant cette date |

---

## 2. Calendrier & Saisons

### Ce qu'on fait déjà
Calendrier via scoreboard date par date — fonctionnel mais N requêtes.

### Ce qu'on peut faire en plus
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Calendrier officiel NBA (toutes les semaines de saison) | `site.api.espn.com/.../nba/calendar` | ✅ CONFIRMÉ | Sélecteur de saison (backlog Sprint 1) — connaître les bornes exactes de chaque phase |
| Semaines saison régulière | `site.api.espn.com/.../nba/calendar/regular-season` | ✅ CONFIRMÉ | Navigation semaine par semaine |
| Dates playoffs | `site.api.espn.com/.../nba/calendar/postseason` | ✅ CONFIRMÉ | Ouverture automatique des ligues Playoffs |
| Offseason | `site.api.espn.com/.../nba/calendar/offseason` | ✅ CONFIRMÉ | Désactiver les pronos hors saison automatiquement |
| Saison courante (metadata) | `sports.core.api.espn.com/v2/.../nba/season` | 🟡 À TESTER | Savoir automatiquement dans quel type de saison on est |
| Liste de toutes les saisons disponibles | `sports.core.api.espn.com/v2/.../nba/seasons` | 🟡 À TESTER | Sélecteur d'historique saisons dans Calendrier |
| Summer League (Las Vegas, Orlando…) | `scoreboard` avec league `nba-summer-las-vegas` | ✅ CONFIRMÉ | Extension scope si intérêt |
| G League | `scoreboard` avec league `nba-development` | ✅ CONFIRMÉ | Extension scope si intérêt |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Calendrier NBA futur non publié | ❌ ESPN ne publie pas les matchs avant qu'ils soient officialisés par la NBA |
| Heure exacte des matchs hors saison | ❌ Indisponible avant publication officielle |

---

## 3. Équipes

### Ce qu'on fait déjà
Trigrammes et logos récupérés via scoreboard — suffisant pour l'affichage actuel.

### Ce qu'on peut faire en plus
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Liste complète 30 équipes (noms, logos, couleurs, IDs) | `site.api.espn.com/.../nba/teams` | ✅ CONFIRMÉ | Remplace table `equipes` Supabase prévue au backlog — données ESPN directes, toujours à jour |
| Fiche équipe complète | `site.api.espn.com/.../nba/teams/{id}` | ✅ CONFIRMÉ | Future page fiche équipe |
| Roster complet | `site.api.espn.com/.../nba/teams/{id}/roster` | ✅ CONFIRMÉ | Page fiche équipe — effectif de la saison |
| Calendrier de l'équipe | `site.api.espn.com/.../nba/teams/{id}/schedule` | ✅ CONFIRMÉ | Filtre Calendrier "Voir les matchs de [équipe]" enrichi |
| Blessés de l'équipe | `site.api.espn.com/.../nba/teams/{id}/injuries` | ✅ CONFIRMÉ | Bloc blessés dans fiche équipe (déjà via summary aussi) |
| Transactions récentes (trades, coupures) | `site.api.espn.com/.../nba/teams/{id}/transactions` | ✅ CONFIRMÉ | Bloc "mouvements" dans fiche équipe |
| Historique franchise | `site.api.espn.com/.../nba/teams/{id}/history` | ✅ CONFIRMÉ | Palmarès, records, historique championnat |
| Depth chart (hiérarchie postes) | `site.api.espn.com/.../nba/teams/{id}/depthcharts` | ✅ CONFIRMÉ | Fiche équipe avancée |
| Couleurs officielles (primary/alternate) | Dans `teams/{id}` — champs `color` et `alternateColor` | ✅ CONFIRMÉ | Affichage couleurs équipe dans cards matchs, fiche équipe |
| Données core (plus détaillées) | `sports.core.api.espn.com/v2/.../nba/teams` | 🟡 À TESTER | Données enrichies si site API insuffisant |
| Franchises (historique noms/villes) | `sports.core.api.espn.com/v2/.../nba/franchises` | 🟡 À TESTER | Historique franchise (ex-Seattle SuperSonics → OKC) |
| Lieux / arènes | `sports.core.api.espn.com/v2/.../nba/venues` | 🟡 À TESTER | Infos stade dans MatchDetail (déjà via summary) + fiche équipe |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Données financières (masse salariale, contrats détaillés) | ❌ Hors ESPN — Spotrac/Basketball Reference uniquement |
| Ownership / structure propriétaire | ❌ Non disponible ESPN |

---

## 4. Joueurs & Stats

### Ce qu'on fait déjà
Leaders (top 3 par catégorie) et blessés via `summary` — données du match uniquement.

### Ce qu'on peut faire en plus

#### Profil & identité joueur
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Profil complet (photo, équipe, position, âge, taille, poids) | `site.api.espn.com/.../nba/athletes/{id}` | ✅ CONFIRMÉ | Fiche joueur |
| Photo haute qualité (headshot) | Champ `headshot.href` dans summary leaders — déjà récupéré | ✅ CONFIRMÉ | Déjà utilisé dans MatchDetail |
| Bio joueur | `site.api.espn.com/.../nba/athletes/{id}/bio` | ✅ CONFIRMÉ | Fiche joueur — bio narrative |
| News joueur | `site.api.espn.com/.../nba/athletes/{id}/news` | ✅ CONFIRMÉ | Bloc actu dans fiche joueur |

#### Stats saison
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Stats saison complètes | `site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats` | ✅ CONFIRMÉ (même domaine summary) | Fiche joueur — stats saison |
| Game log (match par match) | `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/gamelog` | ✅ CONFIRMÉ | Fiche joueur — performances récentes |
| Splits (domicile/extérieur, conférence, mois) | `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/splits` | ✅ CONFIRMÉ | Fiche joueur avancée |
| Vue d'ensemble snapshot (stats + news + prochain match) | `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/overview` | ✅ CONFIRMÉ | Preview joueur rapide au clic |
| Stats career complètes | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/statistics` | 🟡 À TESTER | Fiche joueur historique carrière |
| Stats log par saison (core) | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/statisticslog` | 🟡 À TESTER | Comparaison saisons |
| Historique événements joueur | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/eventlog` | 🟡 À TESTER | Historique complet matchs joués |
| Records de carrière | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/records` | 🟡 À TESTER | Records perso dans fiche joueur |
| Palmarès / Awards | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/awards` | 🟡 À TESTER | MVP, All-Star, titres dans fiche joueur |
| Historique blessures | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/injuries` | 🟡 À TESTER | Contexte fiabilité joueur |
| Contrats | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/contracts` | 🟡 À TESTER | Info contextuelle (à confirmer si données réelles) |
| Head-to-head vs adversaire | `sports.core.api.espn.com/v2/.../nba/athletes/{id}/vsathlete/{opponentId}` | 🟡 À TESTER | Statistiques face-à-face dans MatchDetail |

#### Leaderboards
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Leaders stats NBA (meilleurs marqueurs, passeurs, rebondeurs…) | `site.web.api.espn.com/apis/common/v3/.../statistics/byathlete?category=scoring&sort=points` | ✅ CONFIRMÉ (même domaine) | Page "Leaders NBA" — top scorers, assisters, etc. |
| Leaders core API | `sports.core.api.espn.com/v2/.../nba/leaders` | 🟡 À TESTER | Alternative si web API insuffisante |
| Leaders v3 (schéma enrichi) | `sports.core.api.espn.com/v3/.../nba/leaders` | 🟡 À TESTER | Stats avancées leaders |

#### Liste joueurs
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Tous les joueurs actifs NBA | `sports.core.api.espn.com/v2/.../nba/athletes?active=true&limit=500` | 🟡 À TESTER | Moteur de recherche joueur, autocomplétion |
| Joueurs d'une saison | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/athletes` | 🟡 À TESTER | Recherche historique |
| Free agents | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/freeagents` | 🟡 À TESTER | Contexte off-season |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Stats avancées (PER, Win Shares, VORP, BPM) | ❌ Non disponibles sur ESPN — Basketball Reference uniquement |
| Shooting charts (shot locations) | ❌ Données ESPN non exposées publiquement |
| Tracking data (vitesse, distance) | ❌ NBA uniquement, API propriétaire |
| Salaires détaillés | ❌ ESPN ne les publie pas — Spotrac/HoopsHype |

---

## 5. Classements NBA

### Ce qu'on fait déjà
Classement Swish League uniquement (pronos) — pas de classement NBA réel.

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Standings conférences Est/Ouest | `site.api.espn.com/.../nba/standings` | ✅ CONFIRMÉ | Bloc "Classement NBA" dans Accueil ou page dédiée |
| Standings core (détaillé : bilan dom/ext, série en cours, PPG…) | `sports.core.api.espn.com/v2/.../nba/standings` | 🟡 À TESTER | Classement enrichi avec + de colonnes |
| Divisions | `site.api.espn.com/.../nba/groups` | ✅ CONFIRMÉ | Filtre par division dans classement |
| Rankings (NCAA, si extension scope) | `site.api.espn.com/.../mens-college-basketball/rankings` | ✅ CONFIRMÉ | Hors scope NBA mais disponible |
| Power Index BPI (classement ESPN) | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/powerindex` | 🟡 À TESTER | Classement qualitatif ESPN dans page Stats |
| BPI Leaders | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/powerindex/leaders` | 🟡 À TESTER | Top équipes selon ESPN BPI |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Standings temps réel mid-game | ❌ Les standings ESPN ne se mettent à jour qu'en fin de match |
| Probabilités qualification playoffs (custom) | ❌ ESPN ne les expose pas — FiveThirtyEight (défunt) ou calcul maison |

---

## 6. Données match enrichies (live & pré-match)

### Ce qu'on fait déjà
Via `summary` : score, quart-temps, stats équipes, leaders, L5, blessés, série playoff.

### Ce qu'on peut faire en plus
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Win probability (courbe live) | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/probabilities` | 🟡 À TESTER | Graphe win probability dans MatchDetail live |
| Game Predictor ESPN (avant match) | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/predictor` | 🟡 À TESTER | "ESPN prédit X% de chances pour [équipe]" dans MatchDetail |
| Play-by-play complet | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/plays` | 🟡 À TESTER | Mode "suivi live" dans MatchDetail |
| Situation de jeu live (possession, temps restant) | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/situation` | 🟡 À TESTER | Indicateur live enrichi |
| Cotes bookmakers | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/odds` | 🟡 À TESTER | Contexte prono — "la cote ESPN BET est X" |
| Diffuseurs TV | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/broadcasts` | 🟡 À TESTER | "Où regarder ce match" dans MatchDetail |
| Package complet CDN (combine tout ci-dessus) | `cdn.espn.com/core/nba/game?xhr=1&gameId={id}` | 🟡 À TESTER | Un seul appel pour remplacer summary + enrichissements live |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Score live push (WebSocket) | ❌ ESPN ne propose pas de WebSocket public — polling requis |
| Audio/vidéo du match | 🔒 Derrière ESPN+ auth |
| Stats joueur en temps réel (points du match en cours) | ⚠️ Disponible via play-by-play mais complexe à agréger |

---

## 7. News & Médias

### Ce qu'on fait déjà
Rien — pas de news ESPN actuellement dans l'app.

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| News NBA générales | `site.api.espn.com/.../nba/news` | ✅ CONFIRMÉ | Bloc "Actu NBA" dans Accueil |
| News par équipe | `site.api.espn.com/.../nba/news?team={id}` | ✅ CONFIRMÉ | News dans fiche équipe |
| News par joueur | `site.api.espn.com/.../nba/athletes/{id}/news` | ✅ CONFIRMÉ | News dans fiche joueur |
| Feed temps réel NBA (now API) | `now.core.api.espn.com/v1/sports/news?leagues=nba&limit=10` | 🟡 À TESTER | Actu temps réel (alternative au endpoint news standard) |
| Transactions ligue (trades, signatures) | `site.api.espn.com/.../nba/transactions` | ✅ CONFIRMÉ | Bloc "Mouvements" dans Accueil |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Articles complets ESPN | ❌ L'API retourne titres + résumés, pas le corps complet (paywall ESPN) |
| Vidéos highlights | 🔒 Derrière ESPN+ auth |
| Podcasts ESPN | ❌ Non exposés via API publique |

---

## 8. Assets visuels

### Ce qu'on fait déjà
Logos équipes via champ `logo` du scoreboard. Photos joueurs via `headshot.href` du summary.

### Ce qu'on peut faire en plus
| Asset | Source | Statut | Format / Notes |
|---|---|---|---|
| Logo équipe HD | `teams/{id}` → champ `logos[0].href` | ✅ CONFIRMÉ | PNG transparent, multiple tailles dispo (`?scale=`) |
| Logo équipe fond sombre / fond clair | `logos[0]` vs `logos[1]` dans fiche équipe | ✅ CONFIRMÉ | Utiliser la variante adaptée au fond dark de l'app |
| Couleur primaire équipe | `teams/{id}` → champ `color` (hex sans #) | ✅ CONFIRMÉ | Theming dynamique par équipe dans cards |
| Couleur secondaire équipe | `teams/{id}` → champ `alternateColor` | ✅ CONFIRMÉ | Dégradés aux couleurs de l'équipe |
| Photo joueur (headshot) | `athletes/{id}` → champ `headshot.href` | ✅ CONFIRMÉ | JPG ESPN CDN, taille variable |
| Photo joueur action | Non disponible via ESPN API publique | ❌ | Getty Images uniquement |
| Photo coach | `coaches/{id}` via core API | 🟡 À TESTER | Si on ajoute une section coaches |
| Image bannière équipe | Non disponible | ❌ | À sourcer manuellement (Unsplash, etc.) |

### Bonnes pratiques assets ESPN
- Les URLs de logos sont stables mais non garanties → prévoir un fallback texte/initiales
- Ajouter `?scale=small/medium/large` pour contrôler la taille
- Les headshotss joueurs ont parfois un format portrait différent selon l'ancienneté du joueur
- Couleurs hex ESPN : supprimer le `#` s'il est absent, et le préfixer si besoin

---

## 9. Données historiques

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Profondeur historique |
|---|---|---|---|
| Scores matchs passés | `scoreboard?dates=YYYYMMDD` | ✅ CONFIRMÉ | Depuis ~2003 |
| Summary match passé | `summary?event={id}` | ✅ CONFIRMÉ | Depuis ~2003 (si espn_id connu) |
| Stats saisons passées joueur | `athletes/{id}/statisticslog` | 🟡 À TESTER | Plusieurs saisons (profondeur à confirmer) |
| Palmarès équipe | `teams/{id}/history` | ✅ CONFIRMÉ | Historique franchise complet |
| Draft historique | `seasons/{year}/draft` | 🟡 À TESTER | Par année de draft |
| Toutes les saisons disponibles | `sports.core.api.espn.com/v2/.../nba/seasons` | 🟡 À TESTER | Liste pour navigation historique |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Matchs avant 2003 | ❌ ESPN ne couvre pas de façon fiable l'ère pré-digitale |
| Stats saison 1990s ou 1980s | ❌ Partielles ou absentes — Basketball Reference pour cette période |
| Play-by-play historique | ❌ Disponible uniquement pour matchs récents |

---

## 10. Cotes & Prédictions

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Cotes match (Caesars, FanDuel, DraftKings, ESPN BET…) | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/odds` | 🟡 À TESTER | Contexte prono dans MatchDetail — "les bookmakers donnent X favori" |
| Win probability pré-match et live | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/probabilities` | 🟡 À TESTER | Indicateur de difficulté du prono |
| Game Predictor ESPN | `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/predictor` | 🟡 À TESTER | "ESPN prédit [équipe] gagnante" |
| Futures (champion de conférence, MVP…) | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/futures` | 🟡 À TESTER | Section paris long terme |
| Records ATS (against the spread) par équipe | `sports.core.api.espn.com/v2/.../seasons/{year}/types/{type}/teams/{id}/ats` | 🟡 À TESTER | Stats avancées équipe dans fiche équipe |

**IDs bookmakers ESPN disponibles :**
- Caesars : 38 | FanDuel : 37 | DraftKings : 41 | BetMGM : 58 | ESPN BET : 68 | Bet365 : 2000

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Cotes en temps réel (live betting) | ❌ ESPN ne met pas à jour les cotes pendant le match |
| Toutes les maisons de paris (Unibet, Winamax…) | ❌ ESPN couvre uniquement les partenaires US |
| Calcul de value bet | ❌ Logique à implémenter côté app si besoin |

> ⚠️ **Note RGPD / légale :** Afficher des cotes de bookmakers peut nécessiter une mention légale selon la juridiction. En France, la publicité pour les jeux d'argent est encadrée (ANJ). À traiter avec précaution si l'app devient publique.

---

## 11. Draft & Transactions

### Ce qu'on peut faire
| Donnée | Endpoint | Statut | Cas d'usage Swish League |
|---|---|---|---|
| Draft par année (picks, joueurs, équipes) | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/draft` | 🟡 À TESTER | Page draft historique, fiche joueur (position de draft) |
| Free agents | `sports.core.api.espn.com/v2/.../nba/seasons/{year}/freeagents` | 🟡 À TESTER | Période off-season |
| Transactions ligue (trades, waiver, extensions) | `site.api.espn.com/.../nba/transactions` | ✅ CONFIRMÉ | Bloc "mouvements" dans Accueil ou fiche équipe |
| Transactions par équipe | `site.api.espn.com/.../nba/teams/{id}/transactions` | ✅ CONFIRMÉ | Fiche équipe — dernières arrivées/départs |

### Ce qu'on ne peut pas faire
| Donnée | Raison |
|---|---|
| Détail des contrats (durée, montant, clauses) | ❌ ESPN ne publie pas les contrats — Spotrac uniquement |
| Trade machine / simulateur | ❌ Logique propriétaire ESPN, non exposée |

---

## 12. Hors scope ESPN — alternatives

Ce qui n'est pas disponible via ESPN et nécessiterait une autre source.

| Donnée souhaitée | Pourquoi pas ESPN | Alternative possible | Faisabilité |
|---|---|---|---|
| Stats avancées (PER, Win Shares, RAPTOR…) | ❌ ESPN ne les expose pas | Basketball Reference (scraping légal) | 🟡 Complexe |
| Shooting charts / shot zones | ❌ Données NBA tracking, non publiques | NBA Stats API (bloquée depuis France) | 🔴 BLOQUÉ |
| Données biométriques (vitesse, accélération) | ❌ Proprietaire NBA | Second Spectrum (propriétaire) | ❌ |
| Salaires et contrats détaillés | ❌ Hors ESPN | Spotrac, HoopsHype | 🟡 Scraping |
| Highlights vidéo | 🔒 ESPN+ uniquement | YouTube Data API (clips officiels) | 🟡 Possible |
| Tweets / réactions sociales | ❌ Twitter/X API payante | RSS / nitter alternatifs | 🔴 Instable |
| Classements fantasy publics | ✅ Partiellement ESPN fantasy | `fantasy.espn.com/apis/v3/games/fba/...` | 🟡 Ligues publiques seulement |
| Paris sportifs (odds FR) | ❌ ESPN couvre US uniquement | Odds API (freemium) | 🟡 Clé API requise |

---

## RÉCAPITULATIF DÉCISIONNEL

### ✅ Faisable immédiatement (CORS confirmé, zéro proxy)
- Standings NBA conférences
- News NBA + news par équipe + news par joueur
- Table équipes complète (logos, couleurs, IDs)
- Roster, schedule, injuries, transactions par équipe
- Calendrier officiel saison (bornes, phases)
- Overview + stats saison joueur (même domaine que summary)
- Leaders stats NBA (leaderboard)
- Assets visuels (logos HD, couleurs hex)

### 🟡 Faisable après test CORS (sports.core.api.espn.com)
- Win probability, Game Predictor, cotes
- Play-by-play, situation de jeu live
- Stats carrière joueur, historique, splits avancés
- BPI, futures, ATS records
- Draft, free agents

### 🔴 Nécessite proxy (Supabase Edge Function)
- Tout ce qui est sur `sports.core.api.espn.com` si le CORS est bloqué
- Leaders stats via `site.api.espn.com/leaders` (déjà documenté comme bloqué)

### ❌ Hors de portée ESPN
- Stats avancées (PER, Win Shares, RAPTOR)
- Shooting charts / tracking data
- Salaires / contrats
- Vidéos highlights
- Scores push temps réel (WebSocket)

---

## PROCHAINE ÉTAPE RECOMMANDÉE

Avant de coder quoi que ce soit sur les endpoints 🟡, faire une session de test CORS :
1. Ouvrir la console navigateur sur l'app en prod
2. Tester `sports.core.api.espn.com/v2/sports/basketball/leagues/nba/standings`
3. Tester `sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/probabilities`
4. Documenter les résultats dans ce fichier en mettant à jour les statuts 🟡 → ✅ ou 🔴

---

*Document v1.0 — 2026-05-27*
*Source : github.com/pseudo-r/Public-ESPN-API (mars 2026) + validation terrain projet Swish League*
*Prochaine révision : après session test CORS `sports.core.api.espn.com`*
