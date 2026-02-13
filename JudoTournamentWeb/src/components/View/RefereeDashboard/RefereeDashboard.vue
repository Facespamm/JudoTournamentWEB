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
        <div class="stat-icon active">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.active_tournaments || 0 }}</div>
          <div class="stat-label">Активных турниров</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon athletes">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.unique_athletes || 0 }}</div>
          <div class="stat-label">Участников</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon live">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C10.89 2 10 2.89 10 4V6.76L8.41 8.35C7.91 8.85 7.91 9.66 8.41 10.15L10.59 12.33L8.41 14.51C7.91 15 7.91 15.82 8.41 16.31L10 17.9V20C10 21.11 10.89 22 12 22C13.11 22 14 21.11 14 20V17.9L15.59 16.31C16.09 15.82 16.09 15 15.59 14.51L13.41 12.33L15.59 10.15C16.09 9.66 16.09 8.85 15.59 8.35L14 6.76V4C14 2.89 13.11 2 12 2Z" fill="currentColor"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
          </svg>
        </div>
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
          <span class="action-icon brackets">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9ZM7 6H17V19H7V6ZM9 8V17H11V8H9ZM13 8V17H15V8H13Z" fill="currentColor"/>
              <path d="M3 3V21H5V19H3V5H5V3H3ZM19 3V5H21V19H19V21H21V3H19Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="action-text">Сетки</span>
        </button>

        <button class="action-btn" @click="navigateToTatami">
          <span class="action-icon tatami">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" fill="none"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <path d="M12 2V6M12 18V22M22 12H18M6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="action-text">Татами</span>
        </button>

        <button class="action-btn" @click="navigateToTournaments">
          <span class="action-icon tournaments">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </span>
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
/* Базовые стили для иконок */
.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.stat-icon svg {
  width: 28px;
  height: 28px;
}

/* Цветовые схемы для карточек статистики */
.stat-icon.active {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.stat-icon.athletes {
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.stat-icon.live {
  background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(231, 76, 60, 0.5);
  }
}

/* Стили для кнопок быстрых действий */
.action-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.action-icon svg {
  width: 24px;
  height: 24px;
}

.action-icon.brackets {
  background: linear-gradient(135deg, #E67E22 0%, #D35400 100%);
  color: #fff;
}

.action-icon.tatami {
  background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
  color: #fff;
}

.action-icon.tournaments {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #fff;
}

.action-btn:hover .action-icon {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* Hover эффекты для карточек статистики */
.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}
</style>