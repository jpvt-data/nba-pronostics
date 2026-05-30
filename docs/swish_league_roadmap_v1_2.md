# SWISH LEAGUE — ROADMAP VERS UNE APP COMPLÈTE
## De l'MVP au produit diffusable
> v1.2 — 2026-05-30 | Mise à jour Sprint 1 livré, Sprint 2 en cours, précisions classement & ligues

---

## SOMMAIRE

1. [Contexte & objectif](#1-contexte--objectif)
2. [Benchmark marché](#2-benchmark-marché)
3. [Audit Swish League — état des lieux](#3-audit-swish-league--état-des-lieux)
4. [Les 3 piliers d'une app de pronos qui dure](#4-les-3-piliers-dune-app-de-pronos-qui-dure)
5. [Fonctionnalités manquantes — classification complète](#5-fonctionnalités-manquantes--classification-complète)
6. [Roadmap priorisée — 4 sprints](#6-roadmap-priorisée--4-sprints)
7. [Détail technique par fonctionnalité](#7-détail-technique-par-fonctionnalité)
8. [Ce qu'on ne fait PAS (et pourquoi)](#8-ce-quon-ne-fait-pas-et-pourquoi)
9. [KPIs de succès](#9-kpis-de-succès)
10. [Risques à anticiper](#10-risques-à-anticiper)

---

## 1. Contexte & objectif

### Situation actuelle
Swish League est un produit fonctionnel au-delà du MVP. L'app fait le job : pronos, classements enrichis, scores ESPN, stats joueurs, 1v1, ligues planifiées. Elle est déployée en production sur Vercel, connectée à Supabase, avec une identité visuelle cohérente (dark, violet/orange, mobile first).

**Elle commence à ressembler à une vraie app. Elle n'est pas encore une app qu'on garde sans raison de revenir.**

### Objectif de ce document
Définir la feuille de route précise pour passer d'un produit solide à une app communautaire aboutie, diffusable à une audience au-delà du cercle initial. Ce document est la référence de priorisation pour toutes les prochaines sessions de développement.

### Périmètre
- **Focus exclusif : Swish League** (Swish Data mis de côté indéfiniment)
- Stack inchangé : React + Vite + Supabase + Vercel Hobby
- Contrainte : zéro budget, zéro serveur dédié, ESPN API publique uniquement
- Pas d'IA dans ce cycle — fonctionnalités humaines d'abord

---

## 2. Benchmark marché

### 2.1 — Les catégories d'acteurs

#### Catégorie A — Pure scores/stats
**Acteurs :** SofaScore, FotMob, Flashscore, ESPN app

Ce qu'ils font bien :
- Données en temps réel, riches, fiables
- Design soigné, lisible
- Notifications pertinentes (match qui commence, résultat)
- Heatmaps, ratings joueurs, H2H équipes (SofaScore)
- Momentum graph, xG timelines (FotMob)

Ce qu'ils ne font pas :
- Aucune dimension communautaire ou de prédiction
- Tu consultes, tu ne joues pas

**Lesson :** Swish League n'est pas en concurrence directe. Elle complète ces apps avec une couche sociale et de jeu.

---

#### Catégorie B — Pick'Em / Pronos
**Acteurs :** NBA Pick'Em (officiel NBA), ESPN NBA Playoff Challenge, Pick'Em Sports, Hunch

Ce qu'ils font bien :
- Picks match par match ou bracket complet
- Ligues officielles + ligues privées
- Leaderboard global en temps réel
- Head-to-head direct entre deux joueurs
- Analytics perso (win rate, streaks, trends)
- Badges / récompenses
- Score exact en option pour plus de points

Ce qu'ils ne font pas :
- Expérience communautaire réelle (chat, réactions)
- Vraie personnalisation (profil riche, historique complet)
- Stats NBA intégrées pour aider le prono

**Lesson :** Le modèle de scoring est la mécanique centrale. Score exact = différenciateur fort. Analytics perso = rétention.

---

#### Catégorie C — Communautaire/Social
**Acteurs :** Hunch (groupes + trash talk), communautés Reddit NBA, Discord serveurs NBA

Ce qu'ils font bien :
- Groupes publics et privés avec échanges
- Trash talk intégré
- Compétition élargie

Ce qu'ils ne font pas :
- Design et UX soignés
- Intégration de données NBA réelles

**Lesson :** La dimension sociale crée de l'attachement que les données seules ne créent pas.

---

#### Catégorie D — Collectibles numériques (référence)
**Acteur de référence :** NBA TopShot (Dapper Labs)

Ce que fait NBA TopShot :
- Collecte de "Moments" NBA packagés en NFTs
- Système de raretés avec mint counts limités
- Marketplace d'échange — plus d'1 milliard de dollars de transactions

**Pourquoi ce n'est PAS le modèle à copier :**
TopShot repose sur de l'argent réel, une blockchain, une licence NBA officielle et une dimension spéculative. Le modèle s'est retourné contre lui : la communauté s'est fracturée entre vrais fans et spéculateurs.

**Ce qu'on retient de TopShot :** la mécanique de collection (rareté, extensions, tirage, progression de galerie) — pas le modèle économique. Notre version : 100% gratuite, gagnée par les performances, sans blockchain, sans argent. **Panini numérique communautaire, pas marché financier.**

---

### 2.2 — Ce que veulent vraiment les utilisateurs

| Besoin | Fréquence | Intensité |
|---|---|---|
| Savoir si mon prono était bon rapidement | Quotidien | Haute |
| Comparer ma performance à mes amis | Quotidien | Haute |
| Chambrer un ami après un mauvais prono | Quotidien | Haute |
| Suivre ma progression dans le temps | Hebdomadaire | Moyenne |
| Consulter les stats avant de pronostiquer | Avant chaque match | Moyenne |
| Collectionner, compléter, posséder quelque chose | Continu | Haute (si bien exécuté) |
| Être récompensé et reconnu pour ses performances | Continu | Moyenne |
| Personnaliser son identité dans l'app | Continu | Moyenne |

**Conclusion clé :** Le produit doit générer un rituel quotidien ET un attachement identitaire.

---

## 3. Audit Swish League — état des lieux

### 3.1 — Ce qui existe et fonctionne ✅

| Fonctionnalité | Niveau de maturité | Note |
|---|---|---|
| Pronos match par match | ✅ Complet | Verrouillage auto, upsert propre |
| Ligues privées | ✅ Complet | Planifiables (date_debut/fin), onglets À venir/En cours/Terminées |
| Classement par ligue + général | ✅ Complet | Toggle Semaine/Mois/Saison, MVP semaine précédente |
| Scores ESPN temps réel | ✅ Complet | Scoreboard 3 jours, polling |
| MatchDetail complet | ✅ Complet | Stats équipes, leaders, blessés, L5, predictor ESPN |
| Standings NBA Est/Ouest | ✅ Complet | Saison régulière + historique |
| Bracket playoffs | ✅ Complet | Visuel + sélecteur de saison |
| Fiche joueur | ✅ Bon | Stats saison, radars, game log 15 matchs |
| News NBA | ✅ Basique | 5 actus ESPN |
| Mode No Spoil | ✅ Complet | Tous les composants couverts |
| Auth | ✅ Complet | Session persistante |
| Profil utilisateur | 🟡 Partiel | Avatar, bio — pas encore de stats publiques enrichies |
| MesPronos / Dashboard | ✅ Enrichi | Streak, meilleure/pire équipe, forme 10 matchs |
| Calendrier | ✅ Complet | 4 vues, filtres, cache local |
| Focus (Board) | ✅ Complet | Carousel perso extensible |
| Le Vestiaire (Board) | ✅ Complet | Fil streaks communautaires extensible |
| H2H 1v1 | ✅ Complet | Bilan + match par match, picker adversaire |
| Quoi de neuf | ✅ Complet | Page dédiée + popup allégée |
| ClassementRapide | ✅ Enrichi | Points année NBA, ligues en cours uniquement |

### 3.2 — Forces distinctives actuelles

- **Design cohérent et soigné** : dark theme, tokens CSS propres, mobile first réel
- **Data ESPN profonde** : fiche joueur, radars, game log — peu d'apps de pronos offrent ça
- **Bracket playoffs fonctionnel** : rare dans les apps amateurs
- **No Spoil** : feature distinctive
- **H2H** : comparaison prono par prono, bilan visuel
- **Ligues planifiées** : gestion pro des saisons NBA

### 3.3 — Faiblesses critiques actuelles

1. **Aucune notification** → l'utilisateur n'a aucune raison de revenir s'il n'y pense pas
2. **Aucune interaction sociale** → les ligues existent mais personne ne se parle
3. **Aucune mécanique de reward** → correct ou raté, aucun feedback émotionnel fort
4. **Identité utilisateur pauvre** → aucun objet d'attachement, profil basique

---

## 4. Les 3 piliers d'une app de pronos qui dure

### Pilier 1 — Le rituel quotidien

Le déclencheur externe indispensable : **la notification push** (ou à défaut un badge nav).
Le déclencheur interne : **voir en 5 secondes où j'en suis** — Focus répond à ça.

**Ce qui tue le rituel :** devoir naviguer 3 écrans pour savoir si mon prono d'hier était bon.

### Pilier 2 — La tension sociale

Le chambrage entre amis est le moteur émotionnel du produit.

Vecteurs de tension sociale :
- **H2H direct** : "vs Baptiste ce mois-ci : 12-9 en ma faveur" ✅ livré
- **MVP semaine précédente** ✅ livré
- **Réactions sur les pronos** : à venir Sprint 3
- **Classement en temps réel** ✅ livré

**Ce qui tue la tension sociale :** le silence. Les ligues sans interaction deviennent des tableaux Excel.

### Pilier 3 — La progression visible + l'identité

Mécaniques de progression :
- **Streak** ✅ livré (Focus + MesPronos)
- **Niveaux & XP** : Sprint 4
- **Badges** : Sprint 3
- **Collection de cartes** : Sprint 4

---

## 5. Fonctionnalités manquantes — classification complète

### Niveau 1 — CRITIQUE (bloque la rétention)

#### F1 — Notifications push (Web Push API)
**Pourquoi critique :** Sans notification, l'app est invisible dans le quotidien.
**Cas d'usage :** match imminent, résultat tombé, carte du jour disponible.
**Statut :** Reporté — Web Push bloqué iOS sans Add to Home Screen. Badge nav comme alternative immédiate.
**Complexité :** Moyenne (Service Worker + VAPID + Supabase Edge Function)

#### F3 — Badge nav "pronos en attente"
**Pourquoi :** Alternative légère aux notifs push. Indicateur rouge dans la Navigation.
**Complexité :** Très faible

---

### Niveau 2 — IMPORTANT (différencie l'app)

#### F4 — Head-to-Head entre membres ✅ LIVRÉ v2.5

#### F5 — Score exact en bonus
**Description :** Saisir le score exact du match. Score exact → +3 pts bonus.
**Règles :**
- Winner correct uniquement → +1 pt (inchangé)
- Winner correct + écart ±5 pts → +2 pts
- Score exact → +3 pts
**Complexité :** Moyenne — migration table `pronos`, adapter `points.js`, adapter UI

#### F6 — Classement hebdomadaire ✅ LIVRÉ v2.5
Intégré dans le toggle Semaine/Mois/Saison du classement général.

#### F7 — Chat / réactions par ligue
**Description :** Messagerie simple dans chaque ligue.
**Complexité :** Moyenne/Haute — Supabase Realtime ou polling 30s. Table `messages`.

#### F13 — Onboarding guidé
**Description :** Flow 4 étapes : pitch → rejoindre/créer ligue → premier prono → activer notifs.
**Complexité :** Faible — composant React + champ `onboarding_done` dans `profils`

---

### Niveau 3 — SOUHAITABLE (polish & viralité)

#### F8 — Profil public enrichi
Stats, badges, niveau, cartes récentes, historique pronos consultable par les membres d'un groupe commun.

#### F9 — Badges / achievements
| Badge | Déclencheur |
|---|---|
| 🎯 Sniper | Premier score exact |
| 🔥 En feu | 5 corrects d'affilée |
| 💀 Cold streak | 5 ratés d'affilée |
| 🏆 Champion de semaine | Meilleur score hebdo dans une ligue |
| 👑 Prophète | 10 corrects d'affilée |
| 😤 Anti-LeBron | 0% sur les Lakers |
| 🃏 All-in | Tous les matchs pronostiqués en une semaine |
| 🧠 Analyst | Win rate > 65% sur 20+ pronos |
| 💎 Collectionneur | 50 cartes dans sa collection |
| 🌟 Légendaire | Obtenir une carte légendaire |

#### F10 — Preview match enrichi
Win probability ESPN, blessés clés, L5 des deux équipes, H2H, classements — avant de poser son prono.

#### F11 — Partage de pick
Image partageable (Canvas API) — format Story Instagram.

#### F12 — Leaderboard global
Classement de tous les utilisateurs Swish League, profils publics uniquement.

---

### Niveau 4 — GAMIFICATION & IDENTITÉ

#### F14 — Système de niveaux & XP

| Niveau | Titre | XP requis (cumulé) |
|---|---|---|
| 1 | 🏀 Rookie | 0 |
| 2 | 📋 Role Player | 500 |
| 3 | ⭐ Starter | 1 500 |
| 4 | 🌟 All-Star | 3 500 |
| 5 | 🏆 MVP | 7 500 |
| 6 | 👑 Hall of Famer | 15 000 |
| 7 | 🐐 GOAT | 30 000 |

Sources d'XP : connexion (+10), prono posé (+5), prono correct (+15), score exact (+40), carte du jour (+20), rare (+50), légendaire (+200), streak 5 (+100), streak 10 (+300), champion semaine (+150), membre invité (+100).

#### F15 — Collection de cartes joueurs

| Rareté | Couleur | Probabilité |
|---|---|---|
| ⚪ Common | Gris argenté | 60% |
| 🔵 Rare | Bleu saphir | 25% |
| 🟣 Epic | Violet | 12% |
| 🟡 Legendary | Or | 2,5% |
| 🔴 Ultimate | Rouge prismatique | 0,5% |

Sets : Saison, Légendes, Franchise, Playoffs, Rookie.
Mécaniques : carte du jour (1/connexion), pack récompense (streak 5), pack élite (milestone niveau), carte performance (20% chance après prono correct).

#### F16 — Avatar personnalisable
SVG layers superposés. Éléments : maillots 30 équipes, cadres par niveau, fonds couleurs équipe favorite. Tout gagné, rien acheté.

#### F17 — Profil fan (équipe & joueur favoris)
Équipe favorite → maillot débloqué, fond profil aux couleurs, surbrillance standings, match mis en avant dans le Board.
Joueur favori → notification performance exceptionnelle, carte ⭐ dans la collection.

---

## 6. Roadmap priorisée — 4 sprints

### Vue d'ensemble

```
Sprint 1 ✅ LIVRÉ — RÉTENTION
  ✅ Focus.jsx — carousel spotlight perso
  ✅ LeVestiaire.jsx — fil streaks communautaires
  ✅ Dashboard MesPronos enrichi (streak, équipes, forme)
  ✅ PopupChangelog restructuré + page Quoi de neuf
  ⏳ Notifications push — reporté

Sprint 2 🔄 EN COURS — ENGAGEMENT SOCIAL
  ✅ Classement Semaine/Mois/Saison + MVP semaine précédente
  ✅ Head-to-Head 1v1
  ✅ Ligues planifiées (date_debut, onglets)
  ⏳ Score exact en bonus (+2/+3 pts)
  ⏳ Onboarding guidé

Sprint 3 — PROFONDEUR & POLISH
  Badge nav "pronos en attente"
  Chat / réactions par ligue
  Badges / achievements
  Profil public enrichi
  Preview match enrichi
  Leaderboard global
  Partage de pick

Sprint 4 — GAMIFICATION & IDENTITÉ
  F17 — Profil fan (équipe & joueur favoris)    ← démarrer ici
  F14 — Système de niveaux & XP
  F16 — Avatar personnalisable
  F15 — Collection de cartes joueurs            ← chantier le plus lourd
```

---

### Sprint 2 — Engagement social (en cours)

**Étape 2.1 ✅ — Classement enrichi**
Toggle Semaine/Mois/Saison. MVP semaine précédente depuis `semaines_gagnees`. Ligues en cours uniquement.

**Étape 2.2 ✅ — Head-to-Head 1v1**
Page `/h2h`. Picker adversaire (tous les potes de mes ligues). Bilan + match par match.

**Étape 2.3 ✅ — Ligues planifiées**
`date_debut` ajouté à `groupes`. Onglets À venir/En cours/Terminées. Bouton "Classement" sur ligues en cours et terminées.

**Étape 2.4 ⏳ — Score exact en bonus** — 3 jours (⚠️ migration BDD)
```sql
ALTER TABLE pronos
ADD COLUMN score_dom_prono INTEGER,
ADD COLUMN score_ext_prono INTEGER;
```
Logique points : winner correct → +1. Écart ±5 → +2. Score exact → +3.

**Étape 2.5 ⏳ — Onboarding guidé** — 1.5 jour
Flow 4 étapes. Champ `onboarding_done` dans `profils`.

---

### Sprint 3 — Profondeur & polish

**Étape 3.1 — Badge nav pronos en attente** — 0.5 jour
Indicateur rouge dans Navigation si pronos en attente.

**Étape 3.2 — Preview match enrichi** — 1.5 jour
Win prob ESPN, blessés, L5, H2H avant prono.

**Étape 3.3 — Badges / achievements** — 3-4 jours
Table `badges`. Logique déclenchement. Affichage profil + Focus + Vestiaire.

**Étape 3.4 — Chat / réactions par ligue** — 4-5 jours
Table `messages`. Supabase Realtime ou polling 30s. RLS membres.

**Étape 3.5 — Profil public enrichi** — 1.5 jour
Stats, badges, niveau, historique depuis `/mes-pronos?user_id=X`.

**Étape 3.6 — Leaderboard global** — 1 jour
Agrégation Supabase par user_id. Profils publics.

**Étape 3.7 — Partage de pick** — 3-4 jours
Canvas API. Format Story. ROI long terme (acquisition organique).

---

### Sprint 4 — Gamification & identité

**Étape 4.1 — Profil fan** — 1 jour
Champs `equipe_favorite_id` + `joueur_favori_id` dans `profils`. Picker visuel logos ESPN. Impact Board + standings.

**Étape 4.2 — Niveaux & XP** — 3-4 jours
Tables `xp_log` + champs `xp_total`/`niveau` dans `profils`. Barre progression profil. Notification palier.

**Étape 4.3 — Avatar personnalisable** — 4-5 jours
SVG layers. Table `avatar_deblockages`. Éditeur dans profil. Rendu classement + chat.

**Étape 4.4 — Collection de cartes** — 6-8 jours
Catalogue ~200 cartes (travail éditorial en amont). Tables `cartes_catalogue` + `cartes_collection`. Mécanique tirage. Composant carte (animation rareté). Page `/ma-collection`.

---

## 7. Détail technique par fonctionnalité

### F5 — Score exact

```sql
ALTER TABLE pronos
ADD COLUMN score_dom_prono INTEGER,
ADD COLUMN score_ext_prono INTEGER;
```

```javascript
function calculerPointsMatch(prono, matchFinal) {
  const { equipe_choisie, score_dom_prono, score_ext_prono } = prono
  const { equipe_gagnante, score_dom, score_ext } = matchFinal
  if (equipe_choisie !== equipe_gagnante) return 0
  let points = 1
  if (score_dom_prono === score_dom && score_ext_prono === score_ext) {
    points += 2 // score exact → total +3
  } else if (score_dom_prono !== null &&
    Math.abs((score_dom_prono - score_ext_prono) - (score_dom - score_ext)) <= 5) {
    points += 1 // écart correct → total +2
  }
  return points
}
```

### F7 — Chat par ligue

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  groupe_id UUID REFERENCES groupes(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL CHECK (char_length(contenu) <= 500),
  cree_le TIMESTAMP DEFAULT NOW()
);
```

### F9 — Badges

```sql
CREATE TABLE badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  obtenu_le TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, type)
);
```

### F14 — Niveaux & XP

```sql
ALTER TABLE profils
ADD COLUMN xp_total INTEGER DEFAULT 0,
ADD COLUMN niveau INTEGER DEFAULT 1;

CREATE TABLE xp_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  montant INTEGER NOT NULL,
  cree_le TIMESTAMP DEFAULT NOW()
);
```

### F15 — Cartes joueurs

```sql
CREATE TABLE cartes_catalogue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  joueur_nom TEXT NOT NULL,
  joueur_espn_id TEXT,
  equipe TEXT NOT NULL,
  equipe_espn_id TEXT,
  saison TEXT,
  set_nom TEXT NOT NULL,
  rarete TEXT NOT NULL CHECK (rarete IN ('common', 'rare', 'epic', 'legendary', 'ultimate')),
  serie_max INTEGER,
  description TEXT,
  actif BOOLEAN DEFAULT TRUE
);

CREATE TABLE cartes_collection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profils(id) ON DELETE CASCADE,
  carte_id UUID REFERENCES cartes_catalogue(id),
  serie_numero INTEGER,
  obtenu_le TIMESTAMP DEFAULT NOW(),
  source TEXT NOT NULL
);
```

### semaines_gagnees — logique d'enregistrement

Déclenchée à l'ouverture de `Classement.jsx` :
1. Calcul plage semaine précédente (lundi 00h00 → dimanche 23h59)
2. Pour chaque ligue : vérifier si `semaine_iso` déjà enregistrée
3. Si non : calculer le gagnant depuis `pronos`, dédupliqué par `(user_id, match_id)`
4. Insérer — contrainte UNIQUE absorbe les conflits simultanés silencieusement

---

## 8. Ce qu'on ne fait PAS (et pourquoi)

| Fonctionnalité | Raison |
|---|---|
| **IA prédictive** | Pas de données historiques stockées + ROI faible à ce stade |
| **Fantasy league** | Produit différent, scope trop large |
| **Paris d'argent réel** | Régulation ANJ, risque légal, contre la philosophie du projet |
| **Marketplace de cartes** | Crée une économie spéculative — ce qu'on reproche à TopShot |
| **Cartes NFT / blockchain** | Complexité, coût, sans valeur ajoutée pour le fun |
| **App mobile native** | PWA suffit. Native = App Store review, coût, délai |
| **Stats avancées (PER, Win Shares)** | Non disponibles ESPN, scraping complexe |
| **Highlights vidéo** | Derrière ESPN+ auth |
| **Intégration Twitter/X** | API payante, instable |
| **Swish Data pipeline** | Mis de côté indéfiniment |
| **Comparaison Y vs Z** | H2H = toujours moi vs quelqu'un. Comparer deux autres users = cas anecdotique |
| **Cotes bookmakers dans flow prono** | Risque légal ANJ France |

---

## 9. KPIs de succès

### KPIs d'engagement (après Sprint 1-2)

| Métrique | Cible | Mesure |
|---|---|---|
| DAU / MAU ratio | > 40% | Sessions Vercel Analytics |
| Taux de retour J+1 | > 50% | `profils.derniere_connexion` |
| Prono / utilisateur actif / semaine | > 5 | Count `pronos` / 7j |
| Streak moyen actif | > 3 | Calculé depuis `pronos` |
| H2H consulté / semaine | > 2 sessions | Analytics |

### KPIs de croissance (après Sprint 3)

| Métrique | Cible | Mesure |
|---|---|---|
| Nouveaux inscrits / semaine | Croissance organique | Supabase auth |
| Ligues créées / mois | > 2 | Table `groupes` |
| Membres par ligue en moyenne | > 4 | JOIN `membres_groupe` |
| Taux d'activation (prono < 24h après inscription) | > 60% | `pronos.cree_le` vs `profils.cree_le` |

### KPIs gamification (après Sprint 4)

| Métrique | Cible | Mesure |
|---|---|---|
| % users ayant récupéré leur carte du jour | > 70% | `cartes_collection.source` / DAU |
| Cartes moyenne par user actif | > 15 après 1 mois | Count `cartes_collection` / user |
| % users niveau 3+ | > 40% après 1 mois | `profils.niveau >= 3` |
| Taux de personnalisation avatar | > 60% | `profils.avatar_maillot != 'default'` |

---

## 10. Risques à anticiper

### RISQUE-A — Supabase pause (inactivité > 7 jours)
**Sévérité :** 🔴 Haute si l'app grandit
**Mitigation :** Ping automatique 1x/semaine via cron Vercel Hobby.

### RISQUE-B — ESPN API blocage CORS ou changement de structure
**Sévérité :** 🟡 Moyenne
**Mitigation :** Proxy Supabase Edge Function en fallback.

### RISQUE-C — Dépassement quota Supabase free tier
**Sévérité :** 🟡 Moyenne — Sprint 4 (cartes_collection) peut grossir vite
**Mitigation :** Pagination stricte, no SELECT * sans LIMIT. `semaines_gagnees` reste légère (~52 lignes/an/ligue).

### RISQUE-D — MVP semaine non enregistré si personne n'ouvre Classement
**Sévérité :** 🟢 Faible à ce stade
**Mitigation :** À surveiller si audience augmente — envisager pg_cron à terme.

### RISQUE-E — Spam dans le chat
**Sévérité :** 🟡 Moyenne
**Mitigation :** Limite 500 caractères, rate limiting RLS, signalement simple.

### RISQUE-F — Légalité (confusion pronos / paris)
**Sévérité :** 🟡 Moyenne
**Mitigation :** Mention claire "jeu de pronostics gratuit, aucun argent réel". Pas de cotes bookmakers dans le flow prono.

### RISQUE-G — Charge éditoriale catalogue cartes
**Sévérité :** 🟡 Moyenne
**Mitigation :** Commencer avec 50-100 cartes. Scripter l'import depuis ESPN API pour les joueurs actifs.

### RISQUE-H — Droits images joueurs (cartes)
**Sévérité :** 🟡 Moyenne
**Mitigation :** Utiliser headshotss ESPN (déjà utilisés dans l'app). Pas de photos Getty.

---

## HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---|---|---|
| v1.0 | 2026-05-29 | Création — benchmark marché + roadmap 3 sprints |
| v1.1 | 2026-05-29 | Ajout Sprint 4 : F14 Niveaux XP, F15 Cartes, F16 Avatar, F17 Profil fan |
| v1.2 | 2026-05-30 | Sprint 1 livré. Sprint 2 en cours (H2H ✅, classement enrichi ✅, ligues planifiées ✅). Précisions classement général (Semaine/Mois/Saison, année NBA). Ajout badge nav, onboarding dans Sprint 3. Décision H2H = moi vs quelqu'un uniquement. Popup changelog refonte. |

---

*Document de référence Swish League — roadmap produit*
*Ne pas fusionner avec `socle_nba_v2_5.md` (référence technique) — documents complémentaires*
*Prochaine révision : après Sprint 2 complet livré*
