# AUDIT TECHNIQUE — SWISH LEAGUE v1.1
> Mis à jour le 2026-05-27 | Phase 0 + Phase 1 terminées

---

## SOMMAIRE

1. [Bugs confirmés](#1-bugs-confirmés)
2. [Risques silencieux](#2-risques-silencieux)
3. [Dette technique & architecture](#3-dette-technique--architecture)
4. [Endpoints ESPN disponibles & non exploités](#4-endpoints-espn-disponibles--non-exploités)
5. [Plan d'action priorisé](#5-plan-daction-priorisé)
6. [Règles de mise à jour de ce document](#6-règles-de-mise-à-jour-de-ce-document)

---

## 1. Bugs confirmés

### ✅ BUG-01 — `recupererGagnant` utilisait la mauvaise base URL
Corrigé le 2026-05-27 — `BASE_WEB` dans `recupererGagnant` (`espn.js`).

### ✅ BUG-02 — Variables CSS `--success-dim` et `--danger-dim` absentes
Déjà corrigé avant cette session — présentes dans `index.css`.

### ✅ BUG-03 — `TYPE_SAISON` contenait le type 4 (NBA Cup)
Corrigé le 2026-05-27 — type 4 supprimé, type 5 (International) ajouté (`espn.js`).

### ✅ BUG-04 — `BandeMatchs` chargeait tous les pronos sans filtre
Corrigé le 2026-05-27 — filtre côté client sur les `espn_id` des matchs affichés (`BandeMatchs.jsx`).

### ✅ BUG-05 — Forme récente basée sur `cree_le` du prono, pas sur la date du match
Corrigé le 2026-05-27 — tri par `date_match` décroissant avant `slice(0, 5)` (`MesPronos.jsx`).

---

## 2. Risques silencieux

### ✅ RISQUE-01 — N+1 ESPN dans `calculerPoints`
Corrigé le 2026-05-27 — déduplication des `espn_id` + `Promise.all` (`points.js`).

### RISQUE-02 — `calculerPoints` déclenché sans verrou → race condition
**Sévérité :** 🟡 Moyenne
Toujours actif. Solution long terme : Edge Function Supabase (Sprint 2).
Solution court terme (flag localStorage) non implémentée — acceptable pour l'instant.

### ✅ RISQUE-03 — Profil chargé à chaque montage de `Navigation`
Corrigé le 2026-05-27 — `ProfilContext` charge le profil une fois à l'init de session (`ProfilContext.jsx` + `App.jsx` + `Navigation.jsx`).

### ✅ RISQUE-04 — Erreurs Supabase avalées silencieusement dans `points.js`
Corrigé le 2026-05-27 — logs d'erreur sur toutes les updates (`points.js`).

### RISQUE-05 — ADMIN_ID exposé côté client
**Sévérité :** 🟡 Moyenne (acceptable en proto)
Toujours actif. À traiter : vérifier RLS Supabase sur `groupes`, puis rôle admin en BDD (Sprint 1).

### RISQUE-06 — Stats classement globales, pas par ligue
**Sévérité :** 🟡 Moyenne
Toujours actif. Le taux de réussite dans `Classement.jsx` est calculé sur tous les pronos de l'user, toutes ligues confondues. À corriger Phase 3.

---

## 3. Dette technique & architecture

### DETTE-01 — Composants UI dupliqués dans 6+ fichiers
**Sévérité :** 🟡 Moyenne
`LabelSection`, `BanniereImage`, `BLOC` toujours dupliqués dans chaque page. À extraire dans `components/UI.jsx` (Phase 3).

### ✅ DETTE-02 — `recupererLiguesCibles` dupliquée
Corrigé le 2026-05-27 — extraite dans `src/services/ligues.js`.

### ✅ DETTE-03 — `Avatar` dans `Profil.jsx` importé par 3+ composants
Corrigé le 2026-05-27 — `Avatar` et `couleurAvatar` déplacés dans `src/components/Avatar.jsx`. Imports corrigés dans `Navigation`, `MesPronos`, `Classement`, `Profil`.

### ✅ DETTE-04 — Pas de timeout sur les fetch ESPN
Corrigé le 2026-05-27 — `fetchAvecTimeout` (AbortController, 8s) appliqué sur tous les appels ESPN (`espn.js`).

### ✅ DETTE-05 — Fetch ESPN séquentiels dans `recupererMatchs3Jours`
Corrigé le 2026-05-27 — `Promise.allSettled` sur les 3 dates (`espn.js`).

### DETTE-06 — Filtre "NBA Cup" dans `Calendrier.jsx`
**Sévérité :** 🟡 Faible
Option NBA Cup encore présente dans le sélecteur de filtre type de match de `Calendrier.jsx`. À supprimer Sprint 1.

---

## 4. Endpoints ESPN disponibles & non exploités

*(Inchangé — voir v1.0 pour la cartographie complète. Référence : `espn_capacites_v1.0.md`)*

---

## 5. Plan d'action priorisé

### ✅ PHASE 0 — Corrections silencieuses — TERMINÉE
Toutes les corrections de Phase 0 ont été appliquées le 2026-05-27.

### ✅ PHASE 1 — Refactos légères — TERMINÉE
Toutes les refactos de Phase 1 ont été appliquées le 2026-05-27.

---

### PHASE 2 — Nouvelles données ESPN (< 2 jours, fonctionnalités additives)
*Ajout de blocs dans des pages existantes, sans toucher aux blocs existants.*

| # | Action | Données | Page cible |
|---|---|---|---|
| 2.1 | Standings NBA Est/Ouest | `standings` ESPN | Nouveau bloc Accueil ou bloc dans Classement |
| 2.2 | News NBA | `news` ESPN | Nouveau bloc Accueil (après BandeMatchs) |
| 2.3 | Table équipes ESPN | `teams` ESPN | Remplace backlog "table equipes Supabase" — données ESPN directes |
| 2.4 | Tester CORS `sports.core.api.espn.com` | `probabilities`, `predictor` | MatchDetail (enrichissement live) |

---

### PHASE 3 — Refactos structurelles (1-2 jours, amélioration maintenabilité)
*À faire quand tu as du temps calme — ne change pas l'UX mais allège le code.*

| # | Action | Bénéfice |
|---|---|---|
| 3.1 | Extraire `LabelSection`, `BanniereImage`, `Bloc` dans `components/UI.jsx` | Fin de la duplication dans 6 fichiers |
| 3.2 | Corriger stats classement par ligue (pas globales) | Taux de réussite correct par ligue |
| 3.3 | Supprimer filtre "NBA Cup" dans `Calendrier.jsx` | Cohérence avec TYPE_SAISON |
| 3.4 | Vérifier et documenter les RLS Supabase sur `groupes` | Sécurité ADMIN_ID |

---

### PHASE 4 — Sprint 2 (fonctionnalités majeures, planning à définir)

| # | Action | Prérequis |
|---|---|---|
| 4.1 | Edge Function Supabase — calcul points serveur | Phases 0+1 terminées ✅ |
| 4.2 | Fiche joueur (stats, gamelog, splits) | Groupe B endpoints validés |
| 4.3 | Page Stats/Explorer (leaders, classements NBA) | Groupe B + C validés |
| 4.4 | Proxy Supabase Edge pour endpoints CORS bloqués | Groupe C endpoints identifiés |
| 4.5 | IA Gemini — suggestions pronos | Phases 1-3 stables |

---

## 6. Règles de mise à jour de ce document

- **À chaque correction de bug :** marquer la ligne avec ✅ et la date.
- **À chaque validation d'endpoint ESPN :** mettre à jour le statut CORS dans la section 4.
- **À chaque sprint terminé :** archiver les phases terminées, incrémenter la version du doc.
- **Ce document ne remplace pas `socle_nba_v0.8.md`** — le socle reste la référence technique. Ce fichier est l'audit vivant.

---

*Document v1.1 — 2026-05-27*
*Phase 0 + Phase 1 terminées. Prochaine révision : après Phase 2 ou Phase 3.*
