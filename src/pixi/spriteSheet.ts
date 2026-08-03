import { Rectangle, Texture } from 'pixi.js'

export interface ChromaKeyOptions {
  /** 제거할 배경색 (기본: 크로마키 그린) */
  color?: { r: number; g: number; b: number }
  /** 배경으로 판단할 색상 거리 허용치 */
  tolerance?: number
}

export interface GridSpriteSheetOptions {
  /** 세로 프레임 수 */
  rows: number
  /** 가로 프레임 수 */
  cols: number
  /** 배경 제거 옵션. false로 끌 수 있다. */
  chromaKey?: ChromaKeyOptions | false
}

const DEFAULT_CHROMA_KEY: Required<ChromaKeyOptions> = {
  color: { r: 0, g: 255, b: 0 },
  tolerance: 140,
}

/** 이미지를 로드해 크로마키를 적용한 캔버스를 반환한다 (Pixi Texture와 DOM data URL이 공유하는 전처리 단계). */
async function loadChromaKeyedCanvas(
  url: string,
  chromaKey: ChromaKeyOptions | false = DEFAULT_CHROMA_KEY,
): Promise<HTMLCanvasElement> {
  const image = new Image()
  image.src = url
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D 캔버스 컨텍스트를 생성할 수 없습니다.')
  ctx.drawImage(image, 0, 0)

  if (chromaKey) {
    applyChromaKey(ctx, canvas.width, canvas.height, {
      ...DEFAULT_CHROMA_KEY,
      ...chromaKey,
    })
  }

  return canvas
}

/**
 * 크로마키를 적용한 스프라이트시트를 PNG data URL로 반환한다.
 * DOM(<img>/CSS background)에서 재사용할 때 쓴다 — Pixi 없이도 동일한 배경 제거 로직을 공유한다.
 */
export async function loadChromaKeyedDataUrl(
  url: string,
  chromaKey: ChromaKeyOptions | false = DEFAULT_CHROMA_KEY,
): Promise<string> {
  const canvas = await loadChromaKeyedCanvas(url, chromaKey)
  return canvas.toDataURL('image/png')
}

/**
 * 이미지 URL을 rows x cols 그리드로 잘라 Texture[row][col] 배열로 반환한다.
 * chromaKey가 켜져 있으면(기본값) 지정 색상에 가까운 픽셀을 투명 처리해
 * 그린스크린으로 제작된 스프라이트시트를 바로 사용할 수 있게 한다.
 */
export async function loadGridSpriteSheet(
  url: string,
  { rows, cols, chromaKey = DEFAULT_CHROMA_KEY }: GridSpriteSheetOptions,
): Promise<Texture[][]> {
  const canvas = await loadChromaKeyedCanvas(url, chromaKey)
  const baseTexture = Texture.from(canvas)
  const frameW = canvas.width / cols
  const frameH = canvas.height / rows

  const grid: Texture[][] = []
  for (let row = 0; row < rows; row += 1) {
    const rowTextures: Texture[] = []
    for (let col = 0; col < cols; col += 1) {
      rowTextures.push(
        new Texture({
          source: baseTexture.source,
          frame: new Rectangle(col * frameW, row * frameH, frameW, frameH),
        }),
      )
    }
    grid.push(rowTextures)
  }
  return grid
}

/** 그린스크린 배경을 투명 처리하고, 경계 픽셀의 초록빛 번짐을 완화한다. */
function applyChromaKey(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  { color, tolerance }: Required<ChromaKeyOptions>,
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData
  const edgeBand = tolerance * 0.6

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const dist = Math.sqrt((r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2)

    if (dist < tolerance) {
      data[i + 3] = 0
    } else if (dist < tolerance + edgeBand) {
      const fade = (dist - tolerance) / edgeBand
      data[i + 3] = Math.round(data[i + 3] * fade)
      data[i + 1] = Math.min(g, Math.max(r, b))
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
