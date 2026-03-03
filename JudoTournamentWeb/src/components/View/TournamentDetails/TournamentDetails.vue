<!-- TournamentDetails.vue -->
<template>
  <div class="tournament-details">

    <!-- КНОПКА НАЗАД — только стрелка -->
    <div class="tournament-detail-header">
      <button class="back-button" @click="goBack" title="Назад">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>

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
          :class="{ active: selectedTab === 'weighing' }"
          @click="selectedTab = 'weighing'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M7 16v-6"/>
            <path d="M12 16v-10"/>
            <path d="M17 16v-4"/>
          </svg>
        </span>
        <span class="label">Взвешивание</span>
      </button>

      <button
          class="tab-button"
          :class="{ active: selectedTab === 'results' }"
          @click="selectedTab = 'results'"
      >
        <span class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
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
import { useRoute, useRouter } from 'vue-router'
import { fetchTournamentDetail } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'
import "./TournamentDetails.css"

const route = useRoute()
const router = useRouter()

const tournament = ref(null)
const isLoading = ref(true)
const error = ref('')

const selectedTab = ref('overview')

const tabComponents = {
  overview:  defineAsyncComponent(() => import('@/components/View/TournamentDetails/OverviewTab.vue')),
  draw:      defineAsyncComponent(() => import('@/components/View/TournamentDetails/DrawTab.vue')),
  order:     defineAsyncComponent(() => import('@/components/View/TournamentDetails/OrderTab.vue')),
  athletes:  defineAsyncComponent(() => import('@/components/View/TournamentDetails/AthletesTab.vue')),
  weighing:  defineAsyncComponent(() => import('@/components/View/TournamentDetails/WeightingTab.vue')),
  results:   defineAsyncComponent(() => import('@/components/View/TournamentDetails/TournamentResultsTab.vue')),
  live:      defineAsyncComponent(() => import('@/components/View/TournamentDetails/LiveTab.vue'))
}

provide('tournament', tournament)

const goBack = () => {
  router.back()
}

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