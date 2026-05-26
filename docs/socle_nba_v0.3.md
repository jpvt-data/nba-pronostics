# NBA SOCLE v0.3 — 2026-05-26

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

### Données disponibles via summary ESPN
- `header.competitions[0]` : statut, période, clock, série playoffs, competitors (score, winner, linescores)
- `boxscore.teams[]` : logo, nom, abbreviation, statistiques saison (FG%, 3P%, REB, AST, BLK, STL, TO, PPG)
- `gameInfo.venue` : fullName, address.city
- `header.season` : year, type (1=Pré, 2=Régulière, 3=Playoffs, 4=NBA Cup, 5=International)
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

## Architecture fichiers
```
src/
  App.jsx              — routing + gestion session
  main.jsx
  index.css            — tokens CSS + fonts + reset + responsive
  lib/
    supabase.js        — client Supabase
  services/
    espn.js            — recupererMatchs3Jours(), recupererDetailMatch(), recupererGagnant()
    points.js          — calculerPoints() — déclenché au chargement Board
  pages/
    Accueil.jsx        — Board : header "Bonjour pseudo ⚡", bande matchs, hub
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx      — stats + historique pronos cliquables → MatchDetail
    Calendrier.jsx     — calendrier NBA complet (1j/3j/semaine/mois)
    MatchDetail.jsx    — fiche match complète (/:espn_id)
  components/
    Navigation.jsx     — desktop top + mobile logo top + mobile bottom nav + hamburger
    BandeMatchs.jsx    — bande scrollable horizontale (3 jours), cartes cliquables → MatchDetail
    ClassementRapide.jsx
    PronosAttente.jsx  — refresh via refreshKey prop
    RunsPotes.jsx
    CreerGroupe.jsx
    RejoindreGroupe.jsx
```

## Navigation
- Desktop : top navbar fixe — [● NBA PRONOS] [Board] [Classement] [Mes stats] [≡]
- Mobile : barre logo top 40px + bottom nav fixe 60px — [Board] [Classement] [Mes stats] [≡]
- Hamburger : panneau droit — Groupes + Calendrier + Déconnexion
- Icônes : Lucide React

## Routes
```
/connexion          public
/inscription        public
/accueil            privé — Board
/classement         privé
/mes-pronos         privé
/groupes            privé
/match/:espn_id     privé — fiche match détail
/calendrier         privé
```

## Pages livrées (Sprint 0 + Sprint 1 partiel)

### Auth
✅ Inscription, connexion, déconnexion, session persistante

### Board (Accueil)
✅ Header "Bonjour [pseudo] ⚡" avec pseudo depuis table profils
✅ Sous-titre + séparateurs respirés uniformes
✅ Section "Prochains matchs" + hint "Clique sur une affiche"
✅ Bouton "Calendrier complet" sous la bande
✅ BandeMatchs scrollable horizontale (3 jours) — cartes cliquables → MatchDetail
✅ ClassementRapide (top 5 groupe actif, rang de l'user mis en évidence)
✅ PronosAttente (liste matchs pronos non encore joués, refreshKey après prono)
✅ RunsPotes (série W/L ≥ 3 dans le groupe)

### Fiche match (MatchDetail)
✅ Badges saison (ex: 2025-26) + type (Playoffs / Régulière / etc.) + Live
✅ Série playoffs : description + summary (ex: "NY leads series 3-0")
✅ Affiche principale : logos + trigrammes + noms complets + Extérieur/Domicile
✅ Score final ou VS + heure selon statut
✅ Scores par quart-temps (Q1/Q2/Q3/Q4 + OT)
✅ Lieu + stade + ville + date/heure complète
✅ Forme récente L5 (W/L colorés, par équipe en ligne)
✅ Stats moyennes saison (PPG, FG%, 3P%, REB, AST, BLK, STL, TO)
✅ Leaders (Points/Passes/Rebonds) avec photo headshot
✅ Blessés/Absents avec photo + statut + type
✅ Prono intégré dans l'affiche : clic sur logo/équipe = prono (si match pas commencé)
✅ Indicateur prono sur la carte équipe (✓ Mon prono / ✓ Correct / ✗ Raté)
✅ "Tu peux encore changer d'avis !" si prono existant non verrouillé
✅ Match terminé : équipe perdante en opacité réduite
✅ Verrouillage : STATUS_IN_PROGRESS, STATUS_FINAL, ou heure dépassée

### Pronos
✅ Upsert Supabase (user_id, match_id) — contrainte unique
✅ Verrouillage auto côté client (heure + statut ESPN)
✅ Calcul points au chargement Board (calculerPoints)

### Classement
✅ Sélecteur groupes (si plusieurs)
✅ Podium top 3 (médailles)
✅ Liste complète triée par points

### Mes stats (MesPronos)
✅ Stats globales : Total / Corrects / Ratés / % Réussite
✅ Historique pronos par ligne (match, date, équipe choisie, résultat)
✅ Chaque ligne cliquable → MatchDetail (via espn_id)

### Groupes
✅ Créer (code NBA-XXXX auto), rejoindre, quitter (soft delete)
✅ Affichage code d'invitation + points + badge Admin

### Calendrier
✅ Vues : 1 jour / 3 jours / Semaine / Mois
✅ Vue par défaut : Semaine
✅ Navigation : flèches précédent/suivant + bouton Aujourd'hui
✅ Filtres : type de match + équipe
✅ Cache local par date (pas de rechargement si déjà chargé)
✅ Vue mois : clic jour ≥ 2 matchs → zoom vue 1 jour / = 1 match → MatchDetail
✅ Cartes matchs : logo petit, trigramme, heure, score si terminé, badge Live
✅ Historique disponible depuis ~2003 (ESPN)
✅ Accès : hamburger + bouton sous bande matchs Board

## Système de points
Bon vainqueur = 1 point (base)
Score exact = bonus (à définir)
Bonus série = à définir
Paramétrable par groupe (prévu, pas encore implémenté)

## Règles de travail
- Français, tutoiement, direct, concis
- React + Vite uniquement — pas de HTML/CSS/JS vanilla
- Variables et commentaires en français
- Toujours indiquer fichier + contexte exact pour toute modif de code
- Jamais border shorthand + longhand sur le même élément (warnings React)
- Appels ESPN : surveiller stabilité (API non officielle, CORS variable)
- Supabase : anticiper pause inactivité en dev
- RGPD : pas de données sensibles, minimisation profil

## Backlog Sprint 1 (restant)
- [ ] Page Profil utilisateur (pseudo, avatar, stats perso, série en cours)
- [ ] Lien MatchDetail depuis MesPronos pour matchs anciens (espn_id manquant sur anciens pronos)
- [ ] Leaders stats NBA via proxy Supabase Edge Function (CORS bloqué)
- [ ] Infos contextuelles matchs dans BandeMatchs (saison régulière vs playoffs)
- [ ] Table equipes Supabase (trigrammes officiels NBA, couleurs)
- [ ] Suppression groupe (admin uniquement)
- [ ] Sélecteur de saison dans Calendrier (téléportation au 1er oct de la saison choisie)

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

## Veille technique
ESPN API non officielle : surveiller tout changement de structure ou blocage CORS.
Supabase : surveiller évolutions du free tier (pause inactivité).
Vercel Hobby : usage non-commercial uniquement.

## Sessions Claude — bonnes pratiques
- GitHub raw pas toujours accessible depuis Claude : coller les URLs raw dans le message ou fournir le contenu directement
- Fichier Fichiers_racine.txt à maintenir à jour dans le projet Claude
- En début de session : préciser les fichiers modifiés depuis la dernière session
- Toujours commiter et pusher avant de démarrer une nouvelle session

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
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/RejoindreGroupe.jsx
```
