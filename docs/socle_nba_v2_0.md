# SWISH LEAGUE — SOCLE v2.0
> Document de référence unique — fusion socle + audit  
> Mis à jour le 2026-05-28 | Basé sur socle v1.1 + audit v1.4 + audit de cohérence inter-versions

---

## SOMMAIRE

1. [Projet & philosophie](#1-projet--philosophie)
2. [Identité visuelle & design system](#2-identité-visuelle--design-system)
3. [Sources de données ESPN](#3-sources-de-données-espn)
4. [BDD Supabase](#4-bdd-supabase)
5. [Architecture fichiers](#5-architecture-fichiers)
6. [Navigation & routes](#6-navigation--routes)
7. [Fonctionnalités livrées](#7-fonctionnalités-livrées)
8. [Risques ouverts](#8-risques-ouverts)
9. [Dette technique ouverte](#9-dette-technique-ouverte)
10. [Backlog](#10-backlog)
11. [Règles de travail](#11-règles-de-travail)
12. [RGPD & sécurité](#12-rgpd--sécurité)
13. [Veille technique](#13-veille-technique)

---

## 1. Projet & philosophie

**App web NBA communautaire** — pronos entre amis, stats, scores, classements.  
Nom de marque : **Swish League** (nom de travail initial : NBA Pronostics).  
Périmètre : Planify ecosystem — planificateur sportif de saison.  
Vitrine IA Prismora Solutions.

**Philosophie :** "Les données d'abord, l'interface suit."  
App entre potes : compétition amicale, chambrage, passion basket.  
Mobile first. Rapide. Lisible. Sans surcharge.

### Stack technique — 100% gratuit
- **Front :** React + Vite
- **Deploy :** Vercel (Hobby, non-commercial)
- **Back :** Supabase (PostgreSQL + Auth + Storage) — ⚠️ pause après 1 semaine d'inactivité
- **IA :** Gemini (Google Workspace) — phase 2 uniquement, pas dans le MVP
- **CSS :** pas de framework — tokens CSS centralisés dans `index.css`
- **Icônes :** Lucide React
- **Fonts :** Inter (body) + Barlow Condensed (display/scores) — Google Fonts

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

### Documentation ESPN API — Référence
Source : https://github.com/pseudo-r/Public-ESPN-API  
Doc communautaire complète des endpoints ESPN non officiels — NBA, NFL, MLB, NHL...  
Couvre : endpoints, paramètres URL, formats JSON, exemples curl, scores live, standings.  
⚠️ Consulter en priorité avant tout nouvel appel ESPN inconnu.  
Référence capacités cartographiées : `espn_capacites_v1_0.md`

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE  
**Logo :** `src/assets/swish_league_logo.png` (bouclier basket, rouge/bleu marine)  
**Accroche :** "Pronostique. Clashe. Règne."  
**Baseline :** "Suis la saison NBA, pronostique chaque match avant le tip-off et compare tes résultats avec tes potes. Classements, stats perso, fiches match détaillées — tout ce qu'il faut pour savoir qui prédit le mieux… et qui la ramène pour rien."

### Tokens CSS (index.css)
```
--bg-0: #0d0d12        fond principal
--bg-1: #12121c        cartes / surfaces
--bg-2: #1a1a2e        fonds secondaires
--border: #1e1e2e      bordures
--border-2: #2a2a3e    bordures secondaires
--accent: #6366f1      violet indigo (principal)
--accent-dim: rgba(99,102,241,0.12)
--accent-border: rgba(99,102,241,0.5)
--orange: #f97316      accent secondaire NBA
--success: #22c55e     correct / victoire
--success-dim: rgba(34,197,94,0.10)
--danger: #ef4444      raté / défaite
--danger-dim: rgba(239,68,68,0.10)
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #8080a0      texte tertiaire / paragraphes
--font-body: Inter
--font-display: Barlow Condensed
--radius-sm / md / lg : 6px / 10px / 14px
```

### Composants réutilisables — `src/components/UI.jsx`
Centralisés dans `UI.jsx` — modifier ici applique partout.

**LabelSection** — titre de section en dégradé accent→orange (texte transparent clip)  
**BanniereImage** — bande image Unsplash hauteur 110px, overlay dégradé lateral rgba 0.75/0.35/0.75, bordures accent 0.2  
**Bloc** — card arrondie radius-lg, gradient 160deg rgba(99,102,241,0.08)→transparent, border rgba(99,102,241,0.08), prop `style` pour overrides  
**Header plein bord** — même gradient que Bloc mais sans border et sans border-radius (bord à bord)

### Règle headers
- Accueil, Classement, Calendrier, Groupes, Stats : header plein bord
- Profil, MesPronos : header en Bloc arrondi
- Connexion / Inscription : pas de header, card centrée avec logo

### Images bannières (Unsplash — libres de droits)
```
Tribune foule   : https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60
Terrain Raptors : https://images.unsplash.com/photo-1533923156502-be31530547c4?w=800&q=60
Ballon close-up : https://images.unsplash.com/photo-1627627256672-027a4613d028?w=800&q=60
Joueurs terrain : https://images.unsplash.com/photo-1563506644863-444710df1e03?w=800&q=60
Ballon texture  : https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=800&q=60
```

---

## 3. Sources de données ESPN

### Domaines — statuts CORS validés terrain (2026-05-28)

| Domaine | Statut CORS | Notes |
|---|---|---|
| `site.api.espn.com` | ✅ OK | Sauf `/leaders` et `/athletes/{id}` |
| `site.web.api.espn.com` | ✅ OK | |
| `sports.core.api.espn.com` | ✅ OK | Validé 2026-05-28 |
| `site.api.espn.com/leaders` | 🔴 BLOQUÉ | Proxy requis |
| `site.api.espn.com/athletes/{id}` | 🔴 BLOQUÉ (404) | Utiliser données roster |
| `site.api.espn.com/teams?limit=30` | 🔴 BLOQUÉ | Extraire depuis standings |

### Endpoints actuellement utilisés
```
Scoreboard      : site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
Summary         : site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={id}
Standings       : site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026&seasontype=2
News            : site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=5
Roster          : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster
Injuries        : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries
Stats joueur    : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats?season=2026&seasontype=2
Predictor       : sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor
Bracket playoffs: site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates={plage7j}  ← SANS seasontype
```

### Endpoints validés CORS, non encore exploités
```
Play-by-play    : sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/plays
Cotes bookmakers: sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/odds
Game log joueur : site.web.api.espn.com/apis/common/v3/.../athletes/{id}/gamelog
Splits joueur   : site.web.api.espn.com/apis/common/v3/.../athletes/{id}/splits
```

### Endpoints confirmés non fonctionnels NBA
- `probabilities` : ❌ ESPN ne supporte pas win probability pour le basket NBA

### Types de saison ESPN — validés terrain
- `1` = Pré-saison | `2` = Saison régulière | `3` = Playoffs | `5` = International
- **NBA Cup = type 2** — ESPN ne la distingue pas. Type 4 absent du mapping.

### Types de compétition playoffs ESPN
- `14` / RD16 = 1er tour
- `15` / QTR = Demi-finales de conférence
- `16` / SEMI = Finales de conférence
- `17` / FINAL = Finales NBA

### ⚠️ Bracket Playoffs — stratégie de fetch
- Endpoint : `scoreboard?dates={plage}` **SANS** `seasontype=3`
- Plages de 7 jours sur avril-juin (fonction `plagesPlayoffs`)
- ESPN retourne données vides si `seasontype=3` combiné à une plage historique
- Déduplication par clé `typeId-idEquipe1-idEquipe2` triés — dernière occurrence = wins à jour

### ⚠️ Structure stats joueur ESPN
- Réponse : `categories[]` avec `name: "averages"`
- **Toujours filtrer par `season.year === 2026`** — `statistics[0]` = saison la plus ancienne
- Champs : `avgPoints`, `avgRebounds`, `avgAssists`, `avgSteals`, `avgBlocks`, `avgMinutes`, `fieldGoalPct`, `threePointFieldGoalPct`, `freeThrowPct`, `gamesPlayed`

### ⚠️ Structure roster ESPN
- Réponse : `athletes[]` directement (pas de groupes imbriqués)
- Champs : `id`, `fullName`, `firstName`, `lastName`, `jersey`, `position.abbreviation`, `position.displayName`, `headshot.href`, `displayHeight`, `displayWeight`, `age`

### ⚠️ Predictor ESPN
- Endpoint : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/predictor`
- Structure réponse : `statistics[].find(s => s.name === 'gameProjection').value`
- `gameProjection` est dans `statistics[]`, **pas** directement sur `homeTeam`/`awayTeam`

### Source backup
- balldontlie : `https://api.balldontlie.io/v1` — clé API gratuite requise, backup scores/matchs uniquement

---

## 4. BDD Supabase

Tables : `profils` | `groupes` | `membres_groupe` | `matchs` | `pronos`  
RLS activé sur toutes les tables. Grants : authenticated sur toutes les tables.

### profils
`id` (uuid, FK auth.users) | `pseudo` (text, unique) | `avatar_url` (text, nullable) | `description` (text, nullable) | `cree_le` (timestamptz)

### groupes
`id` | `nom` | `admin_id` | `date_fin` (date, nullable) | `type_saison` (int, nullable) | `saison` (int)  
`type_saison = null` → ligue générale (tous types de matchs)  
`type_saison = 3` → Playoffs uniquement, etc.

### membres_groupe
`id` | `user_id` | `groupe_id` | `points` | `actif` (boolean) — soft delete

### matchs
`id` | `espn_id` (unique) | `date_match` | `equipe_domicile` | `equipe_exterieur` | `statut` | `type_saison` (int) | `saison` (int)

### pronos
`id` | `user_id` | `match_id` | `groupe_id` (nullable) | `equipe_choisie` | `resultat` ('en_attente'|'correct'|'incorrect') | `points_gagnes` | `cree_le`  
Contrainte unique : **(user_id, match_id, groupe_id) NULLS NOT DISTINCT**

### RLS Supabase — état validé (2026-05-28)
- `groupes` INSERT : restreint à l'UUID admin `fa55d016-896c-4eb4-b48a-241d6be71ad0` en BDD
- `groupes` UPDATE : `auth.uid() = admin_id` ✅
- `groupes` DELETE : bloqué par défaut (RLS sans policy = refus) ✅
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id` ✅
- `profils` INSERT/UPDATE : `auth.uid() = id` ✅
- `pronos` INSERT/UPDATE : `auth.uid() = user_id` ✅

### Storage Supabase
Bucket `avatars` (public) — fichiers nommés `{user_id}.{ext}`, upsert activé  
Policies : lecture publique, upload/update restreint à l'utilisateur propriétaire

### Logique pronos multi-ligues
Un prono est enregistré **par ligue active correspondant au type du match** :
- Ligue `type_saison = null` (générale) → compte tous les matchs
- Ligue `type_saison = 3` (Playoffs) → compte uniquement les matchs de playoffs
- Si aucune ligue correspondante → prono enregistré avec `groupe_id = null` (hors ligue)

Fonction centralisée : `recupererLiguesCibles(userId, typeSaisonMatch)` dans `src/services/ligues.js`  
Importée par `Accueil.jsx` et `MatchDetail.jsx`. ✅ Confirmé en BDD et fonctionnel.

### Ligues créées pour 2026-2027
À créer via interface admin (type_saison ESPN, saison ESPN = 2027) :
- Ligue Pré-saison 2026-27 → type 1, saison 2027
- Ligue Saison régulière 2026-27 → type 2, saison 2027
- Ligue Playoffs 2026-27 → type 3, saison 2027
- Ligue Générale 2026-27 → type null, saison 2027

---

## 5. Architecture fichiers

```
src/
  App.jsx              — routing + session + NoSpoilProvider + ProfilProvider + PopupChangelog
  main.jsx
  index.css            — tokens CSS + fonts + reset + responsive
  assets/
    swish_league_logo.png
  lib/
    supabase.js
  context/
    NoSpoilContext.jsx — Context global mode No Spoil (localStorage)
    ProfilContext.jsx  — Context global profil utilisateur (pseudo + avatar_url)
  data/
    changelog.js       — CHANGELOG[] + VERSION_COURANTE (v1.1)
  services/
    espn.js            — recupererMatchs3Jours(), recupererDetailMatch(), recupererGagnant()
    points.js          — calculerPoints()
    ligues.js          — recupererLiguesCibles()
  pages/
    Accueil.jsx        — Board : header + toggle No Spoil + bannières + bande matchs + hub
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx      — stats perso + publiques via ?user_id, forme récente W/L
    MatchDetail.jsx    — fiche match + prono + prédiction ESPN (predictor)
    Calendrier.jsx
    Profil.jsx
    Stats.jsx          — Explorer : classements / équipes / joueurs
  components/
    UI.jsx             — LabelSection, BanniereImage, Bloc
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx — bracket visuel playoffs NBA
    ClassementRapide.jsx
    PronosAttente.jsx
    RunsPotes.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx   — Top 5 classement Est/Ouest + lien "Voir tout" → /stats
    SeriesPlayoffs.jsx — remplacé par BracketPlayoffs sur le Board
    NewsNBA.jsx
```

---

## 6. Navigation & routes

### Navigation
- **Desktop :** top navbar fixe — [Logo + SWISH LEAGUE] [Board] [Classement] [Mes stats] [Explorer] [Avatar+pseudo] [≡]
- **Mobile :** barre logo top 40px + bottom nav fixe 60px [Board] [Classement] [Mes stats] [Explorer]
- **Hamburger :** panneau droit — bloc profil + Explorer + Ligues + Calendrier + No Spoil + Quoi de neuf + Déconnexion

### Routes
```
/connexion     public
/inscription   public
/accueil       privé — Board
/classement    privé
/mes-pronos    privé — accepte ?user_id pour vue publique
/groupes       privé — Ligues
/match/:espn_id privé — fiche match détail
/calendrier    privé
/profil        privé
/stats         privé — Explorer (classements, équipes, joueurs)
```

---

## 7. Fonctionnalités livrées

### Auth ✅
Inscription, connexion, déconnexion, session persistante.

### Board (Accueil) ✅
- Header + accroche + toggle No Spoil
- BandeMatchs scrollable 3 jours → MatchDetail
- StandingsNBA : Top 5 Est/Ouest + lien "Voir tout" → /stats (saison régulière uniquement)
- BracketPlayoffs : bracket visuel playoffs complet (affiché si playoffs en cours)
- NewsNBA : 5 actus ESPN, masquées en No Spoil
- Mode No Spoil : scores masqués sur matchs terminés

### Bracket Playoffs (BracketPlayoffs.jsx) ✅
- Fetch scoreboard par plages de 7 jours (avril-juin) SANS seasontype=3
- Déduplication par paire d'équipes + typeId
- 4 rounds : 1er tour / Demi-finales / Finales conf / Finales NBA
- Conférence déduite depuis standings
- 3 modes adaptatifs : normal (≥520px) / compact (<520px) / ultra (<380px)
- Scroll centré sur la colonne Finales NBA au chargement
- No Spoil : scores masqués, summaries cachés
- Utilisé dans Board (si playoffs) et disponible pour intégration Stats.jsx

### Fiche match (MatchDetail) ✅
- Badges saison + type + Live
- Série playoffs : description + summary
- Affiche : logos + trigrammes + noms + Ext/Dom
- Score final ou VS + heure selon statut
- Scores par quart-temps (Q1/Q2/Q3/Q4 + OT)
- Lieu + stade + ville + date/heure
- Forme récente L5
- Stats moyennes saison (PPG, FG%, 3P%, REB, AST, BLK, STL, TO)
- Leaders (Points/Passes/Rebonds) avec photo headshot
- Blessés/Absents avec photo + statut + type
- Prono intégré : clic sur logo/équipe (verrouillé si match commencé/terminé ou heure dépassée)
- Indicateur prono : Mon prono / Correct / Raté
- Bloc "Prédiction avant match" (predictor ESPN) : barre % + verdict, visible avant/pendant le match

### Mode No Spoil ✅
- BracketPlayoffs : scores masqués, summaries cachés
- SeriesPlayoffs : scores masqués, badge "🙈 No Spoil actif"
- BandeMatchs, Calendrier, MatchDetail : scores masqués sur terminés

### Explorer (Stats.jsx) ✅
- Onglet Classements : standings Est/Ouest, sélecteur de saison historique depuis 2002
- Onglet Équipes : 30 franchises + fiches avec roster trié par PPG
- Onglet Joueurs : ~450 joueurs, filtre équipe + recherche textuelle

### Pronos ✅
- Upsert Supabase — contrainte unique (user_id, match_id, groupe_id)
- Verrouillage auto côté client (heure + statut ESPN)
- Rattachement automatique à la bonne ligue selon type_saison du match
- Calcul points au chargement Board (`calculerPoints`)

### Classement ✅
- Sélecteur ligues
- Podium top 3 (médailles)
- Liste complète triée par points
- Stats enrichies inline : points / corrects / ratés / %
- Clic ligne → /mes-pronos?user_id=xxx

### Mes stats / Profil public (MesPronos) ✅
- Lit `?user_id` — affiche stats de n'importe quel user
- Header : avatar + pseudo + bio
- Badge "Profil public · pronos en attente masqués" si autre user
- Stats globales : total / corrects / ratés / %
- Forme récente : 5 derniers W/L triés par date de match
- Historique pronos (en attente masqués pour les autres)
- Lien → MatchDetail (pour soi uniquement)

### Ligues (Groupes) ✅
- Liste publique — rejoindre en un clic
- Création réservée à l'admin (ADMIN_ID hardcodé côté client, sécurisé RLS côté BDD)
- Champs : nom, type ESPN (1-5 ou null=général), saison ESPN, date de clôture optionnelle
- Clôture automatique si date_fin dépassée
- Tri : actives en haut, terminées en bas

### Calendrier ✅
- Vues : 1j / 3j / Semaine / Mois
- Navigation + bouton Aujourd'hui
- Filtres : type de match (NBA Cup supprimé) + équipe
- Cache local par date
- No Spoil : scores masqués sur terminés
- Historique depuis ~2003
- Clic jour mois : 1 match → MatchDetail, 2+ → zoom 1j

### Profil ✅
- Édition pseudo, bio
- Upload avatar (Supabase Storage)
- Stats perso affichées

### Popup Changelog ✅
- S'affiche une fois par version (localStorage)
- Accessible depuis hamburger "Quoi de neuf ?"
- Encart No Spoil intégré

---

## 8. Risques ouverts

### RISQUE-02 — `calculerPoints` sans verrou → race condition
**Sévérité :** 🟡 Moyenne  
`calculerPoints` est déclenché au chargement du Board par chaque utilisateur simultanément, sans verrou distribué. Risque de double-écriture sur `points_gagnes` en cas de connexions simultanées.  
**Solution long terme :** Edge Function Supabase (voir backlog 5.5). Acceptable en l'état pour le cercle actuel.

### RISQUE-07 — Limite Vercel Hobby ~100 déploiements/jour
**Sévérité :** 🟢 Faible  
Ne pas pusher trop souvent en session intensive. Reset à minuit UTC.

---

## 9. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible  
Appels parallèles, pas bloquant. Pas de cache entre sessions. Amélioration possible : sessionStorage ou mise en cache state React.

### DETTE-09 — BracketPlayoffs : saison passée en dur (`saison={2026}`) dans Accueil.jsx
**Sévérité :** 🟢 Faible  
À mettre à jour manuellement chaque saison. Alternative : déduire depuis `matchs[0].saisonNum`.

### DETTE-10 — BracketPlayoffs non intégré dans Stats.jsx
**Sévérité :** 🟢 Faible  
Composant prêt, à brancher dans l'onglet Classements de Stats.jsx (voir backlog 5.1).

---

## 10. Backlog

### Phase 5 — Backlog actif

| # | Action | Priorité | Notes |
|---|---|---|---|
| 5.1 | Intégration BracketPlayoffs dans Stats.jsx (onglet Classements) | 🟡 Moyenne | Composant prêt, à brancher |
| 5.2 | Game log joueur dans fiche joueur | 🟡 Moyenne | Endpoint CORS validé |
| 5.3 | Splits joueur dans fiche joueur | 🟡 Moyenne | Endpoint CORS validé |
| 5.4 | Dashboard fiche joueur — visualisations stats | 🟡 Moyenne | Présenter la fiche joueur sous forme de dashboard enrichi (graphiques evolution PPG, comparatif saisons, forme). Endpoint gamelog + splits disponibles. À étoffer progressivement. |
| 5.5 | Edge Function Supabase — calcul points serveur + verrou | 🟢 Basse | Corrige RISQUE-02. Déclencher si audience élargie. |
| 5.6 | Chat entre membres d'une ligue | 🟢 Basse | Fonctionnalité communautaire — messagerie légère par ligue (pas global). À concevoir : temps réel Supabase Realtime ou polling simple. |
| 5.7 | Badges utilisateurs | 🟢 Basse | Système de récompenses : séries de pronos corrects, taux de réussite, titres saison. À concevoir et gamifier. |
| 5.8 | Notifications push résultats pronos | 🟢 Basse | Web Push API (navigateurs modernes, y compris mobile). Faisable sans app native. Desktop : à la connexion. Mobile web : nécessite PWA manifest + service worker. À évaluer effort/valeur. |
| 5.9 | Historique carrière joueur | 🟢 Basse | Endpoint `statisticslog` sports.core.api.espn.com — CORS OK |
| 5.10 | Sélecteur de saison dans Calendrier | 🟢 Basse | Nice to have — navigation manuelle suffisante pour l'instant |

### Mis de côté (décision 2026-05-28)

| # | Action | Raison |
|---|---|---|
| — | IA Gemini — suggestions pronos, résumés matchs | Phase 2, après stabilisation |
| — | News FR via RSS + proxy Edge Function | Dépend Edge Function |
| — | Bonus score exact + bonus série | Dépend Edge Function |

### Backlog hors MVP (idées long terme)

- Fantasy league
- Système de draft
- App mobile native (Capacitor ou React Native)
- PWA iOS plein écran (problème Safari/React Router — chantier dédié)
- IA prédictive
- Historique complet saisons
- Comparaison joueurs H2H

---

## 11. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement — HTML/CSS/JS vanilla interdit
- Variables et commentaires en français
- **Toujours indiquer fichier + ligne ou bloc + contexte (lignes avant/après) pour toute modification de code — jamais de "ajoute ça" sans emplacement précis**
- Jamais border shorthand + longhand sur le même élément (warnings React)
- Appels ESPN : surveiller stabilité + CORS — API non officielle
- Supabase : anticiper pause inactivité en dev (1 semaine)
- RGPD : pas de données sensibles, minimisation profil
- En début de session : uploader uniquement les fichiers modifiés depuis la dernière session
- **Une modification à la fois — push + test entre chaque**
- **Toujours réécrire les fichiers complets — jamais de modifications partielles**
- Vercel Hobby : limite ~100 déploiements/jour — ne pas pusher trop souvent en session intensive

---

## 12. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar (Storage), bio, historique pronos.  
Clé balldontlie : variable d'environnement, jamais en dur.  
`.env` dans `.gitignore` — clés Supabase jamais commitées.  
ESPN API : aucune donnée personnelle dans les requêtes.  
ADMIN_ID hardcodé côté client — sécurisé côté BDD (RLS INSERT restreint à l'UUID admin), acceptable en prod.  
Avatars : bucket public Supabase Storage, pas de données sensibles.

---

## 13. Veille technique

- **ESPN API non officielle :** surveiller tout changement de structure ou blocage CORS — aucune garantie de stabilité
- **Supabase :** surveiller évolutions du free tier (pause inactivité, limites)
- **Vercel Hobby :** usage non-commercial uniquement
- **Modèle Claude :** vérifier le modèle disponible à chaque session (`claude-sonnet-4-20250514` au 2026-05-28)

---

*Document v2.0 — 2026-05-28*  
*Fusion complète socle v1.1 + audit v1.4 + audit de cohérence inter-versions v0.1→v1.1*  
*Remplace et archive tous les documents socle et audit antérieurs.*
