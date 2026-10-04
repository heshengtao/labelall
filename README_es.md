<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — abre, visualiza y anota datasets de imágenes COCO, YOLO, VOC e ImageFolder directamente desde una carpeta">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="Licencia: Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="Última versión"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Imagen de Docker"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">Demo en vivo</a></b> ·
  <b><a href="../../releases">Descargar para escritorio</a></b> ·
  <b><a href="#3-ejecútalo-con-docker">Ejecutar con Docker</a></b> ·
  <b><a href="./DEPLOY.md">Autoalojar</a></b>
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
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll mostrando un dataset Pascal VOC: la lista de imágenes, la barra de anotación con controles de clase y capa, y dos cajas dibujadas sobre la imagen actual.">
</p>

LabelAll es una herramienta **gratuita y de código abierto** para abrir, explorar, anotar y exportar datasets de imágenes habituales. No hay paso de conversión de formato ni archivo de proyecto que configurar: elige una carpeta y lee lo que ya hay en ella.

Está pensada para ingenieros de visión por computador, equipos de anotación y control de calidad, estudiantes e investigadores, y cualquiera que necesite revisar o corregir un lote de etiquetas de imágenes con rapidez.

## Qué hace

**Abrir y listo**

- Elige una carpeta: el formato del dataset se detecta automáticamente.
- Lectura tolerante: los archivos dañados, ausentes o fuera de norma se omiten y se resumen en un cuadro de diálogo, así que un archivo malo nunca bloquea el dataset entero.
- Una lista de miniaturas fluida incluso con decenas de miles de imágenes.
- Filtra por partición (train / val / test) o clase y busca por nombre; haz doble clic en una miniatura para abrirla en el visor.

**Ver con claridad**

- Zoom y desplazamiento libres, ajuste a la ventana o vista 1:1.
- Cajas, polígonos, puntos clave y etiquetas de clasificación superpuestos con claridad, con el nombre en una etiqueta del color de la clase.
- Activa o desactiva cada capa; cambia de imagen con las flechas o la tira inferior.

**Anotar y editar**

- Dibuja cajas, polígonos y puntos clave, o añade una etiqueta de clase para toda la imagen.
- Arrastra para mover, redimensiona con ocho tiradores, duplica, elimina, ajusta píxel a píxel y usa el menú contextual para acciones rápidas.
- Añade, renombra, recolorea o elimina clases cuando quieras; deshaz y rehaz sin límites.

**Exportar e interoperar**

- Exporta a COCO, YOLO, Pascal VOC o carpetas de clasificación en un paso.
- Antes de exportar, LabelAll **te dice exactamente qué no puede conservar el formato de destino** y escribe en una carpeta aparte: tus archivos originales nunca se modifican.

**Agradable de usar**

- Temas claro y oscuro, con color de acento y paleta personalizables.
- Diez idiomas de interfaz (incluido el árabe, de derecha a izquierda); la app de escritorio se actualiza sola y la versión web se siente igual.

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="Izquierda: LabelAll detectando un dataset Pascal VOC con un 100 % de confianza. Derecha: la misma imagen anotada con el tema oscuro.">
</p>

## Datasets compatibles

| Formato | Abrir | Exportar | Notas |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | Segmentación por polígono y RLE, puntos clave |
| **YOLO** | ✅ | ✅ | Tareas de detección, segmentación y pose |
| **Pascal VOC** | ✅ | ✅ | Cajas con base 1; XML junto a la imagen o en `Annotations/` |
| **Clasificación / ImageNet** | ✅ | Parcial | El nombre de la carpeta es la clase |
| **labelme** | ✅ | — | Interoperabilidad con labelme |

> También puedes abrir MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 y otros datasets públicos en su formato original.

## Cómo usarlo

Hay tres formas de usar LabelAll. Todas se ejecutan íntegramente en tu máquina: la app **no tiene backend**, así que las imágenes y anotaciones que abras nunca se suben a ningún sitio.

### 1. Pruébalo en el navegador

Abre **<https://labelall.superagentparty.com/>** y elige una carpeta de dataset. No hay nada que instalar.

> La versión web necesita la API de acceso al sistema de archivos del navegador, así que debe servirse por **HTTPS** (o `localhost`). **Chrome / Edge** puede leer y escribir; **Firefox / Safari** abren los datasets en solo lectura.

### 2. Instala la app de escritorio

Descarga el instalador para tu sistema desde la página de [Releases](../../releases): **macOS, Windows y Linux**. Es la forma recomendada de anotar, porque siempre puede escribir en disco.

> **Primer inicio en macOS**: la compilación no está notarizada. Si macOS dice que la app está “dañada” o no puede verificar al desarrollador, ejecuta `xattr -cr /Applications/LabelAll.app` en Terminal y ábrela, o haz clic derecho y elige “Abrir”.

### 3. Ejecútalo con Docker

La versión web es un simple bundle estático, así que la imagen es solo `nginx` más la app compilada. La imagen publicada es multiarquitectura (`linux/amd64` y `linux/arm64`):

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

Luego abre <http://localhost:8080>.

O constrúyela tú mismo desde el código:

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# o
docker compose up -d --build
```

> Las etiquetas se compilan y se suben a Docker Hub automáticamente al hacer push de una etiqueta de versión (`git tag v0.1.3 && git push origin v0.1.3`), generando etiquetas semánticas de versión más `latest`. Consulta [DEPLOY.md](./DEPLOY.md) para configurar Docker Hub y otras opciones de alojamiento (Cloudflare Pages, Netlify, Vercel, …).

## Inicio rápido

1. Abre LabelAll, pulsa “Abrir dataset” y elige la carpeta.
2. Confirma el formato detectado y empieza a explorar.
3. Añade o edita anotaciones y exporta al formato que quieras.

> ¿Quieres probarlo antes? [`examples/voc-mini`](./examples/voc-mini) es un dataset Pascal VOC de tres imágenes: ábrelo directamente.

## Atajos de teclado

| Acción | Atajo |
| --- | --- |
| Imagen anterior / siguiente | `←` / `→` |
| Cambiar la clase activa | `↑` / `↓` |
| Seleccionar/mover · Caja · Polígono · Puntos clave | `V` · `B` · `N` · `M` |
| Mover la anotación seleccionada | `W A S D` (con `Shift`, 10px) |
| Eliminar / duplicar | `Delete` / `Ctrl`·`Cmd` + `D` |
| Deshacer / rehacer | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| Acercar / alejar / ajustar | `+` / `-` / `0` |
| Desplazar el lienzo | Arrastra el fondo, o `Espacio` + arrastrar |

## Limitaciones conocidas

- Pensada para datasets de hasta ~50 000 imágenes con archivos de anotación de hasta 100 MB; por encima no se garantiza fluidez.
- La versión web es de lectura y escritura en Chrome / Edge y de solo lectura en Firefox / Safari.
- La exportación solo escribe archivos de anotación; no copia las imágenes.

## Contribuir y licencia

Las issues y los pull requests son bienvenidos: consulta [CONTRIBUTING.md](./CONTRIBUTING.md), y [RELEASING.md](./RELEASING.md) para publicar versiones. [Apache-2.0](./LICENSE) © 2026 heshengtao.
