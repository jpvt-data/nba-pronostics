# NBA SOCLE v0.6 — 2026-05-27

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
--danger: #ef4444      raté / défaite
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #8080a0      texte tertiaire / paragraphes
--font-body: Inter
--font-display: Barlow Condensed
--radius-sm / md / lg : 6px / 10px / 14px
```

## Charte UI — composants réutilisables
Chaque page utilise les mêmes primitives :

**LabelSection** — titre de section en dégradé accent→orange (texte transparent clip)
**BanniereImage** — bande image Unsplash hauteur 110px, overlay dégradé lateral rgba 0.75/0.35/0.75, bordures accent 0.2
**BLOC** — card arrondie radius-lg, gradient 160deg rgba(99,102,241,0.08)→transparent, border rgba(99,102,241,0.08)
**Header plein bord** — même gradient que BLOC mais sans border et sans border-radius (bord à bord), utilisé sur Accueil / Classement / Calendrier / Groupes

### Règle headers
- Accueil : header plein bord
- Classement, Calendrier, Groupes : header plein bord
- Profil, MesPronos : header en BLOC arrondi
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
- Sans clé API, sans auth, accessible depuis France
- Historique disponible depuis ~2003

### Types de saison ESPN
- 1 = Pré-saison | 2 = Saison régulière | 3 = Playoffs | 4 = NBA Cup | 5 = International

### ⚠️ CORS
- `site.web.api.espn.com` (summary) : passe depuis navigateur
- `site.api.espn.com/leaders` : CORS bloqué — proxy nécessaire (Sprint 2)

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
⚠️ Ancienne contrainte (user_id, match_id) supprimée — migration effectuée le 2026-05-27

### Storage Supabase
Bucket `avatars` (public) — fichiers nommés `{user_id}.{ext}`, upsert activé
Policies : lecture publique, upload/update restreint à l'utilisateur propriétaire

## Logique pronos multi-ligues
Un prono est enregistré **par ligue active correspondant au type du match** :
- Ligue `type_saison = null` (générale) → compte tous les matchs
- Ligue `type_saison = 3` (Playoffs) → compte uniquement les matchs de playoffs
- Si aucune ligue correspondante → prono enregistré avec `groupe_id = null` (hors ligue)

Fonction partagée `recupererLiguesCibles(userId, typeSaisonMatch)` utilisée dans `Accueil.jsx` et `MatchDetail.jsx`.

### SQL de migration appliqué (2026-05-27)
```sql
ALTER TABLE pronos DROP CONSTRAINT IF EXISTS pronos_user_id_match_id_key;
ALTER TABLE pronos ADD CONSTRAINT pronos_user_id_match_id_groupe_id_key
UNIQUE NULLS NOT DISTINCT (user_id, match_id, groupe_id);
```

## Architecture fichiers
```
src/
  App.jsx              — routing + session + NoSpoilProvider + PopupChangelog
  main.jsx
  index.css            — tokens CSS + fonts + reset + responsive
  assets/
    swish_league_logo.png
  lib/
    supabase.js
  context/
    NoSpoilContext.jsx — Context global mode No Spoil (localStorage)
  data/
    changelog.js       — CHANGELOG[] + VERSION_COURANTE (v0.7)
  services/
    espn.js            — recupererMatchs3Jours(), recupererDetailMatch(), recupererGagnant()
    points.js          — calculerPoints() — filtre par type_saison + saison de la ligue
  pages/
    Accueil.jsx        — Board : header + toggle No Spoil + bannières + bande matchs + hub
    Connexion.jsx      — card centrée, logo Swish League
    Inscription.jsx    — card centrée, logo Swish League
    Groupes.jsx        — Ligues : actives / terminées séparées, bannière, header plein bord
    Classement.jsx     — liste par ligue, stats enrichies, clic → MesPronos
    MesPronos.jsx      — stats perso + publiques via ?user_id, forme récente W/L
    MatchDetail.jsx    — fiche match complète, charte BLOC
    Calendrier.jsx     — vues 1j/3j/7j/mois, No Spoil, bannière
    Profil.jsx         — profil éditable, avatar uploadable, charte BLOC
  components/
    Navigation.jsx     — desktop top + mobile logo top + mobile bottom nav + hamburger
                         ↳ Logo Swish League + avatar utilisateur cliquable → /profil
    BandeMatchs.jsx    — bande scrollable horizontale (3 jours) + No Spoil
    ClassementRapide.jsx
    PronosAttente.jsx
    RunsPotes.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx — popup "Quoi de neuf" versionnée, logo Swish League intégré
```

## Navigation
- Desktop : top navbar fixe — [Logo + SWISH LEAGUE] [Board] [Classement] [Mes stats] [Avatar+pseudo] [≡]
- Mobile : barre logo top 40px (logo + nom + avatar cliquable + hamburger) + bottom nav fixe 60px [Board] [Classement] [Mes stats]
- Hamburger : panneau droit — bloc profil (avatar + pseudo + "Mon profil") + Ligues + Calendrier + No Spoil + Quoi de neuf + Déconnexion

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
```

## Profil utilisateur
Champs : pseudo (unique), avatar_url (Storage Supabase), description (bio libre)
Upload avatar : max 2Mo, formats image/*, cache-busting par timestamp
Champs éditables inline : clic → input/textarea, Sauvegarder / Annuler
Avatar affiché partout : Navigation, Classement, MesPronos

## Composant Avatar (exporté depuis Profil.jsx)
```jsx
<Avatar url={profil?.avatar_url} pseudo={profil?.pseudo} taille={40} fontSize={14} />
```
Fallback : initiales 2 lettres + couleur déterministe par première lettre du pseudo
Importé dans : Navigation, Classement, MesPronos

## Fonctionnalités livrées

### Auth
✅ Inscription, connexion, déconnexion, session persistante

### Board (Accueil)
✅ Header + accroche "Pronostique. Clashe. Règne." + description
✅ Toggle No Spoil intégré
✅ Bannières images Unsplash entre sections
✅ BandeMatchs scrollable (3 jours) → MatchDetail
✅ Blocs BLOC gradient : Ligue en cours, Pronos en attente, Runs des potes

### Mode No Spoil
✅ Context global persisté localStorage, actif par défaut
✅ Toggle Board + hamburger
✅ BandeMatchs, Calendrier, MatchDetail : scores masqués sur terminés
✅ Résultat de prono masqué en mode No Spoil (fix 2026-05-27)

### Profil utilisateur
✅ Avatar uploadable (Supabase Storage bucket avatars)
✅ Pseudo + bio éditables inline
✅ Stats pronos : total / corrects / ratés / % réussite
✅ Ligues rejointes avec points
✅ Avatar visible dans Navigation (desktop + mobile + hamburger)

### Popup "Quoi de neuf"
✅ Logo Swish League intégré
✅ Changelog versionné, accessible depuis hamburger
✅ VERSION_COURANTE = v0.7
✅ Encart No Spoil intégré

### Fiche match (MatchDetail)
✅ Badges saison + type + Live
✅ Affiche principale : logos + trigrammes + Ext/Dom
✅ Score final ou VS + heure
✅ Scores par quart-temps (⚠️ bug — ne s'affichent pas toujours)
✅ Lieu + stade + ville + date/heure
✅ Forme récente L5
✅ Stats moyennes saison
✅ Leaders avec photo
✅ Blessés/Absents
✅ Prono intégré : clic sur logo/équipe
✅ No Spoil : score masqué, résultat prono masqué, perdant non grisé

### Pronos
✅ Upsert Supabase — contrainte unique (user_id, match_id, groupe_id)
✅ Verrouillage auto côté client (heure match ou statut)
✅ Cache match enrichi : type_saison + saison stockés
✅ Calcul points au chargement Board
✅ Rattachement automatique à la bonne ligue selon type_saison du match
✅ Support multi-ligues : un prono par ligue correspondante

### Ligues (Groupes)
✅ Liste publique — rejoindre en un clic
✅ Création réservée à l'admin (ADMIN_ID hardcodé)
✅ Champs : nom, type ESPN (1-5 ou null=général), saison ESPN, date de clôture optionnelle
✅ Clôture automatique si date_fin dépassée
✅ Tri automatique : actives en haut, terminées en bas
✅ Badge "✓ Inscrit", points affichés
✅ Quitter (soft delete)

### Classement
✅ Liste par ligue (une liste par ligue rejointe)
✅ Médailles 🥇🥈🥉 dans la liste
✅ Stats enrichies inline : points / corrects ✓ / ratés ✗ / % réussite
✅ Clic sur une ligne → /mes-pronos?user_id=xxx

### Mes stats / Profil public (MesPronos)
✅ Lit ?user_id — affiche stats de n'importe quel user
✅ Header : avatar + pseudo + bio
✅ Badge "Profil public · pronos en attente masqués" si autre user
✅ Stats globales : total / corrects / ratés / %
✅ Forme récente : 5 derniers W/L (matchs terminés uniquement)
✅ Historique : pronos en attente masqués pour les autres users
✅ Cliquable → MatchDetail uniquement pour soi-même

### Calendrier
✅ Vues : 1j / 3j / Semaine / Mois
✅ Navigation + bouton Aujourd'hui
✅ Filtres : type de match + équipe
✅ Cache local par date
✅ No Spoil : scores masqués sur terminés
✅ Historique depuis ~2003
✅ Clic jour mois : 1 match → MatchDetail, 2+ → zoom 1j

## Système de points
Bon vainqueur = 1 point
Points filtrés par ligue (type_saison + saison ESPN)
Score exact / bonus série = à définir (Sprint 2)

## Règles de travail
- Français, tutoiement, direct, concis
- React + Vite uniquement — HTML/CSS/JS vanilla interdit
- Variables et commentaires en français
- Toujours indiquer fichier + ligne/bloc + contexte pour toute modif de code
- Jamais border shorthand + longhand sur le même élément
- Appels ESPN : surveiller stabilité + CORS
- Supabase : anticiper pause inactivité en dev
- RGPD : pas de données sensibles, minimisation profil
- Refetch raw GitHub en début de session — ne pas se fier au cache

## Backlog Sprint 1 (restant)
- [ ] Scores quarts-temps dans MatchDetail (bug — ne s'affichent pas)
- [ ] Leaders stats NBA via proxy Supabase Edge Function (CORS bloqué)
- [ ] Lien MatchDetail depuis MesPronos pour matchs anciens (espn_id manquant)
- [ ] Suppression ligue (admin uniquement)
- [ ] Sélecteur de saison dans Calendrier
- [ ] Table equipes Supabase (trigrammes officiels NBA, couleurs)
- [ ] ADMIN_ID hardcodé côté client → sécuriser côté serveur en prod
- [ ] Calcul points côté serveur (Edge Function) — actuellement déclenché au chargement Board de chaque user

## Backlog Sprint 2
- [ ] IA Gemini : suggestions pronos, résumés matchs
- [ ] Verrouillage prono côté serveur (Edge Function Supabase)
- [ ] Visualisations stats : graphiques, comparaisons joueurs
- [ ] Notifications push résultats pronos
- [ ] Chat entre membres du groupe
- [ ] Badges utilisateurs
- [ ] Edge Functions Supabase pour calcul points automatique
- [ ] Page Stats/Explorer : classements NBA, fiches équipes, fiches joueurs
- [ ] Accueil enrichi : news actu NBA, leaders stats
- [ ] Bonus score exact + bonus série dans le système de points

## Backlog idées (hors MVP)
- Fantasy league
- Système de draft
- App mobile native (Capacitor ou React Native)
- PWA iOS plein écran (problème Safari/React Router — chantier dédié)
- IA prédictive
- Historique complet saisons

## RGPD & Sécurité
Données stockées : pseudo, email (auth), avatar (Storage), bio, historique pronos.
Clé balldontlie : variable d'environnement, jamais en dur.
.env dans .gitignore — clés Supabase jamais commitées.
ESPN API : aucune donnée personnelle dans les requêtes.
ADMIN_ID hardcodé côté client — acceptable en phase proto, à sécuriser côté serveur en prod.
Avatars : bucket public Supabase Storage, pas de données sensibles.

## Veille technique
ESPN API non officielle : surveiller tout changement de structure ou blocage CORS.
Supabase : surveiller évolutions du free tier (pause inactivité).
Vercel Hobby : usage non-commercial uniquement.
Vérifier modèle Claude disponible à chaque session (claude-sonnet dernière version stable).

## Sessions Claude — bonnes pratiques
- Toujours refetch les fichiers raw GitHub en début de session
- Préciser les fichiers modifiés depuis la dernière session
- Toujours commiter et pusher avant de démarrer une nouvelle session
- Coller directement le contenu des fichiers si le raw GitHub est inaccessible
- Le socle est la référence — le mettre à jour à chaque session significative

---
## Liens raw GitHub
```
# Racine
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
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/pages/Profil.jsx

# Components
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/Navigation.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/BandeMatchs.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/ClassementRapide.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/PronosAttente.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/RunsPotes.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/CreerGroupe.jsx
https://raw.githubusercontent.com/jpvt-data/nba-pronostics/refs/heads/main/src/components/PopupChangelog.jsx
```

---
## Backlog idées session (capturées en cours de conversation)
> [2026-05-27] — PWA iOS plein écran — problème Safari/React Router, chantier dédié
> [2026-05-27] — Page Stats/Explorer : classements NBA, fiches équipes/joueurs — Sprint 2
> [2026-05-27] — Bonus score exact + bonus série playoffs — système de points Sprint 2
> [2026-05-27] — Calcul points côté serveur automatique — Sprint 2 prioritaire
