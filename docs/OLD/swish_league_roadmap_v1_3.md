# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.3 — 2026-06-02 | Sprint 2 livré, refonte charte complète v3.0, Sprint 3 en cours

---

## 1. Situation actuelle

Swish League est une app mature, bien au-delà du MVP. Elle tourne en production, connectée ESPN + Supabase, avec une identité visuelle forte et cohérente.

**Ce qui a été livré (Sprints 1 & 2 + refonte charte) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H, ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Focus carousel perso, Le Vestiaire (streaks potes + chat ligues)
- Refonte charte complète : Teko, barres gauche 3px, angles vifs, fonds sombres, popup auth animé
- MatchDetail refondu : affiche énergique, barres stats bicolores couleurs ESPN, leaders 2 colonnes desktop

**Elle ressemble maintenant à un vrai produit.**

---

## 2. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Focus sur le Board répond à ça. La prochaine étape : badges et gamification pour créer un attachement quotidien au-delà des pronos.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅. Prochain levier : badges publics et leaderboard global.

### Pilier 3 — La progression visible
Streak ✅. XP et collection de cartes constituent le chantier Sprint 4.

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
✅ Toutes les pages refondues (Accueil, Classement, MesPronos, MatchDetail,
   Stats, Groupes, Profil, H2H, Calendrier, BracketPlayoffs,
   ClassementRapide, Admin, QuoiDeNeuf)
✅ PopupChangelog = splash screen animé + auth intégré
✅ Connexion.jsx = wrapper popup (5 lignes)
✅ No Spoil retiré du menu et header
✅ LabelSection / Bloc / BanniereImage supprimés
✅ Dégradé CTA accent→orange supprimé
✅ Logo image remplacé par texte Teko
```

### Sprint 3 — PROFONDEUR & POLISH (en cours)
```
⏳ Badges / achievements
    Table `badges`. Logique déclenchement (streak, score, champion semaine…).
    Affichage profil + Focus + Vestiaire.

⏳ Profil public enrichi
    Stats, badges, niveau depuis /mes-pronos?user_id=X.

⏳ Onboarding simplifié
    Pitch → premier prono → activer notifs.
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
```

---

## 4. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Reporté Sprint 4 — migration BDD pronos non triviale |
| Paris d'argent réel | Régulation ANJ, contre la philosophie |
| Marketplace de cartes | Économie spéculative — contre-modèle TopShot |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | Reporté — iOS limité sans Add to Home Screen |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |

---

## 5. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Proxy Edge Function en fallback |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, no SELECT * |
| MVP non enregistré (personne n'ouvre Classement) | 🟢 Faible | Surveiller si usage augmente |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, rate limiting RLS |

---

*Document v1.3 — 2026-06-02*
*Remplace swish_league_roadmap_v1_2.md*
