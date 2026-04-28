<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
          v-if="visible"
          class="focus-overlay"
          @click="activate"
      >
        <div class="focus-card">
          <div class="focus-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="4" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2.5"/>
              <rect x="30" y="4" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2.5"/>
              <rect x="4" y="30" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2.5"/>
              <rect x="30" y="30" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2.5"/>
              <circle cx="24" cy="24" r="4" fill="currentColor"/>
            </svg>
          </div>
          <div class="focus-title">АКТИВИРОВАТЬ ТАБЛО</div>
          <div class="focus-sub">Нажмите в любое место для активации управления</div>
          <div class="focus-hint">
            <span class="hint-key">SPACE</span> старт/стоп
            <span class="hint-key">Q W E</span> белый
            <span class="hint-key">I O P</span> синий
          </div>
          <div class="focus-pulse" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'FocusModal',

  props: {
    visible: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['activate'],

  methods: {
    activate() {
      this.$emit('activate')
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Rajdhani:wght@500;700&display=swap');

.focus-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(5, 8, 20, 0.88);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.focus-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 4rem;
  background: linear-gradient(135deg, #0d1b3e 0%, #0a0f1e 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow:
      0 0 0 1px rgba(244, 208, 63, 0.15),
      0 40px 80px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  text-align: center;
  user-select: none;
  overflow: hidden;
}

.focus-icon {
  color: #f4d03f;
  margin-bottom: 0.5rem;
  animation: icon-breathe 2.5s ease-in-out infinite;
}

.focus-title {
  font-family: 'Oswald', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.focus-sub {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.08em;
  max-width: 320px;
}

.focus-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hint-key {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  font-family: 'Oswald', monospace;
  font-size: 0.75rem;
  color: #f4d03f;
  letter-spacing: 0.1em;
}

/* Пульсирующий ореол сзади */
.focus-pulse {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
  box-shadow: 0 0 0 0 rgba(244, 208, 63, 0.3);
  animation: pulse-ring 2.5s ease-out infinite;
}

/* Переход появления/скрытия */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease, backdrop-filter 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes icon-breathe {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%       { transform: scale(1.1); opacity: 0.7; }
}

@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0   rgba(244, 208, 63, 0.25); }
  70%  { box-shadow: 0 0 0 20px rgba(244, 208, 63, 0); }
  100% { box-shadow: 0 0 0 0   rgba(244, 208, 63, 0); }
}
</style>