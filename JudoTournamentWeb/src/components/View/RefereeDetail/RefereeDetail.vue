<template>
  <div class="athlete-detail">
    <div class="athlete-detail-container">
      <!-- Заголовок и кнопка назад -->
      <div class="athlete-detail-header">
        <button class="back-button" @click="$router.back()">
          ← Назад
        </button>
        <h1>Профиль Судьи</h1>
      </div>

      <!-- Лоадер -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка данных судьи...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button class="retry-button" @click="loadRefereeDetail">Попробовать снова</button>
      </div>

      <!-- Детальная информация -->
      <div v-else-if="referee" class="athlete-info">
        <div class="athlete-main-info">
          <h2 class="athlete-name">{{ getFullName(referee) }}</h2>
          <div class="athlete-badge">{{ referee.certification_level }}</div>
        </div>

        <div class="athlete-details-grid">
          <div class="detail-section">
            <h3>Основная информация</h3>
            <div class="detail-item">
              <span class="detail-label">Фамилия:</span>
              <span class="detail-value">{{ referee.last_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Имя:</span>
              <span class="detail-value">{{ referee.first_name }}</span>
            </div>
            <div v-if="referee.middle_name" class="detail-item">
              <span class="detail-label">Отчество:</span>
              <span class="detail-value">{{ referee.middle_name }}</span>
            </div>
          </div> <!-- Этот div закрывает первый detail-section -->

          <div class="detail-section">
            <h3>Контактная информация</h3>
            <div v-if="referee.phone" class="detail-item">
              <span class="detail-label">Телефон:</span>
              <span class="detail-value">{{ referee.phone }}</span>
            </div>
            <div v-if="referee.email" class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ referee.email }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchRefereeDetail } from './fetchRefereeDetail.js'
import "./RefereeDetail.css"

const route = useRoute()
const referee = ref(null)
const isLoading = ref(true)
const error = ref('')

const getFullName = (referee) => {
  if (referee.full_name) return referee.full_name
  return `${referee.last_name || ''} ${referee.first_name || ''} ${referee.middle_name || ''}`.trim()
}

// Загрузка данных атлета
const loadRefereeDetail = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const athleteId = Number(route.params.id)
    if (isNaN(athleteId)) {
      throw new Error('Неверный ID спортсмена')
    }

    const data = await fetchRefereeDetail(athleteId)

    referee.value = data.referee

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRefereeDetail()
})
</script>

<style scoped>
</style>