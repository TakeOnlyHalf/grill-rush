import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { preloadCriticalAssets, preloadImages } from './utils/assets'
import { FOOD_IMAGE_URLS } from './utils/foodIcons'
import { requestBgm } from './audio/bgm'
import './index.css'

/** GitHub Pages 등 원격 환경에서 탭 전환 시 이미지가 늦게 뜨지 않도록 부트 직후 프리로드 */
void preloadCriticalAssets()
void preloadImages(FOOD_IMAGE_URLS)

/** 타이틀 BGM 자동 재생 시도 (브라우저가 허용하는 경우 클릭 없이 시작) */
requestBgm('title')

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
