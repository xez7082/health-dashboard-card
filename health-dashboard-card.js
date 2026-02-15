# 🥗 Health Dashboard Card (V67)

[![HACS](https://img.shields.io/badge/HACS-Default-blue.svg?style=for-the-badge)](https://github.com/hacs/integration)
![Version](https://img.shields.io/github/v/release/xez7082/health-dashboard-card?include_prereleases&style=for-the-badge)
[![License](https://img.shields.io/github/license/xez7082/health-dashboard-card?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/xez7082/health-dashboard-card/graphs/commit-activity)

Une carte Home Assistant ultra-personnalisable pour le suivi de santé, alliant design moderne et fonctionnalités avancées de visualisation de données.

---

## 🌟 Nouveautés de la Version 67

Cette mise à jour majeure transforme votre tableau de bord en une véritable application de fitness :

* **📊 Mini-Graphiques (Sparklines)** : Chaque bulle de donnée intègre désormais un tracé de tendance en arrière-plan pour visualiser l'évolution d'un coup d'œil.
* **🎨 Thèmes Dynamiques** : Définissez une **couleur d'accentuation unique** par profil (ex: Bleu pour Patrick, Rose pour Sandra). L'interface s'adapte instantanément.
* **📉 Indicateurs de Tendance** : Des flèches dynamiques indiquent si vos mesures (poids, masse grasse, etc.) montent ou descendent.
* **💧 Gestion de l'Hydratation** : Forçage intelligent de l'unité `%` pour les capteurs d'hydratation.
* **✨ Transitions Fluides** : Effets de fondu et animations lors du basculement entre les profils.

---

## 📸 Aperçu

<p align="center">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid.png" width="45%" alt="Vue Patrick">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid1.png" width="45%" alt="Vue Sandra">
</p>

---

## ⚙️ Configuration Avancée

### Capteurs Template (Requis pour le Delta)
Pour afficher le gain ou la perte de poids sous le curseur, ajoutez ceci à votre `configuration.yaml` :

```yaml
template:
  - sensor:
      - name: "Difference Poids Patrick"
        unit_of_measurement: "kg"
        state_class: measurement
        state: >
          {% set actuel = states('sensor.withings_poids_patrick') | float(none) %}
          {% set depart = 85.0 %}
          {{ (actuel - depart) | round(1) if actuel is not none else 'unavailable' }}
