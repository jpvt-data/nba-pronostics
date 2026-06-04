# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.6 — 2026-06-04 | Sprint 3 en cours, XP/niveaux/badges à venir

---

## 1. Situation actuelle

Swish League est une app mature, bien au-delà du MVP. Elle tourne en production, connectée ESPN + Supabase + Basket USA, avec une identité visuelle forte et cohérente.

**Ce qui a été livré (Sprints 1, 2, 2.5, 3) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H, ligues planifiées, MVP semaine, classement Semaine/Mois/Saison
- Briefing ticker horizontal (remplace Focus/Briefing carousel) — défilement gauche→droite continu, fond beige, dismiss
- Le Vestiaire — streaks potes + chat ligues inline
- Badge nav "pronos en attente", série cassée
- Page Admin modération messages
- Refonte charte complète : Teko, barres gauche 3px, angles vifs, fonds sombres
- MatchDetail refondu : affiche énergique, barres stats bicolores ESPN
- BanniereFeed : article 1 Basket USA en tête du Board
- NewsNBA refondu : articles 2 à 6 Basket USA
- Board restructuré v3.3 : À LA UNE / TIMELINE / TICKER / LIGUE EN COURS / VESTIAIRE / CLASSEMENT NBA / ACTU NBA
- Fond desktop : 4 halos violets symétriques
- Bloc CLASSEMENT NBA : wrapper unifié StandingsNBA + BracketPlayoffs, titre gold
- Navbar mobile 52px

**Elle ressemble maintenant à un vrai produit.**

---

## 2. Positionnement & identité

**Tagline actuelle :** "Pronostique. Clashe. Règne."
**Tagline en validation :** "Pronostique. Performe. Règne."
→ "Clashe" trop agressif, pas aligné avec l'esprit réel de l'app.
→ L'esprit : compétition amicale, passion NBA commune, partage — pas du clashe.

**Cible recrutement :** septembre 2026, pour préparer la présaison NBA (octobre).

---

## 3. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Ticker Briefing (AVANT MATCH supprimé) répond à ça — messages contextuels en défilement. BanniereFeed donne l'actu du jour dès l'ouverture.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : XP, niveaux, badges.

### Pilier 3 — La progression visible
Streak ✅, série cassée ✅. XP et niveaux constituent le chantier suivant.

---

## 4. Roadmap — sprints

### Sprints 1, 2, 2.5, 3 ✅ LIVRÉS

### Sprint 3 restant ⏳ — EN COURS

**Prochain chantier : XP / niveaux / badges**
```
Architecture complète d'un coup (pas de badges sans XP).
Tables : xp_log + colonnes xp_total/niveau dans profils.
7 niveaux : Rookie → Role Player → Starter → All-Star → MVP → Hall of Famer → GOAT.
Badges déclenchés par actions : streak, MVP semaine, premier prono, win rate...
Affichage : profil + ticker Briefing + Vestiaire.
```

**Autres items Sprint 3 — déprioritisés ou reportés :**
```
Profil public enrichi       → découle naturellement de XP/niveaux, après Sprint 4
Leaderboard global          → inutile à l'échelle actuelle (app fermée, tous dans mêmes ligues)
                              Classement.jsx section "TOTAL" est déjà le leaderboard de facto.
                              À reconsidérer si l'app s'ouvre.
Onboarding                  → reporté août 2026 (voir §5)
Partage de pick             → reporté août 2026 (voir §5)
```

### Août 2026 — avant recrutement septembre

```
Onboarding carousel 5 slides :
  1. Pitch — "Pronostique chaque match NBA. Construis ton palmarès. Règne sur le classement."
  2. Les pronos (Board + BandeMatchs)
  3. Le classement
  4. Explorer
  5. Action — premier prono posé = onboarding terminé
Navigation : points + "Suivant →" + skip.
Déclenchement : champ onboarding_done boolean dans profils (à créer en août).
Pas de step notifications (PWA, iOS limité, Web Push non configuré).

Partage de pick :
  Canvas API, format Story Instagram.
  Généré après chaque prono posé.

Tagline :
  Valider "Pronostique. Performe. Règne." et mettre à jour partout
  (navbar, popup changelog, onboarding).
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

## 5. Features post-Sprint 4 (notées, non planifiées)

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail — distinct du H2H playoff déjà dispo |
| Enrichissement MatchDetail | Cotes bookmakers ESPN (odds endpoint sports.core.api.espn.com) |
| Pronostic écart final | Déjà listé Sprint 4 |

---

## 6. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Supprimé — impossible au basket |
| Paris d'argent réel | Régulation ANJ, contre la philosophie |
| Marketplace de cartes | Économie spéculative |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | Reporté — iOS limité sans Add to Home Screen |
| Cotes bookmakers dans flow prono | Risque légal ANJ France |
| Leaderboard global séparé | Inutile à l'échelle actuelle |
| "Entre potes" comme positionnement | Trop simpliste — remplacé par compétition amicale + passion |

---

## 7. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Proxy Edge Function en fallback |
| rss2json.com indisponibilité | 🟢 Faible | BanniereFeed/NewsNBA se masquent silencieusement |
| Basket USA changement RSS | 🟢 Faible | Surveiller structure |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, no SELECT * |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération Admin |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création |
| v1.1 | 2026-05-29 | Sprint 4 : niveaux XP, cartes, avatar |
| v1.2 | 2026-05-30 | Sprint 1 livré |
| v1.3 | 2026-06-02 | Sprint 2 livré. Refonte charte v3.0 |
| v1.4 | 2026-06-02 | Sprint 3 partiellement livré |
| v1.5 | 2026-06-03 | Sprint 3 quasi complet. BanniereFeed, NewsNBA, Briefing, Board restructuré |
| v1.6 | 2026-06-04 | Board v3.3 : ticker Briefing, CLASSEMENT NBA wrapper, navbar 52px, espacements. Positionnement revu. Onboarding + partage pick reportés août. Leaderboard global déprioritisé. XP/niveaux/badges = prochain chantier. |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v3_3.md (référence technique)*
*Prochaine révision : après XP/niveaux/badges livré*
