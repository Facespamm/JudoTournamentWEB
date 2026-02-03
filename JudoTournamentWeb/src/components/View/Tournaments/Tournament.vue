<template>
  <div class="judo-tournament">
    <!-- ФИЛЬТРЫ -->
    <div class="judo-tournament-setting_search">
      <select class="judo-tournament-setting_search_select_category" name="tournament_filter_category">
        <option value="all">Категория турнира</option>
        <option value="continental">Континентальные</option>
        <option value="national">Национальные</option>
        <option value="regional">Региональные</option>
      </select>
      <select class="judo-tournament-setting_select_age_group" name="tournament_age_group">
        <option value="all">Возрастная группа</option>
        <option value="cadets">Кадеты (15-17 лет)</option>
        <option value="juniors">Юниоры (18-20 лет)</option>
        <option value="seniors">Взрослые (21+ лет)</option>
      </select>
      <select class="judo-tournament-setting_date" name="tournament_date">
        <option value="all">Год проведения</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
      </select>
      <input type="search" name="tournament_search" placeholder="Поиск турниров" class="search-input" />
    </div>

    <!-- СПИСОК ТУРНИРОВ -->
    <div class="judo-tournament_info">
      <section class="judo-tournament-list">
        <h2>Ближайшие турниры</h2>

        <!-- Индикатор загрузки -->
        <div v-if="isLoading" class="loading-indicator">
          <div class="loading-spinner"></div>
          <p>Загрузка турниров...</p>
        </div>

        <!-- Сообщение об ошибке -->
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="loadTournaments" class="retry-button">Попробовать снова</button>
        </div>

        <!-- Список турниров -->
        <div v-else class="tournament-cards-container">
          <article
              v-for="tournament in tournaments"
              :key="tournament.id"
              class="judo-tournament-card"
              :class="{ 'live': tournament.status === 'LIVE' }"
          >
            <div class="judo-tournament_card_info">
              <div class="tournament-header">
                <span class="tournament-date-badge">{{ formatDate(tournament.start_date, tournament.end_date) }}</span>
                <span class="tournament-status-badge" :class="getStatusClass(tournament.status)">
                  {{ getStatusText(tournament.status) }}
                </span>
              </div>
              <h3 class="judo-tournament_card_name">{{ tournament.name }}</h3>
              <p class="judo-tournament_card_location">{{ getLocation(tournament) }}</p>
              <div class="tournament-stats">
                <span class="stat-item">{{ tournament.athletes_count || 0 }} участников</span>
                <span class="stat-divider">•</span>
                <span class="stat-item">{{ tournament.progress_percentage || 0 }}% завершено</span>
              </div>
              <div v-if="tournament.description" class="tournament-description">
                {{ tournament.description }}
              </div>
              <!-- Кнопки действий -->
              <div class="tournament-actions">
                <button class="tournament-action-btn tournament-view-details-btn" @click="navigateToDetails(tournament.id)">
                  Подробнее
                </button>
                <button
                    v-if="isRegistrationAvailable(tournament)"
                    class="tournament-action-btn tournament-register-btn"
                    @click="navigateToRegistration(tournament.id)"
                >
                  Зарегистрироваться
                </button>
                <button v-else class="tournament-action-btn tournament-register-disabled-btn" disabled>
                  Регистрация закрыта
                </button>
              </div>
            </div>
          </article>

          <!-- Сообщение если нет турниров -->
          <div v-if="tournaments.length === 0 && !isLoading" class="no-tournaments">
            <p>Нет доступных турниров</p>
          </div>
        </div>
      </section>
    </div>

    <!-- ПАГИНАЦИЯ -->
    <div v-if="tournaments.length > 0" class="judo-tournament_button_pagination">
      <button type="button" class="judo-tournament_button_pagination_next" @click="loadMore">
        Показать ещё турниры
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import "./Tournaments.css"
import {fetchCategories} from "@/components/View/TournamentManagement/fetchTournamentManagement.js";

const router = useRouter()

// Состояния
const tournaments = ref([])
const isLoading = ref(false)
const error = ref('')

// Проверка доступности регистрации
const isRegistrationAvailable = (tournament) => {
  const allowedStatuses = ['PLANNED', 'REGISTRATION']
  return allowedStatuses.includes(tournament.status)
}

// Загрузка турниров
const loadTournaments = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const result = await fetchTournaments()
    if (result.success) {
      tournaments.value = result.data
    } else {
      error.value = result.error
    }
  } catch (err) {
    console.error('Ошибка при загрузке турниров:', err)
    error.value = 'Не удалось загрузить турниры. Пожалуйста, попробуйте позже.'
  } finally {
    isLoading.value = false
  }
}

// Вспомогательные функции
const formatDate = (startDate, endDate) => {
  if (!startDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (startDate === endDate) {
    return start.toLocaleDateString('ru-RU')
  }
  return `${start.toLocaleDateString('ru-RU')} – ${end.toLocaleDateString('ru-RU')}`
}

const getLocation = (tournament) => {
  const parts = []
  if (tournament.venue) parts.push(tournament.venue)
  if (tournament.city) parts.push(tournament.city)
  if (tournament.country && tournament.country !== 'string') parts.push(tournament.country)
  return parts.join(', ') || 'Место не указано'
}

const getStatusClass = (status) => {
  const statusMap = {
    'LIVE': 'status-live',
    'PLANNED': 'status-planned',
    'COMPLETED': 'status-completed',
    'REGISTRATION': 'status-registration',
    'WEIGHING': 'status-weighing',
    'BRACKETS': 'status-brackets'
  }
  return statusMap[status] || 'status-planned'
}

const getStatusText = (status) => {
  const statusMap = {
    'LIVE': 'LIVE',
    'PLANNED': 'ПЛАНИРУЕТСЯ',
    'COMPLETED': 'ЗАВЕРШЁН',
    'REGISTRATION': 'РЕГИСТРАЦИЯ',
    'WEIGHING': 'ВЗВЕШИВАНИЕ',
    'BRACKETS': 'СЕТКИ'
  }
  return statusMap[status] || status
}

const loadMore = () => {
  console.log('Загрузка дополнительных турниров...')
}

const navigateToDetails = (id) => {
  router.push(`/tournamentdetails/${id}`)
}

const navigateToRegistration = (id) => {
  localStorage.setItem('registrationTournamentId', id)
  router.push('/registrationathlete')
}

// Загрузка данных при монтировании
onMounted(() => {
  loadTournaments()
})
</script>

<style scoped>
/* ваши стили остаются без изменений */
</style>