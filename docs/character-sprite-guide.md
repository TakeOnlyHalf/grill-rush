# 캐릭터 스프라이트 생성 가이드

## 개요

손님 캐릭터는 **데이터(JSON) + 캐릭터 시트(portraits) + 매핑(registry)** 세 가지로 구성됩니다.
`characters_sprite_sheet.webp` 한 장(3×3 그리드, 캐릭터 9종)에서 손님 타입별로 어울리는 일러스트를 골라 보여주는 방식입니다.

---

## 아키텍처 흐름

```
customers.json           → 손님 게임 데이터 (patience, tipChance 등)
characterPortraits.ts    → 캐릭터 시트 로드 + 칸(cell)별 Texture 캐싱
customerRegistry.ts      → 손님 타입 → 캐릭터 배리에이션 매핑
customerSprite.ts        → Texture로 정적 Sprite 인스턴스 생성
StreetScene.ts           → 씬에서 인스턴스를 만들어 stage에 추가
```

---

## 캐릭터 시트

- 파일 위치: `public/sprite-sheet/characters_sprite_sheet.webp`
- 레이아웃: 3행 × 3열, 칸마다 완성된 캐릭터 일러스트 한 장 (걷기 등 애니메이션 프레임 아님)
- 흰/투명 배경의 완성 아트라 **크로마키 처리가 필요 없음** (`loadGridSpriteSheet`에 `chromaKey: false`로 전달)
- 칸 순서(왼→오, 위→아래)는 `characterPortraits.ts`의 `CHARACTER_KEYS`와 1:1 대응:

  ```
  wolfChef      otterJogger    bearHiker
  catHoodie     deerPolice     retrieverDress
  foxCardigan   rabbitSuit     raccoonCoat
  ```

---

## 새 손님 타입 추가 절차

### 1단계 — customers.json에 손님 데이터 추가

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

### 2단계 — customerRegistry.ts에 캐릭터 매핑 추가

`src/pixi/sprites/customerRegistry.ts`

```ts
export const CUSTOMER_CHARACTERS: Record<string, CharacterKey[]> = {
  office: ['rabbitSuit', 'deerPolice'],
  student: ['catHoodie', 'otterJogger'], // 여기에만 추가하면 끝
}
```

- 배열에 여러 `CharacterKey`를 넣으면 랜덤으로 골라 표시되어 시각적으로 다양해집니다(직전 손님과 같은 캐릭터는 제외).
- 새 캐릭터 그림 자체가 필요하면(시트에 없는 종/의상) 새 시트 이미지를 만들어 `characterPortraits.ts`의 그리드/키 목록을 확장해야 합니다.

이것으로 추가 완료입니다. StreetScene 등 씬 코드는 수정하지 않아도 됩니다.

---

## 인스턴스 생성 방법

```ts
import { loadCharacterPortraits, createCustomerSprite, pickRandomGuestCharacter } from './pixi'

const portraits = await loadCharacterPortraits() // 시트 로드 + 캐싱 (한 번만 실행됨)
const guestKey = pickRandomGuestCharacter('student', usedGuests) // usedGuests(Set)에 담긴 캐릭터와 겹치지 않게 랜덤 선택
if (guestKey) {
  const sprite = createCustomerSprite(portraits[guestKey])
  sprite.x = 100
  sprite.y = 200
  app.stage.addChild(sprite)
}
```

- `Texture`는 시트 전체 기준으로 한 번만 로드/캐싱되고, `createCustomerSprite`를 호출할 때마다 독립된 `Sprite` 인스턴스가 생성됩니다.
- 캐릭터는 정적 일러스트이므로 애니메이션 상태(idle/walk 등) 전환은 없습니다. 대기 중인 느낌은 `StreetScene`의 틱 핸들러가 위아래로 살짝 흔드는 것으로 표현합니다.

---

## 매핑이 없는 손님 타입

`CUSTOMER_CHARACTERS`에 등록되지 않은 타입은 `StreetScene`이 자동으로 **플레이스홀더 도형**(회색 원+사각형)으로 대체합니다. 게임 실행에는 영향이 없으며, 매핑을 추가하기만 하면 됩니다.

---

## 현재 등록 현황

| customers.json id | 배정된 캐릭터 |
|---|---|
| `office` | rabbitSuit, deerPolice |
| `student` | catHoodie, otterJogger |
| `family` | retrieverDress, foxCardigan |
| `tourist` | bearHiker, raccoonCoat |
| `foodie` | wolfChef |

---

## 체크리스트 (새 손님 타입 추가 시)

- [ ] `src/data/customers.json` 에 손님 데이터 추가 (`id` 확인)
- [ ] `src/pixi/sprites/customerRegistry.ts` 의 `CUSTOMER_CHARACTERS` 에 캐릭터 배리에이션 등록
- [ ] (시트에 없는 새 캐릭터가 필요하면) 시트 이미지 갱신 후 `characterPortraits.ts` 의 `CHARACTER_KEYS`/그리드 갱신
