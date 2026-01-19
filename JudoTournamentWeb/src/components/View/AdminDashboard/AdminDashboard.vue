<template>
  <div class="admin-dashboard">
    <!-- ЗАГОЛОВОК -->
    <div class="dashboard-header">
      <h1>Панель администратора</h1>
      <p>Обзор системы управления турнирами по дзюдо</p>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <!-- ... существующие карточки статистики ... -->
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
          <div class="stat-number">{{ stats.total_athletes || 0 }}</div>
          <div class="stat-label">Участников</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🏢</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.total_clubs || 0 }}</div>
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
          <p class="tournament-location">{{ tournament.venue }}, {{ tournament.city }}</p>
          <div class="tournament-stats">
            <span class="stat">{{ tournament.athletes_count || 0 }} участников</span>
            <span class="stat">{{ tournament.progress_percentage || 0 }}% завершено</span>
          </div>
          <button class="manage-btn" @click="navigateToTournament(tournament.id)">Управлять</button>
        </div>

        <div v-if="activeTournaments.length === 0" class="no-tournaments">
          <p>Нет активных турниров</p>
          <button class="create-btn" @click="navigateToCreateTournament">Создать первый турнир</button>
        </div>
      </div>
    </div>

    <!-- TOAST УВЕДОМЛЕНИЕ (встроенное) -->
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

const router = useRouter()

const stats = ref({})
const activeTournaments = ref([])
const recentEvents = ref([])

// Toast состояние
const toast = ref({
  visible: false,
  message: '',
  type: 'success' // success | error
})

// Навигация на страницу создания турнира
const navigateToCreateTournament = () => {
  router.push('/admin/tournament-settings')
}

// Навигация на страницу взвешивания
const navigateToWeighing = () => {
  router.push('/weighing')
}

// Навигация к сеткам
const navigateToBrackets = () => {
  router.push('/brackets')
}

// Универсальная функция показа toast
const showToast = (message, type = 'success', duration = type === 'success' ? 3000 : 4000) => {
  toast.value = { visible: true, message, type }
  setTimeout(() => {
    toast.value.visible = false
  }, duration)
}

const loadDashboardData = async () => {
  try {
    // Загрузка статистики
    const statsResponse = await fetch('/admin/api/quick_stats', {
      headers: { 'X-API-Key': 'mobile_app_2024' }
    })
    if (statsResponse.ok) {
      stats.value = await statsResponse.json()
    }

    // Загрузка активных турниров
    const tournamentsResponse = await fetch('/api/tournament?status=LIVE', {
      headers: { 'X-API-Key': 'mobile_app_2024' }
    })
    if (tournamentsResponse.ok) {
      const data = await tournamentsResponse.json()
      activeTournaments.value = data.tournaments || []
    }

    // Мок данные для событий
    recentEvents.value = [
      { id: 1, time: '10:30', text: 'Создан новый турнир "Кубок Астаны 2024"' },
      { id: 2, time: '09:15', text: 'Зарегистрирован новый участник: Азамат Сарсенбеков' },
      { id: 3, time: '08:45', text: 'Завершена схватка #24 в турнире "Чемпионат Казахстана"' }
    ]

  } catch (error) {
    console.error('Ошибка загрузки данных:', error)

    // Мок данные для демонстрации
    stats.value = {
      total_tournaments: 12,
      active_tournaments: 3,
      total_athletes: 245,
      total_clubs: 18,
      total_users: 8,
      live_fights: 2
    }

    activeTournaments.value = [
      {
        id: 1,
        name: 'Чемпионат Казахстана среди кадетов',
        status: 'LIVE',
        start_date: '2025-03-17',
        venue: 'Дворец спорта',
        city: 'Астана',
        athletes_count: 125,
        progress_percentage: 45
      },
      {
        id: 2,
        name: 'Гран-при Казахстана 2025',
        status: 'BRACKETS',
        start_date: '2025-05-10',
        venue: 'Спорткомплекс "Алатау"',
        city: 'Алматы',
        athletes_count: 240,
        progress_percentage: 20
      }
    ]
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
const navigateToTournaments = () => {
  router.push('/tournament')
}

const navigateToUsers = () => {
  router.push('/admin/users')
}

const navigateToClubs = () => {
  router.push('/admin/clubsAdmin')
}

const navigateToAthletes = () => {
  router.push('/registrationathletes')
}

const navigateToTournament = (tournamentId) => {
  router.push(`/tournament/${tournamentId}`)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
</style>