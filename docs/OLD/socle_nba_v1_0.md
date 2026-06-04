# NBA SOCLE v1.0 — 2026-05-28

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
- Sans clé API, sans auth, accessible depuis France
- Historique disponible depuis ~2003
- Les 3 appels scoreboard (Board) sont lancés en parallèle — timeout 8s sur tous les fetch

### ⚠️ Structure stats joueur ESPN
- Endpoint : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/stats?season=2026&seasontype=2`
- Réponse : `categories[]` avec `name: "averages"`
- Stats dans `categories[0].statistics[]` — tableau par saison
- **Toujours filtrer par `season.year === 2026`** — `statistics[0]` = saison la plus ancienne, pas la courante
- Noms des champs : `avgPoints`, `avgRebounds`, `avgAssists`, `avgSteals`, `avgBlocks`, `avgMinutes`, `fieldGoalPct`, `threePointFieldGoalPct`, `freeThrowPct`, `gamesPlayed`
- Index via `names[]` parallèle à `stats[]`

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
                         ↳ Chargé une fois à l'init de session, exposé via useProfil()
  data/
    changelog.js       — CHANGELOG[] + VERSION_COURANTE (v1.0)
  services/
    espn.js            — recupererMatchs3Jours(), recupererDetailMatch(), recupererGagnant()
                         ↳ Fetch en parallèle (Promise.allSettled) + timeout 8s sur tous les appels
    points.js          — calculerPoints() — filtre par type_saison + saison de la ligue
                         ↳ Déduplication des espn_id avant appels ESPN (un seul appel par match)
    ligues.js          — recupererLiguesCibles() — logique de filtrage ligues partagée
  pages/
    Accueil.jsx        — Board : header + toggle No Spoil + bannières + bande matchs + hub
                         ↳ typeSaisonActuel détecté depuis matchs[0] → prop vers StandingsNBA + SeriesPlayoffs + NewsNBA
    Connexion.jsx      — card centrée, logo Swish League
    Inscription.jsx    — card centrée, logo Swish League
    Groupes.jsx        — Ligues : actives / terminées, CRUD admin, header plein bord
    Classement.jsx     — classement par ligue (stats filtrées) + classement général
                         ↳ Stats pronos filtrées par groupe_id
    MesPronos.jsx      — stats globales + stats par ligue + forme récente + historique
    MatchDetail.jsx    — fiche match complète, charte Bloc
    Calendrier.jsx     — vues 1j/3j/7j/mois, No Spoil, bannière
                         ↳ Filtre type : Tous / Pré-saison / Saison régulière / Playoffs / International (NBA Cup supprimé)
    Profil.jsx         — profil éditable, avatar uploadable, charte Bloc
    Stats.jsx          — page Explorer : classements NBA / fiches équipes / fiches joueurs
  components/
    UI.jsx             — LabelSection, BanniereImage, Bloc — partagés par toutes les pages
    Navigation.jsx     — desktop top + mobile logo top + mobile bottom nav + hamburger
                         ↳ 4 liens : Board / Classement / Mes stats / Explorer
    Avatar.jsx         — composant Avatar + couleurAvatar
    BandeMatchs.jsx    — bande scrollable horizontale (3 jours) + No Spoil
    ClassementRapide.jsx
    PronosAttente.jsx
    RunsPotes.jsx
    CreerGroupe.jsx    — formulaire création ET modification ligue (prop ligueExistante)
                         ↳ Types saison : Toutes / 1-Pré-saison / 2-Saison régulière / 3-Playoffs / 5-International (NBA Cup supprimé)
    PopupChangelog.jsx — popup "Quoi de neuf" versionnée, logo Swish League intégré
    StandingsNBA.jsx   — classement Est/Ouest saison régulière — visible uniquement type 2
                         ↳ Endpoint : site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=2026&seasontype=2
    SeriesPlayoffs.jsx — séries playoffs en cours — visible uniquement type 3
                         ↳ Fetch scoreboard J/J-1/J-2/J-3, déduplique par paire d'équipes
    NewsNBA.jsx        — 5 dernières actus ESPN — masquées si No Spoil actif, cachées hors saison
                         ↳ Endpoint : site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=5
```

## Navigation
- Desktop : top navbar fixe — [Logo + SWISH LEAGUE] [Board] [Classement] [Mes stats] [Explorer] [Avatar+pseudo] [≡]
- Mobile : barre logo top 40px (logo + nom + avatar cliquable + hamburger) + bottom nav fixe 60px [Board] [Classement] [Mes stats] [Explorer]
- Hamburger : panneau droit — bloc profil (avatar + pseudo + "Mon profil") + Explorer + Ligues + Calendrier + No Spoil + Quoi de neuf + Déconnexion

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

## Fonctionnalités livrées

### Auth
✅ Inscription, connexion, déconnexion, session persistante

### Board (Accueil)
✅ Header + accroche + description
✅ Toggle No Spoil intégré
✅ Bannières images Unsplash entre sections
✅ BandeMatchs scrollable (3 jours) → MatchDetail
✅ Blocs Bloc gradient : Ligue en cours, Pronos en attente, Runs des potes
✅ StandingsNBA — classement Est/Ouest en saison régulière (type 2)
✅ SeriesPlayoffs — séries en cours en playoffs (type 3)
✅ NewsNBA — 5 actus ESPN, masquées en No Spoil, cachées hors saison

### Mode No Spoil
✅ Context global persisté localStorage, actif par défaut
✅ Toggle Board + hamburger
✅ BandeMatchs, Calendrier, MatchDetail : scores masqués sur terminés
✅ Résultat de prono masqué en mode No Spoil
✅ News NBA masquées en mode No Spoil

### Profil utilisateur
✅ Avatar uploadable (Supabase Storage bucket avatars)
✅ Pseudo + bio éditables inline
✅ Stats pronos : total / corrects / ratés / % réussite
✅ Ligues rejointes avec points
✅ Avatar visible dans Navigation via ProfilContext

### Popup "Quoi de neuf"
✅ Logo Swish League intégré
✅ Changelog versionné v1.0, accessible depuis hamburger
✅ Encart No Spoil intégré

### Fiche match (MatchDetail)
✅ Badges saison + type + Live
✅ Affiche principale : logos + trigrammes + Ext/Dom
✅ Score final ou VS + heure
✅ Scores par quart-temps
✅ Lieu + stade + ville + date/heure
✅ Forme récente L5
✅ Stats du match (matchs terminés) ou stats moyennes saison (matchs à venir)
✅ Leaders avec photo
✅ Blessés/Absents
✅ Prono intégré : clic sur logo/équipe
✅ No Spoil : score masqué, résultat prono masqué, perdant non grisé

### Pronos
✅ Upsert Supabase — contrainte unique (user_id, match_id, groupe_id)
✅ Verrouillage auto côté client (heure match ou statut)
✅ Cache match enrichi : type_saison + saison stockés
✅ Calcul points au chargement Board — ESPN appelé une seule fois par match
✅ Rattachement automatique à la bonne ligue selon type_saison du match
✅ Support multi-ligues : un prono par ligue correspondante

### Ligues (Groupes)
✅ Liste publique — rejoindre en un clic
✅ Création réservée à l'admin (ADMIN_ID hardcodé côté client + RLS en BDD)
✅ Modification + suppression ligue — admin uniquement
✅ Types : Toutes / Pré-saison / Saison régulière / Playoffs / International (NBA Cup supprimé)
✅ Clôture automatique si date_fin dépassée
✅ Tri automatique : actives en haut, terminées en bas
✅ Badge "✓ Inscrit", points affichés, quitter (soft delete)

### Classement
✅ Classement par ligue — stats filtrées sur la ligue (corrects, ratés, % par groupe_id)
✅ Classement général — total toutes ligues confondues
✅ Médailles 🥇🥈🥉
✅ Clic sur une ligne → /mes-pronos?user_id=xxx

### Mes stats / Profil public (MesPronos)
✅ Stats globales : total / corrects / ratés / %
✅ Stats par ligue : nom, points, corrects, ratés, % — une ligne par ligue
✅ Forme récente : 5 derniers W/L triés par date de match
✅ Historique pronos — en attente masqués pour les autres users
✅ Cliquable → MatchDetail uniquement pour soi-même

### Explorer (Stats)
✅ Route `/stats`, entrée nav desktop + mobile bottom + hamburger
✅ Onglet Classements :
   - Standings Est/Ouest triés par playoffSeed ESPN (ordre officiel)
   - Sélecteur saison historique depuis 2002 (construit depuis data.seasons ESPN)
   - Colonnes : rang, logo, trigramme, bilan, PCT, GB, Dom., Ext., STRK
   - Badges clincher (z/y/x/xp/pb/e/*)
   - Highlight top 6 playoffs + play-in 7-8
   - Clic équipe → fiche équipe directe
✅ Onglet Équipes :
   - Grille 30 franchises extraites depuis standings (pas d'appel teams?limit=30 CORS bloqué)
   - Logos HD + couleurs ESPN en theming dynamique
   - Fiche équipe : roster trié par PPG (stats chargées en parallèle), onglet blessés
   - Clic joueur → fiche joueur
✅ Onglet Joueurs :
   - Chargement 30 rosters en parallèle avec barre de progression
   - Liste alphabétique complète ~450 joueurs
   - Filtre équipe + recherche texte live
   - Badge équipe (logo + trigramme) sur chaque ligne
   - Clic → fiche joueur

### Fiche joueur
✅ Données profil depuis roster (photo, numéro, position, âge, taille, poids)
✅ Stats saison 2026 : PPG, RPG, APG, SPG, BPG, Min, FG%, 3P%, FT%, MJ
✅ Parser stats : filtrage sur `season.year === 2026` dans `statistics[]`

### Calendrier
✅ Vues : 1j / 3j / Semaine / Mois
✅ Navigation + bouton Aujourd'hui
✅ Filtres : type de match (NBA Cup supprimé) + équipe
✅ Cache local par date
✅ No Spoil : scores masqués sur terminés
✅ Historique depuis ~2003

## Système de points
Bon vainqueur = 1 point
Points filtrés par ligue (type_saison + saison ESPN)
Score exact / bonus série = à définir (Sprint 2)

## Ligues créées pour 2026-2027
À créer via interface admin (type_saison ESPN, saison ESPN = 2027) :
- Ligue Pré-saison 2026-27 → type 1, saison 2027
- Ligue Saison régulière 2026-27 → type 2, saison 2027
- Ligue Playoffs 2026-27 → type 3, saison 2027
- Ligue Générale 2026-27 → type null, saison 2027
Date de clôture : à renseigner quand le calendrier NBA officiel sortira (août 2026).

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

## Backlog Sprint 2
- [ ] StandingsNBA Board : TOP 5 + lien "voir tout" → Stats/Explorer (4.4)
- [ ] Win probability + Game Predictor dans MatchDetail (4.5)
- [ ] Sélecteur de saison dans Calendrier (4.6)
- [ ] Edge Function Supabase — calcul points serveur + verrou prono (4.7)
- [ ] Bonus score exact + bonus série dans système de points (4.8)
- [ ] IA Gemini — suggestions pronos, résumés matchs (4.9)
- [ ] News FR via RSS + proxy Edge Function (4.10)
- [ ] ADMIN_ID hardcodé côté client → sécuriser côté serveur en prod
- [ ] Page Stats : bracket playoffs visuel (actuellement séries texte)
- [ ] Page Stats : game log joueur + splits
- [ ] Page Stats : historique carrière joueur

## Backlog idées (hors MVP)
- Fantasy league
- Système de draft
- App mobile native (Capacitor ou React Native)
- PWA iOS plein écran (problème Safari/React Router — chantier dédié)
- IA prédictive
- Historique complet saisons
- Chat entre membres du groupe
- Badges utilisateurs
- Notifications push résultats pronos

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
