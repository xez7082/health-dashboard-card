# Health Dashboard Card 📊

Une carte Home Assistant (Lovelace) hautement personnalisable pour le suivi de la santé de deux personnes. Conçue pour offrir une visualisation moderne et intuitive de vos données biométriques (poids, pas, IMC, etc.).



## ✨ Caractéristiques

- **Double Profil** : Basculez entre deux profils (ex: Patrick & Sandra) via des boutons dédiés.
- **Suivi de Poids Interactif** : Une barre de progression visuelle entre le poids de départ et le poids idéal, incluant le calcul automatique du delta.
- **Jauge de Pas** : Un anneau de progression circulaire basé sur votre objectif quotidien.
- **Blocs Santé Flexibles** : Affichage de l'IMC et de la Corpulence avec personnalisation complète des icônes et du texte.
- **Capteurs Additionnels** : Ajoutez autant de capteurs que vous le souhaitez (Sommeil, Tension, Température, etc.).
- **Éditeur Visuel (GUI)** : Plus besoin de coder en YAML. Configurez positions, tailles et entités directement dans l'interface.

---

## 🚀 Installation

1. **Fichier** : Téléchargez `health-dashboard-card.js` et placez-le dans votre dossier `/config/www/`.
2. **Ressource** : Dans Home Assistant, allez dans *Paramètres* > *Tableaux de bord* > *Ressources* et ajoutez :
   - **URL** : `/local/health-dashboard-card.js`
   - **Type** : `Module JavaScript`
3. **Carte** : Ajoutez une nouvelle carte `Custom: Health Dashboard Card` à votre tableau de bord.

---

## ⚙️ Configuration de l'Éditeur

L'éditeur est divisé en quatre sections pour une gestion simplifiée :

### 1. Profil 👤
- **Nom** : Identité affichée sur le bouton.
- **Image** : URL de l'image de fond pour le profil.
- **Objectifs** : Réglage du poids de départ, de l'objectif et du poids idéal.
- **Pas** : Définition de l'objectif quotidien de pas.

### 2. Santé 🏥
- **IMC & Corpulence** : Choix des entités, personnalisation des noms, des icônes, des tailles de police et positionnement précis sur la carte (X/Y).

### 3. Capteurs ➕
- **Gestion libre** : Ajoutez des capteurs supplémentaires.
- **Icônes** : Chaque capteur peut avoir sa propre icône MDI.
- **Positionnement** : Déplacement libre de chaque bloc via les coordonnées en pourcentage (%).
- **Suppression** : Bouton direct pour retirer les capteurs inutiles.

### 4. Design 🎨
- **Dimensions globales** : Hauteur de la carte et taille par défaut des blocs.
- **Positions** : Ajustement de l'emplacement des boutons de profil et de l'offset de l'image de fond.

---

## 🛠️ Entités Requises

Pour une intégration automatique (ex: Withings), la carte utilise les suffixes de profil :

- **Poids** : `sensor.withings_poids_patrick` / `_sandra`
- **Différence** : `sensor.difference_poids_patrick` / `_sandra`
- **Pas** : `sensor.withings_pas_patrick` / `_sandra`

---

## 🔄 Historique des Versions

- **v2.1.4** : Gestion des icônes pour les capteurs additionnels.
- **v2.1.3** : Personnalisation des textes et icônes IMC/Corpulence.
- **v2.1.2** : Intégration des réglages de design globaux (X/Y boutons, polices).
- **v2.1.1** : Correction du bug de suppression des capteurs dans l'éditeur.

---

*Développé pour Home Assistant - 2026*
