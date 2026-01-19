<template>
  <div class="registration-athletes-page">
    <div class="registration-container">
      <section class="registration-navigation">
        <h2>Регистрация участников</h2>
        <nav class="nav-tabs">

          <button
              class="nav-tab"
              :class="{ active: activeTab === 'weighing' }"
              @click="activeTab = 'weighing'"
          >
            Взвешивание
          </button>
        </nav>
      </section>

      <section class="registration-content">
        <!-- TOAST УВЕДОМЛЕНИЕ -->
        <transition name="fade">
          <div v-if="toast.visible" class="toast-notification" :class="toast.type">
            <div class="toast-content">
              <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
              <span class="toast-message">{{ toast.message }}</span>
            </div>
          </div>
        </transition>


        <Weighing
            v-if="activeTab === 'weighing'"
            :toast="toast"
            @show-toast="showToast"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Weighing from '@/components/View/RegistrationAthletes/WeighingForm.vue'
import "./RegistrationAthletes.css"


const activeTab = ref('add-athlete')

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

const handleAthleteCreated = () => {
  // Можно добавить логику при создании спортсмена
  console.log('Спортсмен создан')
}
</script>

<style scoped>
</style>