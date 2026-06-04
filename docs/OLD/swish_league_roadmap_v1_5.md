# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.5 — 2026-06-03 | Sprint 3 quasi complet, Sprint 4 à venir

---

## 1. Situation actuelle

Swish League est une app mature, bien au-delà du MVP. Elle tourne en production, connectée ESPN + Supabase + Basket USA, avec une identité visuelle forte et cohérente.

**Ce qui a été livré (Sprints 1, 2, 2.5, 3) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H, ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Briefing perso (ex-Focus) avec messages guideline cliquables, dismiss localStorage, carousel 6s
- Le Vestiaire — streaks potes + chat ligues inline
- Badge nav "pronos en attente", série cassée (Briefing + Vestiaire)
- Page Admin modération messages
- Refonte charte complète : Teko, barres gauche 3px, angles vifs, fonds sombres
- MatchDetail refondu : affiche énergique, barres stats bicolores ESPN
- **BanniereFeed** : article 1 Basket USA en tête du Board, photo plein largeur
- **NewsNBA** refondu : articles 2 à 6 Basket USA, thumb + résumé, fond beige
- **Board** restructuré : À LA UNE / AVANT MATCH / TIMELINE / LIGUE EN COURS / VESTIAIRE / NBA DATA / ACTU NBA
- **Fond desktop** : 4 halos violets symétriques, box-shadow sur `#root`
- Bracket/Standings : logique basée sur ligues Supabase (fallback ESPN)

**Elle ressemble maintenant à un vrai produit.**

---

## 2. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Briefing (AVANT MATCH) répond à ça avec messages contextuels, ligue active, prochain match. BanniereFeed donne l'actu du jour dès l'ouverture.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : badges publics et leaderboard global.

### Pilier 3 — La progression visible
Streak ✅, série cassée ✅. XP et collection de cartes constituent le chantier Sprint 4.

---

## 3. Roadmap — 4 sprints

### Sprint 1 ✅ LIVRÉ — RÉTENTION
### Sprint 2 ✅ LIVRÉ — ENGAGEMENT SOCIAL
### Sprint 2.5 ✅ LIVRÉ — REFONTE CHARTE

### Sprint 3 ✅ QUASI COMPLET — PROFONDEUR & POLISH

**Livré :**
```
✅ Badge nav "pronos en attente"
✅ Chat par ligue (LeVestiaire inline, polling 30s)
✅ Focus → Briefing (AVANT MATCH) — navigation manuelle + carousel 6s + dismiss localStorage
✅ Messages guideline cliquables (pronos, ligue active, prochain match, profil)
✅ Bracket/Standings — logique ligues Supabase (DETTE-16 résolue)
✅ Forme récente — ordre corrigé (dernier à droite, max 5)
✅ Actus NBA en français — Basket USA via rss2json
✅ BanniereFeed — article 1 Basket USA en tête, photo plein largeur
✅ NewsNBA refondu — articles 2 à 6, thumb + résumé, fond beige, source citée
✅ Board restructuré — titres À LA UNE / AVANT MATCH, espacements groupes
✅ Fond desktop — 4 halos violets symétriques + box-shadow #root
✅ Admin page — modération messages
✅ PopupChangelog — welcome back pseudo + message contextuel
✅ BandeMatchs vide — bloc informatif avec lien calendrier
```

**Restant Sprint 3 :**
```
⏳ Badges / achievements
    Table `badges`. Logique déclenchement (streak, score, champion semaine…).
    Affichage profil + Briefing + Vestiaire.

⏳ Profil public enrichi
    Stats, badges, niveau depuis /mes-pronos?user_id=X.

⏳ Onboarding simplifié
    Flow 3 étapes : pitch app → premier prono → activer notifs.
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
    Migration table pronos requise.
```

---

## 4. Features post-Sprint 4 (notées, non planifiées)

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail — distinct du H2H playoff déjà dispo |
| Enrichissement MatchDetail | Cotes bookmakers ESPN (odds endpoint sports.core.api.espn.com) |
| Pronostic écart final | Déjà listé Sprint 4 |

---

## 5. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Supprimé — impossible au basket |
| Paris d'argent réel | Régulation ANJ, contre la philosophie |
| Marketplace de cartes | Économie spéculative — contre-modèle TopShot |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | Reporté — iOS limité sans Add to Home Screen |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |
| H2H Y vs Z (deux autres users) | Cas anecdotique |

---

## 6. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Proxy Edge Function en fallback |
| rss2json.com indisponibilité | 🟢 Faible | BanniereFeed/NewsNBA se masquent silencieusement |
| Basket USA changement RSS | 🟢 Faible | Surveiller structure, adapter extraction image |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, no SELECT * |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération page Admin |
| Clé rss2json visible front | 🟢 Info | Normal pour usage perso — à passer en env var si app publique |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création — benchmark marché + roadmap 3 sprints |
| v1.1 | 2026-05-29 | Ajout Sprint 4 : niveaux XP, cartes, avatar, profil fan |
| v1.2 | 2026-05-30 | Sprint 1 livré. Sprint 2 en cours. Badge nav, onboarding Sprint 3. |
| v1.3 | 2026-06-02 | Sprint 2 livré. Refonte charte v3.0. Sprint 3 en cours. |
| v1.4 | 2026-06-02 | Sprint 3 partiellement livré. Todo Sprint 3 détaillée. |
| v1.5 | 2026-06-03 | Sprint 3 quasi complet. Briefing, BanniereFeed, NewsNBA Basket USA, Board restructuré, fond desktop. Restant : badges, profil public, onboarding, leaderboard, partage de pick. |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec `socle_nba_v3_2.md` (référence technique) — documents complémentaires*
*Prochaine révision : après Sprint 3 complet livré*
