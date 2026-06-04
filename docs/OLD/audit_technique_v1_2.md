# AUDIT TECHNIQUE — SWISH LEAGUE v1.2
> Mis à jour le 2026-05-28 | Phases 0, 1, 2, 3 terminées

---

## SOMMAIRE

1. [Bugs confirmés](#1-bugs-confirmés)
2. [Risques silencieux](#2-risques-silencieux)
3. [Dette technique & architecture](#3-dette-technique--architecture)
4. [Endpoints ESPN — statuts CORS](#4-endpoints-espn--statuts-cors)
5. [Plan d'action priorisé](#5-plan-daction-priorisé)
6. [Règles de mise à jour de ce document](#6-règles-de-mise-à-jour-de-ce-document)

---

## 1. Bugs confirmés

### ✅ BUG-01 — `recupererGagnant` utilisait la mauvaise base URL
Corrigé le 2026-05-27 — `BASE_WEB` dans `recupererGagnant` (`espn.js`).

### ✅ BUG-02 — Variables CSS `--success-dim` et `--danger-dim` absentes
Corrigé avant session 2026-05-27 — présentes dans `index.css`.

### ✅ BUG-03 — `TYPE_SAISON` contenait le type 4 (NBA Cup)
Corrigé le 2026-05-27 — type 4 supprimé, type 5 ajouté (`espn.js`).

### ✅ BUG-04 — `BandeMatchs` chargeait tous les pronos sans filtre
Corrigé le 2026-05-27 — filtre côté client sur les `espn_id` des matchs affichés.

### ✅ BUG-05 — Forme récente basée sur `cree_le` du prono, pas sur la date du match
Corrigé le 2026-05-27 — tri par `date_match` décroissant (`MesPronos.jsx`).

---

## 2. Risques silencieux

### ✅ RISQUE-01 — N+1 ESPN dans `calculerPoints`
Corrigé le 2026-05-27 — déduplication des `espn_id` + `Promise.all` (`points.js`).

### RISQUE-02 — `calculerPoints` déclenché sans verrou → race condition
**Sévérité :** 🟡 Moyenne
Toujours actif. Solution long terme : Edge Function Supabase (Phase 4).

### ✅ RISQUE-03 — Profil chargé à chaque montage de `Navigation`
Corrigé le 2026-05-27 — `ProfilContext` charge le profil une fois à l'init de session.

### ✅ RISQUE-04 — Erreurs Supabase avalées silencieusement dans `points.js`
Corrigé le 2026-05-27 — logs d'erreur sur toutes les updates.

### RISQUE-05 — ADMIN_ID exposé côté client
**Sévérité :** 🟡 Moyenne (acceptable en proto)
Toujours actif. À traiter Phase 4 : vérifier RLS Supabase sur `groupes`, puis rôle admin en BDD.

### ✅ RISQUE-06 — Stats classement globales, pas par ligue
Corrigé le 2026-05-28 — stats filtrées par groupe_id dans `Classement.jsx` + stats par ligue dans `MesPronos.jsx`.

---

## 3. Dette technique & architecture

### ✅ DETTE-01 — Composants UI dupliqués dans 6+ fichiers
Corrigé le 2026-05-28 — `LabelSection`, `BanniereImage`, `Bloc` extraits dans `src/components/UI.jsx`.
Tous les fichiers pages importent depuis UI.jsx. Modifier UI.jsx applique partout.

### ✅ DETTE-02 — `recupererLiguesCibles` dupliquée
Corrigé le 2026-05-27 — extraite dans `src/services/ligues.js`.

### ✅ DETTE-03 — `Avatar` dans `Profil.jsx` importé par 3+ composants
Corrigé le 2026-05-27 — `Avatar` et `couleurAvatar` dans `src/components/Avatar.jsx`.

### ✅ DETTE-04 — Pas de timeout sur les fetch ESPN
Corrigé le 2026-05-27 — `fetchAvecTimeout` (AbortController, 8s) sur tous les appels ESPN.

### ✅ DETTE-05 — Fetch ESPN séquentiels dans `recupererMatchs3Jours`
Corrigé le 2026-05-27 — `Promise.allSettled` sur les 3 dates.

### ✅ DETTE-06 — Filtre "NBA Cup" dans `Calendrier.jsx` et `CreerGroupe.jsx`
Corrigé le 2026-05-28 — supprimé des deux fichiers.

### DETTE-07 — RLS Supabase sur `groupes` non vérifiées
**Sévérité :** 🟡 Moyenne
Toujours actif. ADMIN_ID hardcodé côté client — n'importe qui connaissant l'UUID peut créer une ligue si RLS mal configuré. À auditer Phase 4.

---

## 4. Endpoints ESPN — statuts CORS validés terrain (2026-05-28)

| Domaine | Statut | Validé terrain |
|---|---|---|
| `site.api.espn.com` | ✅ CORS OK | Oui |
| `site.web.api.espn.com` | ✅ CORS OK | Oui |
| `sports.core.api.espn.com` | ✅ CORS OK | Oui — 2026-05-28 |
| `site.api.espn.com/leaders` | 🔴 CORS bloqué | Oui — proxy requis |

### Endpoints actuellement utilisés
- Scoreboard : `site.api.espn.com/.../scoreboard?dates=YYYYMMDD`
- Summary : `site.web.api.espn.com/.../summary?event={id}`
- Standings : `site.api.espn.com/apis/v2/.../standings?season=2026&seasontype=2`
- News : `site.api.espn.com/.../news?limit=5`

### Endpoints validés CORS, non encore exploités
- Win probability : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/probabilities`
- Game Predictor : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/predictor`
- Play-by-play : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/plays`
- Cotes bookmakers : `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/odds`
- Fiche équipe : `site.api.espn.com/.../teams/{id}`
- Roster : `site.api.espn.com/.../teams/{id}/roster`
- Fiche joueur : `site.api.espn.com/.../athletes/{id}`
- Stats saison joueur : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/stats`
- Game log joueur : `site.web.api.espn.com/apis/common/v3/.../athletes/{id}/gamelog`

---

## 5. Plan d'action priorisé

### ✅ PHASE 0 — Corrections silencieuses — TERMINÉE (2026-05-27)
### ✅ PHASE 1 — Refactos légères — TERMINÉE (2026-05-27)
### ✅ PHASE 2 — Nouvelles données ESPN — TERMINÉE (2026-05-28)
### ✅ PHASE 3 — Refactos structurelles — TERMINÉE (2026-05-28)

---

### PHASE 4 — Sprint 2 (fonctionnalités majeures)

| # | Action | Priorité | Notes |
|---|---|---|---|
| 4.1 | Vérifier et documenter les RLS Supabase sur `groupes` | 🔴 Haute | Sécurité ADMIN_ID — à faire avant toute mise en prod publique |
| 4.2 | Page Stats/Explorer — classements NBA par saison, fiches équipes, fiches joueurs | 🔴 Haute | Nouvelle route `/stats`, entrée hamburger |
| 4.3 | Entrée menu hamburger → page Stats/Explorer | 🔴 Haute | Dépend de 4.2 |
| 4.4 | StandingsNBA Board : TOP 5 + lien "voir tout" → Stats/Explorer | 🟡 Moyenne | Dépend de 4.2 |
| 4.5 | Win probability + Game Predictor dans MatchDetail | 🟡 Moyenne | CORS validé ✅ — sports.core.api.espn.com |
| 4.6 | Sélecteur de saison dans Calendrier | 🟡 Moyenne | Backlog Sprint 1 restant |
| 4.7 | Edge Function Supabase — calcul points serveur + verrou prono | 🟡 Moyenne | Corrige RISQUE-02 |
| 4.8 | Bonus score exact + bonus série dans système de points | 🟡 Moyenne | Nécessite 4.7 |
| 4.9 | IA Gemini — suggestions pronos, résumés matchs | 🟢 Basse | Phases 1-3 stables ✅ |
| 4.10 | News FR via RSS + proxy Edge Function | 🟢 Basse | Nécessite Edge Function |

---

## 6. Règles de mise à jour de ce document

- **À chaque correction de bug :** marquer la ligne avec ✅ et la date.
- **À chaque validation d'endpoint ESPN :** mettre à jour le statut CORS section 4.
- **À chaque sprint terminé :** archiver les phases terminées, incrémenter la version du doc.
- **Ce document ne remplace pas `socle_nba_v0.9.md`** — le socle reste la référence technique.

---

*Document v1.2 — 2026-05-28*
*Phases 0, 1, 2, 3 terminées. Prochaine révision : après Phase 4.*
