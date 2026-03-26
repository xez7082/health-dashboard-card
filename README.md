# 📊 Health Dashboard Card (V4.9.1)

[![HACS](https://img.shields.io/badge/HACS-Default-blue.svg)](https://github.com/hacs/integration)
![Version](https://img.shields.io/github/v/release/xez7082/spa-card?include_prereleases)
[![License](https://img.shields.io/github/license/xez7082/spa-card)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/xez7082/spa-card/graphs/commit-activity)


Une carte personnalisée et optimisée pour **Home Assistant** dédiée au suivi complet de la santé, de la composition corporelle et du sommeil. Cette version V4.9.1 apporte une précision accrue (2 décimales) et une gestion fluide des catégories.

---

## 📸 Aperçu du Dashboard

Visualisez vos données avec un design moderne et épuré.

| Vue Globale | Composition Corporelle | Analyse Santé |
| :---: | :---: | :---: |
| ![Vue Globale](https://github.com/xez7082/health-dashboard-card/blob/main/health.png?raw=true) | ![Détails Forme](https://github.com/xez7082/health-dashboard-card/blob/main/health1.png?raw=true) | ![Analyse Santé](https://github.com/xez7082/health-dashboard-card/blob/main/health2.png?raw=true) |

---

## 🛠️ Configuration des Indicateurs

Voici le guide des icônes **MDI** et des couleurs recommandées pour chaque catégorie.

### 🏃 Catégorie : FORME
| Indicateur | Icône MDI | Unité | Couleur |
| :--- | :--- | :--- | :--- |
| **Poids** | `mdi:scale-bathroom` | `kg` | `#f1f5f9` |
| **IMC** | `mdi:human-male-height-variant` | `idx` | `#38bdf8` |
| **Calories Actives** | `mdi:fire` | `kcal` | `#f59e0b` |
| **Masse Musculaire** | `mdi:arm-flex` | `kg` | `#22c55e` |
| **Masse Maigre** | `mdi:dumbbell` | `kg` | `#10b981` |
| **Taux de Graisse** | `mdi:chart-pie` | `%` | `#fbbf24` |
| **Perte de Poids** | `mdi:trending-down` | `kg` | `#22c55e` |
| **Corpulence** | `mdi:human-male-height` | `-` | `#f1f5f9` |

### 🩺 Catégorie : SANTÉ
| Indicateur | Icône MDI | Unité | Couleur |
| :--- | :--- | :--- | :--- |
| **Masse Osseuse** | `mdi:bone` | `kg` | `#e2e8f0` |
| **Hydratation** | `mdi:water` | `%` | `#06b6d4` |
| **Graisse Viscérale** | `mdi:target` | `idx` | `#be123c` |

### 😴 Catégorie : SOMMEIL
| Indicateur | Icône MDI | Unité | Couleur |
| :--- | :--- | :--- | :--- |
| **Score Sommeil** | `mdi:star-face` | `/100` | `#818cf8` |
| **Sommeil Profond** | `mdi:weather-night` | `h` | `#6366f1` |
| **Sommeil Léger** | `mdi:weather-partly-cloudy` | `h` | `#a5b4fc` |

---

## 🚀 Caractéristiques de la V4.9.1

* **Précision Chirurgicale** : Affichage forcé à **2 chiffres après la virgule** (ex: `22,45`) pour un suivi médical précis.
* **Design Adaptatif** : Utilisation des paramètres `X`, `W` (Largeur) et `H` (Hauteur) pour créer une grille personnalisée.
* **Gestion des Catégories** : Tri automatique des capteurs dans les sections `forme`, `sante` et `sommeil`.
* **Support Chaîne de Caractères** : Affiche aussi bien des chiffres que du texte (ex: Corpulence "Normale").

## 📦 Installation

1.  Ajoutez le fichier `health-dashboard-card.js` à votre dossier `www/community/`.
2.  Ajoutez la ressource dans votre configuration Home Assistant.
3.  Utilisez l'éditeur visuel pour ajouter vos entités et définir leurs catégories respectives.

---

## 📜 Licence
Ce projet est sous licence **MIT**. Toute contribution est la bienvenue !
