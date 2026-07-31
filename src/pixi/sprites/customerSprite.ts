import { Sprite, type Texture } from 'pixi.js'

/** 캐릭터 포트레이트 Texture로 손님 스프라이트를 만든다 (앵커: 발밑 중앙) */
export function createCustomerSprite(texture: Texture): Sprite {
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5, 1)
  return sprite
}
