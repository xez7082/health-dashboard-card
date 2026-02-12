# 🏥 Health Dashboard Custom Card
### **Version 34.0 — "The Visual Icon & Color Release"**

Cette carte personnalisée pour Home Assistant permet de suivre les données de santé de deux utilisateurs (Homme/Femme) de manière esthétique et interactive. Elle est optimisée pour les balances connectées (Withings, etc.).

![Version](https://img.shields.io/badge/Version-34.0-blueviolet)
![User Interface](https://img.shields.io/badge/UI-Dark--Mode-black)
![Platform](https://img.shields.io/badge/Platform-Home--Assistant-blue)

---

## ✨ Fonctionnalités Principales

### 👤 Double Profil Interactif
* **Boutons Homme/Femme** : Changez de vue instantanément. Les positions des capteurs et les images de fond sont indépendantes pour chaque profil.

### ⚖️ Jauge de Corpulence Dynamique
* **Calcul d'IMC en temps réel** : La flèche se déplace automatiquement selon les entités de poids et de taille.
* **Édition Ultra-Flexible** : 
    * Ajustez la largeur et la hauteur de la jauge.
    * Positionnez le titre "CORPULENCE" indépendamment de la jauge.
    * Utilisez votre propre image de graduation (`/local/images/33.png`).

### 🎨 Intelligence Visuelle
* **Couleurs Dynamiques** : 
    * 🟢 **Vert** : S'affiche pour une perte de poids (valeur négative) sur les capteurs contenant le mot `difference`.
    * 🔴 **Rouge** : S'affiche pour une prise de poids (valeur positive) sur les mêmes capteurs.
    * **Icônes Synchronisées** : L'icône change de couleur en même temps que le texte.
* **Support Hydratation** : Ajoute automatiquement le symbole `%` aux entités contenant le mot `hydration`.
* **Icônes MDI** : Support complet des icônes Material Design configurées dans vos entités.

---

## 🛠️ Installation

1. Téléchargez le fichier `health-dashboard-card.js` (V34).
2. Placez-le dans votre dossier `/config/www/`.
3. Ajoutez l'image de votre jauge dans `/config/www/images/33.png`.
4. Dans Home Assistant, allez dans **Paramètres** > **Tableaux de bord** > **Ressources** et ajoutez :
   * **URL** : `/local/health-dashboard-card.js?v=34`
   * **Type** : `JavaScript Module`

---

## ⚙️ Configuration de l'Éditeur

L'éditeur visuel a été conçu en **Gris Foncé** pour une meilleure lisibilité.

### Sections de l'éditeur :
- **Bascule Mode Homme/Femme** : Pour configurer chaque profil séparément.
- **Paramètres Jauge** : Réglages de la taille, de la position du titre et de la flèche.
- **Gestion des Capteurs** : Ajoutez, déplacez (X/Y) ou supprimez des capteurs via une interface simplifiée.

---

## 📋 Nomenclature des Entités

Pour activer les fonctions automatiques, nommez vos entités ou leurs titres avec ces mots-clés :
* **`imc` / `corpulence`** : Active l'affichage sous forme de jauge graphique.
* **`difference`** : Active la coloration automatique Vert/Rouge.
* **`hydration`** : Force l'affichage de l'unité `%`.

---

## 📝 Historique des Versions (Changelog)
- **v34** : Restauration des icônes MDI et synchronisation de leur couleur avec le texte.
- **v33** : Forçage de l'unité `%` pour l'hydratation et stabilité de l'éditeur.
- **v32** : Introduction de la logique de couleur dynamique (Rouge/Vert).
- **v31** : Nouvel éditeur sombre (Dark Mode) et boutons de navigation.

---
*Développé pour une intégration parfaite avec le protocole Withings et les balances intelligentes.*
