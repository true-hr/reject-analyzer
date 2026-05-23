# Chrome Web Store 제출 패키지 생성 절차

PASSMAP 선택 텍스트 보내기 확장의 Chrome Web Store 제출용 zip을 안전하게 생성하는 절차입니다.

본 문서는 **사람이 따라가는 체크리스트** 입니다. 자동화 스크립트는 본 저장소에 추가하지 않습니다 (수동 검증 우선).

---

## 1. 생성 결과물

| 항목 | 값 |
|---|---|
| 결과 파일명 | `passmap-selection-import-<version>.zip` (현재 manifest 기준: `passmap-selection-import-0.1.1.zip`) |
| 결과 파일 위치 | 본 저장소 외부 (예: `D:\passmap-packages\` 또는 임의 작업 폴더). 본 git 저장소에는 커밋하지 않음 |
| zip 루트 구조 | `manifest.json` 이 zip의 **최상위** 에 있어야 함. 폴더로 한 단계 더 감싸면 안 됨 |

Chrome Web Store는 zip을 풀었을 때 `manifest.json` 이 최상위에 있는 구조만 허용합니다. 폴더 안에 폴더가 또 있는 형태(`passmap-selection-import/manifest.json`) 로 압축하면 거부됩니다.

---

## 2. zip에 포함할 파일

다음 파일들만 zip에 포함합니다. `extension/passmap-selection-import/` 폴더 기준입니다.

```
manifest.json
background.js
content-passmap.js
icons/icon-16.png
icons/icon-32.png
icons/icon-48.png
icons/icon-128.png
```

문서(`.md`) 파일은 zip에 포함하지 않습니다. 스토어 listing은 별도 입력 양식으로 처리됩니다.

`manifest.json` 의 `icons` 필드는 위 4개 PNG와 정확히 같은 상대 경로(`icons/icon-16.png` 등) 를 가리켜야 합니다. 파일이 누락되거나 경로 표기가 다르면 manifest 검증에서 실패합니다. 현재 본 저장소의 `icons/` 폴더에는 PASSMAP 공식 심볼 PNG 기반으로 생성된 16/32/48/128 4종이 이미 포함되어 있습니다.

---

## 3. 절대 포함하면 안 되는 파일 / 폴더

다음 항목은 어떤 경우에도 zip에 포함되어서는 안 됩니다.

### 개발 환경 / 의존성
- `node_modules/`
- `.npm/`
- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `dist/`, `build/` (본 확장은 빌드 단계가 없음)

### 비밀 / 환경
- `.env`, `.env.local`, `.env.*`
- `*.key`, `*.pem`, `*.p12`
- `secrets/`, `credentials/`
- API 키 / 토큰이 포함된 모든 파일

### VCS / IDE
- `.git/`, `.gitignore`, `.gitattributes`
- `.vscode/`, `.idea/`, `.cursor/`
- `*.swp`, `*.swo`, `.DS_Store`, `Thumbs.db`

### 문서 / 메타
- `*.md` (`README.md`, `STORE_LISTING_DRAFT.md`, `PACKAGE_FOR_STORE.md` 등 본 폴더의 모든 마크다운)
- `CHANGELOG.md`, `LICENSE.md`
- `docs/` 전체

### 테스트 / 임시
- `test/`, `tests/`, `__tests__/`
- `*.test.js`, `*.spec.js`
- `coverage/`, `.nyc_output/`
- `tmp/`, `temp/`, `scratch/`

### 개인 / 작업 데이터
- 사용자가 테스트 중 만든 임시 파일
- 캡처 / 녹화 결과물
- 개인 계정 정보가 포함된 모든 파일

확장이 한 번이라도 로컬에서 정상 동작했다면, 위 항목 중 어떤 것도 사실은 확장 자체에 필요하지 않습니다.

---

## 4. zip 생성 절차

### Windows PowerShell 기준

다음 단계는 사람이 직접 수동으로 수행합니다. 작업 폴더는 본 git 저장소 **외부** 를 권장합니다.

1. 작업 폴더 준비
   ```powershell
   $work = "D:\passmap-packages\store-build-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
   New-Item -ItemType Directory -Force -Path $work | Out-Null
   ```

2. 확장 파일 복사 (포함 대상만 명시적으로 지정)
   ```powershell
   $src = "C:\Users\qorrk\Documents\passmap-work\reject-analyzer\extension\passmap-selection-import"
   Copy-Item "$src\manifest.json"        $work
   Copy-Item "$src\background.js"        $work
   Copy-Item "$src\content-passmap.js"   $work
   Copy-Item "$src\icons"                $work -Recurse
   ```

3. 잘못 포함된 파일이 없는지 확인
   ```powershell
   Get-ChildItem $work -Recurse | Select-Object FullName
   ```
   기대 결과: `manifest.json`, `background.js`, `content-passmap.js`, `icons/icon-16.png`, `icons/icon-32.png`, `icons/icon-48.png`, `icons/icon-128.png` 총 7개.
   그 외 항목이 보이면 즉시 삭제 후 다시 확인.

4. zip 생성
   ```powershell
   $version = (Get-Content "$work\manifest.json" -Raw | ConvertFrom-Json).version
   $out = "D:\passmap-packages\passmap-selection-import-$version.zip"
   Compress-Archive -Path "$work\*" -DestinationPath $out -Force
   ```

5. zip 내용 확인
   ```powershell
   Add-Type -Assembly System.IO.Compression.FileSystem
   $zip = [System.IO.Compression.ZipFile]::OpenRead($out)
   $zip.Entries | Select-Object FullName, Length
   $zip.Dispose()
   ```
   기대: 최상위에 `manifest.json` 이 있고, 폴더로 한 단계 더 감싸여 있지 않을 것.

### macOS / Linux 기준 (참고용)

```bash
# 본 저장소 외부에 작업 폴더 생성
work=$(mktemp -d)
src="/path/to/reject-analyzer/extension/passmap-selection-import"

cp "$src/manifest.json"      "$work/"
cp "$src/background.js"      "$work/"
cp "$src/content-passmap.js" "$work/"
cp -R "$src/icons"           "$work/"

version=$(node -p "require('$work/manifest.json').version")
out="/tmp/passmap-selection-import-$version.zip"

# zip 루트에 manifest.json이 오도록 — 폴더 안에서 압축
( cd "$work" && zip -r "$out" . -x "*.md" "*.DS_Store" )

# 검증
unzip -l "$out"
```

---

## 5. 최종 검증 체크리스트

zip 생성 후 Chrome 개발자 대시보드에 올리기 전 다음을 점검합니다.

- [ ] zip 파일 크기가 비정상적으로 크지 않은가 (확장 자체는 보통 10KB 미만이어야 합니다)
- [ ] zip 루트에 `manifest.json` 이 있는가
- [ ] zip 안에 `node_modules`, `.git`, `.env`, `*.key`, `package.json` 이 없는가
- [ ] zip 안에 `.md` 파일이 없는가
- [ ] 아이콘이 포함된 경우, manifest의 `icons` 경로와 실제 파일 경로가 정확히 일치하는가
- [ ] manifest의 `version` 이 기존 스토어 등록 버전보다 크거나 첫 등록 버전인가
- [ ] manifest의 `host_permissions` 가 `https://reject-analyzer.vercel.app/*` 단 하나인가
- [ ] manifest의 `permissions` 에 `contextMenus`, `storage`, `tabs` 외 항목이 없는가

위 항목이 모두 통과하면 zip을 Chrome 개발자 대시보드에 업로드합니다.

---

## 6. 업로드 후 즉시 수행할 일

본 문서는 zip 생성까지만 다룹니다. 그 이후 단계는 운영자가 수행합니다.

1. Chrome 개발자 대시보드에서 zip 업로드
2. STORE_LISTING_DRAFT.md 의 내용을 listing 폼에 입력
3. 스크린샷, 프로모션 타일 업로드
4. 권한 사유 입력
5. 개인정보처리방침 공개 URL 입력
6. 공개 범위는 **1차 Unlisted** 로 설정 후 제출
7. 심사 통과 후 내부 테스트를 거쳐 **Public** 으로 전환

---

## 7. 본 절차를 자동화하지 않는 이유

- 본 확장은 빌드 단계가 없고 정적 파일 3개 + 아이콘으로 구성됩니다. 스크립트보다 사람이 직접 확인하는 편이 비밀 누출 위험이 더 낮습니다.
- npm/node 의존성, 환경변수, 빌드 산출물이 없으므로 자동화의 장점이 거의 없습니다.
- 자동화를 추가하면 `package.json` 등 본 확장에는 필요하지 않은 파일을 도입해야 하므로 스토어 정책 검수가 더 복잡해집니다.

향후 확장이 빌드 단계를 갖게 되거나 파일 수가 늘어나면 그때 별도 스크립트 도입을 재검토합니다.
