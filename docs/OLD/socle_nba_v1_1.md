# NBA SOCLE v1.1 — 2026-05-28

## Projet
App web NBA communautaire — pronos entre amis, stats, scores, classements.
Nom de marque : **Swish League** (nom de travail initial : NBA Pronostics).
Périmètre : Planify ecosystem — planificateur sportif de saison.
Vitrine IA Prismora Solutions.

## Philosophie
"Les données d'abord, l'interface suit."
App entre potes : compétition amicale, chambrage, passion basket.
Mobile first. Rapide. Lisible. Sans surcharge.

## Stack technique — 100% gratuit
Front : React + Vite | Deploy : Vercel (Hobby, non-commercial)
Back : Supabase (PostgreSQL + Auth + Storage) — ⚠️ pause après 1 semaine d'inactivité
IA : Gemini (Google Workspace) — phase 2 uniquement, pas dans le MVP
CSS : pas de framework — tokens CSS centralisés dans index.css
Icônes : Lucide React
Fonts : Inter (body) + Barlow Condensed (display/scores) — Google Fonts

## Documentation ESPN API — Référence
Source : https://github.com/pseudo-r/Public-ESPN-API
Doc communautaire complète des endpoints ESPN non officiels — NBA, NFL, MLB, NHL...
Couvre : endpoints, paramètres URL, formats JSON, exemples curl, scores live, standings.
⚠️ À consulter en priorité avant tout nouvel appel ESPN : endpoints, structure JSON, paramètres.
Claude doit fetcher cette doc en début de session si besoin d'un endpoint inconnu ou d'une structure de réponse.

## URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

## Identité visuelle
Nom affiché : **SWISH LEAGUE**
Logo : `src/assets/swish_league_logo.png` (bouclier basket, rouge/bleu marine)
Accroche : "Pronostique. Clashe. Règne."
Baseline : "Suis la saison NBA, pronostique chaque match avant le tip-off et compare tes résultats avec tes potes. Classements, stats perso, fiches match détaillées — tout ce qu'il faut pour savoir qui prédit le mieux… et qui la ramène pour rien."

## Design system — tokens CSS (index.css)
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

## Charte UI — composants réutilisables
Centralisés dans `src/components/UI.jsx` — modifier ici applique partout.

**LabelSection** — titre de section en dégradé accent→orange (texte transparent clip)
**BanniereImage** — bande image Unsplash hauteur 110px, overlay dégradé lateral rgba 0.75/0.35/0.75, bordures accent 0.2
**Bloc** — card arrondie radius-lg, gradient 160deg rgba(99,102,241,0.08)→transparent, border rgba(99,102,241,0.08), prop `style` pour overrides
**Header plein bord** — même gradient que Bloc mais sans border et sans border-radius (bord à bord)

### Règle headers
- Accueil, Classement, Calendrier, Groupes, Stats : header plein bord
- Profil, MesPronos : header en Bloc arrondi
- Connexion / Inscription : pas de header, card centrée avec logo

### Images bannières (Unsplash — libres de droits)
- Tribune foule : `https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800&q=60`
- Terrain NBA Raptors : `https://images.unsplash.com/photo-1533923156502-be31530547c4?w=800&q=60`
- Ballon close-up : `https://images.unsplash.com/photo-1627627256672-027a4613d028?w=800&q=60`
- Joueurs terrain : `https://images.unsplash.com/photo-1563506644863-444710df1e03?w=800&q=60`
- Ballon texture : `https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=800&q=60`

## Sources de données — validées
### Source principale : ESPN API non officielle
- Scoreboard : `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD`
- Summary : `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={espn_id}`
- Standings : `https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026&seasontype=2`
- News : `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=5`
- Roster : `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster`
- Injuries : `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries`
- Stats joueur : `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats?season=2026&seasontype=2`
- Predictor match : `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor`
- Sans clé API, sans auth, accessible depuis France
- Historique disponible depuis ~2003
- Les 3 appels scoreboard (Board) sont lancés en parallèle — timeout 8s sur tous les fetch

### ⚠️ Bracket Playoffs — stratégie de fetch
- Endpoint : `site.api.espn.com/.../scoreboard?dates={plage}` SANS `seasontype=3`
- Plages de 7 jours sur avril-juin de la saison (fonction `plagesPlayoffs`)
- ESPN retourne des données vides si `seasontype=3` est combiné à une plage historique
- Types de compétition playoffs : `14`=1er tour, `15`=Demi-finales conf, `16`=Finales conf, `17`=Finales NBA
- Déduplication par clé `typeId-idEquipe1-idEquipe2` triés — dernière occurrence = wins à jour
- `probabilities` endpoint : ❌ non supporté pour le basket NBA par ESPN
- `predictor` endpoint : ✅ retourne `statistics[].gameProjection` (pas directement `homeTeam.gameProjection`)

### ⚠️ Structure stats joueur ESPN
- Endpoint : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/stats?season=2026&seasontype=2`
- Réponse : `categories[]` avec `name: "averages"`
- Stats dans `categories[0].statistics[]` — tableau par saison
- **Toujours filtrer par `season.year === 2026`** — `statistics[0]` = saison la plus ancienne, pas la courante
- Noms des champs : `avgPoints`, `avgRebounds`, `avgAssists`, `avgSteals`, `avgBlocks`, `avgMinutes`, `fieldGoalPct`, `threePointFieldGoalPct`, `freeThrowPct`, `gamesPlayed`

### ⚠️ Structure roster ESPN
- Endpoint : `site.api.espn.com/.../teams/{id}/roster`
- Réponse : `athletes[]` directement (pas de groupes imbriqués)
- Champs : `id`, `fullName`, `firstName`, `lastName`, `jersey`, `position.abbreviation`, `position.displayName`, `headshot.href`, `displayHeight`, `displayWeight`, `age`

### ⚠️ CORS — validés terrain (2026-05-28)
- `site.api.espn.com` : ✅ CORS OK (sauf `/leaders` et `/athletes/{id}`)
- `site.web.api.espn.com` : ✅ CORS OK
- `sports.core.api.espn.com` : ✅ CORS OK (validé session 2026-05-28)
- `site.api.espn.com/leaders` : 🔴 CORS bloqué — proxy nécessaire
- `site.api.espn.com/athletes/{id}` : 🔴 CORS bloqué (404) — utiliser données roster
- `site.api.espn.com/teams?limit=30` : 🔴 CORS bloqué — extraire depuis standings

### ⚠️ Types de saison ESPN — validés terrain
- 1 = Pré-saison | 2 = Saison régulière | 3 = Playoffs | 5 = International
- **NBA Cup = type 2** (saison régulière) — ESPN ne la distingue PAS. Type 4 absent du mapping.

### ⚠️ Types de compétition playoffs ESPN
- `14` / `RD16` = 1er tour
- `15` / `QTR` = Demi-finales de conférence
- `16` / `SEMI` = Finales de conférence
- `17` / `FINAL` = Finales NBA

### Source backup : balldontlie
- `https://api.balldontlie.io/v1` — clé API gratuite requise, backup scores/matchs uniquement

### Hors jeu
- nba_api (Python) : bloqué depuis France
- stats.nba.com : inaccessible depuis France

## Schéma BDD Supabase
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

## Logique pronos multi-ligues
Un prono est enregistré **par ligue active correspondant au type du match** :
- Ligue `type_saison = null` (générale) → compte tous les matchs
- Ligue `type_saison = 3` (Playoffs) → compte uniquement les matchs de playoffs
- Si aucune ligue correspondante → prono enregistré avec `groupe_id = null` (hors ligue)

Fonction `recupererLiguesCibles(userId, typeSaisonMatch)` — centralisée dans `src/services/ligues.js`, importée par `Accueil.jsx` et `MatchDetail.jsx`.

## Architecture fichiers
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
    MesPronos.jsx
    MatchDetail.jsx    — fiche match + prono + prédiction ESPN (predictor)
    Calendrier.jsx
    Profil.jsx
    Stats.jsx          — Explorer : classements / équipes / joueurs
  components/
    UI.jsx             — LabelSection, BanniereImage, Bloc
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx — bracket visuel playoffs NBA (nouveau v1.1)
    ClassementRapide.jsx
    PronosAttente.jsx
    RunsPotes.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx   — Top 5 classement Est/Ouest + lien "Voir tout" → /stats
    SeriesPlayoffs.jsx — ⚠️ remplacé par BracketPlayoffs sur le Board
    NewsNBA.jsx
```

## Navigation
- Desktop : top navbar fixe — [Logo + SWISH LEAGUE] [Board] [Classement] [Mes stats] [Explorer] [Avatar+pseudo] [≡]
- Mobile : barre logo top 40px + bottom nav fixe 60px [Board] [Classement] [Mes stats] [Explorer]
- Hamburger : panneau droit — bloc profil + Explorer + Ligues + Calendrier + No Spoil + Quoi de neuf + Déconnexion

## Routes
```
/connexion          public
/inscription        public
/accueil            privé — Board
/classement         privé
/mes-pronos         privé — accepte ?user_id pour vue publique
/groupes            privé — Ligues
/match/:espn_id     privé — fiche match détail
/calendrier         privé
/profil             privé
/stats              privé — Explorer (classements, équipes, joueurs)
```

## Fonctionnalités livrées v1.1

### Auth ✅
Inscription, connexion, déconnexion, session persistante

### Board (Accueil) ✅
- Header + accroche + toggle No Spoil
- BandeMatchs scrollable (3 jours) → MatchDetail
- StandingsNBA : Top 5 Est/Ouest + lien "Voir tout" → /stats (saison régulière uniquement)
- BracketPlayoffs : bracket visuel playoffs complet (playoffs uniquement)
- NewsNBA : 5 actus ESPN, masquées en No Spoil
- Mode No Spoil : SeriesPlayoffs respecte le No Spoil (scores masqués)

### Bracket Playoffs (BracketPlayoffs.jsx) ✅
- Fetch scoreboard par plages de 7 jours (avril-juin) SANS seasontype=3
- Déduplication par paire d'équipes + typeId
- 4 rounds : 1er tour / Demi-finales / Finales conf / Finales NBA
- Conférence déduite depuis standings (confEst / confOuest)
- Layout flexbox avec hauteurs fixes calculées — alignement parfait
- 3 modes adaptatifs : normal (≥520px) / compact (<520px) / ultra (<380px)
- Scroll centré sur la colonne Finales NBA au chargement (finaleRef)
- No Spoil : scores masqués (?), summaries cachés
- Utilisé dans Board (typeSaisonActuel === 3) et disponible pour Stats.jsx

### Fiche match (MatchDetail) ✅
- Bloc "Prédiction avant match" — visible uniquement avant/pendant le match
- Fetch `predictor` ESPN : `sports.core.api.espn.com/.../events/{id}/competitions/{id}/predictor`
- Structure réponse : `statistics[].find(s => s.name === 'gameProjection').value`
- Barre visuelle ext/dom avec % — texte verdict "ESPN prédit une victoire des X"
- `probabilities` supprimé (non supporté NBA par ESPN)

### Mode No Spoil ✅
- BracketPlayoffs : scores masqués, summaries cachés
- SeriesPlayoffs : scores masqués, label masqué, badge "🙈 No Spoil actif"
- BandeMatchs, Calendrier, MatchDetail : scores masqués sur terminés

### Explorer (Stats) ✅
- Onglet Classements : standings Est/Ouest historiques depuis 2002
- Onglet Équipes : 30 franchises + fiches avec roster trié par PPG
- Onglet Joueurs : ~450 joueurs, filtre équipe + recherche

## Système de points
Bon vainqueur = 1 point
Score exact / bonus série = à définir (Sprint 2 — dépend Edge Function)

## Backlog Sprint 2 — état au 2026-05-28

### Mis de côté (décision session)
- 4.6 — Sélecteur de saison Calendrier (nice to have, navigation manuelle suffisante)
- 4.7 — Edge Function Supabase calcul points serveur + verrou prono (à faire si industrialisation)
- 4.8 — Bonus score exact + bonus série (dépend de 4.7)
- 4.9 — IA Gemini (phase 2)
- 4.10 — News FR RSS (dépend de 4.7)

### Restant backlog Stats
- [ ] Intégration BracketPlayoffs dans Stats.jsx (onglet Classements si playoffs)
- [ ] Game log joueur + splits
- [ ] Historique carrière joueur

### Ligues créées pour 2026-2027
À créer via interface admin (type_saison ESPN, saison ESPN = 2027) :
- Ligue Pré-saison 2026-27 → type 1, saison 2027
- Ligue Saison régulière 2026-27 → type 2, saison 2027
- Ligue Playoffs 2026-27 → type 3, saison 2027
- Ligue Générale 2026-27 → type null, saison 2027

## Règles de travail
- Français, tutoiement, direct, concis
- React + Vite uniquement — HTML/CSS/JS vanilla interdit
- Variables et commentaires en français
- Toujours indiquer fichier + ligne/bloc + contexte pour toute modif de code
- Jamais border shorthand + longhand sur le même élément
- Appels ESPN : surveiller stabilité + CORS
- Supabase : anticiper pause inactivité en dev
- RGPD : pas de données sensibles, minimisation profil
- En début de session : uploader uniquement les fichiers modifiés depuis la dernière session
- Une modification à la fois — push + test entre chaque
- Toujours réécrire les fichiers complets — jamais de modifications partielles
- Vercel Hobby : limite ~100 déploiements/jour — ne pas pusher trop souvent

## RGPD & Sécurité
Données stockées : pseudo, email (auth), avatar (Storage), bio, historique pronos.
Clé balldontlie : variable d'environnement, jamais en dur.
.env dans .gitignore — clés Supabase jamais commitées.
ESPN API : aucune donnée personnelle dans les requêtes.
ADMIN_ID hardcodé côté client — sécurisé côté BDD (RLS), acceptable en prod.
Avatars : bucket public Supabase Storage, pas de données sensibles.

## Veille technique
ESPN API non officielle : surveiller tout changement de structure ou blocage CORS.
Supabase : surveiller évolutions du free tier (pause inactivité).
Vercel Hobby : usage non-commercial uniquement.
Vérifier modèle Claude disponible à chaque session (claude-sonnet-4-20250514).
