import type { CSSProperties } from 'react'
import { publicUrl } from './assets'

/**
 * public/images/foods 실사풍 음식 사진 — 재료 12종 중 sauce를 뺀 11종과 메뉴 8종의 아이콘 자리에 이모지 대신 쓴다.
 * "_set" 파일은 한 이미지 안에 여러 컷(재료/완성 접시)이 흩어져 있어, 알파 바운딩박스를 실측해서
 * CSS crop-to-fill(background-size/position 퍼센트) 방식으로 필요한 부분만 잘라 보여준다.
 * sauce(BBQ 소스)는 깨끗하게 잘라 쓸 만한 소스 사진이 없어 데이터의 용기 이모지를 그대로 쓴다.
 */
const FOODS_DIR = 'images/foods/'
const CANVAS_W = 1536
const CANVAS_H = 1024

function foodUrl(file: string): string {
  return publicUrl(FOODS_DIR + file)
}

interface CropStyle {
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
}

/** 크롭 주변에 여백을 둬 가장자리가 잘려 보이지 않게 한다. */
function crop(
  file: string,
  x: number,
  y: number,
  w: number,
  h: number,
  padRatio = 0.1,
): CropStyle {
  const padX = Math.round(w * padRatio)
  const padY = Math.round(h * padRatio)
  let nx = x - padX
  let ny = y - padY
  let nw = w + padX * 2
  let nh = h + padY * 2

  if (nx < 0) {
    nw += nx
    nx = 0
  }
  if (ny < 0) {
    nh += ny
    ny = 0
  }
  if (nx + nw > CANVAS_W) nw = CANVAS_W - nx
  if (ny + nh > CANVAS_H) nh = CANVAS_H - ny

  const sizeW = (100 * CANVAS_W) / nw
  const sizeH = (100 * CANVAS_H) / nh
  const posX = nw >= CANVAS_W ? 50 : (100 * nx) / (CANVAS_W - nw)
  const posY = nh >= CANVAS_H ? 50 : (100 * ny) / (CANVAS_H - nh)
  return {
    backgroundImage: `url(${foodUrl(file)})`,
    backgroundSize: `${sizeW.toFixed(2)}% ${sizeH.toFixed(2)}%`,
    backgroundPosition: `${posX.toFixed(2)}% ${posY.toFixed(2)}%`,
  }
}

/** 재료 id → 사진 크롭 스타일. sauce는 매핑이 없어 emoji로 자연히 폴백된다. */
export const INGREDIENT_FOOD_STYLE: Partial<Record<string, CSSProperties>> = {
  egg: crop('egg_bacon_toast_set.webp', 150, 110, 550, 330),
  bacon: crop('egg_bacon_toast_set.webp', 800, 120, 650, 310),
  sausage: crop('sausage.webp', 430, 270, 680, 470),
  corn: crop('corn.webp', 390, 240, 720, 560),
  patty: crop('patty.webp', 370, 240, 800, 580),
  chicken: crop('chicken_set.webp', 130, 580, 520, 320),
  shrimp: crop('shrimp_set.webp', 60, 70, 520, 360),
  steak: crop('steak_set.webp', 90, 500, 600, 380),
  bun: crop('burger_set.webp', 70, 50, 440, 280),
  veggie: crop('salad.webp', 310, 170, 880, 710),
  cheese: crop('cheese.webp', 400, 180, 700, 650),
}

/** 메뉴 id → 완성 접시 사진 크롭 스타일 */
export const MENU_FOOD_STYLE: Partial<Record<string, CSSProperties>> = {
  egg_bacon: crop('egg_bacon_toast_set.webp', 760, 500, 720, 420),
  grilled_corn: crop('corn_set.webp', 640, 420, 820, 520),
  grilled_sausage: crop('sausage_set.webp', 600, 470, 820, 480),
  classic_burger: crop('cheeseburger.webp', 370, 180, 800, 700),
  grilled_chicken: crop('chicken_set.webp', 700, 430, 760, 500),
  shrimp_skewer: crop('shrimp_set.webp', 760, 480, 740, 460),
  grilled_steak: crop('steak_set.webp', 700, 430, 800, 520),
  grill_platter: crop('bbq_platter_set.webp', 640, 400, 820, 520),
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
