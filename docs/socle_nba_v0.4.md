# NBA SOCLE v0.4 — 2026-05-26

## Projet
App web NBA communautaire — pronos entre amis, stats, scores, classements.
Nom de travail : **NBA Pronostics** (nom de marque à définir — "Orbite" en tête).
Périmètre : Planify ecosystem — planificateur sportif de saison.
Vitrine IA Prismora Solutions.

## Philosophie
"Les données d'abord, l'interface suit."
App entre potes : compétition amicale, chambrage, passion basket.
Mobile first. Rapide. Lisible. Sans surcharge.

## Stack technique — 100% gratuit
Front : React + Vite | Deploy : Vercel (Hobby, non-commercial)
Back : Supabase (PostgreSQL + Auth) — ⚠️ pause après 1 semaine d'inactivité
IA : Gemini (Google Workspace) — phase 2 uniquement, pas dans le MVP
CSS : pas de framework — tokens CSS centralisés dans index.css
Icônes : Lucide React
Fonts : Inter (body) + Barlow Condensed (display/scores) — Google Fonts

## URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

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
--danger: #ef4444      raté / défaite
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #4a4a6a      texte tertiaire / labels
--font-body: Inter
--font-display: Barlow Condensed
--radius-sm / md / lg : 6px / 10px / 14px
```

## Sources de données — validées
### Source principale : ESPN API non officielle
- Scoreboard : https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
- Summary : https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={espn_id}
- Sans clé API, sans auth, accessible depuis France
- Historique disponible depuis ~2003

### Types de saison ESPN
- 1 = Pré-saison
- 2 = Saison régulière
- 3 = Playoffs
- 4 = NBA Cup
- 5 = International (JO, matchs monde)

### Données disponibles via summary ESPN
- `header.competitions[0]` : statut, période, clock, série playoffs, competitors (score, winner, linescores)
- `boxscore.teams[]` : logo, nom, abbreviation, statistiques saison (FG%, 3P%, REB, AST, BLK, STL, TO, PPG)
- `gameInfo.venue` : fullName, address.city
- `header.season` : year, type (voir types ci-dessus)
- `leaders[]` : meilleurs joueurs (Points, Passes, Rebonds) avec photo headshot
- `lastFiveGames[]` : 5 derniers matchs par équipe (W/L, score, adversaire)
- `injuries[]` : blessés/absents avec statut et type
- `seasonseries[]` : confrontations saison + série playoffs (summary, seriesScore, round)

### ⚠️ CORS
- `site.web.api.espn.com` (summary) : passe depuis navigateur
- `site.api.espn.com/leaders` et `/statistics/leaders` : CORS bloqué — proxy nécessaire (Sprint 2)

### Source backup : balldontlie
- https://api.balldontlie.io/v1 — clé API gratuite requise
- Backup scores/matchs uniquement

### Hors jeu
- nba_api (Python) : bloqué depuis France
- stats.nba.com : inaccessible depuis France

## Schéma BDD Supabase
Tables : profils | groupes | membres_groupe | matchs | pronos
RLS activé sur toutes les tables.
Grants : authenticated sur toutes les tables.

### Détails clés
- membres_groupe.actif (boolean) — soft delete pour quitter/rejoindre
- pronos.resultat : 'en_attente' | 'correct' | 'incorrect'
- pronos : contrainte unique sur (user_id, match_id)
- matchs : cache ESPN local, upsert sur espn_id
- matchs.type_saison (int) + matchs.saison (int) — ESPN season.type + season.year
- groupes.type_saison (int) + groupes.saison (int) — filtre pour calcul points
- groupes.date_fin (date) — clôture automatique de la ligue

## Architecture fichiers
```
src/
  App.jsx              — routing + gestion session + PopupChangelog
  main.jsx
  index.css            — tokens CSS + fonts + reset + responsive
  lib/
    supabase.js        — client Supabase
  context/
    NoSpoilContext.jsx — Context global mode No Spoil (localStorage)
  data/
    changelog.js       — CHANGELOG[] + VERSION_COURANTE
  services/
    espn.js            — recupererMatchs3Jours(), recupererDetailMatch(), recupererGagnant()
                         ↳ retourne typeSaisonNum + saisonNum (entiers ESPN bruts)
    points.js          — calculerPoints() — filtre par type_saison + saison de la ligue
  pages/
    Accueil.jsx        — Board : header + toggle No Spoil + bande matchs + hub
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx        — Ligues : liste publique, rejoindre/quitter, création admin
    Classement.jsx
    MesPronos.jsx      — stats + historique pronos cliquables → MatchDetail
    Calendrier.jsx     — calendrier NBA complet (1j/3j/semaine/mois) + No Spoil
    MatchDetail.jsx    — fiche match complète + No Spoil + prono intégré
  components/
    Navigation.jsx     — desktop top + mobile logo top + mobile bottom nav + hamburger
                         ↳ Ligues (Swords), Calendrier, No Spoil toggle, Quoi de neuf
    BandeMatchs.jsx    — bande scrollable horizontale (3 jours) + No Spoil
    ClassementRapide.jsx — top 5 ligue active + bouton "Voir les ligues"
    PronosAttente.jsx  — refresh via refreshKey prop
    RunsPotes.jsx
    CreerGroupe.jsx    — création ligue (admin only) : nom, type ESPN, saison, date clôture
    PopupChangelog.jsx — popup "Quoi de neuf" versionnée (localStorage)
```

## Navigation
- Desktop : top navbar fixe — [● NBA PRONOS] [Board] [Classement] [Mes stats] [≡]
- Mobile : barre logo top 40px + bottom nav fixe 60px — [Board] [Classement] [Mes stats]
- Hamburger : panneau droit — Ligues (Swords) + Calendrier + No Spoil + Quoi de neuf + Déconnexion
- Icônes : Lucide React

## Routes
```
/connexion          public
/inscription        public
/accueil            privé — Board
/classement         privé
/mes-pronos         privé
/groupes            privé — Ligues
/match/:espn_id     privé — fiche match détail
/calendrier         privé
```

## Fonctionnalités livrées

### Auth
✅ Inscription, connexion, déconnexion, session persistante

### Board (Accueil)
✅ Header "Bonjour [pseudo] ⚡" + toggle No Spoil intégré
✅ BandeMatchs scrollable horizontale (3 jours) — cartes cliquables → MatchDetail
✅ ClassementRapide (top 5 ligue active, rang user, bouton "Voir les ligues")
✅ PronosAttente
✅ RunsPotes

### Mode No Spoil
✅ Context global (NoSpoilContext) — persisté en localStorage
✅ Actif par défaut à l'ouverture
✅ Toggle : bouton Board + hamburger
✅ BandeMatchs : scores masqués sur matchs terminés (—), opacité réduite
✅ Calendrier : scores masqués sur matchs terminés
✅ MatchDetail : score central masqué (🙈), série playoffs masquée, perdant non grisé

### Popup "Quoi de neuf"
✅ S'affiche à chaque ouverture (dev) / une fois par version (prod)
✅ Changelog versionné dans src/data/changelog.js
✅ Accessible depuis hamburger → "Quoi de neuf ?"
✅ Encart No Spoil intégré dans le popup
✅ VERSION_COURANTE = v0.5

### Fiche match (MatchDetail)
✅ Badges saison + type (Playoffs / Régulière / etc.) + Live
✅ Série playoffs masquée en No Spoil
✅ Affiche principale : logos + trigrammes + noms + Ext/Dom
✅ Score final ou VS + heure selon statut
✅ Scores par quart-temps (à débugger — ne s'affichent pas)
✅ Lieu + stade + ville + date/heure
✅ Forme récente L5
✅ Stats moyennes saison
✅ Leaders (Points/Passes/Rebonds) avec photo
✅ Blessés/Absents
✅ Prono intégré : clic sur logo/équipe
✅ No Spoil : score masqué, perdant non grisé, résultat prono masqué

### Pronos
✅ Upsert Supabase (user_id, match_id) — contrainte unique
✅ Verrouillage auto côté client
✅ Cache match enrichi : type_saison + saison stockés au moment du prono
✅ Calcul points au chargement Board (calculerPoints)
✅ Points attribués par ligue selon type_saison + saison correspondants

### Ligues (ex-Groupes)
✅ Liste publique de toutes les ligues — rejoindre en un clic
✅ Création réservée à l'admin (ADMIN_ID hardcodé)
✅ Champs : nom, type ESPN (1-5), saison ESPN (année), date de clôture optionnelle
✅ Clôture automatique si date_fin dépassée (badge "Fermée", bouton Rejoindre masqué)
✅ Badge "✓ Inscrit" sur les ligues rejointes
✅ Points par ligue affichés
✅ Quitter une ligue (soft delete)
✅ Pas de code d'invitation — système ouvert

### Classement
✅ Sélecteur ligues
✅ Podium top 3
✅ Liste complète triée par points

### Mes stats (MesPronos)
✅ Stats globales : Total / Corrects / Ratés / % Réussite
✅ Historique pronos cliquables → MatchDetail

### Calendrier
✅ Vues : 1j / 3j / Semaine / Mois
✅ Navigation + bouton Aujourd'hui
✅ Filtres : type de match + équipe
✅ Cache local par date
✅ No Spoil : scores masqués sur terminés
✅ Historique depuis ~2003

## Système de points
Bon vainqueur = 1 point
Points filtrés par ligue (type_saison + saison ESPN)
Ligue sans filtre type = ligue générale (compte tous les matchs)
Score exact / bonus série = à définir

## Règles de travail
- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- Toujours indiquer fichier + contexte exact pour toute modif de code
- Jamais border shorthand + longhand sur le même élément
- Appels ESPN : surveiller stabilité + CORS
- Supabase : anticiper pause inactivité en dev
- RGPD : pas de données sensibles, minimisation profil

## Backlog Sprint 1 (restant)
- [ ] Page Profil utilisateur (pseudo, avatar, stats perso, série en cours)
- [ ] Scores quarts-temps dans MatchDetail (bug — ne s'affichent pas)
- [ ] Leaders stats NBA via proxy Supabase Edge Function (CORS bloqué)
- [ ] Lien MatchDetail depuis MesPronos pour matchs anciens (espn_id manquant)
- [ ] Suppression ligue (admin uniquement)
- [ ] Sélecteur de saison dans Calendrier
- [ ] Table equipes Supabase (trigrammes officiels NBA, couleurs)

## Backlog Sprint 2
- [ ] IA Gemini : suggestions pronos, résumés matchs
- [ ] Verrouillage prono côté serveur (Edge Function Supabase)
- [ ] Visualisations stats : graphiques, comparaisons joueurs
- [ ] Notifications push résultats pronos
- [ ] Chat entre membres du groupe
- [ ] Badges utilisateurs
- [ ] Edge Functions Supabase pour calcul points automatique
- [ ] Page Stats/Explorer : classements NBA, fiches équipes, fiches joueurs, H2H
- [ ] Accueil enrichi : news actu NBA, leaders stats

## Backlog idées (hors MVP)
- Fantasy league
- Système de draft
- App mobile native (Capacitor ou React Native)
- IA prédictive
- Historique complet saisons
- PWA iOS plein écran (problème Safari/React Router — chantier dédié)

## RGPD & Sécurité
Données stockées : pseudo, email (auth), historique pronos — rien de sensible.
Clé balldontlie : variable d'environnement, jamais en dur.
.env dans .gitignore — clés Supabase jamais commitées.
ESPN API : aucune donnée personnelle dans les requêtes.
ADMIN_ID hardcodé côté client — acceptable en phase proto, à sécuriser côté serveur en prod.

## Veille technique
ESPN API non officielle : surveiller tout changement de structure ou blocage CORS.
Supabase : surveiller évolutions du free tier (pause inactivité).
Vercel Hobby : usage non-commercial uniquement.

## Sessions Claude — bonnes pratiques
- Toujours refetch les fichiers raw GitHub en début de session (ne pas se fier au cache)
- Préciser les fichiers modifiés depuis la dernière session
- Toujours commiter et pusher avant de démarrer une nouvelle session
- Coller directement le contenu des fichiers si le raw GitHub est inaccessible

---
## Liens raw GitHub
```
# Fichiers racine
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/index.html
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/vite.config.js
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/package.json
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/vercel.json

# CSS + App
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/index.css
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/App.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/main.jsx

# Context + Data
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/context/NoSpoilContext.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/data/changelog.js

# Lib
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/lib/supabase.js

# Services
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/services/espn.js
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/services/points.js

# Pages
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Accueil.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Connexion.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Inscription.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Groupes.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Classement.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/MesPronos.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/MatchDetail.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Calendrier.jsx

# Components
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/Navigation.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/BandeMatchs.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/ClassementRapide.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/PronosAttente.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/RunsPotes.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/CreerGroupe.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/PopupChangelog.jsx
```
