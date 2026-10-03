<div align="center">

# LabelAll

**Charger, consulter et annoter des jeux d'images courants**

Ouvrir et annoter un jeu d'images devrait être aussi simple que choisir un dossier.

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square)](../../releases)

</div>

<p align="center">
  <a href="README_zh.md"><b>简体中文</b></a> ·
  <a href="README_zh_TW.md"><b>繁體中文</b></a> ·
  <a href="README.md"><b>English</b></a> ·
  <a href="README_ja.md"><b>日本語</b></a> ·
  <a href="README_ko.md"><b>한국어</b></a> ·
  <a href="README_es.md"><b>Español</b></a> ·
  <a href="README_fr.md"><b>Français</b></a> ·
  <a href="README_de.md"><b>Deutsch</b></a> ·
  <a href="README_ru.md"><b>Русский</b></a> ·
  <a href="README_ar.md"><b>العربية</b></a>
</p>

---

## Qu'est-ce que LabelAll

LabelAll est un outil **gratuit et open source** pour ouvrir, parcourir, annoter et exporter des
jeux d'images courants.

Pas de code, pas de conversion de format au préalable, pas de chasse aux fichiers d'annotation :
choisissez un dossier, il s'occupe du reste. Il s'adresse aux ingénieurs en vision par ordinateur,
aux équipes d'annotation et de contrôle qualité, aux étudiants et chercheurs, et à toute personne
qui doit consulter ou modifier rapidement un lot d'étiquettes.

## Ce qu'il fait

**Ouvrir, c'est tout**

- Choisissez un dossier : le format est détecté automatiquement, sans configuration.
- Lecture tolérante : les fichiers corrompus, manquants ou hors norme sont ignorés et récapitulés
  dans une boîte de dialogue ; un seul fichier défectueux ne bloque jamais tout le jeu.
- Une liste de vignettes fluide même avec des dizaines de milliers d'images.
- Filtrez par sous-ensemble (train / val / test) ou par classe, cherchez par nom ; double-cliquez sur
  une vignette pour l'ouvrir dans la visionneuse.

**Voir clairement**

- Zoom et déplacement libres, ajustement à la fenêtre ou vue 1:1.
- Boîtes, polygones, points clés et étiquettes de classification superposés proprement, avec le nom
  dans une pastille de la couleur de la classe.
- Activez ou masquez chaque calque ; parcourez les images avec les flèches ou le bandeau inférieur.

**Annoter et modifier**

- Dessinez des boîtes, des polygones et des points clés, ou ajoutez une étiquette de classe pour
  toute l'image.
- Glissez pour déplacer, redimensionnez avec huit poignées, dupliquez, supprimez, ajustez au pixel
  près, et utilisez le menu contextuel pour les actions rapides.
- Ajoutez, renommez, recolorez ou supprimez des classes à tout moment ; annulez et rétablissez
  librement.

**Exporter et interopérer**

- Exportez vers COCO, YOLO, Pascal VOC ou des dossiers de classification en une étape.
- Avant l'export, LabelAll **indique exactement ce que le format cible ne peut pas conserver** et
  écrit dans un dossier séparé : vos fichiers d'origine ne sont jamais modifiés.

**Agréable à utiliser**

- Thèmes clair et sombre, couleur d'accent et palette personnalisables.
- Dix langues d'interface (dont l'arabe, de droite à gauche) ; l'application de bureau se met à jour
  toute seule et la version web offre la même expérience.

## Jeux de données pris en charge

| Format | Ouvrir | Exporter | Remarques |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Segmentation polygone et RLE, points clés |
| **YOLO** | ✅ | ✅ | Tâches détection, segmentation et pose |
| **Pascal VOC** | ✅ | ✅ | Boîtes en base 1 ; XML à côté de l'image ou dans `Annotations/` |
| **Classification / ImageNet** | ✅ | Partiel | Le nom du dossier est la classe |
| **labelme** | ✅ | — | Interopérabilité avec labelme |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 et d'autres jeux publics s'ouvrent dans leur
> format d'origine.

## Démarrage rapide

1. Ouvrez LabelAll, cliquez sur « Ouvrir un jeu de données » et choisissez le dossier.
2. Confirmez le format détecté et commencez à parcourir.
3. Ajoutez ou modifiez des annotations, puis exportez au format souhaité.

| Action | Raccourci |
| --- | --- |
| Image précédente / suivante | `←` / `→` |
| Sélectionner/déplacer · Boîte · Polygone · Points clés | `V` · `B` · `P` · `K` |
| Déplacer l'annotation sélectionnée | `Flèches` (`Shift` pour 10px) |
| Supprimer / dupliquer | `Delete` / `Ctrl`·`Cmd` + `D` |
| Annuler / rétablir | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Zoom avant / arrière / ajuster | `+` / `-` / `0` |
| Déplacer le canevas | Glissez le fond, ou `Espace` + glisser |

> Envie d'essayer ? [`examples/voc-mini`](./examples/voc-mini) est un petit jeu Pascal VOC de trois
> images : ouvrez-le directement.

## Téléchargement

Récupérez l'installeur pour votre système dans les [Releases](../../releases) (macOS / Windows /
Linux), ou lancez la version web avec `docker compose up -d --build` (voir [DEPLOY.md](./DEPLOY.md)).

> **Premier lancement sur macOS** : la version n'est pas notariée. Si macOS affiche « endommagée » ou
> ne peut pas vérifier le développeur, exécutez `xattr -cr /Applications/LabelAll.app` dans le
> Terminal, puis ouvrez l'application — ou faites un clic droit et choisissez « Ouvrir ».

## Limitations connues

- Conçu pour des jeux allant jusqu'à ~50 000 images et des fichiers d'annotation de moins de 100 Mo ;
  au-delà, la fluidité n'est pas garantie.
- La version web est en lecture/écriture sur Chrome / Edge et en lecture seule sur Firefox / Safari.
- L'export n'écrit que les fichiers d'annotation ; les images ne sont pas copiées.

## Contribution et licence

Les issues et pull requests sont bienvenus : voir [CONTRIBUTING.md](./CONTRIBUTING.md), et
[RELEASING.md](./RELEASING.md) pour publier une version. [Apache-2.0](./LICENSE) © 2026 heshengtao.
