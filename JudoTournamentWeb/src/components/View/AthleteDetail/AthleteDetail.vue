<template>
  <div class="athlete-detail-container">
    <!-- Заголовок и кнопка назад -->
    <div class="athlete-detail-header">
      <button class="back-button" @click="$router.back()">← Назад</button>
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
        <h2 class="athlete-name">{{ getFullName(athlete) }}</h2>
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
    'M': 'Мужской', 'М': 'Мужской',
    'F': 'Женский', 'Ж': 'Женский',
    'MALE': 'Мужской', 'FEMALE': 'Женский'
  }
  return genders[gender] || gender
}

// Функция для форматирования даты
const formatDate = (dateString) => {
  if (!dateString) return 'Не указана'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU')
}

const getFullName = (athlete) => {
  if (athlete.full_name) return athlete.full_name
  return `${athlete.last_name || ''} ${athlete.first_name || ''} ${athlete.middle_name || ''}`.trim()
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
.athlete-detail-container {
  width: 100%;
  min-height: 100vh;
  background: #ffffff; /* Теперь чистый белый фон */
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  padding: 90px 6rem 4rem 2rem; /* отступ справа сохранён */
  max-width: 1200px;
  margin: 0 auto;
}

/* Остальные стили без изменений */
.athlete-detail-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
}

.back-button {
  background: #c89b3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #e0b456;
  transform: translateY(-1px);
}

.athlete-detail-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.athlete-info {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.athlete-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.athlete-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.athlete-badge {
  background: #c89b3c;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.athlete-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.detail-section {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a1a1a;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e8e8e8;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-size: 0.9rem;
  color: #333;
  font-weight: 600;
  text-align: right;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  color: #d32f2f;
  padding: 2rem;
}

.retry-button {
  background: #c89b3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #e0b456;
}

@media (max-width: 768px) {
  .athlete-detail-container {
    padding: 90px 1rem 4rem 1rem; /* симметричные отступы на мобильных */
  }

  .athlete-detail-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .athlete-main-info {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .athlete-details-grid {
    grid-template-columns: 1fr;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-value {
    text-align: left;
  }
}
</style>