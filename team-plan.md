# Plan Stratégique d'Équipe - Projet ZenFlow PWA

**Directeur de l'Ingénierie & Produit (@chef)** :
Notre ambition est claire : délivrer la meilleure application To-Do List du marché en termes de réduction de la charge mentale. L'excellence technique "World Class" est notre seul standard.

*Note aux agents : Consultez obligatoirement `GLOBAL_RETROSPECTIVE.md` avant toute intervention.*

## Vision Technologique
- **Socle** : Next.js 14 App Router (React Server Components).
- **Esthétique** : Strict respect de la maquette AI Studio (dominante Magenta `#f425f4`, fond `#f8f5f8`, bordures subtiles).
- **Offline-First** : PWA via Serwist v9+ (synchronisation optimiste obligatoire).
- **Intelligence** : UX "Zero-Friction" (formulaires instantanés, catégorisation auto).

---

## 👨‍🎨 Mission @frontend (Design Expert)
**Objectif** : Implémenter les vues manquantes avec une fluidité absolue.
- [x] **Vue "New Task" (`/new-task`)** : Créer un formulaire d'ajout rapide ultra-fluide. Auto-focus sur l'input, support clavier (Enter pour valider).
- [x] **Vues "Projects" & "Calendar"** : Développer les grilles et listes correspondantes en respectant minutieusement le code couleur et les ombres (shadow-xl shadow-[#f425f4]/40).
- [x] **Micro-interactions** : Intégrer Framer Motion pour les transitions de page et les validations de tâches.

## ⚙️ Mission @backend (Architecture Expert)
**Objectif** : Rendre l'application fonctionnelle, robuste et résiliente aux coupures réseau.
- [x] **Base de données locales** : Configurer IndexedDB (via `idb`) pour le stockage complet des tâches hors-ligne.
- [x] **Data Fetching** : Câbler la vue principale (`/`) pour lire les tâches depuis le store local au lieu des données mockées.
- [x] **Server Actions (Préparation)** : Préparer la logique de synchronisation optimiste pour le jour où nous brancherons Supabase/Prisma.

## 🛡️ Mission @qa (Quality Assurance Expert)
**Objectif** : S'assurer que chaque livraison est indestructible.
- [ ] **Audit PWA** : Vérifier que Lighthouse donne un score de 100% sur le manifest et le service worker.
- [ ] **Tests d'intégration** : Valider que le BottomNav redirige sans erreur 404.
- [ ] **Offline Test** : Simuler une coupure réseau dans les tests (Playwright) et vérifier que l'ajout / lecture de tâches fonctionne toujours.

---
**Règle d'or** : Chaque agent doit documenter ses choix complexes dans le code. Aucun raccourci toléré.
