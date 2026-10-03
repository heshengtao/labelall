<div align="center">

# LabelAll

**Carga, visualiza y anota datasets de imágenes habituales**

Abrir y etiquetar un dataset de imágenes debería ser tan fácil como elegir una carpeta.

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

## Qué es LabelAll

LabelAll es una herramienta **gratuita y de código abierto** para abrir, explorar, anotar y exportar
datasets de imágenes habituales.

Sin código, sin convertir formatos antes y sin buscar los archivos de anotación: elige una carpeta y
el resto corre de su cuenta. Está pensada para ingenieros de visión por computador, equipos de
anotación y control de calidad, estudiantes e investigadores, y cualquiera que necesite revisar o
editar etiquetas de imágenes con rapidez.

## Qué hace

**Abrir y listo**

- Elige una carpeta: el formato se detecta automáticamente, sin configurar nada.
- Lectura tolerante: los archivos dañados, ausentes o fuera de norma se omiten y se resumen en un
  cuadro de diálogo, así que un archivo malo nunca bloquea el dataset entero.
- Una lista de miniaturas fluida incluso con decenas de miles de imágenes.
- Filtra por partición (train / val / test) o clase y busca por nombre; haz doble clic en una
  miniatura para abrirla en el visor.

**Ver con claridad**

- Zoom y desplazamiento libres, ajuste a la ventana o vista 1:1.
- Cajas, polígonos, puntos clave y etiquetas de clasificación superpuestos con claridad, con el
  nombre en una etiqueta del color de la clase.
- Activa o desactiva cada capa; cambia de imagen con las flechas o la tira inferior.

**Anotar y editar**

- Dibuja cajas, polígonos y puntos clave, o añade una etiqueta de clase para toda la imagen.
- Arrastra para mover, redimensiona con ocho tiradores, duplica, elimina, ajusta píxel a píxel y usa
  el menú contextual para acciones rápidas.
- Añade, renombra, recolorea o elimina clases cuando quieras; deshaz y rehaz sin límites.

**Exportar e interoperar**

- Exporta a COCO, YOLO, Pascal VOC o carpetas de clasificación en un paso.
- Antes de exportar, LabelAll **te dice exactamente qué no puede conservar el formato de destino** y
  escribe en una carpeta aparte: tus archivos originales nunca se modifican.

**Agradable de usar**

- Temas claro y oscuro, con color de acento y paleta personalizables.
- Diez idiomas de interfaz (incluido el árabe, de derecha a izquierda); la app de escritorio se
  actualiza sola y la versión web se siente igual.

## Datasets compatibles

| Formato | Abrir | Exportar | Notas |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Segmentación por polígono y RLE, puntos clave |
| **YOLO** | ✅ | ✅ | Tareas de detección, segmentación y pose |
| **Pascal VOC** | ✅ | ✅ | Cajas con base 1; XML junto a la imagen o en `Annotations/` |
| **Clasificación / ImageNet** | ✅ | Parcial | El nombre de la carpeta es la clase |
| **labelme** | ✅ | — | Interoperabilidad con labelme |

> También puedes abrir MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 y otros datasets públicos en
> su formato original.

## Inicio rápido

1. Abre LabelAll, pulsa “Abrir dataset” y elige la carpeta.
2. Confirma el formato detectado y empieza a explorar.
3. Añade o edita anotaciones y exporta al formato que quieras.

| Acción | Atajo |
| --- | --- |
| Imagen anterior / siguiente | `←` / `→` |
| Seleccionar/mover · Caja · Polígono · Puntos clave | `V` · `B` · `P` · `K` |
| Mover la anotación seleccionada | `Flechas` (con `Shift`, 10px) |
| Eliminar / duplicar | `Delete` / `Ctrl`·`Cmd` + `D` |
| Deshacer / rehacer | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Acercar / alejar / ajustar | `+` / `-` / `0` |
| Desplazar el lienzo | Arrastra el fondo, o `Espacio` + arrastrar |

> ¿Quieres probarlo antes? [`examples/voc-mini`](./examples/voc-mini) es un dataset Pascal VOC de tres
> imágenes: ábrelo directamente.

## Descarga

Consigue el instalador para tu sistema en [Releases](../../releases) (macOS / Windows / Linux) o
levanta la versión web con `docker compose up -d --build` (ver [DEPLOY.md](./DEPLOY.md)).

> **Primer inicio en macOS**: la compilación no está notarizada. Si macOS dice que la app está
> “dañada” o no puede verificar al desarrollador, ejecuta `xattr -cr /Applications/LabelAll.app` en
> Terminal y ábrela, o haz clic derecho y elige “Abrir”.

## Limitaciones conocidas

- Pensada para datasets de hasta ~50 000 imágenes con archivos de anotación de hasta 100 MB; por
  encima no se garantiza fluidez.
- La versión web es de lectura y escritura en Chrome / Edge y de solo lectura en Firefox / Safari.
- La exportación solo escribe archivos de anotación; no copia las imágenes.

## Contribuir y licencia

Las issues y los pull requests son bienvenidos: consulta [CONTRIBUTING.md](./CONTRIBUTING.md), y
[RELEASING.md](./RELEASING.md) para publicar versiones. [Apache-2.0](./LICENSE) © 2026 heshengtao.
