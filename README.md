# 🥗 Health Dashboard Card (V65)

Une carte Home Assistant personnalisée et élégante pour suivre votre santé et vos objectifs de poids avec un style "Apple Health" sombre et moderne.

---

## 📸 Aperçu du Design

Voici un aperçu de l'interface et de l'éditeur de configuration :

<p align="center">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid.png" width="45%" alt="Dashboard Vue 1">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid1.png" width="45%" alt="Dashboard Vue 2">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid2.png" width="45%" alt="Éditeur Vue 1">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid3.png" width="45%" alt="Éditeur Vue 2">
</p>

---

## ✨ Fonctionnalités

- 👥 **Multi-Utilisateurs** : Basculez facilement entre deux profils (ex: Patrick et Sandra).
- 📏 **Règle de Progression** : Visualisez votre poids actuel entre votre point de départ, votre poids de confort et votre objectif idéal.
- 🎨 **Indicateur Dynamique** : Affiche la différence de poids (Delta) en **vert** (perte) ou **rouge** (prise) via vos capteurs dédiés.
- ⚙️ **Éditeur Intégré** : Interface de configuration visuelle complète pour ajuster les noms, images, objectifs, tailles et capteurs.
- 🫧 **Bulles de Capteurs** : Placez vos données (IMC, Masse grasse, etc.) où vous voulez sur l'image avec des coordonnées X/Y.

---

## 🛠 Installation

1. Copiez le code du fichier `health-dashboard-card.js` dans votre dossier `www/community/`.
2. Ajoutez la ressource dans Home Assistant :
   - **Paramètres** > **Tableaux de bord** > **Ressources**
   - Ajoutez `/local/health-dashboard-card.js` (Type: JavaScript Module).

---

## 📝 Configuration (Exemple)

```yaml
type: custom:health-dashboard-card
card_height: 600
b_width: 160
imc_width: 160
imc_height: 70
person1:
  name: Patrick
  image: /local/img/patrick.jpg
  start: 85
  goal: 75
  ideal: 70
  sensors:
    - name: Corpulence
      entity: sensor.bmi_patrick
      icon: mdi:human-male-height-variant
      x: 30
      y: 40
person2:
  name: Sandra
  image: /local/img/sandra.jpg
  start: 65
  goal: 58
  ideal: 55
  sensors:
    - name: IMC
      entity: sensor.bmi_sandra
      icon: mdi:scale-bathroom
      x: 70
      y: 45
