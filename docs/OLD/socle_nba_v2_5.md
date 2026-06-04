# SWISH LEAGUE — SOCLE v2.5
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-05-30

---

## SOMMAIRE

1. [Projet & philosophie](#1-projet--philosophie)
2. [Identité visuelle & design system](#2-identité-visuelle--design-system)
3. [Charte graphique — règles appliquées](#3-charte-graphique--règles-appliquées)
4. [Sources de données ESPN](#4-sources-de-données-espn)
5. [BDD Supabase](#5-bdd-supabase)
6. [Architecture fichiers](#6-architecture-fichiers)
7. [Navigation & routes](#7-navigation--routes)
8. [Fonctionnalités livrées](#8-fonctionnalités-livrées)
9. [Décisions produit](#9-décisions-produit)
10. [Risques ouverts](#10-risques-ouverts)
11. [Dette technique ouverte](#11-dette-technique-ouverte)
12. [Backlog](#12-backlog)
13. [Règles de travail](#13-règles-de-travail)
14. [RGPD & sécurité](#14-rgpd--sécurité)
15. [Veille technique](#15-veille-technique)
16. [Documents de référence complémentaires](#16-documents-de-référence-complémentaires)

---

## 1. Projet & philosophie

**App web NBA communautaire** — pronos entre amis, stats, scores, classements, collection de cartes joueurs.
Nom de marque : **Swish League**.
Périmètre : app de passion NBA, pensée pour un usage entre amis avec une vraie dimension sociale et de gamification.

**Philosophie :** "Les données d'abord, l'interface suit."
App entre potes : compétition amicale, chambrage, passion basket.
Mobile first. Rapide. Lisible. Fun. Sans surcharge.

### Stack technique — 100% gratuit
- **Front :** React + Vite
- **Deploy :** Vercel (Hobby, non-commercial)
- **Back :** Supabase (PostgreSQL + Auth + Storage) — ⚠️ pause après 1 semaine d'inactivité
- **CSS :** pas de framework — tokens CSS centralisés dans `index.css`
- **Icônes :** Lucide React
- **Fonts :** Inter (body) + Barlow Condensed (display/scores) — Google Fonts

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE
**Logo :** `src/assets/swish_league_logo.png` (bouclier basket, rouge/bleu marine)
**Accroche :** "Pronostique. Clashe. Règne."

### Tokens CSS (index.css) — v2.5
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
--gold: #f59e0b        streak / podium / points
--gold-dim: rgba(245,158,11,0.12)
--text-1: #e8e8f0      texte principal
--text-2: #9090b0      texte secondaire
--text-3: #8080a0      texte tertiaire / paragraphes
--radius-sm / md / lg : 6px / 10px / 14px
--shadow-sm: 0 2px 8px rgba(0,0,0,0.4)
--shadow-md: 0 4px 16px rgba(0,0,0,0.5)
--font-body: Inter
--font-display: Barlow Condensed
```

### Composants réutilisables — `src/components/UI.jsx`
- **LabelSection** — titre de section en dégradé accent→orange, uppercase, letterSpacing 0.1em
- **BanniereImage** — image Unsplash bord à bord, sans border-radius, avec dégradé latéral, bordures accent top/bottom
- **Bloc** — card radius-lg, gradient accent 8% → transparent

---

## 3. Charte graphique — règles appliquées

### Typographie

| Élément | Font | Taille | Poids | Token couleur |
|---|---|---|---|---|
| h1 | Barlow Condensed | 26px | 700 | --text-1 |
| h2 | Barlow Condensed | 20px | 700 | --text-1 |
| h3 (labels section) | Inter | 13px | 700 | --text-2, uppercase |
| Scores / chiffres clés | Barlow Condensed | 28-36px | 700 | selon contexte |
| Stats globales (profil) | Barlow Condensed | 32px | 700 | selon sémantique |
| Points classement | Barlow Condensed | 18px | 700 | **--gold** |
| Trigrammes équipes | Barlow Condensed | 16px | 700 | --text-1 / --text-2 |
| Corps | Inter | 13-14px | 400-600 | --text-2 / --text-3 |

### Couleurs sémantiques — règles strictes
- **--gold** : points, médailles top 3, streak. Jamais --accent pour les points.
- **--accent** : éléments interactifs, badges, liens
- **--success** : prono correct, W dans forme récente
- **--danger** : prono raté, L dans forme récente
- **--orange** : second accent NBA

### Headers de page — règle unifiée
Toutes les pages ont un header avec `background: linear-gradient(160deg, rgba(99,102,241,0.08) 0%, transparent 60%)` et `padding: 20px 16px`.

### Boutons CTA principaux
Dégradé `linear-gradient(90deg, var(--accent), var(--orange))`.

---

## 4. Sources de données ESPN

### Philosophie — source unique ESPN
**Décision : ESPN uniquement.**

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
Standings       : site.api.espn.com/apis/v2/sports/basketball/nba/standings?season={SAISON_ESPN}&seasontype=2
News            : site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=5
Roster          : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster
Injuries        : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries
Stats joueur    : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats
Game log joueur : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog
Predictor       : sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor
```

---

## 5. BDD Supabase

### Tables actuelles
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `semaines_gagnees`
RLS activé sur toutes les tables.

### profils
`id` | `pseudo` | `avatar_url` | `description` | `cree_le`

### groupes
`id` | `nom` | `admin_id` | `date_debut` | `date_fin` | `type_saison` | `saison`
- `date_debut` : ajouté v2.5 — permet de planifier les ligues à l'avance
- `date_fin` : clôture de la ligue
- Les ligues sans `date_debut` renseignée sont considérées en cours (rétrocompatibilité)

### membres_groupe
`id` | `user_id` | `groupe_id` | `points` | `actif`
⚠️ Pas de colonne `cree_le` dans cette table — ne pas l'utiliser.

### matchs
`id` | `espn_id` | `date_match` | `equipe_domicile` | `equipe_exterieur` | `statut` | `type_saison` | `saison`

### pronos
`id` | `user_id` | `match_id` | `groupe_id` | `equipe_choisie` | `resultat` | `points_gagnes` | `cree_le`
Valeurs `resultat` : `'correct'` | `'incorrect'` | `'en_attente'`

### semaines_gagnees — NOUVELLE v2.5
`id` | `user_id` | `groupe_id` | `semaine_iso` | `points` | `cree_le`
- Contrainte UNIQUE sur `(groupe_id, semaine_iso)` — 1 seul gagnant par ligue par semaine
- Alimentée automatiquement à l'ouverture de Classement.jsx (option C — calcul à l'affichage)
- Format semaine_iso : `'2026-W21'`
- RLS : lecture tous authentifiés, insert tous authentifiés (la contrainte UNIQUE absorbe les conflits)

### RLS Supabase — état validé
- `pronos` SELECT : `auth.role() = 'authenticated'`
- `pronos` INSERT/UPDATE : `auth.uid() = user_id`
- `profils` INSERT/UPDATE : `auth.uid() = id`
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `semaines_gagnees` SELECT/INSERT : `auth.role() = 'authenticated'`

---

## 6. Architecture fichiers

```
src/
  App.jsx
  main.jsx
  index.css
  config.js
  assets/
    swish_league_logo.png
  lib/
    supabase.js
  context/
    NoSpoilContext.jsx
    ProfilContext.jsx
  data/
    changelog.js
  services/
    espn.js
    points.js
    ligues.js
  pages/
    Accueil.jsx
    Connexion.jsx
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx
    MatchDetail.jsx
    Calendrier.jsx
    Profil.jsx
    Stats.jsx
    H2H.jsx           ← NOUVEAU v2.5
    QuoiDeNeuf.jsx    ← NOUVEAU v2.5
  components/
    UI.jsx
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Focus.jsx
    LeVestiaire.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
```

**Supprimé :** `RunsPotes.jsx` — remplacé par `LeVestiaire.jsx`

---

## 7. Navigation & routes

### Routes actuelles
```
/connexion        public
/inscription      public
/accueil          privé — Board
/classement       privé — supporte ?ligue=X pour ligue spécifique
/mes-pronos       privé — supporte ?user_id=X pour profil public
/groupes          privé
/match/:espn_id   privé
/calendrier       privé
/profil           privé
/stats            privé
/h2h              privé — supporte ?user2=X pour pré-sélection adversaire
/quoi-de-neuf     privé
```

### Menu hamburger — ordre
Profil → Explorer → Ligues → Calendrier → No Spoil → 1v1 → [séparateur] → Quoi de neuf ? → Déconnexion

---

## 8. Fonctionnalités livrées

### Auth ✅
### Board (Accueil) ✅
Ordre des blocs :
1. Header (accroche + pseudo + toggle No Spoil)
2. **Focus** — carousel spotlight perso (streak, win rate, pronos en attente)
3. BandeMatchs scrollable 3 jours
4. Bouton Calendrier complet
5. **Le Vestiaire** — fil streaks communautaires
6. ClassementRapide — ligue en cours, points année NBA
7. Pronos en attente
8. Bannière séparatrice
9. StandingsNBA + BracketPlayoffs (si playoffs) + Actu NBA

### Focus.jsx ✅
- Carousel séquentiel avec fade (350ms) toutes les 4s
- Points de pagination animés
- Messages : pronos en attente → streak ≥ 2 → win rate (si ≥ 5 pronos)
- Se masque si aucun message. Extensible via `genererMessages()`

### LeVestiaire.jsx ✅
- Détecte streaks ≥ 2 (correct ET incorrect) pour tous les potes de toutes les ligues
- Déduplication potes par user_id
- Se masque si aucun événement. Extensible via `genererEvenements()`
- ⚠️ `membres_groupe` n'a pas de colonne `cree_le`

### MesPronos.jsx ✅ — enrichi v2.5
- Stats globales (total / corrects / ratés / %)
- **Streak actuel + max** — bloc Séries
- **Meilleure / Pire équipe** — seuil minimum 3 pronos pour significativité
- Forme récente 10 derniers matchs (W/L + équipe choisie)
- Stats par ligue
- Historique complet cliquable
- Bouton **1v1** visible quand on consulte le profil d'un autre user → `/h2h?user2=X`

### Classement.jsx ✅ — refondu v2.5
- Ligues en cours uniquement par défaut (filtre date_debut/date_fin)
- Supporte `?ligue=X` pour afficher une ligue spécifique (terminées incluses)
- **MVP Semaine précédente** — lu depuis `semaines_gagnees`, ex-aequo gérés
- **Classement général** avec toggle **Semaine / Mois / Saison** (année NBA 1 sept → 31 août)
- Enregistrement automatique du gagnant semaine précédente à l'ouverture (option C)
- Déduplication pronos par `(user_id, match_id)` pour le général
- Clic sur un membre → `/mes-pronos?user_id=X`

### ClassementRapide.jsx ✅ — mis à jour v2.5
- Affiche uniquement les ligues en cours (filtre date_debut/date_fin)
- Points calculés depuis le 1er septembre de l'année NBA courante
- Label "Saison 25-26" affiché sous le nom de ligue

### Groupes.jsx ✅ — refondu v2.5
- Onglets **À venir / En cours / Terminées** (défaut : En cours)
- Catégorisation automatique selon date_debut et date_fin
- Bouton "Classement" sur les ligues en cours et terminées → `/classement?ligue=X`
- Bouton "Rejoindre" disponible aussi sur les ligues À venir

### CreerGroupe.jsx ✅ — mis à jour v2.5
- `date_debut` et `date_fin` obligatoires (avec validation)
- Dates côte à côte (grid 1fr 1fr)
- Validation : date_debut < date_fin

### H2H.jsx ✅ — NOUVEAU v2.5
- Page `/h2h` — moi vs un pote
- Picker adversaire : tous les membres de mes ligues (dédupliqués, triés par pseudo)
- Pré-sélection via `?user2=X`
- Bilan global (victoires / défaites / nuls) avec verdict coloré
- Match par match : pick des deux users + résultat, cliquable vers MatchDetail
- Bouton retour `navigate(-1)`
- Accessible depuis : hamburger "1v1", bouton dans MesPronos, clic MVP semaine précédente

### QuoiDeNeuf.jsx ✅ — NOUVEAU v2.5
- Page `/quoi-de-neuf` — historique des versions
- Alimentée par `changelog.js` (JSON extensible)
- Accessible depuis le menu hamburger

### PopupChangelog.jsx ✅ — refondu v2.5
- Logo texte "SWISH LEAGUE" style navbar (plus d'image logo)
- Encart No Spoil conservé
- Message contextuel : pronos en attente ou "Bon retour 🏀"
- Changelog retiré du popup → déplacé dans `/quoi-de-neuf`

### Explorer (Stats.jsx) ✅
### Fiche match (MatchDetail) ✅
### Pronos ✅
### Profil ✅
### Calendrier ✅
### Mode No Spoil ✅

---

## 9. Décisions produit

### Session 2026-05-29
- **Focus** = spotlight personnel, carousel. **Le Vestiaire** = fil communautaire potes.
- RunsPotes.jsx = obsolète, supprimé.
- Les deux sections extensibles à chaque Sprint sans refonte.

### Session 2026-05-30
- **Popup changelog** : ne sert plus à afficher les nouveautés (personne ne lit). Rôle = accueil contextuel (No Spoil + message). Les nouveautés → page dédiée `/quoi-de-neuf`.
- **H2H** : toujours moi vs quelqu'un. Pas de Y vs Z. Accès naturel depuis MesPronos (bouton sur profil d'un autre user).
- **Classement général** : filtrable Semaine / Mois / Saison. Pas de "total depuis toujours" — l'année NBA (1 sept → 31 août) est l'unité de temps de référence.
- **Ligues planifiées** : `date_debut` ajouté à `groupes`. Permet de créer les ligues en avance. Les ligues futures n'apparaissent pas dans Classement ni ClassementRapide.
- **Semaines gagnées** : stockage déclenché à l'affichage de Classement (option C — pas de cron). Contrainte UNIQUE absorbe les conflits simultanés.
- **ClassementRapide** : points depuis le 1er septembre uniquement (année NBA), pas depuis la création de la ligue.
- **Icônes hamburger** : Ligues = Shield (Swords réservé au 1v1).

### Trame messages Focus — extensible Sprint par Sprint
| Priorité | Condition | Message |
|---|---|---|
| 1 | pronos en attente > 0 | "Tu as N pronos en attente..." |
| 2 | streak correct ≥ 2 | "Tu es sur une série de N..." |
| 3 | streak incorrect ≥ 2 | "N ratés d'affilée..." |
| 4 | win rate (≥ 5 pronos) | "Tu réussis X%..." |
| + Sprint 3 | badge proche | "Plus qu'1 prono pour débloquer..." |
| + Sprint 4 | carte du jour | "Ta carte du jour t'attend 🃏" |

### Trame événements Vestiaire — extensible Sprint par Sprint
| Événement | Condition | Message |
|---|---|---|
| Streak correct | ≥ 2 corrects consécutifs | "🔥 Pseudo est sur une série de N..." |
| Streak incorrect | ≥ 2 incorrects consécutifs | "❄️ Pseudo est sur une série de N ratés..." |
| + Sprint 3 | badge débloqué | "🏅 Pseudo a débloqué le badge..." |
| + Sprint 3 | leader semaine | "👑 Pseudo prend la tête de la ligue..." |
| + Sprint 4 | carte légendaire | "💎 Pseudo vient d'obtenir une carte Legendary..." |

---

## 10. Risques ouverts

### RISQUE-02 — `calculerPoints` sans verrou → race condition
**Sévérité :** 🟡 Moyenne

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute si l'app grandit

### RISQUE-B — ESPN API blocage CORS
**Sévérité :** 🟡 Moyenne

### RISQUE-C — Dépassement quota Supabase free tier
**Sévérité :** 🟡 Moyenne — `semaines_gagnees` reste légère (1 ligne/semaine/ligue)

### RISQUE-D — MVP semaine précédente non enregistré si personne n'ouvre Classement
**Sévérité :** 🟢 Faible — acceptable à ce stade, à surveiller si usage augmente

---

## 11. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible

### DETTE-14 — ClassementRapide : plusieurs appels séquentiels pour calculer les points année NBA
**Sévérité :** 🟢 Faible — optimisable avec une vue Supabase si nécessaire

---

## 12. Backlog

### Sprint 1 — RÉTENTION ✅ LIVRÉ
```
✅ Focus.jsx — carousel spotlight perso
✅ LeVestiaire.jsx — fil streaks communautaires
✅ Dashboard MesPronos enrichi (streak, meilleure/pire équipe, forme 10 matchs)
✅ PopupChangelog restructuré
✅ Page Quoi de neuf (/quoi-de-neuf)
⏳ Notifications push — reporté (Web Push limité iOS, badge nav comme alternative légère)
```

### Sprint 2 — ENGAGEMENT SOCIAL (en cours)
```
✅ Classement hebdomadaire → remplacé par toggle Semaine/Mois/Saison
✅ MVP Semaine précédente (semaines_gagnees)
✅ Head-to-Head 1v1
✅ Ligues planifiées (date_debut + onglets À venir/En cours/Terminées)
⏳ Score exact en bonus (+2 pts écart ±5, +3 pts score exact) — migration BDD pronos
⏳ Onboarding guidé (4 étapes : pitch → ligue → prono → notifs)
```

### Sprint 3 — PROFONDEUR & POLISH
```
Chat / réactions par ligue (Supabase Realtime ou polling 30s)
Badges / achievements (table badges, logique déclenchement)
Profil public enrichi (stats, badges, niveau, historique)
Preview match enrichi (win prob ESPN, blessés, L5, H2H avant prono)
Leaderboard global (tous users, profils publics)
Partage de pick (Canvas API, format Story)
Badge nav "pronos en attente" (alternative légère aux notifs push)
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (équipe & joueur favoris) — impact Board + standings + collection
Système de niveaux & XP (table xp_log, 7 niveaux Rookie → GOAT)
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes joueurs (catalogue ~200 cartes, 5 raretés, tirage quotidien)
```

### Mis de côté
- Swish Data — indéfiniment
- Notifications push Web — reporté après clarification audience iOS vs Android

---

## 13. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- **Toujours indiquer fichier + ligne ou bloc + contexte pour toute modification**
- Jamais border shorthand + longhand sur le même élément
- **Une modification à la fois — push + test entre chaque**
- **Toujours réécrire les fichiers complets**
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- Tokens CSS : toujours utiliser les variables
- Année NBA = 1 septembre → 31 août — référence pour tous les calculs temporels

---

## 14. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar, bio, historique pronos.
Clés Supabase : variables d'environnement, jamais commitées.
Notifications push : consentement explicite obligatoire si implémenté.
Mention légale : "jeu de pronostics gratuit, aucun argent réel".
Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France).

---

## 15. Veille technique

- ESPN API non officielle : surveiller changements de structure
- Supabase : surveiller free tier (500 MB stockage, 2 GB bande passante/mois)
- Vercel Hobby : usage non-commercial uniquement, 1 cron/projet
- Web Push API : compatibilité Safari iOS limitée (Add to Home Screen requis)
- `semaines_gagnees` : surveiller la croissance (estimé ~52 lignes/an/ligue — très gérable)

---

## 16. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v2_5.md` | Référence technique | ✅ Ce document |
| `swish_league_roadmap_v1_2.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v2.5 — 2026-05-30*
*Remplace socle_nba_v2_4.md*
