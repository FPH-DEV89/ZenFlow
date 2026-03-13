# Règles de Développement ZenFlow 🛡️

Ce document est impératif pour tout agent intervenant sur ce projet. Il doit être lu au début de chaque session.

## 🚫 Restrictions d'Outils
- **Agent Browser** : INTERDICTION FORMELLE d'utiliser `browser_subagent` sans l'accord explicite de l'utilisateur (consomme trop de tokens).

## 🛠️ Méthodologie d'Édition (Anti-Régression)
- **Éditions Chirurgicales** : Ne jamais utiliser `replace_file_content` sur des blocs de plus de 10-15 lignes si seulement une petite partie change. Favoriser `multi_replace_file_content` avec des correspondances exactes.
- **Vérification Post-Édition** : 
    - Relire systématiquement les objets modifiés pour détecter les clés en double.
    - Vérifier qu'aucune balise JSX n'est restée vide suite à un remplacement (perte de labels).
    - Lancer un `npm run build` (ou simuler une vérification de type) si des interfaces TypeScript sont modifiées.

## 🌍 Standards Techniques ZenFlow
- **Timezones** : Le serveur utilise l'heure UTC. Les notifications doivent être calculées avec un offset (ex: France = UTC+1).
- **Style** : Tailwind CSS pur. Éviter les classes ad-hoc si des utilitaires standard existent.
- **Base de Données** : Utiliser les Vues SQL pour les statistiques complexes afin d'alléger les composants React.

## 📋 Checklist Avant Push
1. [ ] Aucun lint error (clés doublées, variables inutilisées).
2. [ ] Labels UI vérifiés (visuels préservés dans le code).
3. [ ] Rétrospective mise à jour dans `GLOBAL_RETROSPECTIVE.md`.
