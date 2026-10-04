<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="LabelAll — 폴더에서 바로 COCO, YOLO, VOC, ImageFolder 이미지 데이터셋을 열고 보고 라벨링합니다">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="라이선스: Apache-2.0"></a>
  <a href="../../releases"><img src="https://img.shields.io/github/v/release/heshengtao/labelall?style=flat-square" alt="최신 릴리스"></a>
  <a href="https://hub.docker.com/r/ailm32442/labelall"><img src="https://img.shields.io/badge/docker-ailm32442%2Flabelall-2496ED.svg?logo=docker&logoColor=white" alt="Docker 이미지"></a>
</p>

<p align="center">
  <b><a href="https://labelall.superagentparty.com/">라이브 데모</a></b> ·
  <b><a href="../../releases">데스크톱용 다운로드</a></b> ·
  <b><a href="#3-docker로-실행">Docker로 실행</a></b> ·
  <b><a href="./DEPLOY.md">직접 호스팅</a></b>
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
  <img src="./assets/readme/showcase.png" width="100%" alt="LabelAll이 Pascal VOC 데이터셋을 보여 주는 화면: 이미지 목록, 클래스와 레이어 컨트롤이 있는 라벨링 툴바, 현재 이미지에 그려진 두 개의 박스.">
</p>

LabelAll은 일반적인 이미지 데이터셋을 열고, 보고, 라벨링하고, 내보내는 **무료 오픈 소스** 도구입니다. 형식 변환 절차도, 준비할 프로젝트 파일도 없습니다——폴더만 고르면 그 안에 있는 내용을 그대로 읽습니다.

컴퓨터 비전 엔지니어, 라벨링·검수 팀, 학생과 연구자, 그리고 이미지 라벨을 빠르게 확인하거나 수정하려는 모든 분에게 적합합니다.

## 할 수 있는 일

**열면 바로**

- 폴더만 고르면 데이터셋 형식을 자동으로 감지합니다. 별도 설정이 없습니다.
- 관대한 읽기: 손상되었거나 빠졌거나 규격을 벗어난 파일은 건너뛰고 대화상자에 모아 보여 주므로, 파일 하나 때문에 데이터셋 전체가 열리지 않는 일이 없습니다.
- 이미지가 수만 장이어도 부드러운 썸네일 목록.
- 분할(train / val / test)이나 클래스로 걸러 보기, 파일 이름으로 검색. 썸네일을 두 번 클릭하면 뷰어에서 열립니다.

**보기 편하게**

- 자유롭게 확대·이동하고, 창에 맞추거나 1:1로 확인합니다.
- 박스, 폴리곤, 키포인트, 분류 태그를 깔끔하게 겹쳐 그리고 클래스 색 라벨 칩으로 이름을 표시합니다.
- 레이어별로 켜고 끌 수 있고, 방향키나 필름스트립으로 이미지를 넘길 수 있습니다.

**라벨링과 편집**

- 박스·폴리곤·키포인트를 그리거나 이미지 전체 분류 라벨을 추가합니다.
- 끌어서 이동, 8개 핸들로 크기 조절, 복제, 삭제, 1px 단위 미세 조정. 오른쪽 클릭 메뉴로 빠르게 처리.
- 클래스는 언제든 추가·이름 변경·색 변경·삭제할 수 있고, 실행 취소/다시 실행도 자유롭습니다.

**내보내기와 상호 운용**

- COCO, YOLO, Pascal VOC, 분류 폴더로 한 번에 내보냅니다.
- 내보내기 전에 **대상 형식이 담을 수 없는 내용을 정확히 알려 주고**, 별도 폴더에 씁니다——원본 파일은 절대 수정하지 않습니다.

**쓰기 편하게**

- 라이트/다크 테마, 강조 색상과 팔레트를 바꿀 수 있습니다.
- 10개 언어 인터페이스(오른쪽에서 왼쪽으로 쓰는 아랍어 포함). 데스크톱 앱은 자동 업데이트를 지원하고, 웹 버전도 같은 사용감입니다.

<p align="center">
  <img src="./assets/readme/showcase-more.png" width="100%" alt="왼쪽: Pascal VOC 데이터셋을 100% 확신도로 감지하는 LabelAll. 오른쪽: 같은 라벨링 이미지를 다크 테마로 본 모습.">
</p>

## 지원 데이터셋

| 형식 | 열기 | 내보내기 | 비고 |
| --- | :---: | :---: | --- |
| **COCO** | ✅ | ✅ | 폴리곤·RLE 분할, 키포인트 |
| **YOLO** | ✅ | ✅ | 검출·분할·포즈 |
| **Pascal VOC** | ✅ | ✅ | 1부터 시작하는 좌표. XML이 이미지 옆이나 `Annotations/`에 있어도 됨 |
| **분류 폴더 / ImageNet** | ✅ | 일부 | 폴더 이름이 클래스 이름 |
| **labelme** | ✅ | — | labelme와 상호 운용 |

> MS COCO, ImageNet / ILSVRC, Pascal VOC 2007/2012 등 공개 데이터셋도 원래 형식 그대로 열 수 있습니다.

## 실행 방법

LabelAll은 세 가지 방식으로 사용할 수 있으며, 모두 여러분의 컴퓨터에서만 실행됩니다——앱에 **백엔드가 없으므로** 열어 본 이미지와 라벨이 어디로도 전송되지 않습니다.

### 1. 브라우저에서 사용해 보기

**<https://labelall.superagentparty.com/>**를 열고 데이터셋 폴더를 고르면 됩니다. 설치할 것이 없습니다.

> 웹 버전은 브라우저의 파일 시스템 접근 API가 필요하므로 **HTTPS**(또는 `localhost`)로 제공해야 합니다. **Chrome / Edge**는 읽기·쓰기가 되고, **Firefox / Safari**는 읽기 전용으로 데이터셋을 엽니다.

### 2. 데스크톱 앱 설치

[Releases](../../releases) 페이지에서 운영체제에 맞는 설치 파일을 받으세요——**macOS, Windows, Linux**. 디스크에 항상 쓸 수 있으므로 라벨링에는 데스크톱 앱을 권장합니다.

> **macOS 첫 실행**: Apple 공증을 받지 않았습니다. “손상되었기 때문에 열 수 없습니다” 등이 뜨면 터미널에서 `xattr -cr /Applications/LabelAll.app`을 실행한 뒤 열거나, 앱을 오른쪽 클릭해 “열기”를 선택하세요.

### 3. Docker로 실행

웹 버전은 그대로 정적 번들이라, 이미지는 `nginx`와 컴파일된 앱뿐입니다. 공개된 이미지는 멀티 아키텍처(`linux/amd64`, `linux/arm64`)입니다:

```bash
docker run --rm -p 8080:80 ailm32442/labelall:latest
```

그런 다음 <http://localhost:8080>을 여세요.

체크아웃에서 직접 빌드할 수도 있습니다:

```bash
docker build -t labelall .
docker run --rm -p 8080:80 labelall

# 또는
docker compose up -d --build
```

> 버전 태그를 푸시하면(`git tag v0.1.3 && git push origin v0.1.3`) 태그가 자동으로 빌드되어 Docker Hub에 푸시되며, 시맨틱 버전 태그와 `latest`가 만들어집니다. Docker Hub 설정과 다른 호스팅 방법(Cloudflare Pages, Netlify, Vercel 등)은 [DEPLOY.md](./DEPLOY.md)를 참고하세요.

## 빠른 시작

1. LabelAll을 열고 “데이터셋 열기”에서 폴더를 선택합니다.
2. 감지된 형식을 확인하고 둘러보기 시작합니다.
3. 라벨을 추가·수정한 뒤 원하는 형식으로 내보냅니다.

> 먼저 써 보고 싶다면: [`examples/voc-mini`](./examples/voc-mini)는 이미지 3장짜리 작은 Pascal VOC 데이터셋입니다. 바로 열어 보세요.

## 단축키

| 동작 | 단축키 |
| --- | --- |
| 이전 / 다음 이미지 | `←` / `→` |
| 선택/이동 · 박스 · 폴리곤 · 키포인트 | `V` · `B` · `P` · `K` |
| 선택한 라벨 미세 조정 | `방향키`(`Shift`로 10px) |
| 삭제 / 복제 | `Delete` / `Ctrl`·`Cmd` + `D` |
| 실행 취소 / 다시 실행 | `Ctrl`·`Cmd` + `Z` / `Shift` + `Ctrl`·`Cmd` + `Z` |
| 확대 / 축소 / 창에 맞추기 | `+` / `-` / `0` |
| 캔버스 이동 | 빈 곳 드래그, 또는 `Space` + 드래그 |

## 알려진 제한

- 이미지 약 5만 장, 라벨 파일 100 MB 정도까지를 대상으로 합니다. 그 이상은 쾌적함을 보장하지 않습니다.
- 웹 버전은 Chrome / Edge에서 읽기·쓰기, Firefox / Safari는 읽기 전용입니다.
- 내보내기는 라벨 파일만 쓰고 이미지는 복사하지 않습니다.

## 기여와 라이선스

Issue와 Pull Request를 환영합니다([CONTRIBUTING.md](./CONTRIBUTING.md)). 릴리스 방법은 [RELEASING.md](./RELEASING.md). [Apache-2.0](./LICENSE) © 2026 heshengtao.
