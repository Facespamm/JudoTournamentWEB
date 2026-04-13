<template>
  <div class="registration-athletes-page">
    <!-- TOAST УВЕДОМЛЕНИЕ (overlay, bottom-right) -->
    <transition name="fade">
      <div v-if="toast.visible" class="toast-notification" :class="toast.type">
        <div class="toast-content">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </div>
    </transition>

    <section class="registration-navigation">
      <h2>Регистрация звешивания</h2>
      <!--<nav class="nav-tabs">
        <button
            class="nav-tab"
            :class="{ active: activeTab === 'weighing' }"
            @click="activeTab = 'weighing'"
        >
          Взвешивание
        </button>
      </nav>-->
    </section>

    <section class="registration-content">
      <Weighing
          v-if="activeTab === 'weighing'"
          :toast="toast"
          @show-toast="showToast"
      />
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Weighing from '@/components/View/RegistrationAthletes/WeighingForm.vue'
import "./RegistrationAthletes.css"

const activeTab = ref('weighing')

// Toast состояние
const toast = ref({
  visible: false,
  message: '',
  type: 'success'
})

// Универсальная функция показа toast
const showToast = (message, type = 'success', duration = type === 'success' ? 3000 : 4000) => {
  toast.value = { visible: true, message, type }
  setTimeout(() => {
    toast.value.visible = false
  }, duration)
}
</script>

<style scoped>
/* Локальные стили только для toast — дублируют те, что в RegistrationAthletes.css,
   чтобы они точно применялись (scoped имеет приоритет) */
.toast-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  min-width: 320px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  z-index: 10000;
  animation: slideIn 0.4s ease-out;
}

.toast-notification.success {
  background: linear-gradient(135deg, #28a745, #34ce57);
}

.toast-notification.error {
  background: linear-gradient(135deg, #dc3545, #e4606d);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@media (max-width: 768px) {
  .toast-notification {
    left: 20px;
    right: 20px;
    bottom: 20px;
    min-width: auto;
  }
}
</style>