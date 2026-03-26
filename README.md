# 📊 Health Dashboard Card (V4.9.1)

[![HACS](https://img.shields.io/badge/HACS-Default-blue.svg)](https://github.com/hacs/integration)
![Version](https://img.shields.io/github/v/release/xez7082/health-dashboard-card?include_prereleases)
[![License](https://img.shields.io/github/license/xez7082/health-dashboard-card)](LICENSE)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/xez7082/health-dashboard-card/graphs/commit-activity)

Une carte personnalisée et optimisée pour **Home Assistant** dédiée au suivi complet de la santé, de la composition corporelle et du sommeil. Cette version **V4.9.1** apporte une précision accrue (2 décimales) et une gestion fluide des catégories.

---

## 📸 Aperçu du Dashboard

Visualisez vos données avec un design moderne et épuré.

| Vue Globale | Composition Corporelle | Analyse Santé |
| :---: | :---: | :---: |
| ![Vue Globale](https://github.com/xez7082/health-dashboard-card/blob/main/health.png?raw=true) | ![Détails Forme](https://github.com/xez7082/health-dashboard-card/blob/main/health1.png?raw=true) | ![Analyse Santé](https://github.com/xez7082/health-dashboard-card/blob/main/health2.png?raw=true) |

---

## 🛠️ Configuration des Indicateurs

Guide des icônes **MDI** et des couleurs recommandées par catégorie.

### 🏃 Catégorie : `forme`
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

### 🩺 Catégorie : `sante`
| Indicateur | Icône MDI | Unité | Couleur |
| :--- | :--- | :--- | :--- |
| **Masse Osseuse** | `mdi:bone` | `kg` | `#e2e8f0` |
| **Hydratation** | `mdi:water` | `%` | `#06b6d4` |
| **Graisse Viscérale** | `mdi:target` | `idx` | `#be123c` |

### 😴 Catégorie : `sommeil`
| Indicateur | Icône MDI | Unité | Couleur |
| :--- | :--- | :--- | :--- |
| **Score Sommeil** | `mdi:star-face` | `/100` | `#818cf8` |
| **Sommeil Profond** | `mdi:weather-night` | `h` | `#6366f1` |
| **Sommeil Léger** | `mdi:weather-partly-cloudy` | `h` | `#a5b4fc` |

---

## 🚀 Caractéristiques Techniques

* **Précision Chirurgicale** : Utilise la fonction locale `toLocaleString` pour forcer l'affichage à **2 décimales** (ex: `22,45`), idéal pour le suivi médical.
* **Design Dynamique** : Paramétrage précis via `x`, `y` (position) et `w`, `h` (taille) pour chaque bloc d'entité.
* **Intelligence des Données** : Supporte nativement les capteurs numériques et les capteurs de texte (ex: "Normal", "Athlétique").
* **Groupement Automatique** : Les entités sont injectées dans les conteneurs HTML correspondants à leur `category`.

---

## 🎨 Personnalisation du Style (CSS)

La carte utilise des variables CSS standard de Home Assistant. Vous pouvez surcharger le style via `card_mod`.

| Variable | Description | Valeur par défaut |
| :--- | :--- | :--- |
| `--card-background-color` | Fond de la carte | `var(--ha-card-background)` |
| `--primary-text-color` | Couleur des titres | `var(--primary-text-color)` |
| `--accent-color` | Bordures et accents | `#38bdf8` |

**Exemple card_mod :**
```yaml
card_mod:
  style: |
    ha-card {
      border-radius: 20px;
      box-shadow: 0px 4px 15px rgba(0,0,0,0.3);
    }
    .entity-box:hover {
      transform: scale(1.05);
      transition: 0.2s;
    }
