/**
 * PixiJS 게임 렌더 레이어
 *
 * React는 HUD·페이즈·상태, Pixi는 거리 뷰·미니게임·스프라이트 연출을 담당한다.
 * 새 씬은 `scenes/`에 추가하고 PixiStage + create*Scene 패턴을 따른다.
 */
export { default as PixiStage } from './PixiStage'
export { PIXI_COLORS } from './colors'
export { createStreetScene } from './scenes/StreetScene'
export { createTimingBarScene } from './scenes/TimingBarScene'
export { loadGridSpriteSheet } from './spriteSheet'
export { loadCustomerFrames, createCustomerSprite } from './sprites/customerSprite'
export { CUSTOMER_SPRITES, getCustomerSpriteConfig } from './sprites/customerRegistry'
export { createPrepCityScene } from './scenes/PrepCityScene'
export { createPrepLocationScene } from './scenes/PrepLocationScene'
export { createIngredientMarketScene } from './scenes/IngredientMarketScene'
export { createMenuBoardScene } from './scenes/MenuBoardScene'
