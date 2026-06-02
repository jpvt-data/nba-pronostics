# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.4 — 2026-06-02 | Sprint 3 en cours, features livrées et todo active

---

## 1. Situation actuelle

Swish League est une app mature, bien au-delà du MVP. Elle tourne en production, connectée ESPN + Supabase, avec une identité visuelle forte et cohérente.

**Ce qui a été livré (Sprints 1, 2, 2.5 + début Sprint 3) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H, ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Focus carousel perso, Le Vestiaire (streaks potes + chat ligues inline)
- Badge nav "pronos en attente", série cassée (Focus + Vestiaire)
- Page Admin modération messages
- Refonte charte complète : Teko, barres gauche 3px, angles vifs, fonds sombres, popup auth animé
- MatchDetail refondu : affiche énergique, barres stats bicolores couleurs ESPN, leaders 2 colonnes desktop

**Elle ressemble maintenant à un vrai produit.**

---

## 2. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Focus sur le Board répond à ça. Badge nav + messages guideline cliquables (à venir) renforcent le retour quotidien.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : badges publics et leaderboard global.

### Pilier 3 — La progression visible
Streak ✅, série cassée ✅. XP et collection de cartes constituent le chantier Sprint 4.

---

## 3. Roadmap — 4 sprints

### Sprint 1 ✅ LIVRÉ — RÉTENTION
```
✅ Focus.jsx
✅ LeVestiaire.jsx (streaks + chat)
✅ MesPronos enrichi
✅ QuoiDeNeuf
```

### Sprint 2 ✅ LIVRÉ — ENGAGEMENT SOCIAL
```
✅ Classement Semaine/Mois/Saison
✅ MVP Semaine précédente
✅ H2H 1v1
✅ Ligues planifiées
```

### Sprint 2.5 ✅ LIVRÉ — REFONTE CHARTE
```
✅ Design system Teko + barres gauche + angles vifs
✅ Toutes les pages refondues
✅ PopupChangelog = splash screen animé + auth intégré
✅ No Spoil retiré du menu et header
✅ LabelSection / Bloc / BanniereImage supprimés
✅ Logo image remplacé par texte Teko
```

### Sprint 3 — PROFONDEUR & POLISH (en cours)

**Livré :**
```
✅ Badge nav "pronos en attente" (point rouge icône Board)
✅ Chat par ligue (LeVestiaire inline, polling 30s, date/heure messages)
✅ Focus enrichi (nbPronosAttente prop + série cassée perso)
✅ Le Vestiaire — détection fin de série potes
✅ PopupChangelog — welcome back pseudo + message contextuel
✅ BandeMatchs vide — bloc informatif avec lien calendrier
✅ NewsNBA fix — indépendant de typeSaison
✅ Admin page — modération messages toutes ligues (/admin)
```

**Restant :**
```
⏳ Focus → Briefing
    Renommer le composant.
    Ajouter messages guideline cliquables :
    - résultats de la nuit disponibles → lien MesPronos
    - nouveaux messages chat → lien Vestiaire
    - compléter son profil (si avatar/bio vides) → lien Profil
    Chaque message cliquable navigue vers la section concernée.
    Disparition via localStorage (timestamp de visite par section).

⏳ Brackets/Standings — logique ligues
    Affichage basé sur type_saison des ligues en cours de l'user,
    pas sur typeSaisonActuel ESPN (null si pas de matchs 3 jours).
    BracketPlayoffs visible si une ligue en cours a type_saison = 3.

⏳ Forme récente — ordre
    Dernier match à droite, plus ancien à gauche.
    Max 5 affichés, glisse au fil du temps.

⏳ Actus NBA en français
    Trouver une source d'actus NBA en français (pas ESPN qui est en anglais).

⏳ Badges / achievements
    Table `badges`. Logique déclenchement (streak, score, champion semaine…).
    Affichage profil + Focus + Vestiaire.

⏳ Profil public enrichi
    Stats, badges, niveau depuis /mes-pronos?user_id=X.

⏳ Onboarding simplifié
    Flow 3 étapes : pitch app → premier prono → activer notifs.
    (Étape "rejoindre une ligue" supprimée — seul JPVT crée des ligues.)
    Champ `onboarding_done` dans profils.

⏳ Leaderboard global
    Tous users, profils publics, agrégation Supabase.

⏳ Partage de pick
    Canvas API. Format Story Instagram.
```

### Sprint 4 — GAMIFICATION & IDENTITÉ
```
Profil fan (équipe & joueur favoris)
    Champs equipe_favorite_id + joueur_favori_id dans profils.
    Impact Board + standings + collection.

Système de niveaux & XP
    Tables xp_log + champs xp_total/niveau dans profils.
    7 niveaux : Rookie → Role Player → Starter → All-Star → MVP → Hall of Famer → GOAT.

Avatar personnalisable
    SVG layers. Maillots 30 équipes, cadres par niveau. Tout gagné, rien acheté.

Collection de cartes joueurs
    Catalogue ~200 cartes. 5 raretés : Common / Rare / Epic / Legendary / Ultimate.
    Tirage quotidien. Page /ma-collection.

Pronostic écart final
    Victoire serrée (<5 pts) ou large (>20 pts) → +2 pts bonus.
    Reformulation "score exact" adaptée au basket.
    Migration table pronos requise.
```

---

## 4. Features post-Sprint 4 (notées, non planifiées)

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail — distinct du H2H playoff déjà dispo via summary |
| Enrichissement MatchDetail | Cotations bookmakers ESPN (odds endpoint sports.core.api.espn.com) et/ou sources stats supplémentaires |
| Pronostic écart final | Déjà listé Sprint 4 — à confirmer selon priorisation |

---

## 5. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Supprimé — impossible au basket (scores trop élevés, probabilité nulle) |
| Paris d'argent réel | Régulation ANJ, contre la philosophie |
| Marketplace de cartes | Économie spéculative — contre-modèle TopShot |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | Reporté — iOS limité sans Add to Home Screen |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |
| H2H Y vs Z (deux autres users) | H2H = toujours moi vs quelqu'un. Cas anecdotique. |

---

## 6. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Proxy Edge Function en fallback |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, no SELECT * |
| MVP non enregistré (personne n'ouvre Classement) | 🟢 Faible | Surveiller si usage augmente |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération page Admin |
| Clé anon Supabase visible dans le front | 🟢 Info | Normal par design — sécurité = RLS uniquement |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création — benchmark marché + roadmap 3 sprints |
| v1.1 | 2026-05-29 | Ajout Sprint 4 : F14 Niveaux XP, F15 Cartes, F16 Avatar, F17 Profil fan |
| v1.2 | 2026-05-30 | Sprint 1 livré. Sprint 2 en cours. Précisions classement général. Badge nav, onboarding dans Sprint 3. |
| v1.3 | 2026-06-02 | Sprint 2 livré. Refonte charte v3.0. Sprint 3 en cours. |
| v1.4 | 2026-06-02 | Sprint 3 partiellement livré : badge nav, chat Vestiaire, Focus enrichi, Admin, fixes ESPN. Todo Sprint 3 restante détaillée. Features post-Sprint 4 notées. Score exact supprimé. Pronostic écart final déplacé Sprint 4. |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec `socle_nba_v3_1.md` (référence technique) — documents complémentaires*
*Prochaine révision : après Sprint 3 complet livré*
