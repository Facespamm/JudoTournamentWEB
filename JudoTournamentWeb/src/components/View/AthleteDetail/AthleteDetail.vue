<template>
  <div class="athlete-detail">
    <div class="athlete-detail-container">
      <!-- Заголовок и кнопка назад -->
      <div class="athlete-detail-header">
        <button class="back-button" @click="$router.back()">
          ← Назад
        </button>
        <h1>Профиль спортсмена</h1>
      </div>

      <!-- Лоадер -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка данных спортсмена...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button class="retry-button" @click="loadAthleteDetail">Попробовать снова</button>
      </div>

      <!-- Детальная информация -->
      <div v-else-if="athlete" class="athlete-info">
        <div class="athlete-main-info">
          <h2 class="athlete-name">{{ athlete.full_name }}</h2>
          <div class="athlete-badge">{{ athlete.rank }}</div>
        </div>

        <div class="athlete-details-grid">
          <div class="detail-section">
            <h3>Основная информация</h3>
            <div class="detail-item">
              <span class="detail-label">Фамилия:</span>
              <span class="detail-value">{{ athlete.last_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Имя:</span>
              <span class="detail-value">{{ athlete.first_name }}</span>
            </div>
            <div v-if="athlete.middle_name" class="detail-item">
              <span class="detail-label">Отчество:</span>
              <span class="detail-value">{{ athlete.middle_name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Пол:</span>
              <span class="detail-value">{{ getGenderText(athlete.gender) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Дата рождения:</span>
              <span class="detail-value">{{ formatDate(athlete.birth_date) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Возраст:</span>
              <span class="detail-value">{{ athlete.age }} лет</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Спортивная информация</h3>
            <div class="detail-item">
              <span class="detail-label">Разряд:</span>
              <span class="detail-value">{{ athlete.rank }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Клуб:</span>
              <span class="detail-value">{{ athlete.club_name }}</span>
            </div>
            <div v-if="athlete.license_number" class="detail-item">
              <span class="detail-label">Номер лицензии:</span>
              <span class="detail-value">{{ athlete.license_number }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Медосмотр:</span>
              <span class="detail-value">{{ athlete.medical_check ? 'Пройден' : 'Не пройден' }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Контактная информация</h3>
            <div v-if="athlete.phone" class="detail-item">
              <span class="detail-label">Телефон:</span>
              <span class="detail-value">{{ athlete.phone }}</span>
            </div>
            <div v-if="athlete.email" class="detail-item">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ athlete.email }}</span>
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
import { fetchAthleteDetail } from '@/components/View/AthleteDetail/fetchAthletesDetail.js'
import "./AthleteDetail.css"

const route = useRoute()
const athlete = ref(null)
const isLoading = ref(true)
const error = ref('')

// Функция для отображения пола
const getGenderText = (gender) => {
  const genders = {
    'M': 'Мужской',
    'М': 'Мужской',
    'F': 'Женский',
    'Ж': 'Женский',
    'MALE': 'Мужской',
    'FEMALE': 'Женский'
  }
  return genders[gender] || gender
}

// Функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return 'Не указана'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU')
}

// Загрузка данных атлета
const loadAthleteDetail = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const athleteId = Number(route.params.id)
    if (isNaN(athleteId)) {
      throw new Error('Неверный ID спортсмена')
    }

    const response = await fetchAthleteDetail(athleteId)

    if (response.success) {
      athlete.value = response.athlete
    } else {
      throw new Error('Не удалось загрузить данные спортсмена')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAthleteDetail()
})
</script>

<style scoped>
</style>