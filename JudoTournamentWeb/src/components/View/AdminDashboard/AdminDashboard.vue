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
        <div class="stat-icon trophy">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.total_tournaments || 0 }}</div>
          <div class="stat-label">Всего турниров</div>
        </div>
      </div>

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
        <div class="stat-icon clubs">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.unique_clubs || 0 }}</div>
          <div class="stat-label">Клубов</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon users">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.total_users || 0 }}</div>
          <div class="stat-label">Пользователей</div>
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
        <button class="action-btn" @click="navigateToCreateTournament">
          <span class="action-icon create">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="action-text">Создать турнир</span>
        </button>

        <button class="action-btn" @click="navigateToWeighing">
          <span class="action-icon weighing">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C10.73 3 9.6 3.8 9.18 5H3V7H4.95L2 14C1.53 16 3 17 5.5 17C8 17 9.56 16 9 14L6.05 7H9.17C9.5 7.85 10.15 8.5 11 8.83V20H2V22H22V20H13V8.82C13.85 8.5 14.5 7.85 14.82 7H17.95L15 14C14.53 16 16 17 18.5 17C21 17 22.56 16 22 14L19.05 7H21V5H14.83C14.4 3.8 13.27 3 12 3ZM12 5C12.55 5 13 5.45 13 6C13 6.55 12.55 7 12 7C11.45 7 11 6.55 11 6C11 5.45 11.45 5 12 5ZM6.05 9L7.5 13.5C7.65 14.05 7.23 14.65 6.5 14.93C5.77 15.21 5.05 15.08 4.9 14.5L3.45 9H6.05ZM17.95 9H20.55L19.1 14.5C18.95 15.08 18.23 15.21 17.5 14.93C16.77 14.65 16.35 14.05 16.5 13.5L17.95 9Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="action-text">Взвешивание</span>
        </button>

        <button class="action-btn" @click="navigateToBrackets">
          <span class="action-icon brackets">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V21H21V3H3ZM19 19H5V5H19V19ZM7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H14V17H7V15Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="action-text">Сетки</span>
        </button>

        <button class="action-btn" @click="navigateToUsers">
          <span class="action-icon manage-users">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="action-text">Управление пользователями</span>
        </button>

        <button class="action-btn" @click="navigateToClubs">
          <span class="action-icon manage-clubs">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="action-text">Управление клубами</span>
        </button>

        <button class="action-btn" @click="navigateToAthletes">
          <span class="action-icon manage-athletes">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C10.89 2 10 2.89 10 4V6.76L8.41 8.35C7.91 8.85 7.91 9.66 8.41 10.15L10.59 12.33L8.41 14.51C7.91 15 7.91 15.82 8.41 16.31L10 17.9V20C10 21.11 10.89 22 12 22C13.11 22 14 21.11 14 20V17.9L15.59 16.31C16.09 15.82 16.09 15 15.59 14.51L13.41 12.33L15.59 10.15C16.09 9.66 16.09 8.85 15.59 8.35L14 6.76V4C14 2.89 13.11 2 12 2Z" fill="currentColor"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
            </svg>
          </span>
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
.stat-icon.trophy {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

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

.stat-icon.clubs {
  background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.stat-icon.users {
  background: linear-gradient(135deg, #1ABC9C 0%, #16A085 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
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

.action-icon.create {
  background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%);
  color: #fff;
}

.action-icon.weighing {
  background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
  color: #fff;
}

.action-icon.brackets {
  background: linear-gradient(135deg, #E67E22 0%, #D35400 100%);
  color: #fff;
}

.action-icon.manage-users {
  background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%);
  color: #fff;
}

.action-icon.manage-clubs {
  background: linear-gradient(135deg, #34495E 0%, #2C3E50 100%);
  color: #fff;
}

.action-icon.manage-athletes {
  background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  color: #fff;
}

.action-btn:hover .action-icon {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* Адаптация под существующие стили */
.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}
</style>