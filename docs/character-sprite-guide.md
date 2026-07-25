# 캐릭터 스프라이트 생성 가이드

## 개요

캐릭터는 **데이터(JSON) + 스프라이트 설정(registry) + 이미지(시트)** 세 가지로 구성됩니다.  
새 캐릭터를 추가하거나 같은 캐릭터를 여러 개 화면에 올리는 방법을 설명합니다.

---

## 아키텍처 흐름

```
customers.json          → 손님 게임 데이터 (patience, tipChance 등)
customerRegistry.ts     → 스프라이트시트 설정 (경로, rows/cols, 상태-행 매핑)
customerSprite.ts       → 로딩 + 캐싱 + AnimatedSprite 인스턴스 생성
StreetScene.ts          → 씬에서 인스턴스를 만들어 stage에 추가
```

---

## 지원하는 애니메이션 상태

```ts
type CustomerAnimationState = 'idle' | 'walk' | 'happy' | 'sad'
```

스프라이트시트의 **각 행(row)** 이 하나의 상태에 대응합니다.

```
row 0 → idle
row 1 → walk
row 2 → happy
row 3 → sad
```

---

## 새 캐릭터 추가 절차

### 1단계 — 스프라이트시트 준비

- 그린스크린(#00ff00) 배경으로 제작 (크로마키 자동 처리됨)
- 레이아웃: `rows × cols` 균등 그리드
- 예: 4행 6열 → 24프레임 (상태 4개 × 프레임 6개)
- 파일 위치: `public/sprite-sheet/<파일명>.jpg`

### 2단계 — customers.json에 손님 데이터 추가

`src/data/customers.json`

```json
{
  "id": "student",
  "name": "학생",
  "icon": "🎒",
  "patience": 20,
  "tipChance": 0.08,
  "priceSensitivity": 1.2
}
```

`id` 는 registry의 `type` 과 반드시 일치해야 합니다.

### 3단계 — customerRegistry.ts에 스프라이트 설정 추가

`src/pixi/sprites/customerRegistry.ts`

```ts
import { publicUrl } from '../../utils/assets'
import type { CustomerSpriteConfig } from './customerSprite'

const STUDENT: CustomerSpriteConfig = {
  type: 'student',                                          // customers.json id와 동일
  sheetUrl: publicUrl('sprite-sheet/student_sheet.jpg'),   // public/ 기준 경로
  rows: 4,
  cols: 6,
  animationRows: { idle: 0, walk: 1, happy: 2, sad: 3 },  // 행 번호 매핑
}

export const CUSTOMER_SPRITES: Record<string, CustomerSpriteConfig> = {
  office: OFFICE_WORKER_FOX,
  student: STUDENT,   // 여기에만 추가하면 끝
}
```

이것으로 추가 완료입니다. StreetScene 등 씬 코드는 수정하지 않아도 됩니다.

---

## 인스턴스 생성 방법

### 기본 패턴

```ts
import { loadCustomerFrames, createCustomerSprite } from './sprites/customerSprite'
import { getCustomerSpriteConfig } from './sprites/customerRegistry'

const config = getCustomerSpriteConfig('student')  // registry에서 설정 조회
if (!config) return                                 // 설정 없으면 플레이스홀더로 대체

const frames = await loadCustomerFrames(config)    // 시트 로드 + 크로마키 처리
const { sprite, setAnimation } = createCustomerSprite(frames, 'idle')

sprite.x = 100
sprite.y = 200
app.stage.addChild(sprite)
```

### 상태 전환

```ts
setAnimation('walk')   // 걷기
setAnimation('happy')  // 주문 완료 등 긍정 반응
setAnimation('sad')    // 이탈 등 부정 반응
setAnimation('idle')   // 대기
```

같은 상태로 중복 호출해도 안전합니다 (내부에서 중복 전환을 무시합니다).

---

## 동일 캐릭터 다중 인스턴스

**가능합니다.** 설계상 지원됩니다.

### 작동 원리

| 계층 | 공유 여부 | 설명 |
|---|---|---|
| `Texture` (이미지 데이터) | **공유** | `framesCache`에 type별로 캐싱 — 이미지는 한 번만 로드 |
| `AnimatedSprite` 인스턴스 | **독립** | `createCustomerSprite` 호출마다 새 객체 생성 |
| 애니메이션 상태 | **독립** | 각 인스턴스가 자체 `current` 상태 보유 |

```ts
const frames = await loadCustomerFrames(config)   // Texture는 한 번만 로드 (캐시됨)

const customer1 = createCustomerSprite(frames, 'idle')
const customer2 = createCustomerSprite(frames, 'walk')  // 같은 frames, 다른 인스턴스
const customer3 = createCustomerSprite(frames, 'idle')

// 각자 독립적으로 상태 전환 가능
customer1.setAnimation('happy')   // customer2, customer3에 영향 없음
customer2.setAnimation('sad')

app.stage.addChild(customer1.sprite)
app.stage.addChild(customer2.sprite)
app.stage.addChild(customer3.sprite)
```

`loadCustomerFrames`를 여러 번 호출해도 실제 로딩은 한 번만 실행됩니다.  
인스턴스 수에 관계없이 메모리 중복 없이 동작합니다.

---

## 스프라이트 설정이 없는 경우

registry에 등록되지 않은 타입은 StreetScene이 자동으로 **플레이스홀더 도형**(회색 원+사각형)으로 대체합니다.  
게임 실행에는 영향이 없으며, 이미지가 준비되면 registry에 추가하기만 하면 됩니다.

---

## 현재 등록 현황

| customers.json id | registry 등록 | 스프라이트 |
|---|---|---|
| `office` | ✅ | worker_fox_sprite_sheet.jpg |
| `student` | ❌ | 미제작 |
| `family` | ❌ | 미제작 |
| `tourist` | ❌ | 미제작 |
| `foodie` | ❌ | 미제작 |

---

## 체크리스트 (새 캐릭터 추가 시)

- [ ] `public/sprite-sheet/` 에 스프라이트시트 이미지 배치
- [ ] `src/data/customers.json` 에 손님 데이터 추가 (`id` 확인)
- [ ] `src/pixi/sprites/customerRegistry.ts` 에 `CustomerSpriteConfig` 추가 후 `CUSTOMER_SPRITES` 에 등록
