<!-- ManageRoles.vue – с модальным окном выбора роли -->
<template>
  <div class="roles-management-page">
    <div class="management-container">
      <section class="management-content">
        <!-- Уведомление (toast) -->
        <transition name="fade">
          <div v-if="toast.visible" class="toast-notification" :class="toast.type">
            <div class="toast-content">
              <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
              <span class="toast-message">{{ toast.message }}</span>
            </div>
          </div>
        </transition>

        <!-- Модальное окно выбора -->
        <div v-if="showModal" class="modal-overlay" @click="closeModalIfOverlay">
          <div class="modal-content" @click.stop>
            <h3 class="modal-title">Выберите действие</h3>
            <p class="modal-text">Вы хотите зарегистрироваться как участник или войти как зритель?</p>
            <div class="modal-actions">
              <button @click="goToLogin" class="modal-button secondary">
                Войти как зритель
              </button>
              <button @click="registerAsAthlete" class="modal-button primary">
                Зарегистрироваться как участник
              </button>
            </div>
          </div>
        </div>

        <!-- Форма спортсмена (показывается всегда, но под модалкой будет недоступна) -->
        <AthleteRole @show-toast="showToast" />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'  // Добавлен роутер
import AthleteRole from './AthleteRole.vue'
import './Roles.css'

const router = useRouter()

// Состояние уведомления
const toast = ref({
  visible: false,
  message: '',
  type: 'success'
})

const showToast = (message, type = 'success', duration = 3000) => {
  toast.value = { visible: true, message, type }
  setTimeout(() => {
    toast.value.visible = false
  }, duration)
}

// Состояние модалки
const showModal = ref(true)

const closeModalIfOverlay = (event) => {
  if (event.target === event.currentTarget) {
    // Закрытие по клику на оверлей (опционально, можно убрать)
    // showModal.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

const registerAsAthlete = () => {
  showModal.value = false
}
</script>