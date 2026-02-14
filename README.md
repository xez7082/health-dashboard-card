# 🥗 Health Dashboard Card (V66)

# Health Dashboard Card

[![HACS](https://img.shields.io/badge/HACS-Default-blue.svg?style=for-the-badge)](https://github.com/hacs/integration)
![Version](https://img.shields.io/github/v/release/xez7082/health-dashboard-card?include_prereleases&style=for-the-badge)
[![License](https://img.shields.io/github/license/xez7082/health-dashboard-card?style=for-the-badge)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/xez7082/health-dashboard-card/graphs/commit-activity)
[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-orange.svg?style=for-the-badge&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/xez7082)

---

Une carte Home Assistant personnalisée, élégante et interactive pour le suivi de la santé et des objectifs de poids, inspirée du design "Apple Health".

---

## 📸 Aperçu

<p align="center">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid.png" width="45%" alt="Dashboard Vue Patrick">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid1.png" width="45%" alt="Dashboard Vue Sandra">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid2.png" width="45%" alt="Éditeur de configuration">
  <img src="https://raw.githubusercontent.com/xez7082/health-dashboard-card/main/poid3.png" width="45%" alt="Gestion des capteurs">
</p>

---

## 📖 Contexte & Concept

Le suivi de santé dans Home Assistant manque souvent d'esthétique. Cette carte transforme vos données biométriques froides en une interface visuelle motivante.

### Points forts :
* **Visualisation de Progression** : Une règle dynamique place votre poids actuel entre votre point de départ et votre objectif idéal.
* **Delta Intelligent** : Affiche la différence de poids en temps réel (Vert pour une perte, Rouge pour une prise).
* **Entièrement Personnalisable** : Gérez les positions X/Y de vos capteurs et les dimensions des bulles directement depuis l'interface.

---

## 🛠️ Configuration des Capteurs (Requis)

Pour un fonctionnement optimal du "Delta" de poids, vous devez créer des capteurs Template dans votre fichier `configuration.yaml` :

```yaml
template:
  - sensor:
      - name: "Difference Poids Patrick"
        unique_id: health_card_diff_patrick
        unit_of_measurement: "kg"
        device_class: weight
        state_class: measurement
        state: >
          {% set actuel = states('sensor.withings_poids_patrick') | float(none) %}
          {% set depart = 85.0 %} 
          {{ (actuel - depart) | round(1) if actuel is not none else 'unavailable' }}

      - name: "Difference Poids Sandra"
        unique_id: health_card_diff_sandra
        unit_of_measurement: "kg"
        device_class: weight
        state_class: measurement
        state: >
          {% set actuel = states('sensor.withings_poids_sandra') | float(none) %}
          {% set depart = 65.0 %}
          {{ (actuel - depart) | round(1) if actuel is not none else 'unavailable' }}
