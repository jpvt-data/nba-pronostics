// Changelog NBA Pronostics — une entrée par version/feature
export const CHANGELOG = [
  {
    version: 'v0.5',
    date: '2026-05-26',
    titre: 'Ligues — nouvelle organisation',
    desc: 'Les groupes deviennent des Ligues. Tu vois toutes les ligues disponibles et tu rejoins en un clic — plus de code d\'invitation. Chaque ligue est liée à un type de compétition ESPN (Playoffs, Saison régulière...) et une saison. Les points sont calculés uniquement sur les matchs correspondants. Accès depuis le menu hamburger → Ligues.',
    lien: '/groupes',
    labelLien: 'Voir les ligues',
  },
  {
    version: 'v0.4',
    date: '2026-05-26',
    titre: 'Mode No Spoil',
    desc: 'Active le mode No Spoil pour masquer les scores des matchs terminés : scores cachés dans la bande matchs, le calendrier et les fiches match. La série playoffs et le résultat de prono sont aussi masqués. À activer/désactiver depuis le bouton "No Spoil" en haut du Board ou depuis le menu hamburger.',
    lien: '/accueil',
    labelLien: 'Voir le Board',
  },
  {
    version: 'v0.3',
    date: '2026-05-26',
    titre: 'Calendrier NBA complet',
    desc: 'Vues 1j / 3j / Semaine / Mois, navigation avant/arrière, filtre équipe et type de match. Accès depuis le hamburger et le Board.',
    lien: '/calendrier',
    labelLien: 'Voir le calendrier',
  },
  {
    version: 'v0.3',
    date: '2026-05-26',
    titre: 'Fiche match détaillée',
    desc: 'Scores par quart-temps, stats moyennes saison, leaders (Points/Passes/Rebonds), blessés, forme récente L5, prono intégré directement dans l\'affiche.',
    lien: null,
    labelLien: null,
  },
  {
    version: 'v0.3',
    date: '2026-05-26',
    titre: 'Mes stats & historique pronos',
    desc: 'Taux de réussite, total / corrects / ratés. Chaque ligne de l\'historique est cliquable vers la fiche match.',
    lien: '/mes-pronos',
    labelLien: 'Mes stats',
  },
  {
    version: 'v0.3',
    date: '2026-05-26',
    titre: 'Classement groupe',
    desc: 'Podium top 3, liste complète triée par points. Sélecteur si tu es dans plusieurs groupes.',
    lien: '/classement',
    labelLien: 'Classement',
  },
  {
    version: 'v0.3',
    date: '2026-05-26',
    titre: 'Groupes & codes d\'invitation',
    desc: 'Créer un groupe (code NBA-XXXX auto-généré), rejoindre, quitter. Badge Admin pour le créateur.',
    lien: '/groupes',
    labelLien: 'Groupes',
  },
  {
    version: 'v0.2',
    date: '2026-05-24',
    titre: 'Pronostics verrouillés automatiquement',
    desc: 'Le prono se verrouille à l\'heure du match ou dès qu\'il commence. Possibilité de changer d\'avis tant que c\'est ouvert.',
    lien: null,
    labelLien: null,
  },
  {
    version: 'v0.1',
    date: '2026-05-20',
    titre: 'Lancement — Auth & Board',
    desc: 'Inscription, connexion, session persistante. Board avec bande matchs scrollable 3 jours, classement rapide, pronos en attente, séries des potes.',
    lien: '/accueil',
    labelLien: 'Board',
  },
]

// Version courante de l'app — à incrémenter à chaque déploiement avec nouveautés
export const VERSION_COURANTE = 'v0.5'