<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — ouvrez, consultez et annotez des jeux d'images COCO, YOLO, VOC et ImageFolder directement depuis un dossier">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Licence : Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="Dernière version"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Image Docker"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">Démo en ligne</a></b> ·
  <b><a href="../../releases">Télécharger pour le bureau</a></b> ·
  <b><a href="#3-lancez-le-avec-docker">Lancer avec Docker</a></b> ·
  <b><a href="./DEPLOY.md">Auto-héberger</a></b>
</p>

<p align="center">
  <a href="README_zh.md">简体中文</a> ·
  <a href="README_zh_TW.md">繁體中文</a> ·
  <a href="README.md">English</a> ·
  <a href="README_ja.md">日本語</a> ·
  <a href="README_ko.md">한국어</a> ·
  <a href="README_es.md">Español</a> ·
  <a href="README_fr.md">Français</a> ·
  <a href="README_de.md">Deutsch</a> ·
  <a href="README_ru.md">Русский</a> ·
  <a href="README_ar.md">العربية</a>
</p>

---

<p align="center">
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll affichant un jeu Pascal VOC : la liste des images, la barre d'annotation avec les contrôles de classe et de calque, et deux boîtes dessinées sur l'image courante.">
</p>

LabelAll est un outil **gratuit et open source** pour ouvrir, parcourir, annoter et exporter des jeux d'images courants. Pas d'étape de conversion de format ni de fichier de projet à configurer : choisissez un dossier, il lit ce qui s'y trouve déjà.

Il s'adresse aux ingénieurs en vision par ordinateur, aux équipes d'annotation et de contrôle qualité, aux étudiants et chercheurs, et à toute personne qui doit consulter ou corriger rapidement un lot d'étiquettes.

## Ce qu'il fait

**Ouvrir, c'est tout**

- Choisissez un dossier : le format du jeu de données est détecté automatiquement.
- Lecture tolérante : les fichiers corrompus, manquants ou hors norme sont ignorés et récapitulés dans une boîte de dialogue ; un seul fichier défectueux ne bloque jamais tout le jeu.
- Une liste de vignettes fluide même avec des dizaines de milliers d'images.
- Filtrez par sous-ensemble (train / val / test) ou par classe, cherchez par nom ; double-cliquez sur une vignette pour l'ouvrir dans la visionneuse.

**Voir clairement**

- Zoom et déplacement libres, ajustement à la fenêtre ou vue 1:1.
- Boîtes, polygones, points clés et étiquettes de classification superposés proprement, avec le nom dans une pastille de la couleur de la classe.
- Activez ou masquez chaque calque ; parcourez les images avec les flèches ou le bandeau inférieur.

**Annoter et modifier**

- Dessinez des boîtes, des polygones et des points clés, ou ajoutez une étiquette de classe pour toute l'image.
- Glissez pour déplacer, redimensionnez avec huit poignées, dupliquez, supprimez, ajustez au pixel près, et utilisez le menu contextuel pour les actions rapides.
- Ajoutez, renommez, recolorez ou supprimez des classes à tout moment ; annulez et rétablissez librement.

**Exporter et interopérer**

- Exportez vers COCO, YOLO, Pascal VOC ou des dossiers de classification en une étape.
- Avant l'export, LabelAll **indique exactement ce que le format cible ne peut pas conserver** et écrit dans un dossier séparé : vos fichiers d'origine ne sont jamais modifiés.

**Agréable à utiliser**

- Thèmes clair et sombre, couleur d'accent et palette personnalisables.
- Dix langues d'interface (dont l'arabe, de droite à gauche) ; l'application de bureau se met à jour toute seule et la version web offre la même expérience.

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="À gauche : LabelAll détectant un jeu Pascal VOC avec 100 % de confiance. À droite : la même image annotée dans le thème sombre.">
</p>

## Jeux de données pris en charge

| Format | Ouvrir | Exporter | Remarques |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Segmentation polygone et RLE, points clés |
| **YOLO** | ✅ | ✅ | Tâches détection, segmentation et pose |
| **Pascal VOC** | ✅ | ✅ | Boîtes en base 1 ; XML à côté de l'image ou dans `Annotations/` |
| **Classification / ImageNet** | ✅ | Partiel | Le nom du dossier est la classe |
| **labelme** | ✅ | — | Interopérabilité avec labelme |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 et d'autres jeux publics s'ouvrent dans leur format d'origine.

## Comment l'utiliser

Il existe trois façons d'utiliser LabelAll. Toutes s'exécutent entièrement sur votre machine : l'application **n'a pas de backend**, donc les images et annotations que vous ouvrez ne sont jamais envoyées nulle part.

### 1. Essayez-le dans le navigateur

Ouvrez **<https://labelall.superagentparty.com/>** et choisissez un dossier de jeu de données. Rien à installer.

> La version web a besoin de l'API File System Access du navigateur : elle doit donc être servie en **HTTPS** (ou sur `localhost`). **Chrome / Edge** peut lire et écrire ; **Firefox / Safari** ouvrent les jeux en lecture seule.

### 2. Installez l'application de bureau

Récupérez l'installeur pour votre système sur la page [Releases](../../releases) : **macOS, Windows et Linux**. C'est la façon recommandée d'annoter, car il peut toujours réécrire sur le disque.

> **Premier lancement sur macOS** : la version n'est pas notariée. Si macOS affiche « endommagée » ou ne peut pas vérifier le développeur, exécutez `xattr -cr /Applications/LabelAll.app` dans le Terminal, puis ouvrez l'application — ou faites un clic droit et choisissez « Ouvrir ».

### 3. Lancez-le avec Docker

La version web est un simple bundle statique : l'image n'est donc que `nginx` plus l'application compilée. L'image publiée est multi-architecture (`linux/amd64` et `linux/arm64`) :

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

Ouvrez ensuite <http://localhost:8080>.

Ou construisez-la vous-même depuis un checkout :

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# ou
docker compose up -d --build
```

> Les tags sont construits et poussés vers Docker Hub automatiquement lorsque vous poussez un tag de version (`git tag v0.1.3 && git push origin v0.1.3`), produisant des tags sémantiques plus `latest`. Voir [DEPLOY.md](./DEPLOY.md) pour la configuration de Docker Hub et d'autres options d'hébergement (Cloudflare Pages, Netlify, Vercel, …).

## Démarrage rapide

1. Ouvrez LabelAll, cliquez sur « Ouvrir un jeu de données » et choisissez le dossier.
2. Confirmez le format détecté et commencez à parcourir.
3. Ajoutez ou modifiez des annotations, puis exportez au format souhaité.

> Envie d'essayer ? [`examples/voc-mini`](./examples/voc-mini) est un petit jeu Pascal VOC de trois images : ouvrez-le directement.

## Raccourcis clavier

| Action | Raccourci |
| --- | --- |
| Image précédente / suivante | `←` / `→` |
| Changer de classe active | `↑` / `↓` |
| Sélectionner/déplacer · Boîte · Polygone · Points clés | `V` · `B` · `N` · `M` |
| Déplacer l'annotation sélectionnée | `W A S D` (`Shift` pour 10px) |
| Supprimer / dupliquer | `Delete` / `Ctrl`·`Cmd` + `D` |
| Annuler / rétablir | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Zoom avant / arrière / ajuster | `+` / `-` / `0` |
| Déplacer le canevas | Glissez le fond, ou `Espace` + glisser |

## Limitations connues

- Conçu pour des jeux allant jusqu'à ~50 000 images et des fichiers d'annotation de moins de 100 Mo ; au-delà, la fluidité n'est pas garantie.
- La version web est en lecture/écriture sur Chrome / Edge et en lecture seule sur Firefox / Safari.
- L'export n'écrit que les fichiers d'annotation ; les images ne sont pas copiées.

## Contribution et licence

Les issues et pull requests sont bienvenus : voir [CONTRIBUTING.md](./CONTRIBUTING.md), et [RELEASING.md](./RELEASING.md) pour publier une version. [Apache-2.0](./LICENSE) © 2026 heshengtao.
