import type { CSSProperties } from 'react'
import { publicUrl } from './assets'

/**
 * public/images/foods 실사풍 음식 사진 — 재료 12종 중 sauce를 뺀 11종과 메뉴 8종의 아이콘 자리에 이모지 대신 쓴다.
 * "_set" 파일은 한 이미지 안에 여러 컷(재료/완성 접시)이 흩어져 있어, 알파 바운딩박스를 실측해서
 * CSS crop-to-fill(background-size/position 퍼센트) 방식으로 필요한 부분만 잘라 보여준다.
 * sauce(BBQ 소스)는 깨끗하게 잘라 쓸 만한 소스 사진이 없어 기존 이모지(🫙)를 그대로 쓴다.
 */
const FOODS_DIR = 'images/foods/'

function foodUrl(file: string): string {
  return publicUrl(FOODS_DIR + file)
}

interface CropStyle {
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
}

function crop(file: string, x: number, y: number, w: number, h: number): CropStyle {
  const CANVAS_W = 1536
  const CANVAS_H = 1024
  const sizeW = (100 * CANVAS_W) / w
  const sizeH = (100 * CANVAS_H) / h
  const posX = w >= CANVAS_W ? 50 : (100 * x) / (CANVAS_W - w)
  const posY = h >= CANVAS_H ? 50 : (100 * y) / (CANVAS_H - h)
  return {
    backgroundImage: `url(${foodUrl(file)})`,
    backgroundSize: `${sizeW.toFixed(2)}% ${sizeH.toFixed(2)}%`,
    backgroundPosition: `${posX.toFixed(2)}% ${posY.toFixed(2)}%`,
  }
}

/** 재료 id → 사진 크롭 스타일. sauce는 매핑이 없어 emoji로 자연히 폴백된다. */
export const INGREDIENT_FOOD_STYLE: Partial<Record<string, CSSProperties>> = {
  egg: crop('egg_bacon_toast_set.webp', 160, 128, 524, 288),
  bacon: crop('egg_bacon_toast_set.webp', 816, 136, 620, 276),
  sausage: crop('sausage.webp', 444, 292, 652, 432),
  corn: crop('corn.webp', 408, 256, 688, 536),
  patty: crop('patty.webp', 388, 260, 764, 548),
  chicken: crop('chicken_set.webp', 144, 608, 480, 284),
  shrimp: crop('shrimp_set.webp', 124, 92, 440, 304),
  steak: crop('steak_set.webp', 104, 532, 560, 332),
  bun: crop('burger_set.webp', 92, 72, 384, 216),
  veggie: crop('salad.webp', 328, 192, 844, 672),
  cheese: crop('cheese.webp', 424, 200, 668, 620),
}

/** 메뉴 id → 완성 접시 사진 크롭 스타일 */
export const MENU_FOOD_STYLE: Partial<Record<string, CSSProperties>> = {
  egg_bacon: crop('egg_bacon_toast_set.webp', 788, 524, 676, 380),
  grilled_corn: crop('corn_set.webp', 660, 444, 776, 484),
  grilled_sausage: crop('sausage_set.webp', 620, 492, 788, 452),
  classic_burger: crop('cheeseburger.webp', 396, 208, 748, 648),
  grilled_chicken: crop('chicken_set.webp', 728, 464, 732, 452),
  shrimp_skewer: crop('shrimp_set.webp', 784, 512, 696, 424),
  grilled_steak: crop('steak_set.webp', 728, 460, 768, 484),
  grill_platter: crop('bbq_platter_set.webp', 660, 424, 780, 492),
}

/** 프리로드용 — 매핑에 쓰인 원본 이미지 파일 전체(중복 제거) */
export const FOOD_IMAGE_URLS: readonly string[] = Array.from(
  new Set(
    [
      'egg_bacon_toast_set.webp',
      'sausage.webp',
      'corn.webp',
      'patty.webp',
      'chicken_set.webp',
      'shrimp_set.webp',
      'steak_set.webp',
      'burger_set.webp',
      'salad.webp',
      'cheese.webp',
      'corn_set.webp',
      'sausage_set.webp',
      'cheeseburger.webp',
      'bbq_platter_set.webp',
    ].map(foodUrl),
  ),
)
