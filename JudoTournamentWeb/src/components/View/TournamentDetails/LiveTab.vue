<template>
  <div class="tab-section live-section">
    <h2>Прямая трансляция</h2>
    <div class="stream-player">
      <div class="video-placeholder">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <p>Трансляция начнется в назначенное время</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-section { padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); min-height: 300px; }
.live-section .stream-player { aspect-ratio: 16 / 9; width: 100%; max-width: none; border: 2px solid #e0b456; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
.live-section .video-placeholder { height: 100%; background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; }
.live-section .video-placeholder svg { margin-bottom: 1rem; color: #c89b3c; }
.live-section .video-placeholder p { font-size: 1rem; margin: 0; text-align: center; }
.tab-section h2 { font-size: 1.6rem; margin: 0 0 1.5rem; text-align: center; color: #1a1a1a; }
</style>