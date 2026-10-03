<div align="center">

# LabelAll

**Gängige Bilddatensätze laden, ansehen und annotieren**

Einen Bilddatensatz zu öffnen und zu beschriften sollte so einfach sein wie die Wahl eines Ordners.

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

## Was ist LabelAll

LabelAll ist ein **freies Open-Source-Werkzeug** zum Öffnen, Durchsuchen, Annotieren und Exportieren
gängiger Bilddatensätze.

Kein Code, keine vorherige Formatkonvertierung, kein Suchen nach den Annotationsdateien: Ordner
auswählen und den Rest erledigt es. Es richtet sich an Computer-Vision-Ingenieurinnen und -Ingenieure,
Annotationsteams und Qualitätssicherung, Studierende und Forschende sowie alle, die schnell eine
Reihe von Bildlabels prüfen oder bearbeiten möchten.

## Was es kann

**Öffnen und loslegen**

- Ordner auswählen: Das Format wird automatisch erkannt, ohne Einrichtung.
- Nachsichtiges Lesen: beschädigte, fehlende oder unübliche Dateien werden übersprungen und in einem
  Dialog zusammengefasst – eine schlechte Datei blockiert nie den ganzen Datensatz.
- Eine Thumbnail-Liste, die auch bei Zehntausenden Bildern flüssig bleibt.
- Nach Split (train / val / test) oder Klasse filtern und nach Dateinamen suchen; Doppelklick öffnet
  das Bild im Betrachter.

**Klar sehen**

- Frei zoomen und verschieben, an das Fenster anpassen oder 1:1 prüfen.
- Rechtecke, Polygone, Keypoints und Klassifikations-Tags sauber überlagert, mit dem Namen in einer
  Plakette in Klassenfarbe.
- Jede Ebene ein- oder ausblenden; mit Pfeiltasten oder Filmstreifen durch die Bilder gehen.

**Annotieren und bearbeiten**

- Rechtecke, Polygone und Keypoints zeichnen oder ein Klassenlabel für das ganze Bild vergeben.
- Ziehen zum Verschieben, Größe über acht Griffe ändern, duplizieren, löschen, pixelgenau
  verschieben und über das Kontextmenü schnell handeln.
- Klassen jederzeit hinzufügen, umbenennen, umfärben oder entfernen; rückgängig und wiederholen ohne
  Einschränkung.

**Exportieren und austauschen**

- In einem Schritt nach COCO, YOLO, Pascal VOC oder Klassifikationsordner exportieren.
- Vor dem Export **sagt LabelAll genau, was das Zielformat nicht behalten kann**, und schreibt in
  einen separaten Ordner – die Originaldateien bleiben unverändert.

**Angenehm zu bedienen**

- Helles und dunkles Thema, Akzentfarbe und Palette anpassbar.
- Zehn Oberflächensprachen (inklusive rechtsläufigem Arabisch); die Desktop-App aktualisiert sich
  selbst, die Web-Version fühlt sich gleich an.

## Unterstützte Datensätze

| Format | Öffnen | Export | Hinweise |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Polygon- und RLE-Segmentierung, Keypoints |
| **YOLO** | ✅ | ✅ | Detektions-, Segmentierungs- und Pose-Aufgaben |
| **Pascal VOC** | ✅ | ✅ | Boxen mit Basis 1; XML neben dem Bild oder in `Annotations/` |
| **Klassifikation / ImageNet** | ✅ | Teilweise | Der Ordnername ist die Klasse |
| **labelme** | ✅ | — | Austausch mit labelme |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 und weitere öffentliche Datensätze lassen sich im
> Originalformat öffnen.

## Schnellstart

1. LabelAll öffnen, „Datensatz öffnen“ anklicken und den Ordner wählen.
2. Das erkannte Format bestätigen und loslegen.
3. Annotationen ergänzen oder ändern und im gewünschten Format exportieren.

| Aktion | Tastenkürzel |
| --- | --- |
| Vorheriges / nächstes Bild | `←` / `→` |
| Auswählen/Verschieben · Rechteck · Polygon · Keypoints | `V` · `B` · `P` · `K` |
| Ausgewählte Annotation verschieben | `Pfeiltasten` (`Shift` für 10px) |
| Löschen / duplizieren | `Delete` / `Ctrl`·`Cmd` + `D` |
| Rückgängig / wiederholen | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Vergrößern / verkleinern / anpassen | `+` / `-` / `0` |
| Arbeitsfläche verschieben | Hintergrund ziehen, oder `Leertaste` + Ziehen |

> Erst ausprobieren? [`examples/voc-mini`](./examples/voc-mini) ist ein kleiner Pascal-VOC-Datensatz
> mit drei Bildern – einfach öffnen.

## Download

Den Installer für dein System gibt es auf der [Releases](../../releases)-Seite (macOS / Windows /
Linux); die Web-Version läuft mit `docker compose up -d --build` (siehe [DEPLOY.md](./DEPLOY.md)).

> **Erster Start unter macOS**: Der Build ist nicht notarisiert. Meldet macOS „beschädigt“ oder könne
> den Entwickler nicht überprüfen, führe `xattr -cr /Applications/LabelAll.app` im Terminal aus und
> öffne die App – oder rechtsklicke sie und wähle „Öffnen“.

## Bekannte Einschränkungen

- Ausgelegt auf Datensätze bis etwa 50 000 Bilder und Annotationsdateien bis 100 MB; darüber ist
  keine flüssige Bedienung garantiert.
- Die Web-Version ist in Chrome / Edge les- und schreibbar, in Firefox / Safari nur lesbar.
- Der Export schreibt nur Annotationsdateien; Bilder werden nicht kopiert.

## Mitwirken und Lizenz

Issues und Pull Requests sind willkommen – siehe [CONTRIBUTING.md](./CONTRIBUTING.md) und
[RELEASING.md](./RELEASING.md) für Releases. [Apache-2.0](./LICENSE) © 2026 heshengtao.
