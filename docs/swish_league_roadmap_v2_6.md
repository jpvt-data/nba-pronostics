# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v2.6 — 2026-06-09 | Navigation + Roue + Missions chaînées + Onboarding tuto

---

## 1. Situation actuelle

Swish League est une app mature, cohérente et enrichie. Elle couvre l'intégralité du calendrier NBA, dispose d'un système de progression RPG complet avec missions chaînées, d'une roue quotidienne gamifiée, d'un système de tracking comportemental avec dashboard Admin, et d'une navigation restructurée avec pages à venir.

**Ce qui a été livré (Sprints 1→3.8 + Cotes + Sessions 3→4) :**
- Pronos, classements, scores ESPN temps réel, stats joueurs, bracket playoffs
- 1v1 H2H enrichi (fourchettes), ligues planifiées, MVP semaine
- Briefing ticker, Le Vestiaire, BanniereFeed, NewsNBA
- Board v4.2, Scanner ESPN, Admin 5 onglets
- Calendrier enrichi, MatchDetail enrichi, Explorer/Stats
- RPG complet (100 niveaux, 7 titres, 14 badges, missions, XP)
- Bonus Écart, Tracking events, Dashboard Admin
- Bloc CONTEXTE COTES dans MatchDetail
- Session 3 : DETTE-19 soldée, typo Outfit, zéro emoji, header Board v4.2
- **Session 4 ✅** : Navigation v4.3, Roue quotidienne, Missions chaînées

**Session 4 — livrée 2026-06-09 ✅**

---

## 2. Positionnement & identité

**Tagline :** "Pronostique. Flambe. Règne." ✅ active partout.
**Cible recrutement :** septembre 2026, pour préparer la présaison NBA (octobre).

---

## 3. Les 3 piliers

### Pilier 1 — Le rituel quotidien
Ticker Briefing + BanniereFeed + BandeMatchs. Connexion quotidienne récompensée en XP. Missions hebdomadaires comme moteur de rétention. Roue quotidienne ✅ livré. Contexte cotes pour aider le prono.

### Pilier 2 — La tension sociale
H2H ✅, MVP semaine ✅, chat Vestiaire ✅, streaks potes ✅. Prochain levier : collection de cartes.

### Pilier 3 — La progression visible
Streak ✅, RPG complet ✅, Bonus Écart ✅, Missions chaînées ✅, Roue ✅. Prochaine étape : avatars, onboarding.

---

## 4. Système RPG — état détaillé

### Courbe
`XP_BASE = 300` / `XP_COEFFICIENT = 1.06` dans `config.js`

| Titre | Niveaux |
|---|---|
| Rookie | 1 → 10 |
| Sixième Homme | 11 → 20 |
| Starter | 21 → 30 |
| All-Star | 31 → 40 |
| MVP | 41 → 60 |
| Hall of Fame | 61 → 80 |
| GOAT | 81 → 100 |

### Sources XP complètes

| Action | XP | Fréquence |
|---|---|---|
| Connexion quotidienne | +5 | 1×/jour |
| Prono posé | +10 | Par prono |
| Premier prono du jour | +10 | 1×/jour |
| Prono correct | +25 | Par prono validé |
| Semaine 100% pronostiquée | +50 | 1×/semaine |
| Premier prono de l'histoire | +75 | 1× à vie |
| Fourchette d'écart posée | +5 | 1× par match |
| Fourchette d'écart correcte | +30 | Par fourchette validée |
| **Roue quotidienne** | **+15/30/75/150 ou 0** | **1×/jour** |

### Points de classement ligue
- Prono vainqueur correct : **1 pt**
- Fourchette d'écart correcte : **+2 pts**
- Match parfait : **3 pts**

---

## 5. Système Tracking ✅ OPÉRATIONNEL

- Table `events` Supabase + service `tracker.js`
- 7 event types, 9 pages trackées
- Dashboard Admin 8 blocs, période 7j/14j/30j, export CSV + purge

---

## 6. Roadmap — sprints prioritisés

### Sprints 1→3.8 + Cotes + Sessions 3→4 ✅ LIVRÉS

---

### PRIORITÉ 1 — Avant juillet 2026 (Summer League 9-19 juillet)

```
✅ Navigation restructurée (loupe, hamburger, pages bientôt)
✅ "Stats" uniformisé (DETTE-24 soldée)
✅ Roue quotidienne (modal SVG animé, XP, missions)
✅ Missions chaînées (prerequis_slug, 5 nouvelles missions)
⏳ Onboarding tuto — carousel 5 slides
    Bouton "Tuto" à gauche de "Missions" dans les chips header Board
    Style : slides épurées, texte + icônes + couleurs app (pas de screenshots)
    onboarding_done boolean dans profils
    Rejouable via le bouton après premier visionnage
```

Summer League Las Vegas 2026 : 9-19 juillet.

---

### PRIORITÉ 2 — Août 2026 (avant recrutement septembre)

```
⏳ Partage de pick — Canvas API, Story Instagram
⏳ Classements par phase (front) — colonne tag déjà en base
```

---

### PRIORITÉ 3 — Sprint 4 — GAMIFICATION & IDENTITÉ

```
Profil fan (equipe_favorite_id + joueur_favori_id dans profils)
Filtrage pronos saison régulière — mécanisme à concevoir
Avatar personnalisable (SVG layers, maillots 30 équipes, cadres par niveau)
Collection de cartes (5 raretés, tirage quotidien, /ma-collection)
Edge Functions Supabase (sécurité XP côté serveur)
Titres saisonniers (gravés en fin de saison NBA dans profils)
```

---

## 7. Features post-Sprint 4

| Feature | Détail |
|---|---|
| H2H historique équipes saison régulière | Dans MatchDetail |
| Bracket Summer League dynamique | Depuis headlines |
| Classements par phase | Front déjà débloqué (tag en base) |
| Draft Night | Nouveau type de prono |
| Jalons visuels niveaux | Tous les 5 niveaux |
| XP social | +XP sur réaction Vestiaire |
| Dashboard tracking enrichi | Cohortes, funnel post-recrutement |
| Upgrade The Odds API | Si > 500 req/mois après septembre |

---

## 8. Ce qu'on ne fait PAS

| Fonctionnalité | Raison |
|---|---|
| Score exact en bonus | Impossible au basket — remplacé par fourchette d'écart ✅ |
| Paris d'argent réel | Régulation ANJ |
| Cotes dans le flow prono | Risque légal ANJ France |
| Marketplace de cartes | Économie spéculative |
| App mobile native | PWA suffit |
| Stats avancées (PER, Win Shares) | Non disponibles ESPN |
| Swish Data pipeline | Mis de côté indéfiniment |
| Notifications push Web | iOS limité |
| Leaderboard global séparé | Inutile à l'échelle actuelle |
| Standings NBA Cup / Summer League dédiés | ESPN ne les expose pas |

---

## 9. Off-season — stratégie rétention (juin → septembre)

- **Summer League** (juillet-août) : pronos via endpoint `nba-summer-las-vegas`
- **Missions hebdomadaires** : reset lundi, incentive récurrent même sans match NBA
- **Roue quotidienne** ✅ : point d'entrée quotidien off-season
- **Le Vestiaire** : discussions off-season, rumeurs transferts, draft
- **Onboarding tuto** : prêt pour l'arrivée des nouveaux users en septembre

---

## 10. Risques à anticiper

| Risque | Sévérité | Mitigation |
|---|---|---|
| Supabase pause (inactivité > 7j) | 🔴 Haute | Ping automatique cron Vercel |
| ESPN API changement structure | 🟡 Moyenne | Scanner Admin détecte les anomalies |
| rss2json.com indisponibilité | 🟢 Faible | Composants se masquent silencieusement |
| The Odds API quota dépassé | 🟢 Faible | Cache TTL 6h — upgrade si > 50 users |
| Dépassement quota Supabase free | 🟡 Moyenne | Pagination stricte, purge events |
| Spam chat Vestiaire | 🟡 Moyenne | Limite 500 chars, modération Admin |
| Missions trop répétitives | 🟡 Moyenne | Catalogue renouvelable via Admin |
| XP manipulation côté client | 🟡 Moyenne | RLS + Edge Functions post-Sprint 4 |
| Volume table events | 🟢 Faible court terme | Purge manuelle via Admin |

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création |
| v2.0 | 2026-06-05 | Sprint 3.6 livré : Bonus Écart complet |
| v2.1 | 2026-06-07 | Sprint 3.7 livré : Missions + Tracking + Dashboard Admin |
| v2.2 | 2026-06-07 | Sprint 3.8 livré : Bugfixes & stabilisation |
| v2.4 | 2026-06-08 | CRUD Missions Admin livré. Tagline validée. |
| v2.5 | 2026-06-09 | Session 3 : DETTE-19 soldée, typo Outfit, zéro emoji, header Board v4.2 |
| v2.6 | 2026-06-09 | Session 4 : Navigation v4.3, Roue quotidienne, Missions chaînées, Onboarding tuto en PRIORITÉ 1 |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec socle_nba_v4_3.md (référence technique)*
*Prochaine révision : après onboarding tuto livré*
