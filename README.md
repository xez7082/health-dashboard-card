# 🏥 Health Dashboard Card pour Home Assistant

Une carte personnalisée élégante pour Home Assistant permettant de suivre et visualiser la santé de deux personnes avec des silhouettes et des cartes de capteurs personnalisables.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2023.1+-green.svg)

## ✨ Fonctionnalités

- 🎨 Interface moderne avec dégradé de couleur personnalisable
- 👥 Gestion de deux profils de santé (switchable via boutons)
- 🖼️ Silhouettes d'arrière-plan personnalisables (homme/femme)
- 📊 Cartes de capteurs avec icônes personnalisables
- 📱 Design responsive (mobile & desktop)
- ⚡ Mise à jour en temps réel des valeurs des capteurs
- 🎯 Animation fluide au survol

## 📋 Prérequis

- Home Assistant version 2023.1 ou supérieure
- Navigateur web moderne

## 🚀 Installation

### Méthode 1 : Installation manuelle

1. **Télécharger les fichiers**
   ```bash
   cd /config/www
   mkdir health-dashboard
   cd health-dashboard
   ```

2. **Copier le fichier JavaScript**
   - Téléchargez `health-dashboard-card.js`
   - Placez-le dans `/config/www/health-dashboard/`

3. **Ajouter les images**
   - Créez un dossier `/config/www/health-dashboard/`
   - Ajoutez vos images de silhouettes :
     - `male-silhouette.png` (image d'homme)
     - `female-silhouette.png` (image de femme)

4. **Enregistrer la ressource dans Home Assistant**
   - Allez dans **Configuration** > **Lovelace Dashboards** > **Resources**
   - Cliquez sur **Add Resource**
   - URL : `/local/health-dashboard/health-dashboard-card.js`
   - Type : `JavaScript Module`

### Méthode 2 : HACS (recommandé)

1. Ouvrez HACS
2. Allez dans "Frontend"
3. Cliquez sur le menu trois points en haut à droite
4. Sélectionnez "Custom repositories"
5. Ajoutez l'URL de ce dépôt
6. Installez "Health Dashboard Card"
7. Redémarrez Home Assistant

## 🎯 Configuration

### Configuration de base

Ajoutez cette configuration à votre dashboard Lovelace (en mode YAML) :

```yaml
type: custom:health-dashboard-card
person1:
  name: "Jean"
  gender: male
  background_image: male-silhouette.png
  sensors:
    - entity: sensor.jean_poids
      name: "Poids"
      icon: "⚖️"
    - entity: sensor.jean_imc
      name: "IMC"
      icon: "📊"
    - entity: sensor.jean_taille
      name: "Taille"
      icon: "📏"
    - entity: sensor.jean_frequence_cardiaque
      name: "Cœur"
      icon: "❤️"
    - entity: sensor.jean_tension_systolique
      name: "Tension"
      icon: "🩺"
    - entity: sensor.jean_temperature
      name: "Température"
      icon: "🌡️"

person2:
  name: "Marie"
  gender: female
  background_image: female-silhouette.png
  sensors:
    - entity: sensor.marie_poids
      name: "Poids"
      icon: "⚖️"
    - entity: sensor.marie_imc
      name: "IMC"
      icon: "📊"
    - entity: sensor.marie_taille
      name: "Taille"
      icon: "📏"
    - entity: sensor.marie_frequence_cardiaque
      name: "Cœur"
      icon: "❤️"
    - entity: sensor.marie_tension_systolique
      name: "Tension"
      icon: "🩺"
    - entity: sensor.marie_glycemie
      name: "Glycémie"
      icon: "🩸"
```

### Options de configuration

| Option | Type | Requis | Description |
|--------|------|--------|-------------|
| `person1.name` | string | ✅ | Prénom de la première personne |
| `person1.gender` | string | ❌ | Genre : `male` ou `female` (défaut: `male`) |
| `person1.background_image` | string | ❌ | Nom du fichier image de fond |
| `person1.sensors` | list | ✅ | Liste des capteurs à afficher |
| `person2.name` | string | ✅ | Prénom de la deuxième personne |
| `person2.gender` | string | ❌ | Genre : `male` ou `female` (défaut: `female`) |
| `person2.background_image` | string | ❌ | Nom du fichier image de fond |
| `person2.sensors` | list | ✅ | Liste des capteurs à afficher |

### Configuration des capteurs

Chaque capteur peut avoir les propriétés suivantes :

| Propriété | Type | Requis | Description |
|-----------|------|--------|-------------|
| `entity` | string | ✅ | ID de l'entité sensor dans Home Assistant |
| `name` | string | ✅ | Nom à afficher sur la carte |
| `icon` | string | ❌ | Icône emoji ou unicode |

## 📊 Exemples de capteurs

### Créer des capteurs dans configuration.yaml

```yaml
sensor:
  - platform: template
    sensors:
      jean_poids:
        friendly_name: "Poids Jean"
        unit_of_measurement: "kg"
        value_template: "75.5"
      
      jean_imc:
        friendly_name: "IMC Jean"
        unit_of_measurement: "kg/m²"
        value_template: "23.4"
      
      jean_taille:
        friendly_name: "Taille Jean"
        unit_of_measurement: "cm"
        value_template: "180"
      
      jean_frequence_cardiaque:
        friendly_name: "Fréquence cardiaque Jean"
        unit_of_measurement: "bpm"
        value_template: "72"
```

### Capteurs recommandés

- 🏋️ **Poids** : `sensor.weight`
- 📊 **IMC** : `sensor.bmi`
- 📏 **Taille** : `sensor.height`
- ❤️ **Fréquence cardiaque** : `sensor.heart_rate`
- 🩺 **Tension artérielle** : `sensor.blood_pressure`
- 🌡️ **Température** : `sensor.body_temperature`
- 🩸 **Glycémie** : `sensor.blood_glucose`
- 💧 **Hydratation** : `sensor.hydration`
- 🏃 **Pas quotidiens** : `sensor.daily_steps`
- 😴 **Qualité du sommeil** : `sensor.sleep_quality`
- 💪 **Masse musculaire** : `sensor.muscle_mass`
- 🫀 **Saturation O2** : `sensor.oxygen_saturation`

## 🎨 Personnalisation

### Icônes disponibles

Utilisez des emojis ou des caractères Unicode :
- ⚖️ Poids
- 📊 IMC
- 📏 Taille/Hauteur
- ❤️ Cœur/Fréquence cardiaque
- 🩺 Tension artérielle
- 🌡️ Température
- 🩸 Glycémie
- 💧 Hydratation
- 🏃 Activité physique
- 😴 Sommeil
- 💪 Muscle
- 🫀 Oxygène

### Images de silhouette

Pour de meilleurs résultats, utilisez des images PNG transparentes :
- Taille recommandée : 800x1200 pixels
- Format : PNG avec transparence
- Style : Silhouette ou contour simple

Exemples de sources d'images :
- [Unsplash](https://unsplash.com/) (photos libres)
- [Flaticon](https://www.flaticon.com/) (icônes et silhouettes)
- [Freepik](https://www.freepik.com/) (illustrations)

## 🐛 Dépannage

### La carte ne s'affiche pas

1. Vérifiez que le fichier JS est bien accessible via `/local/health-dashboard/health-dashboard-card.js`
2. Videz le cache de votre navigateur (Ctrl+F5)
3. Vérifiez la console du navigateur pour les erreurs (F12)

### Les valeurs ne s'affichent pas

1. Vérifiez que les entités existent dans Home Assistant
2. Vérifiez l'orthographe des entity_id
3. Assurez-vous que les capteurs ont des valeurs valides

### Les images ne s'affichent pas

1. Vérifiez le chemin des images : `/config/www/health-dashboard/`
2. Vérifiez les permissions des fichiers
3. Utilisez des noms de fichiers sans espaces ni caractères spéciaux

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- 🐛 Signaler des bugs
- 💡 Proposer de nouvelles fonctionnalités
- 🔧 Soumettre des pull requests

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- Communauté Home Assistant
- Tous les contributeurs

## 📧 Support

Pour toute question ou problème :
- Ouvrez une [issue](https://github.com/votre-username/health-dashboard-card/issues)
- Consultez le [forum Home Assistant](https://community.home-assistant.io/)

---

⭐ Si vous aimez ce projet, n'hésitez pas à lui donner une étoile sur GitHub !
