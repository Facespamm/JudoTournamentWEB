<template>
  <div class="tab-section live-section">
    <h2>Прямая трансляция</h2>

    <div class="stream-wrapper">
      <div class="stream-player">
        <div class="video-placeholder">
          <div class="play-icon">
            <svg width="44" height="44" viewBox="0 0 20 20" fill="currentColor"><polygon points="4,2 18,10 4,18"/></svg>
          </div>
          <p class="stream-label">Трансляция начнётся в назначенное время</p>
        </div>
      </div>

      <div class="stream-meta">
        <div class="meta-item">
          <span class="meta-dot offline"></span>
          <span>Оффлайн</span>
        </div>
        <div class="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Скоро начнётся</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-section {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.tab-section h2 {
  font-size: 1.3rem;
  margin: 0 0 1.2rem;
  color: #1a1a1a;
  font-weight: 700;
}

.stream-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  max-width: 560px;
  margin: 0 auto;
}

.stream-player {
  aspect-ratio: 16 / 9;
  width: 100%;
  border: 2px solid #e0b456;
  border-radius: 10px;
  overflow: hidden;
}

.video-placeholder {
  width: 100%;
  height: 100%;
  background: #f7f4ef;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  position: relative;
}

.play-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c89b3c;
  position: relative;
  z-index: 1;
}



.stream-label {
  font-size: 0.82rem;
  color: #999;
  margin: 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.stream-meta {
  display: flex;
  gap: 1.2rem;
  padding: 0 0.2rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #888;
}

.meta-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.meta-dot.offline { background: #ccc; }
.meta-dot.live    { background: #e53e3e; animation: blink 1s infinite; }


@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
</style>