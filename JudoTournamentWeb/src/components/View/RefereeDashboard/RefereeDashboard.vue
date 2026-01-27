<template>
  <div class="referee-dashboard">
    <!-- ЗАГОЛОВОК -->
    <div class="dashboard-header">
      <h1>Панель судьи</h1>
      <p>Управление схватками и турнирами</p>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.active_tournaments || 0 }}</div>
          <div class="stat-label">Активных турниров</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.unique_athletes || 0 }}</div>
          <div class="stat-label">Участников</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🥋</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.live_fights || 0 }}</div>
          <div class="stat-label">Live схваток</div>
        </div>
      </div>
    </div>

    <!-- БЫСТРЫЕ ДЕЙСТВИЯ -->
    <div class="quick-actions-section">
      <h2>Быстрые действия</h2>
      <div class="actions-grid">
        <button class="action-btn" @click="navigateToBrackets">
          <span class="action-icon">📊</span>
          <span class="action-text">Сетки</span>
        </button>

        <button class="action-btn" @click="navigateToTatami">
          <span class="action-icon">🎯</span>
          <span class="action-text">Татами</span>
        </button>

        <button class="action-btn" @click="navigateToTournaments">
          <span class="action-icon">🏆</span>
          <span class="action-text">Турниры</span>
        </button>
      </div>
    </div>

    <!-- АКТИВНЫЕ ТУРНИРЫ -->
    <div class="active-tournaments-section">
      <div class="section-header">
        <h2>Активные турниры</h2>
        <button class="view-all-btn" @click="navigateToTournaments">Все турниры</button>
      </div>

      <div class="tournaments-grid">
        <div v-for="tournament in activeTournaments" :key="tournament.id" class="tournament-card">
          <div class="tournament-header">
            <span class="tournament-status" :class="getStatusClass(tournament.status)">
              {{ getStatusText(tournament.status) }}
            </span>
            <span class="tournament-date">{{ formatDate(tournament.start_date) }}</span>
          </div>
          <h3 class="tournament-name">{{ tournament.name }}</h3>
          <p class="tournament-location">{{ tournament.city }}, {{ tournament.country }}</p>
          <div class="tournament-stats">
            <span class="stat">{{ tournament.athletes_count || 0 }} участников</span>
            <span class="stat">{{ tournament.live_fights_count || 0 }} live-схваток</span>
            <span class="stat">{{ tournament.tatami_count || 0 }} татами</span>
          </div>
          <button class="manage-btn" @click="navigateToTournament(tournament.id)">Управлять</button>
        </div>

        <div v-if="activeTournaments.length === 0" class="no-tournaments">
          <p>Нет активных турниров</p>
        </div>
      </div>
    </div>

    <!-- TOAST УВЕДОМЛЕНИЕ -->
    <transition name="fade">
      <div v-if="toast.visible" class="toast-notification" :class="toast.type">
        <div class="toast-content">
          <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✕' }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import "./RefereeDashboard.css"
import { GetRefereeStatistics, GetLiveTournamentReferee } from "@/components/View/RefereeDashboard/fetchRefereeDashboard.js"

const router = useRouter()

const stats = ref({})
const activeTournaments = ref([])

const toast = ref({
  visible: false,
  message: '',
  type: 'success' // success | error
})

const showToast = (message, type = 'success', duration = type === 'success' ? 3000 : 5000) => {
  toast.value = { visible: true, message, type }
  setTimeout(() => {
    toast.value.visible = false
  }, duration)
}

const loadDashboardData = async () => {
  try {
    // 1. Статистика
    const statsData = await GetRefereeStatistics()
    console.log('GetRefereeStatistics → полный ответ:', statsData)

    if (statsData?.success && statsData?.data) {
      stats.value = statsData.data
      console.log('Статистика успешно загружена:', stats.value)
    } else {
      console.warn('Некорректный формат статистики')
      showToast('Не удалось загрузить статистику', 'error')
      stats.value = {}
    }

    // 2. Активные турниры — исправлено под реальную структуру ответа
    const tournamentsData = await GetLiveTournamentReferee()
    console.log('GetLiveTournamentReferee → полный ответ:', tournamentsData)

    if (tournamentsData?.success) {
      // Турниры приходят напрямую в поле data как массив объектов
      activeTournaments.value = Array.isArray(tournamentsData.data)
          ? tournamentsData.data
          : tournamentsData.data?.tournaments || tournamentsData.data?.active_tournaments || []

      console.log('Активные турниры загружены:', activeTournaments.value)
    } else {
      console.warn('Не удалось загрузить активные турниры')
      showToast('Не удалось загрузить список турниров', 'error')
      activeTournaments.value = []
    }

  } catch (error) {
    console.error('Ошибка загрузки данных панели судьи:', error)
    showToast('Не удалось загрузить данные панели. Попробуйте позже.', 'error')
    stats.value = {}
    activeTournaments.value = []
  }
}

// Вспомогательные функции
const getStatusClass = (status) => {
  const statusMap = {
    'LIVE': 'status-live',
    'BRACKETS': 'status-brackets',
    'REGISTRATION': 'status-registration',
    'WEIGHING': 'status-weighing'
  }
  return statusMap[status] || 'status-default'
}

const getStatusText = (status) => {
  const statusMap = {
    'LIVE': 'LIVE',
    'BRACKETS': 'Сетки',
    'REGISTRATION': 'Регистрация',
    'WEIGHING': 'Взвешивание'
  }
  return statusMap[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU')
}

// Навигация
const navigateToBrackets = () => router.push('/brackets')
const navigateToTatami = () => router.push('/tatami')
const navigateToTournaments = () => router.push('/tournament')
const navigateToTournament = (id) => router.push(`/tournament/${id}`)

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* ваши стили */
</style>