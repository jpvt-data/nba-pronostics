# NBA SOCLE v0.1 — 2025-05-24

## Projet
App web NBA communautaire — pronos entre amis, stats, scores, classements.
Nom de travail : **NBA Pronostics** (nom de marque à définir).
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
Pas de framework CSS imposé — à décider en phase UI

## Sources de données — validées en exploration (2025-05-24)
### Source principale : ESPN API non officielle
- Base : https://site.api.espn.com/apis/site/v2/sports/basketball/nba
- Base web : https://site.web.api.espn.com/apis
- Sans clé API, sans authentification, accessible depuis France
- Couvre : équipes, joueurs, scores, matchs, stats, standings, playoffs, blessures, roster
- Photos joueurs : https://a.espncdn.com/i/headshots/nba/players/full/{espn_id}.png

### Source complémentaire : cdn.nba.com
- Photos joueurs HD : https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_id}.png
- Logos équipes SVG : https://cdn.nba.com/logos/nba/{team_id}/global/L/logo.svg
- Accessible depuis France, sans clé

### Source backup : balldontlie
- https://api.balldontlie.io/v1 — clé API gratuite requise
- Backup scores/matchs uniquement (stats et standings = payants)
- Utile si ESPN instable

### Hors jeu
- nba_api (Python) : bloqué depuis France — éliminé
- stats.nba.com : inaccessible depuis France — éliminé

## Données disponibles (ESPN)
Équipes : id, conference, division, city, name, abbreviation
Joueurs : id, nom, poste, taille, poids, maillot, college, pays, draft, photo, blessures
Matchs : date, statut, scores, détail par quart, overtime, lieu, diffusion, cotes, série
Stats joueur : GP, MPG, FG%, 3P%, FT%, REB, AST, BLK, STL, PF, TO, PTS — splits saison/playoffs
Standings : wins, losses, seed, streak, home/road, div, conf, L10, differential
Playoffs : bracket, séries, statut

## Roadmap MVP
Objectif : testable avant fin des Finales NBA 2026 (juin 2026)
Diffusion publique : J1 saison régulière NBA (octobre 2026)

### Sprint 0 — ASAP (mai 2026)
- Auth (Supabase) : inscription, connexion, pseudo
- Groupe : créer / rejoindre
- Pronos : choisir vainqueur, verrouillage auto à l'heure du match
- Classement groupe : points, rang, historique

### Sprint 1 — Juin → été 2026
- Accueil : matchs du jour, scores, statut live
- Calendrier : saison régulière + playoffs, filtre équipe/date
- Équipes : roster, stats, classement
- Joueurs : fiche, stats saison, photo

### Sprint 2 — Septembre 2026
- Visualisations : graphiques stats, comparaisons
- IA Gemini : suggestions pronos, résumés matchs
- Polish UI + optimisations mobile
- Diffusion cercle élargi

## Fonctionnalités hors MVP (backlog)
Fantasy league, badges, chat, commentaires matchs, notifications push,
historique complet, système de draft, app mobile native, IA prédictive.

## Groupes — décision
Inclus dans le MVP. Raison : sans groupe, pas de dimension sociale.
Le classement n'a de sens qu'entre personnes qui se connaissent.
Implémentation simple : code d'invitation, pas de système complexe.

## Système de points (configurable)
Bon vainqueur = 1 point (base)
Score exact = bonus (à définir)
Bonus série = à définir
Paramétrable par groupe.

## Profil utilisateur
Pseudo (unique), mot de passe (Supabase Auth), avatar optionnel.
Historique pronos, taux de réussite, rang groupe.

## Organisation Claude
Projet dédié : PLANIFY — NBA
Ce fichier = socle de référence, embarqué dans chaque session.
Variables et commentaires en français.
Versioning : nba_v0.1, nba_v0.2...

## Règles de travail
- Français, tutoiement, direct, concis
- HTML/CSS/JS vanilla interdit ici — React + Vite uniquement
- Appels ESPN : pas de clé, surveiller la stabilité (API non officielle)
- Supabase : anticiper la pause d'inactivité en dev
- RGPD : pas de données sensibles, minimisation profil, pas de PII dans les requêtes
- ESPN API non officielle : risque de changement sans préavis — architecture découplée obligatoire

## RGPD & Sécurité
Données stockées : pseudo, email (auth), historique pronos — rien de sensible.
Pas de données personnelles dans les appels API ESPN.
Clé balldontlie : variable d'environnement, jamais en dur dans le code.

## Veille technique
ESPN API non officielle : surveiller tout changement de structure ou blocage.
Supabase : surveiller évolutions du free tier.
Vercel Hobby : usage non-commercial uniquement — ok pour phase test.

---
## Backlog idées
> [2025-05-24] — Notifications push résultats pronos — évoqué en session init
> [2025-05-24] — Chat entre membres du groupe — évoqué en session init
> [2025-05-24] — Badges utilisateurs — évoqué en session init