<template>
  <div class="admin-dashboard">
    <!-- ЗАГОЛОВОК -->
    <div class="dashboard-header">
      <h1>Панель администратора</h1>
      <p>Обзор системы управления турнирами по дзюдо</p>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.total_tournaments || 0 }}</div>
          <div class="stat-label">Всего турниров</div>
        </div>
      </div>

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
        <div class="stat-icon">🏢</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.unique_clubs || 0 }}</div>
          <div class="stat-label">Клубов</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👤</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.total_users || 0 }}</div>
          <div class="stat-label">Пользователей</div>
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
        <button class="action-btn" @click="navigateToCreateTournament">
          <span class="action-icon">➕</span>
          <span class="action-text">Создать турнир</span>
        </button>

        <button class="action-btn" @click="navigateToWeighing">
          <span class="action-icon">⚖️</span>
          <span class="action-text">Взвешивание</span>
        </button>

        <button class="action-btn" @click="navigateToBrackets">
          <span class="action-icon">📊</span>
          <span class="action-text">Сетки</span>
        </button>

        <button class="action-btn" @click="navigateToUsers">
          <span class="action-icon">👥</span>
          <span class="action-text">Управление пользователями</span>
        </button>

        <button class="action-btn" @click="navigateToClubs">
          <span class="action-icon">🏢</span>
          <span class="action-text">Управление клубами</span>
        </button>

        <button class="action-btn" @click="navigateToAthletes">
          <span class="action-icon">🥋</span>
          <span class="action-text">Управление дзюдоистами</span>
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
          <p class="tournament-location">
            <template v-if="tournament.venue">{{ tournament.venue }}, </template>
            {{ tournament.city }}
            <template v-if="tournament.country">, {{ tournament.country }}</template>
          </p>
          <div class="tournament-stats">
            <span class="stat">{{ tournament.athletes_count || 0 }} участников</span>
            <span class="stat" v-if="tournament.live_fights_count !== undefined">{{ tournament.live_fights_count }} live схваток</span>
            <span class="stat" v-if="tournament.tatami_count">{{ tournament.tatami_count }} татами</span>
          </div>
          <button class="manage-btn" @click="navigateToTournament(tournament.id)">Управлять</button>
        </div>

        <div v-if="activeTournaments.length === 0" class="no-tournaments">
          <p>Нет активных турниров</p>
          <button class="create-btn" @click="navigateToCreateTournament">Создать первый турнир</button>
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
import "./AdminDashboard.css"
import { GetAdminStatistics, GetLiveTournamentAdmin } from "@/components/View/AdminDashboard/fetchAdminDashboard.js"

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
    // 1. Статистика — гибкая обработка разных форматов
    console.log('=== Запрос GetAdminStatistics ===')
    const statsData = await GetAdminStatistics()
    console.log('GetAdminStatistics → полный ответ:', statsData)

    let statsObj = {}

    if (statsData) {
      // Стандарт: { success: true, data: { ... } }
      if (statsData.success && statsData.data) {
        statsObj = statsData.data
      }
      // Вариант: { data: { success: true, ... } }
      else if (statsData.data?.success) {
        statsObj = statsData.data
      }
      // Вариант: просто объект со статистикой
      else if (typeof statsData === 'object' && !Array.isArray(statsData)) {
        statsObj = statsData
      }
      // Вариант: { success: true, result: { ... } }
      else if (statsData.success && (statsData.result || statsData.results)) {
        statsObj = statsData.result || statsData.results
      }
    }

    if (Object.keys(statsObj).length > 0) {
      stats.value = statsObj
      console.log('✅ Успешно распарсена статистика:', stats.value)
    } else {
      console.warn('⚠️ Не удалось распознать структуру статистики')
      showToast('Получены некорректные данные статистики', 'error')
    }

    // 2. Активные турниры — исправленная обработка
    console.log('=== Запрос GetLiveTournamentAdmin ===')
    const tournamentsData = await GetLiveTournamentAdmin()
    console.log('GetLiveTournamentAdmin → полный ответ:', tournamentsData)
    console.log('tournamentsData.success:', tournamentsData?.success)
    console.log('tournamentsData.data:', tournamentsData?.data)
    console.log('tournamentsData.athletes:', tournamentsData?.athletes)

    let tournamentsList = []

    if (tournamentsData && tournamentsData.success) {
      console.log('✓ success === true')

      // ИСПРАВЛЕНИЕ: В вашем API данные приходят в поле 'athletes', а не 'data'!
      tournamentsList =
          tournamentsData.data ||           // Стандартный вариант
          tournamentsData.athletes ||       // ВАШ API возвращает в этом поле!
          tournamentsData.tournaments ||
          tournamentsData.active_tournaments ||
          tournamentsData.items ||
          tournamentsData.result ||
          []

      console.log('tournamentsList после парсинга:', tournamentsList)
    } else {
      console.warn('✗ success !== true или нет данных')
    }

    activeTournaments.value = Array.isArray(tournamentsList) ? tournamentsList : []
    console.log('✅ activeTournaments.value:', activeTournaments.value)
    console.log('✅ Количество турниров:', activeTournaments.value.length)

  } catch (error) {
    console.error('❌ Ошибка загрузки данных дашборда:', error)
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
const navigateToCreateTournament = () => router.push('/admin/tournament-settings')
const navigateToWeighing = () => router.push('/weighing')
const navigateToBrackets = () => router.push('/brackets')
const navigateToUsers = () => router.push('/admin/users')
const navigateToClubs = () => router.push('/admin/clubsAdmin')
const navigateToAthletes = () => router.push('/registrationathletes')
const navigateToTournaments = () => router.push('/tournament')
const navigateToTournament = (id) => router.push(`/tournament/${id}`)

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
/* ваши стили */
</style>