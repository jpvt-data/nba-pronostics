# SWISH LEAGUE — SOCLE v3.2
> Document de référence unique — technique et organisationnel
> Mis à jour le 2026-06-03

---

## SOMMAIRE

1. [Projet & philosophie](#1-projet--philosophie)
2. [Identité visuelle & design system](#2-identité-visuelle--design-system)
3. [Charte graphique — règles appliquées](#3-charte-graphique--règles-appliquées)
4. [Sources de données ESPN](#4-sources-de-données-espn)
5. [Sources de données tierces](#5-sources-de-données-tierces)
6. [BDD Supabase](#6-bdd-supabase)
7. [Architecture fichiers](#7-architecture-fichiers)
8. [Navigation & routes](#8-navigation--routes)
9. [Fonctionnalités livrées](#9-fonctionnalités-livrées)
10. [Décisions produit](#10-décisions-produit)
11. [Risques ouverts](#11-risques-ouverts)
12. [Dette technique ouverte](#12-dette-technique-ouverte)
13. [Backlog](#13-backlog)
14. [Règles de travail](#14-règles-de-travail)
15. [RGPD & sécurité](#15-rgpd--sécurité)
16. [Veille technique](#16-veille-technique)
17. [Documents de référence complémentaires](#17-documents-de-référence-complémentaires)

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

### Fond desktop — v3.2
4 halos violets symétriques aux 4 coins + box-shadow sur `#root` :

```css
/* body desktop */
background:
  radial-gradient(ellipse 70% 55% at 0% 0%,    rgba(99, 102, 241, 0.18) 0%, transparent 70%),
  radial-gradient(ellipse 70% 55% at 100% 0%,  rgba(99, 102, 241, 0.18) 0%, transparent 70%),
  radial-gradient(ellipse 70% 55% at 0% 100%,  rgba(99, 102, 241, 0.18) 0%, transparent 70%),
  radial-gradient(ellipse 70% 55% at 100% 100%,rgba(99, 102, 241, 0.18) 0%, transparent 70%),
  var(--bg-0);
background-attachment: fixed;

/* #root */
box-shadow: 0 0 100px rgba(99, 102, 241, 0.18);
```

Pas de `border-left`/`border-right` sur `#root` — le box-shadow suffit à délimiter le corps.

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
- Mots composés (`FORME RÉCENTE`) → mot1="FORME" mot2="RÉCENTE" avec `gap: 6`
- Mots simples (`SÉRIES`, `HISTORIQUE`) → tout en blanc, pas de mot2
- Jamais couper un mot au milieu
- `gap: 0` uniquement quand le découpage est naturellement collé (`CLASSE`+`MENT`, `1`+`v1`)

### Pattern header de page — règle unifiée

```jsx
<div style={{ padding: '20px 16px 0 16px', position: 'relative' }}>
  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--accent)' }} />
  <TitreSection mot1="PAGE" mot2="TITRE" taille={36} />
</div>
```

### Pattern blocs de contenu — barre gauche 3px
- **accent** `#6366f1` → sections principales, stats, AVANT MATCH, LIGUE EN COURS
- **gold** `#f59e0b` → classements, points, MVP
- **orange** `#f97316` → équipes, BanniereFeed (barre intérieure)
- **success** `#22c55e` → résultats corrects
- **danger** `#ef4444` → blessés, admin, résultats ratés
- **border / border-2** → historique neutre, sections secondaires

### Espacement Board — règle v3.2
Groupes visuels avec respiration :

| Transition | Espace |
|---|---|
| Header → À LA UNE | 8px (paddingTop label) |
| À LA UNE → AVANT MATCH | 24px |
| AVANT MATCH → TIMELINE | 24px |
| TIMELINE → LIGUE EN COURS | 24px |
| LIGUE EN COURS → LE VESTIAIRE | 8px (même univers social) |
| LE VESTIAIRE → NBA DATA | 24px |
| NBA DATA → ACTU NBA | 24px |

### Fonds — alternance rythmée (pas mécanique)
- `var(--bg-0)` `#0d0d12` — fond principal
- `var(--bg-1)` `#12121c` — blocs principaux
- `#f0ede8` — beige clair (LeVestiaire, AVANT MATCH, ACTU NBA)

### Angles vifs — règle stricte
- Pas de `border-radius-lg` sur les blocs de contenu
- `border-radius-sm` (6px) uniquement sur les boutons et inputs
- Préférer `border-radius: 0` pour les listes et cards

### Boutons CTA
- Principal : `background: var(--accent)`, `border-radius: var(--radius-sm)`
- Secondaire : `background: transparent`, `border: 1px solid var(--border)`

### Couleurs sémantiques — règles strictes
- **--gold** : points, médailles top 3, streak, MVP
- **--accent** : éléments interactifs, badges, liens, icônes actives, AVANT MATCH, LIGUE EN COURS, ACTU NBA
- **--success** : prono correct, W dans forme récente
- **--danger** : prono raté, L dans forme récente, admin
- **--orange** : À LA UNE, BanniereFeed source label

---

## 4. Sources de données ESPN

### Philosophie — source unique ESPN
**Décision : ESPN uniquement pour les données sportives.**

### Domaines — statuts CORS validés terrain

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
Roster          : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster
Injuries        : site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/injuries
Stats joueur    : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/stats
Game log joueur : site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/{id}/gamelog
Predictor       : sports.core.api.espn.com/v2/sports/basketball/leagues/nba/events/{id}/competitions/{id}/predictor
```

**Endpoint News ESPN supprimé** — remplacé par Basket USA via rss2json.

---

## 5. Sources de données tierces

### Basket USA — actus NBA en français
- **Source :** https://www.basketusa.com/feed/ (flux RSS WordPress)
- **Proxy :** rss2json.com (clé API — 10 000 req/jour, 25 feeds, 1h refresh)
- **Usage :** BanniereFeed (article 1) + NewsNBA (articles 2 à 6)
- **Données récupérées :** titre, résumé (HTML strippé, 120 chars), lien, image
- **Extraction image robuste :** `thumbnail` → `enclosure.link` → regex sur `content` → regex sur `description`
- **Droits :** RSS public, usage syndication standard. Source citée ("Basket USA" cliquable).
- **Légal :** usage perso entre potes = zéro risque. Si app publique/commerciale → contact Basket USA requis.
- **Clé stockée :** dans `BanniereFeed.jsx` (constante). À déplacer en variable d'env si app publique.

---

## 6. BDD Supabase

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
- Max 500 caractères (CHECK constraint)
- RLS : lecture/insert membres actifs du groupe uniquement
- DELETE : admin uniquement (`fa55d016-896c-4eb4-b48a-241d6be71ad0`)
- GRANT : `SELECT, INSERT, DELETE ON messages TO authenticated` requis en plus des policies RLS

### RLS Supabase — état validé
- `pronos` SELECT : `auth.role() = 'authenticated'`
- `pronos` INSERT/UPDATE : `auth.uid() = user_id`
- `profils` INSERT/UPDATE : `auth.uid() = id`
- `membres_groupe` INSERT/UPDATE : `auth.uid() = user_id`
- `semaines_gagnees` SELECT : `auth.role() = 'authenticated'` + `GRANT SELECT,INSERT TO authenticated`
- `groupes` INSERT : restreint à `admin_id = 'fa55d016-...'`
- `messages` SELECT : membres actifs du groupe via EXISTS sur `membres_groupe`
- `messages` INSERT : `auth.uid() = user_id` + `groupe_id IN (SELECT ... FROM membres_groupe WHERE actif = true)`
- `messages` DELETE : `auth.uid() = 'fa55d016-896c-4eb4-b48a-241d6be71ad0'`

---

## 7. Architecture fichiers

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
    Accueil.jsx             ← refondu v3.2
    Connexion.jsx
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
    Focus.jsx               ← remplacé par Briefing.jsx (Focus conservé en archive)
    Briefing.jsx            ← NOUVEAU v3.2 — remplace Focus
    BanniereFeed.jsx        ← NOUVEAU v3.2 — bannière actu Basket USA
    LeVestiaire.jsx
    CreerGroupe.jsx
    PopupChangelog.jsx
    StandingsNBA.jsx
    SeriesPlayoffs.jsx
    NewsNBA.jsx             ← refondu v3.2 — source Basket USA via rss2json
    LeadersStats.jsx
```

---

## 8. Navigation & routes

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
/admin            → privé, restreint ADMIN_ID (fa55d016-896c-4eb4-b48a-241d6be71ad0)
*                 → redirect /accueil
```

### Logique auth — App.jsx
- Non connecté → `/accueil` avec popup indestructible
- Connecté → popup normal fermable → accueil
- Déconnexion → `navigate('/connexion')` → reload complet → popup réapparaît

### Menu hamburger — ordre
Profil → Explorer → Ligues → Calendrier → 1v1 → [séparateur] → Admin (si admin) → Quoi de neuf ? → Déconnexion

---

## 9. Fonctionnalités livrées

### Board (Accueil) ✅ — v3.2
Structure et ordre des blocs :

1. **Header** — "Bonjour JPVT" (Teko 36px, barre accent gauche)
2. **À LA UNE** (label Teko 20px, orange) + **BanniereFeed** — article 1 Basket USA, photo plein largeur, titre overlay
3. **AVANT MATCH** (label Teko 20px, accent) + **Briefing** — messages perso + contexte ligue
4. **TIMELINE** — BandeMatchs + filtres Équipe + bouton Calendrier
5. **LIGUE EN COURS** — ClassementRapide
6. **LE VESTIAIRE** — streaks potes + chat ligues (fond beige)
7. **StandingsNBA + BracketPlayoffs** (si playoffs)
8. **ACTU NBA** — NewsNBA articles 2 à 6 Basket USA (fond beige, barre accent)

**BanniereImage Unsplash supprimée** — remplacée par BanniereFeed.

### Briefing.jsx ✅ — v3.2 (remplace Focus)
Navigation manuelle (`Suivant →`) + carousel auto 6s avec reset au clic.
Messages par priorité :

| # | Condition | Dismissable | Lien |
|---|---|---|---|
| 1 | Matchs sans prono > 0 | ✅ jusqu'au lendemain | Board |
| 2 | Pronos en_attente > 0 | — | MesPronos |
| 3 | Streak correct ≥ 3 | — | — |
| 4 | Streak incorrect ≥ 3 | — | — |
| 5 | Série cassée | — | — |
| 6 | Win rate (≥ 5 pronos) | — | — |
| 7 | Ligue active (contexte + date fin si ≤ 7j) | — | — |
| 8 | Ligue à venir | — | — |
| 9 | Ligue terminée récemment | — | — |
| 10 | Prochain match dans N jours | — | — |
| 11 | Profil incomplet | ✅ jusqu'au lendemain | Profil |

Dismiss via localStorage : clé `briefing_dismiss_{id}_{date}` — réapparaît le lendemain.
Streak seuil : ≥ 3 (au lieu de 2 dans Focus).

### BanniereFeed.jsx ✅ — v3.2 (NOUVEAU)
- Article 1 du flux Basket USA
- Photo plein largeur, hauteur `clamp(160px, 22vw, 240px)` — responsive
- Luminosité image : `brightness(0.75)`
- Fond fallback si pas d'image : `rgba(99,102,241,0.18)` (violet accent pâle)
- Barre orange gauche 3px
- Label "BASKET USA" (11px, orange, uppercase) + titre (13px, blanc gras, 2 lignes max)
- Clic → ouvre l'article dans un nouvel onglet
- Exporte `fetchFeedBasketUSA()` — partagé avec NewsNBA (1 seul appel rss2json)

### NewsNBA.jsx ✅ — v3.2 (refondu)
- Source : Basket USA via rss2json (articles 2 à 6)
- Affichage : thumbnail 56×42 + titre + résumé tronqué 120 chars
- Fond beige `#f0ede8`, textes sombres (`#1a1a2e` / `#6b6b80`)
- Source "Basket USA" cliquable en bas
- Callback `onFeedCharge` → remonte l'article 1 à Accueil pour BanniereFeed
- Extraction image robuste : `thumbnail` → `enclosure.link` → regex `content` → regex `description`

### Bracket/Standings — logique ligues ✅ — v3.2
- `typeSaisonEffectif` = `typeSaisonActuel` (ESPN) ?? `typeSaisonLigues` (Supabase)
- Si ESPN renvoie null (hors-saison, break), fallback sur le `type_saison` max des ligues actives de l'user
- Requête Supabase : `membres_groupe` → `groupes(type_saison, date_fin)` filtrée sur `actif = true` et `date_fin >= aujourd'hui`

### Auth & Onboarding ✅ — v3.0
- `Connexion.jsx` = wrapper PopupChangelog
- `PopupChangelog.jsx` = splash screen animé + formulaire login intégré
- "Content de te revoir, [pseudo] !" + message contextuel pronos en attente

### Badge nav "pronos en attente" ✅ — v3.1
- Point rouge sur l'icône Board
- Calculé dans `BandeMatchs` via prop `onBadge`

### Le Vestiaire ✅ — v3.1
- Streaks potes + chat ligues inline, polling 30s
- Format date/heure : `jj/mm hh:mm`

### Admin.jsx ✅ — v3.1
- Page `/admin` — 100 derniers messages toutes ligues, suppression par message

### Classement.jsx ✅ — v3.0
- Toggle Semaine / Mois / Saison, MVP semaine précédente

### MesPronos.jsx ✅ — v3.0
- Stats globales, séries, forme récente (plus récent à droite, max 5)

### MatchDetail.jsx ✅ — v3.0
- Affiche principale watermark, barres stats bicolores ESPN, leaders 2 colonnes desktop

---

## 10. Décisions produit

### Session 2026-06-03 — Sprint 3 suite (v3.2)

**Board & structure :**
- **Briefing** remplace Focus — navigation manuelle + carousel 6s, dismiss localStorage
- **BanniereFeed** — article 1 Basket USA en tête du Board, remplace la bannière Unsplash statique
- **AVANT MATCH** — nom retenu pour le bloc Briefing (hiérarchise mieux que "Mon Briefing" ou "La Causerie")
- **À LA UNE** — label retenu pour la BanniereFeed
- **ACTU NBA** — fond beige + barre accent (violet) — plus une seule barre orange double
- **Espacement Board** — groupes logiques avec 24px entre sections distinctes, 8px entre sections liées

**Actus NBA en français :**
- **Source retenue : Basket USA** (basketusa.com) — flux RSS WordPress, contenu 100% français, qualité éditoriale
- **Proxy retenu : rss2json.com** — free tier suffisant (10k req/jour), images incluses (`thumbnail`, `enclosure`)
- **Architecture** : `fetchFeedBasketUSA()` exporté depuis `BanniereFeed.jsx`, réutilisé par `NewsNBA.jsx` — 1 seul appel API pour les 2 composants
- **"Game X" playoffs abandonné** — trop coûteux en appels summary. Label type saison envisagé mais `typeSaisonNum` non renvoyé fiablement par le scoreboard dans ce contexte

**Design desktop :**
- **Fond desktop** : 4 halos violets symétriques aux 4 coins (`rgba(99,102,241,0.18)`, `ellipse 70% 55%`)
- **`#root` box-shadow** : `0 0 100px rgba(99,102,241,0.18)` — délimite le corps sans bordure visible
- **Pas de `border-left`/`border-right`** sur `#root` — trop visible, casse la charte barres gauche

**Bracket/Standings :**
- Affichage basé sur `typeSaisonEffectif` = ESPN ?? ligues Supabase — DETTE-16 résolue

### Session 2026-06-02 — Refonte charte complète (v3.0 / v3.1)
- Design system Teko + barres gauche + angles vifs
- PopupChangelog = point d'entrée unique auth
- Badge nav, chat Vestiaire, Focus enrichi, Admin, fixes ESPN

### Features futures notées (post-Sprint 4)
- H2H historique équipes en saison régulière dans MatchDetail
- Enrichissement MatchDetail : cotes bookmakers ESPN
- Pronostic écart final : victoire serrée (<5 pts) ou large (>20 pts) → +2 pts bonus

### Trame messages Briefing — v3.2
| Priorité | Condition | Dismissable | Message |
|---|---|---|---|
| 1 | matchs sans prono > 0 | ✅ | "T'as N match(s) à pronostiquer !" |
| 2 | pronos en_attente > 0 | — | "N prono(s) en cours — résultats à venir" |
| 3 | streak correct ≥ 3 | — | "Série de N pronos réussis — continue !" |
| 4 | streak incorrect ≥ 3 | — | "N ratés d'affilée… tu vas t'en sortir" |
| 5 | série cassée | — | "Ta série de N vient de prendre fin" |
| 6 | win rate ≥ 5 pronos | — | "Tu réussis X% de tes pronos" |
| 7 | ligue active (fin ≤ 7j) | — | ""Nom" se termine dans N jours !" |
| 7 | ligue active | — | ""Nom" en cours" |
| 8 | ligue à venir | — | "La ligue "Nom" commence le JJ mois" |
| 9 | ligue terminée (≤ 7j) | — | "La ligue "Nom" vient de se terminer !" |
| 10 | prochain match | — | "Prochain match dans N jours / demain / ce soir !" |
| 11 | profil incomplet | ✅ | "Ton profil est incomplet — ajoute un avatar ou une bio" |

---

## 11. Risques ouverts

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
**Sévérité :** 🟡 Moyenne — limite 500 chars en place, modération via page Admin

### RISQUE-F — rss2json.com indisponibilité
**Sévérité :** 🟢 Faible — si le service tombe, BanniereFeed et NewsNBA se masquent silencieusement. Non critique.

---

## 12. Dette technique ouverte

### DETTE-08 — Roster trié par PPG : 15-20 appels ESPN par ouverture fiche équipe
**Sévérité :** 🟢 Faible

### DETTE-14 — ClassementRapide : plusieurs appels séquentiels pour points année NBA
**Sévérité :** 🟢 Faible

### DETTE-15 — `UI.jsx` contient des composants obsolètes (LabelSection, Bloc, BanniereImage)
**Sévérité :** 🟢 Faible — à nettoyer quand l'ensemble est stabilisé

### DETTE-16 — Bracket/Standings : affichage basé sur `typeSaisonActuel` ESPN
**Sévérité :** ✅ RÉSOLUE v3.2 — fallback `typeSaisonLigues` Supabase

### DETTE-17 — Forme récente MesPronos : ordre
**Sévérité :** ✅ RÉSOLUE — dernier match à droite, max 5

### DETTE-18 — Clé rss2json dans le code front
**Sévérité :** 🟢 Faible pour usage perso. À déplacer en variable d'env si app publique.

---

## 13. Backlog

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

### Sprint 3 ✅ LIVRÉ (session 2026-06-03)
```
✅ Badge nav "pronos en attente" (point rouge icône Board)
✅ Chat / réactions par ligue (LeVestiaire inline, polling 30s)
✅ Focus → Briefing — navigation manuelle + carousel 6s + dismiss localStorage
✅ Messages guideline cliquables dans Briefing (pronos, ligue, profil, prochain match)
✅ Bracket/Standings — logique basée sur type_saison ligues en cours (DETTE-16 résolue)
✅ Forme récente — ordre corrigé (dernier à droite, max 5)
✅ Actus NBA en français — Basket USA via rss2json
✅ BanniereFeed — article 1 Basket USA en tête du Board
✅ NewsNBA refondu — articles 2 à 6, thumb + résumé, fond beige
✅ Board espacements — groupes logiques 24px / 8px
✅ Titres de section Board — À LA UNE, AVANT MATCH
✅ Fond desktop — 4 halos violets symétriques + box-shadow #root
✅ Admin page — modération messages toutes ligues
✅ PopupChangelog — welcome back pseudo + message contextuel
✅ BandeMatchs vide — bloc informatif avec lien calendrier
✅ NewsNBA fix — plus de dépendance typeSaison
```

### Sprint 3 restant ⏳
```
⏳ Badges / achievements (table badges, logique déclenchement, affichage)
⏳ Profil public enrichi (stats, badges, niveau depuis /mes-pronos?user_id=X)
⏳ Onboarding simplifié (pitch → premier prono → activer notifs)
⏳ Leaderboard global (tous users, profils publics, agrégation Supabase)
⏳ Partage de pick (Canvas API, format Story Instagram)
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (équipe & joueur favoris)
Système de niveaux & XP (7 niveaux Rookie → GOAT)
Avatar personnalisable (SVG layers, maillots 30 équipes)
Collection de cartes joueurs (~200 cartes, 5 raretés)
Pronostic écart final (victoire <5 pts / >20 pts = +2 pts bonus)
```

### Mis de côté
- Swish Data — indéfiniment
- Notifications push Web — reporté (iOS limité)
- Score exact en bonus — supprimé (impossible au basket)

---

## 14. Règles de travail

- Français, tutoiement, direct, concis
- React + Vite uniquement
- Variables et commentaires en français
- **Toujours indiquer fichier + bloc + contexte pour toute modification**
- Jamais border shorthand + longhand sur le même élément
- **Une modification à la fois — push + test entre chaque**
- **Toujours réécrire les fichiers complets quand demandé**
- `SAISON_ESPN` depuis `src/config.js` — jamais hardcoder l'année
- Tokens CSS : toujours utiliser les variables, jamais de valeurs brutes
- Année NBA = 1 septembre → 31 août
- `TitreSection` défini localement dans chaque fichier (pas de composant partagé)
- Pas de `border-radius-lg` sur les blocs de contenu

---

## 15. RGPD & sécurité

Données stockées : pseudo, email (auth), avatar, bio, historique pronos, messages chat.
Clés Supabase : variables d'environnement, jamais commitées.
Clé `anon` Supabase : publique par design — sécurité = RLS.
Clé `service_role` : jamais dans le front.
Clé rss2json : dans le code front pour usage perso — à passer en variable d'env si app publique.
Mention légale : "jeu de pronostics gratuit, aucun argent réel".
Cotes bookmakers : ne pas intégrer dans le flow prono (risque légal ANJ France).
Admin : ADMIN_ID hardcodé `fa55d016-896c-4eb4-b48a-241d6be71ad0`.

---

## 16. Veille technique

- ESPN API non officielle : surveiller changements de structure
- rss2json.com : surveiller quota (10k req/jour) et disponibilité
- Basket USA : surveiller changements de structure RSS
- Supabase : surveiller free tier (500 MB stockage, 2 GB bande passante/mois)
- Vercel Hobby : usage non-commercial uniquement
- Web Push API : compatibilité Safari iOS limitée

---

## 17. Documents de référence complémentaires

| Document | Rôle | Statut |
|---|---|---|
| `socle_nba_v3_2.md` | Référence technique | ✅ Ce document |
| `swish_league_roadmap_v1_5.md` | Vision produit, roadmap | ✅ Actif |
| `espn_capacites_v1_0.md` | Cartographie ESPN API | ✅ Actif |

---

*Document v3.2 — 2026-06-03*
*Remplace socle_nba_v3_1.md*
