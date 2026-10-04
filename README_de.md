<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — Bilddatensätze in COCO, YOLO, VOC und ImageFolder direkt aus einem Ordner öffnen, ansehen und annotieren">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Lizenz: Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="Neueste Version"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Docker-Image"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">Live-Demo</a></b> ·
  <b><a href="../../releases">Für Desktop herunterladen</a></b> ·
  <b><a href="#3-mit-docker-ausführen">Mit Docker ausführen</a></b> ·
  <b><a href="./DEPLOY.md">Selbst hosten</a></b>
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
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll zeigt einen Pascal-VOC-Datensatz: die Bildliste, die Annotationsleiste mit Klassen- und Ebenensteuerung und zwei auf das aktuelle Bild gezeichnete Boxen.">
</p>

LabelAll ist ein **freies Open-Source-Werkzeug** zum Öffnen, Durchsuchen, Annotieren und Exportieren gängiger Bilddatensätze. Es gibt keinen Formatkonvertierungsschritt und keine Projektdatei einzurichten – Ordner auswählen und es liest, was schon da ist.

Es richtet sich an Computer-Vision-Ingenieurinnen und -Ingenieure, Annotationsteams und Qualitätssicherung, Studierende und Forschende sowie alle, die schnell eine Reihe von Bildlabels prüfen oder korrigieren möchten.

## Was es kann

**Öffnen und loslegen**

- Ordner auswählen: Das Format des Datensatzes wird automatisch erkannt.
- Nachsichtiges Lesen: beschädigte, fehlende oder unübliche Dateien werden übersprungen und in einem Dialog zusammengefasst – eine schlechte Datei blockiert nie den ganzen Datensatz.
- Eine Thumbnail-Liste, die auch bei Zehntausenden Bildern flüssig bleibt.
- Nach Split (train / val / test) oder Klasse filtern und nach Dateinamen suchen; Doppelklick öffnet das Bild im Betrachter.

**Klar sehen**

- Frei zoomen und verschieben, an das Fenster anpassen oder 1:1 prüfen.
- Rechtecke, Polygone, Keypoints und Klassifikations-Tags sauber überlagert, mit dem Namen in einer Plakette in Klassenfarbe.
- Jede Ebene ein- oder ausblenden; mit Pfeiltasten oder Filmstreifen durch die Bilder gehen.

**Annotieren und bearbeiten**

- Rechtecke, Polygone und Keypoints zeichnen oder ein Klassenlabel für das ganze Bild vergeben.
- Ziehen zum Verschieben, Größe über acht Griffe ändern, duplizieren, löschen, pixelgenau verschieben und über das Kontextmenü schnell handeln.
- Klassen jederzeit hinzufügen, umbenennen, umfärben oder entfernen; rückgängig und wiederholen ohne Einschränkung.

**Exportieren und austauschen**

- In einem Schritt nach COCO, YOLO, Pascal VOC oder Klassifikationsordner exportieren.
- Vor dem Export **sagt LabelAll genau, was das Zielformat nicht behalten kann**, und schreibt in einen separaten Ordner – die Originaldateien bleiben unverändert.

**Angenehm zu bedienen**

- Helles und dunkles Thema, Akzentfarbe und Palette anpassbar.
- Zehn Oberflächensprachen (inklusive rechtsläufigem Arabisch); die Desktop-App aktualisiert sich selbst, die Web-Version fühlt sich gleich an.

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="Links: LabelAll erkennt einen Pascal-VOC-Datensatz mit 100 % Konfidenz. Rechts: dasselbe annotierte Bild im dunklen Thema.">
</p>

## Unterstützte Datensätze

| Format | Öffnen | Export | Hinweise |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Polygon- und RLE-Segmentierung, Keypoints |
| **YOLO** | ✅ | ✅ | Detektions-, Segmentierungs- und Pose-Aufgaben |
| **Pascal VOC** | ✅ | ✅ | Boxen mit Basis 1; XML neben dem Bild oder in `Annotations/` |
| **Klassifikation / ImageNet** | ✅ | Teilweise | Der Ordnername ist die Klasse |
| **labelme** | ✅ | — | Austausch mit labelme |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 und weitere öffentliche Datensätze lassen sich im Originalformat öffnen.

## So verwendest du es

Es gibt drei Wege, LabelAll zu nutzen. Alle laufen vollständig auf deinem Rechner – die App hat **kein Backend**, die geöffneten Bilder und Annotationen werden also nirgendwohin hochgeladen.

### 1. Im Browser ausprobieren

Öffne **<https://labelall.superagentparty.com/>** und wähle einen Datensatzordner. Nichts zu installieren.

> Die Web-Version benötigt die File System Access API des Browsers und muss daher über **HTTPS** (oder `localhost`) ausgeliefert werden. **Chrome / Edge** kann lesen und schreiben; **Firefox / Safari** öffnen Datensätze nur lesend.

### 2. Die Desktop-App installieren

Lade den Installer für dein System von der [Releases](../../releases)-Seite – **macOS, Windows und Linux**. Zum Annotieren ist die Desktop-App empfohlen, da sie immer auf die Festplatte zurückschreiben kann.

> **Erster Start unter macOS**: Der Build ist nicht notarisiert. Meldet macOS „beschädigt“ oder könne den Entwickler nicht überprüfen, führe `xattr -cr /Applications/LabelAll.app` im Terminal aus und öffne die App – oder rechtsklicke sie und wähle „Öffnen“.

### 3. Mit Docker ausführen

Die Web-Version ist ein reines statisches Bundle, das Image besteht also nur aus `nginx` plus der kompilierten App. Das veröffentlichte Image ist Multi-Arch (`linux/amd64` und `linux/arm64`):

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

Öffne dann <http://localhost:8080>.

Oder baue es selbst aus einem Checkout:

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# oder
docker compose up -d --build
```

> Beim Push eines Versions-Tags (`git tag v0.1.3 && git push origin v0.1.3`) werden die Tags automatisch gebaut und zu Docker Hub gepusht – als semantische Versions-Tags plus `latest`. Siehe [DEPLOY.md](./DEPLOY.md) für die Docker-Hub-Einrichtung und andere Hosting-Optionen (Cloudflare Pages, Netlify, Vercel, …).

## Schnellstart

1. LabelAll öffnen, „Datensatz öffnen“ anklicken und den Ordner wählen.
2. Das erkannte Format bestätigen und loslegen.
3. Annotationen ergänzen oder ändern und im gewünschten Format exportieren.

> Erst ausprobieren? [`examples/voc-mini`](./examples/voc-mini) ist ein kleiner Pascal-VOC-Datensatz mit drei Bildern – einfach öffnen.

## Tastenkürzel

| Aktion | Tastenkürzel |
| --- | --- |
| Vorheriges / nächstes Bild | `←` / `→` |
| Aktive Klasse wechseln | `↑` / `↓` |
| Auswählen/Verschieben · Rechteck · Polygon · Keypoints | `V` · `B` · `N` · `M` |
| Ausgewählte Annotation verschieben | `W A S D` (`Shift` für 10px) |
| Löschen / duplizieren | `Delete` / `Ctrl`·`Cmd` + `D` |
| Rückgängig / wiederholen | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Vergrößern / verkleinern / anpassen | `+` / `-` / `0` |
| Arbeitsfläche verschieben | Hintergrund ziehen, oder `Leertaste` + Ziehen |

## Bekannte Einschränkungen

- Ausgelegt auf Datensätze bis etwa 50 000 Bilder und Annotationsdateien bis 100 MB; darüber ist keine flüssige Bedienung garantiert.
- Die Web-Version ist in Chrome / Edge les- und schreibbar, in Firefox / Safari nur lesbar.
- Der Export schreibt nur Annotationsdateien; Bilder werden nicht kopiert.

## Mitwirken und Lizenz

Issues und Pull Requests sind willkommen – siehe [CONTRIBUTING.md](./CONTRIBUTING.md) und [RELEASING.md](./RELEASING.md) für Releases. [Apache-2.0](./LICENSE) © 2026 heshengtao.
