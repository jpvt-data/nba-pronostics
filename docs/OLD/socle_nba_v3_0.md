# SWISH LEAGUE — SOCLE v3.0
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-02

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
Tagline : **"Pronostique. Clashe. Règne."**
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
- **Fonts :** Inter (body) + Barlow Condensed (display/scores) + **Teko (titres de sections)** — Google Fonts

### URLs
- App en prod : https://nba-pronostics.vercel.app
- Repo GitHub : https://github.com/jpvt-data/nba-pronostics
- Supabase : https://fcyhieueuskeooakyla.supabase.co

---

## 2. Identité visuelle & design system

**Nom affiché :** SWISH LEAGUE
**Logo :** texte Teko — "SWISH" `var(--text-1)` + "LEAGUE" `var(--accent)`, pas d'image logo
**Accroche :** "Pronostique · Clashe · Règne" (sous le logo en navbar)

### Tokens CSS (index.css) — v3.0

```
--bg-0: #0d0d12        fond principal
--bg-1: #12121c        surfaces / blocs sombres
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
--radius-sm: 6px
--radius-md: 10px
--radius-lg: 14px
--shadow-sm: 0 2px 8px rgba(0,0,0,0.4)
--shadow-md: 0 4px 16px rgba(0,0,0,0.5)
--font-body: Inter
--font-display: Barlow Condensed
--font-title: Teko
--nav-bg: #ffffff
--nav-border: #e8e8e8
--nav-text: #0d0d12
--nav-text-dim: #888
```

### Composants UI — état v3.0
- **`LabelSection`**, **`Bloc`**, **`BanniereImage`** : obsolètes, **supprimés** de toutes les pages. Ne plus utiliser.
- Remplacés par le pattern barre gauche + `TitreSection` Teko défini localement dans chaque fichier.

---

## 3. Charte graphique — règles appliquées

### Typographie

| Élément | Font | Taille | Poids | Token couleur |
|---|---|---|---|---|
| Titre page (header) | Teko | 36px | 600 | --text-1 + mot2 accent |
| Titre section | Teko | 20-24px | 600 | --text-1 + mot2 couleur sémantique |
| Scores / chiffres clés | Barlow Condensed | 32-44px | 700 | selon contexte |
| Points classement | Barlow Condensed | 18px | 700 | **--gold** |
| Trigrammes équipes | Barlow Condensed | 16-26px | 700 | --text-1 / couleur équipe |
| Corps | Inter | 12-14px | 400-600 | --text-2 / --text-3 |
| Labels uppercase | Inter | 10-11px | 600-700 | --text-3, letterSpacing 0.06em |

### Titres bicolores Teko — règle stricte

```jsx
const TitreSection = ({ mot1, mot2 = '', couleur2 = 'var(--accent)', taille = 20 }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
    <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: 'var(--text-1)', letterSpacing: '0.02em', lineHeight: 1 }}>{mot1}</span>
    {mot2 && <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: taille, color: couleur2, letterSpacing: '0.02em', lineHeight: 1 }}>{mot2}</span>}
  </div>
)
```

**Règles bicolore :**
- Mots composés (`FORME RÉCENTE`) → mot1="FORME" mot2="RÉCENTE" avec `gap: 6` — l'espace est géré par le gap
- Mots simples (`SÉRIES`, `HISTORIQUE`) → tout en blanc, pas de mot2
- Jamais couper un mot au milieu (`SÉ`/`RIES` interdit)
- `gap: 0` uniquement quand le découpage est naturellement collé (`CLASSE`+`MENT`, `1`+`v1`)

### Pattern header de page — règle unifiée

```jsx
<div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
  <TitreSection mot1="PAGE" mot2="TITRE" taille={36} />
  <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>Sous-titre</p>
</div>
```

### Pattern blocs de contenu — barre gauche 3px
Chaque section de contenu utilise une barre gauche colorée selon sa sémantique :
- **accent** `#6366f1` → sections principales, stats, picker
- **gold** `#f59e0b` → classements, points, MVP
- **orange** `#f97316` → équipes, actus NBA, profil fan
- **success** `#22c55e` → résultats corrects
- **danger** `#ef4444` → blessés, admin, résultats ratés
- **border / border-2** → historique neutre, sections secondaires

### Fonds — alternance rythmée (pas mécanique)
- `var(--bg-0)` `#0d0d12` — fond principal
- `var(--bg-1)` `#12121c` — blocs principaux
- `#f0ede8` — beige clair (LeVestiaire, Accueil board — usage limité)
- Pas d'alternance systématique clair/sombre/clair/sombre — rythmer selon sens

### Angles vifs — règle stricte
- Pas de `border-radius-lg` sur les blocs de contenu
- `border-radius-sm` (6px) uniquement sur les boutons et inputs
- Préférer `border-radius: 0` pour les listes et cards

### Boutons CTA
- Principal : `background: var(--accent)`, `border-radius: var(--radius-sm)`
- Secondaire : `background: transparent`, `border: 1px solid var(--border)`
- **Plus de dégradé accent→orange** sur les CTA (supprimé v3.0)

### Couleurs sémantiques — règles strictes
- **--gold** : points, médailles top 3, streak, MVP. Jamais --accent pour les points.
- **--accent** : éléments interactifs, badges, liens, icônes actives
- **--success** : prono correct, W dans forme récente
- **--danger** : prono raté, L dans forme récente, admin
- **--orange** : second accent NBA, équipes, actus

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
`profils` | `groupes` | `membres_groupe` | `matchs` | `pronos` | `semaines_gagnees` | `messages`
RLS activé sur toutes les tables.

### profils
`id` | `pseudo` | `avatar_url` | `description` | `cree_le`

### groupes
`id` | `nom` | `admin_id` | `date_debut` | `date_fin` | `type_saison` | `saison`
- `date_debut` : permet de planifier les ligues à l'avance
- Les ligues sans `date_debut` sont considérées en cours (rétrocompatibilité)

### membres_groupe
`id` | `user_id` | `groupe_id` | `points` | `actif`
⚠️ Pas de colonne `cree_le` dans cette table.

### matchs
`id` | `espn_id` | `date_match` | `equipe_domicile` | `equipe_exterieur` | `statut` | `type_saison` | `saison`

### pronos
`id` | `user_id` | `match_id` | `groupe_id` | `equipe_choisie` | `resultat` | `points_gagnes` | `cree_le`
Valeurs `resultat` : `'correct'` | `'incorrect'` | `'en_attente'`

### semaines_gagnees
`id` | `user_id` | `groupe_id` | `semaine_iso` | `points` | `cree_le`
- Contrainte UNIQUE sur `(groupe_id, semaine_iso)` — 1 seul gagnant par ligue par semaine
- Ex-aequo → rien inséré (pas de MVP cette semaine)
- Alimentée à l'ouverture de `Classement.jsx`
- Format semaine_iso : `'2026-W22'`

### messages
`id` | `user_id` | `groupe_id` | `contenu` | `cree_le`
- Max 500 caractères
- RLS : lecture/insert membres du groupe

### RLS Supabase — état validé
- `pronos` SELECT : `auth.role() = 'authenticated'`
- `pronos` INSERT/UPDATE : `auth.uid() = user_id`
- `profils` INSERT/UPDATE : `auth.uid() = id`
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `semaines_gagnees` SELECT : `auth.role() = 'authenticated'` + `GRANT SELECT,INSERT TO authenticated`
- `groupes` INSERT : restreint à `admin_id = 'fa55d016-...'`

---

## 6. Architecture fichiers

```
src/
  App.jsx
  main.jsx
  index.css
  config.js
  assets/
    swish_league_logo.png   ← non utilisé (logo texte Teko en production)
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
    Connexion.jsx           ← redirige vers PopupChangelog (5 lignes)
    Inscription.jsx
    Groupes.jsx
    Classement.jsx
    MesPronos.jsx
    MatchDetail.jsx
    Calendrier.jsx
    Profil.jsx
    Stats.jsx
    H2H.jsx
    QuoiDeNeuf.jsx
    Admin.jsx
  components/
    UI.jsx                  ← LabelSection/Bloc/BanniereImage obsolètes mais fichier conservé
    Navigation.jsx
    Avatar.jsx
    BandeMatchs.jsx
    BracketPlayoffs.jsx
    ClassementRapide.jsx
    PronosAttente.jsx
    Focus.jsx
    LeVestiaire.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx      ← point d'entrée auth + splash screen animé
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx
    LeadersStats.jsx
```

---

## 7. Navigation & routes

### Routes

```
/connexion        → Connexion.jsx (render PopupChangelog forceOuvert)
/inscription      → public, accessible sans session
/accueil          → non protégé (popup bloque les non-connectés)
/classement       → privé, supporte ?ligue=X
/mes-pronos       → privé, supporte ?user_id=X
/groupes          → privé
/match/:espn_id   → privé
/calendrier       → privé
/profil           → privé
/stats            → privé
/h2h              → privé, supporte ?user2=X
/quoi-de-neuf     → privé
/admin            → privé, restreint ADMIN_ID
*                 → redirect /accueil
```

### Logique auth — App.jsx
- Non connecté → `/accueil` avec popup indestructible (pas de `onClick` fond)
- Connecté → popup normal fermable → accueil
- Déconnexion → `navigate('/connexion')` → reload complet → popup réapparaît
- `skip_popup` localStorage : supprimé (v3.0)

### Menu hamburger — ordre
Profil → Explorer → Ligues → Calendrier → 1v1 → [séparateur] → Admin (si admin) → Quoi de neuf ? → Déconnexion
**No Spoil supprimé du menu** (v3.0)

---

## 8. Fonctionnalités livrées

### Auth & Onboarding ✅ — refondu v3.0
- `Connexion.jsx` = wrapper PopupChangelog
- `PopupChangelog.jsx` = splash screen animé (logo → tagline mot par mot) + formulaire login intégré
- Non connecté : fond plein `var(--bg-0)`, popup indestructible
- Connecté : fond semi-transparent, "Content de te revoir + pseudo", bouton C'est parti
- `Inscription.jsx` : page dédiée même charte que le popup

### Mode No Spoil ✅
- Toggle dans la navbar desktop et mobile top
- **Supprimé** du menu hamburger et de l'header Board (v3.0)

### Board (Accueil) ✅
Ordre des blocs :
1. Header (Bonjour + pseudo, barre accent gauche)
2. **Focus** — carousel spotlight perso
3. **TIMELINE** — BandeMatchs + FiltreEquipe + bouton Calendrier
4. **LIGUE EN COURS** — ClassementRapide
5. **Le Vestiaire** — fond beige `#f0ede8`, streaks potes + chat ligues
6. Bannière Unsplash
7. StandingsNBA + BracketPlayoffs (si playoffs)
8. **ACTU NBA** — NewsNBA

### Classement.jsx ✅ — v3.0
- Filtre par défaut : **Saison** (année NBA)
- Toggle Semaine / Mois / Saison
- MVP semaine précédente — ex-aequo = pas de MVP
- Ligues en cours uniquement

### MesPronos.jsx ✅ — v3.0
- Stats globales, séries, forme récente (plus récent à droite)
- Meilleure/pire équipe (seuil 3 pronos)
- Fonds : bg-1 → bg-0 → bg-1 → bg-0 → bg-1 → bg-0

### MatchDetail.jsx ✅ — v3.0
- Affiche principale : logo watermark fond, score 44px, barre gauche couleur équipe si prono
- Barres stats comparatives horizontales bicolores couleurs ESPN
- Leaders : grille 2 colonnes desktop, 1 colonne mobile
- Quart-temps avec colonne Total

### Stats.jsx (Explorer) ✅ — v3.0
- Tableau standings avec colonnes sticky `#`, logo, trigramme
- Scroll horizontal sur les colonnes stats

### Autres pages ✅ — toutes refondues v3.0
- `Groupes.jsx` : cartes ligues barre gauche, angles vifs
- `Profil.jsx` : icône Pencil sur champs éditables
- `H2H.jsx` : bilan scores 40px, verdict barre gauche colorée
- `Calendrier.jsx` : header Teko, BanniereImage supprimée
- `BracketPlayoffs.jsx` : titre Teko, cards équipes barre gauche 2px
- `Admin.jsx` : barre danger, liste sans cards
- `QuoiDeNeuf.jsx` : alternance bg-0/bg-1
- `ClassementRapide.jsx` : lignes sans cards arrondies

---

## 9. Décisions produit

### Session 2026-06-02 — Refonte charte complète
- **No Spoil** : conservé, retiré du menu hamburger et header Board
- **PopupChangelog** = point d'entrée unique auth
- **Connexion.jsx** = 5 lignes, rend `<PopupChangelog forceOuvert={true} />`
- **Dégradé CTA** `accent→orange` : supprimé. CTA = `var(--accent)` plein.
- **`LabelSection` / `Bloc` / `BanniereImage`** : obsolètes, supprimés
- **Logo image** : plus utilisé. Logo = texte Teko.
- **Angles vifs** : principe validé et appliqué partout
- **Barres gauche 3px** : pattern universel
- **Stats MatchDetail** : barres horizontales bicolores couleurs ESPN, pas de barres grises
- **MVP ex-aequo** : pas de gagnant enregistré si égalité

### Trame messages Focus
| Priorité | Condition | Message |
|---|---|---|
| 1 | pronos en attente > 0 | "Tu as N pronos en attente..." |
| 2 | streak correct ≥ 2 | "Tu es sur une série de N..." |
| 3 | streak incorrect ≥ 2 | "N ratés d'affilée..." |
| 4 | win rate (≥ 5 pronos) | "Tu réussis X%..." |
| + Sprint 3 | badge proche | "Plus qu'1 prono pour débloquer..." |
| + Sprint 4 | carte du jour | "Ta carte du jour t'attend 🃏" |

### Trame événements Vestiaire
| Événement | Condition | Message |
|---|---|---|
| Streak correct | ≥ 2 corrects consécutifs | "🔥 Pseudo est sur une série de N..." |
| Streak incorrect | ≥ 2 incorrects consécutifs | "❄️ Pseudo est sur une série de N ratés..." |
| Série cassée | streak précédent ≥ 2 correct | "💔 Pseudo vient de briser sa série..." |
| + Sprint 3 | badge débloqué | "🏅 Pseudo a débloqué le badge..." |
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
**Sévérité :** 🟡 Moyenne

### RISQUE-D — MVP semaine non enregistré si personne n'ouvre Classement
**Sévérité :** 🟢 Faible

### RISQUE-E — Spam dans le chat Vestiaire
**Sévérité :** 🟡 Moyenne — limite 500 chars en place

---

## 11. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible

### DETTE-14 — ClassementRapide : plusieurs appels séquentiels pour points année NBA
**Sévérité :** 🟢 Faible

### DETTE-15 — `UI.jsx` contient des composants obsolètes (LabelSection, Bloc, BanniereImage)
**Sévérité :** 🟢 Faible — à nettoyer quand l'ensemble est stabilisé

---

## 12. Backlog

### Sprint 1 ✅ LIVRÉ — RÉTENTION
```
✅ Focus.jsx — carousel spotlight perso
✅ LeVestiaire.jsx — fil streaks + chat ligues
✅ Dashboard MesPronos enrichi
✅ PopupChangelog restructuré
✅ Page Quoi de neuf
```

### Sprint 2 ✅ LIVRÉ — ENGAGEMENT SOCIAL
```
✅ Classement Semaine/Mois/Saison
✅ MVP Semaine précédente (semaines_gagnees)
✅ Head-to-Head 1v1
✅ Ligues planifiées (date_debut + onglets)
```

### Sprint 2.5 ✅ LIVRÉ — REFONTE CHARTE
```
✅ Design system Teko + barres gauche + angles vifs
✅ Toutes les pages refondues
✅ PopupChangelog = splash screen animé + auth intégré
✅ No Spoil retiré du menu et header
✅ LabelSection / Bloc / BanniereImage supprimés
```

### Sprint 3 — PROFONDEUR & POLISH
```
⏳ Badges / achievements
⏳ Profil public enrichi
⏳ Onboarding simplifié
⏳ Leaderboard global
⏳ Partage de pick (Canvas API, format Story)
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (équipe & joueur favoris)
Système de niveaux & XP (7 niveaux Rookie → GOAT)
Avatar personnalisable (SVG layers, maillots 30 équipes)
Collection de cartes joueurs (~200 cartes, 5 raretés)
```

### Mis de côté
- Swish Data — indéfiniment
- Notifications push Web — reporté (iOS limité)
- Score exact en bonus — reporté Sprint 4

---

## 13. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- **Toujours indiquer fichier + bloc + contexte pour toute modification**
- Jamais border shorthand + longhand sur le même élément
- **Une modification à la fois — push + test entre chaque**
- **Toujours réécrire les fichiers complets quand demandé**
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- Tokens CSS : toujours utiliser les variables, jamais de valeurs brutes
- Année NBA = 1 septembre → 31 août — référence pour tous les calculs temporels
- `TitreSection` défini localement dans chaque fichier (pas de composant partagé)
- Pas de `border-radius-lg` sur les blocs de contenu

---

## 14. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar, bio, historique pronos, messages chat.
Clés Supabase : variables d'environnement, jamais commitées.
Mention légale : "jeu de pronostics gratuit, aucun argent réel".
Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France).
Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`, accès restreint côté RLS et côté UI.

---

## 15. Veille technique

- ESPN API non officielle : surveiller changements de structure
- Supabase : surveiller free tier (500 MB stockage, 2 GB bande passante/mois)
- Vercel Hobby : usage non-commercial uniquement
- Web Push API : compatibilité Safari iOS limitée
- `semaines_gagnees` : ~52 lignes/an/ligue — très gérable

---

## 16. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v3_0.md` | Référence technique | ✅ Ce document |
| `swish_league_roadmap_v1_3.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.0 — 2026-06-02*
*Remplace socle_nba_v2_5.md*
