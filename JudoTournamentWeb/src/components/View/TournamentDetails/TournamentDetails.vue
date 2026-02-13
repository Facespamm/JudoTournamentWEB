<!-- TournamentDetails.vue (финальная версия: только хедер, таб-бар и переключение табов) -->
<template>
  <div class="tournament-details">
    <!-- ЗАГОЛОВОК И КНОПКА НАЗАД -->
    <!-- ГОРИЗОНТАЛЬНАЯ ПАНЕЛЬ ТАБОВ -->
    <div v-if="tournament" class="tab-bar">
      <button
          class="tab-button"
          :class="{ active: selectedTab === 'overview' }"
          @click="selectedTab = 'overview'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </span>
        <span class="label">Обзор</span>
      </button>

      <button
          class="tab-button"
          :class="{ active: selectedTab === 'draw' }"
          @click="selectedTab = 'draw'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <circle cx="15.5" cy="15.5" r="1.5"/>
          </svg>
        </span>
        <span class="label">Жеребьевка</span>
      </button>

      <button
          class="tab-button"
          :class="{ active: selectedTab === 'order' }"
          @click="selectedTab = 'order'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </span>
        <span class="label">Порядок схваток</span>
      </button>

      <button
          class="tab-button"
          :class="{ active: selectedTab === 'athletes' }"
          @click="selectedTab = 'athletes'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </span>
        <span class="label">Дзюдоисты</span>
      </button>

      <button
          class="tab-button"
          :class="{ active: selectedTab === 'results' }"
          @click="selectedTab = 'results'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M7 16v-6"/>
            <path d="M12 16v-10"/>
            <path d="M17 16v-4"/>
          </svg>
        </span>
        <span class="label">Результаты</span>
      </button>

      <button
          class="tab-button"
          :class="{ active: selectedTab === 'live' }"
          @click="selectedTab = 'live'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </span>
        <span class="label">Live</span>
      </button>
    </div>

    <!-- ЛОАДЕР -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка данных турнира...</p>
    </div>

    <!-- ОШИБКА -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button class="retry-button" @click="loadTournamentDetail">Попробовать снова</button>
    </div>

    <!-- СОДЕРЖИМОЕ ТАБОВ -->
    <div v-if="tournament" class="tab-content">
      <keep-alive>
        <component :is="tabComponents[selectedTab]" />
      </keep-alive>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent, provide } from 'vue'
import { useRoute } from 'vue-router'
import { fetchTournamentDetail } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'
import "./TournamentDetails.css"
const route = useRoute()

const tournament = ref(null)
const isLoading = ref(true)
const error = ref('')

// По умолчанию открывается Обзор
const selectedTab = ref('overview')

// Ленивая загрузка всех табов
const tabComponents = {
  overview: defineAsyncComponent(() => import('@/components/View/TournamentDetails/OverviewTab.vue')),
  draw: defineAsyncComponent(() => import('@/components/View/TournamentDetails/DrawTab.vue')),
  order: defineAsyncComponent(() => import('@/components/View/TournamentDetails/OrderTab.vue')),
  athletes: defineAsyncComponent(() => import('@/components/View/TournamentDetails/AthletesTab.vue')),
  results: defineAsyncComponent(() => import('@/components/View/TournamentDetails/ResultsTab.vue')),
  live: defineAsyncComponent(() => import('@/components/View/TournamentDetails/LiveTab.vue'))
}

// Делаем tournament доступным во всех табах
provide('tournament', tournament)

const loadTournamentDetail = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const tournamentId = Number(route.params.id)
    if (isNaN(tournamentId)) throw new Error('Неверный ID турнира')

    const response = await fetchTournamentDetail(tournamentId)
    if (response && response.success !== false) {
      tournament.value = response.tournament || response
    } else {
      throw new Error('Не удалось загрузить данные турнира')
    }
  } catch (err) {
    console.error('Error loading tournament data:', err)
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTournamentDetail()
})
</script>

<style scoped>
</style>