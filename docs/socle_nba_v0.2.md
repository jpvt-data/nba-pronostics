# NBA SOCLE v0.2 — 2026-05-25

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
CSS : pas de framework — styles inline + index.css global
Icônes : Lucide React

## URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

## Sources de données — validées
### Source principale : ESPN API non officielle
- Base : https://site.api.espn.com/apis/site/v2/sports/basketball/nba
- Sans clé API, sans auth, accessible depuis France
- Couvre : scoreboard, matchs, scores, statut, logos équipes
- Gagnant match : /summary?event={espn_id}
- ⚠️ CORS bloque certains endpoints (leaders stats, stats joueurs) — proxy nécessaire

### Source backup : balldontlie
- https://api.balldontlie.io/v1 — clé API gratuite requise
- Backup scores/matchs uniquement

### Hors jeu
- nba_api (Python) : bloqué depuis France
- stats.nba.com : inaccessible depuis France
- ESPN /leaders et /statistics/leaders : CORS bloqué depuis navigateur

## Schéma BDD Supabase
Tables : profils | groupes | membres_groupe | matchs | pronos
RLS activé sur toutes les tables.
Grants : authenticated sur toutes les tables.

### Détails clés
- membres_groupe.actif (boolean) — soft delete pour quitter/rejoindre
- pronos.resultat : 'en_attente' | 'correct' | 'incorrect'
- pronos : contrainte unique sur (user_id, match_id) — pas de groupe_id
- matchs : cache ESPN local, upsert sur espn_id

## Architecture fichiers
```
src/
  App.jsx              — routing + gestion session
  main.jsx
  index.css
  lib/
    supabase.js        — client Supabase
  services/
    espn.js            — recupererMatchs3Jours(), recupererGagnant()
    points.js          — calculerPoints() — déclenché au chargement accueil
  pages/
    Accueil.jsx        — hub principal
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx
  components/
    Navigation.jsx     — navbar desktop top + mobile bottom + hamburger
    BandeMatchs.jsx    — bande scrollable horizontale + pronos intégrés
    ClassementRapide.jsx
    PronosAttente.jsx
    RunsPotes.jsx
    LeadersStats.jsx   — désactivé (CORS ESPN)
    CreerGroupe.jsx
    RejoindreGroupe.jsx
```

## Navigation
- Desktop : top navbar fixe — [NBA PRONOS] [Pronos] [Classement] [Mes stats] [≡]
- Mobile : bottom nav fixe — [Pronos] [Classement] [Mes stats] [≡]
- Hamburger : panneau droit — Groupes + Déconnexion
- Icônes : Lucide React (Home, Trophy, BarChart2, Menu, Users, LogOut)

## Pages livrées (Sprint 0 + début Sprint 1)
✅ Auth complète : inscription, connexion, déconnexion, session persistante
✅ Groupes : créer (code NBA-XXXX), rejoindre, quitter (soft delete)
✅ Accueil Hub : bande matchs 3 jours, classement rapide, pronos en attente, runs potes
✅ Pronos : upsert sur match, verrouillage auto si match commencé/terminé
✅ Calcul points : au chargement accueil, compare prono vs gagnant ESPN
✅ Classement : par groupe, trié par points
✅ Mes Pronos : historique + stats (total, corrects, ratés, taux réussite)
✅ Navigation : Lucide icons, hamburger, responsive desktop/mobile
✅ Déploiement Vercel : vercel.json SPA rewrite, variables env

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
- Appels ESPN : surveiller stabilité (API non officielle)
- Supabase : anticiper pause inactivité en dev
- RGPD : pas de données sensibles, minimisation profil

## Backlog Sprint 1
- [ ] Design / polish UI — direction artistique à définir
- [ ] Page Calendrier NBA complet
- [ ] Leaders stats NBA — proxy Supabase Edge Function (CORS)
- [ ] Taille cartes bande matchs réduite sur mobile
- [ ] Page Profil utilisateur (pseudo, avatar, stats, série)
- [ ] Infos contextuelles par match (saison régulière vs playoffs, statut série)
- [ ] Équipe domicile à droite (convention NBA)
- [ ] Table equipes Supabase (trigrammes officiels NBA, couleurs)
- [ ] Suppression groupe (admin uniquement)

## Backlog Sprint 2
- [ ] IA Gemini : suggestions pronos, résumés matchs
- [ ] Visualisations stats : graphiques, comparaisons joueurs
- [ ] Notifications push résultats pronos
- [ ] Chat entre membres du groupe
- [ ] Badges utilisateurs
- [ ] Edge Functions Supabase pour calcul points automatique
- [ ] Page Stats/Explorer : classements NBA, fiches équipes, fiches joueurs, H2H
- [ ] Accueil enrichi : news actu NBA, leaders stats, logo = lien accueil

## Backlog idées (hors MVP)
- Fantasy league
- Système de draft
- App mobile native
- IA prédictive
- Historique complet saisons

## RGPD & Sécurité
Données stockées : pseudo, email (auth), historique pronos — rien de sensible.
Clé balldontlie : variable d'environnement, jamais en dur.
.env dans .gitignore — clés Supabase jamais commitées.

## Veille technique
ESPN API non officielle : surveiller tout changement de structure ou blocage.
Supabase : surveiller évolutions du free tier.
Vercel Hobby : usage non-commercial uniquement.

---
## Liens raw GitHub
```
# Fichiers racine
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/index.html
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/vite.config.js
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/package.json
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/vercel.json
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/.gitignore

# CSS
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/index.css

# App
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

# Components
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/Navigation.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/BandeMatchs.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/ClassementRapide.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/PronosAttente.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/RunsPotes.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/LeadersStats.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/CreerGroupe.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/RejoindreGroupe.jsx
```
