<template>
  <div class="tournament-details">
    <!-- ЗАГОЛОВОК И КНОПКА НАЗАД -->
    <div class="tournament-detail-header">
      <button class="back-button" @click="$router.back()">
        ← Назад
      </button>
      <h1>Детали турнира</h1>
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

    <!-- ОСНОВНАЯ ИНФОРМАЦИЯ О ТУРНИРЕ -->
    <div v-else-if="tournament" class="tournament-main-info">
      <section class="tournament-info">
        <h1>{{ tournament.name }}</h1>
        <p class="tournament-description">{{ tournament.description || 'Описание отсутствует' }}</p>

        <div class="tournament-meta">
          <div class="meta-item">
            <span class="meta-label">Дата проведения:</span>
            <span class="meta-value">{{ formatDate(tournament.start_date, tournament.end_date) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Место проведения:</span>
            <span class="meta-value">{{ getLocation(tournament) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Статус:</span>
            <span class="meta-value status-badge" :class="getStatusClass(tournament.status)">
              {{ getStatusText(tournament.status) }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Количество участников:</span>
            <span class="meta-value">{{ tournament.athletes_count || 0 }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Количество татами:</span>
            <span class="meta-value">{{ tournament.tatami_count || 0 }}</span>
          </div>
          <div v-if="tournament.progress_percentage > 0" class="meta-item">
            <span class="meta-label">Прогресс:</span>
            <span class="meta-value">{{ tournament.progress_percentage }}% завершено</span>
          </div>
        </div>

        <!-- БЛОК КАТЕГОРИЙ -->
        <div class="categories-section">
          <h2>Категории турнира</h2>

          <!-- Если категорий нет -->
          <div v-if="categories.length === 0" class="no-categories">
            <p>Категории ещё не созданы или недоступны для этого турнира.</p>
          </div>

          <!-- Если категории есть -->
          <div v-else>
            <div class="category-dropdown">
              <select v-model="selectedCategoryId">
                <option :value="null">Все категории</option>
                <option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                >
                  {{ category.name }} ({{ category.gender }}, {{ category.min_age }}-{{ category.max_age }} лет, {{ category.min_weight }}-{{ category.max_weight }} кг, {{ category.athletes_count }} уч.)
                </option>
              </select>
            </div>

            <!-- Детали выбранной категории (без сетки) -->
            <div v-if="selectedCategory" class="category-details">
              <h3>Выбранная категория: {{ selectedCategory.name }}</h3>
              <div class="category-meta">
                <div class="meta-item">
                  <span class="meta-label">Пол:</span>
                  <span class="meta-value">{{ selectedCategory.gender }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Возраст:</span>
                  <span class="meta-value">{{ selectedCategory.min_age }} – {{ selectedCategory.max_age }} лет</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Вес:</span>
                  <span class="meta-value">{{ selectedCategory.min_weight }} – {{ selectedCategory.max_weight }} кг</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Участников:</span>
                  <span class="meta-value">{{ selectedCategory.athletes_count }}</span>
                </div>
              </div>
            </div>

            <!-- Общая сводка, когда выбрано "Все категории" -->
            <div v-else class="category-summary">
              <p>Всего категорий: <strong>{{ categories.length }}</strong></p>
              <p>Общее количество участников по категориям: <strong>{{ totalAthletesInCategories }}</strong></p>
              <p>Участников в турнире (по основной информации): <strong>{{ tournament.athletes_count || 0 }}</strong></p>
            </div>
          </div>
        </div>
      </section>

      <!-- Остальные секции -->
      <div class="scoreboard-section">
        <div class="scoreboard">
          <span class="team-left">Команда A: 5</span>
          <span class="vs">vs</span>
          <span class="team-right">Команда B: 3</span>
        </div>
      </div>

      <section class="stream-section">
        <h2>Прямая трансляция</h2>
        <div class="stream-player">
          <div class="video-placeholder">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <p>Трансляция начнется в назначенное время</p>
          </div>
        </div>
      </section>

      <!-- ТУРНИРНАЯ СЕТКА ПОД ПЛЕЕРОМ (только при выбранной категории) -->
      <div v-if="selectedCategory" class="tournament-bracket-final">
        <h2 class="section-title">Турнирная сетка</h2>

        <div v-if="bracketLoading" class="loading">
          <div class="spinner"></div>
          <p>Загрузка сетки...</p>
        </div>

        <div v-else-if="!hasBracketMatches" class="no-matches">
          <p>Турнирная сетка будет опубликована после завершения жеребьёвки.</p>
        </div>

        <div v-else class="bracket-canvas">
          <div
              v-for="(round, roundIndex) in sortedRounds"
              :key="round.roundNumber"
              class="round"
              :class="getRoundClass(roundIndex, sortedRounds.length)"
          >
            <div class="round-label">{{ getRoundName(round.roundNumber, sortedRounds.length) }}</div>
            <div class="matches">
              <div
                  v-for="(match, matchIndex) in round.matches"
                  :key="match.fightId"
                  class="match"
                  :class="{
                  'tbd-match': !match.hasFighters,
                  ['status-' + match.status.toLowerCase()]: true
                }"
              >
                <div class="slot top">
                  <span class="name">{{ match.topName }}</span>
                </div>
                <div class="vs">vs</div>
                <div class="slot bottom">
                  <span class="name">{{ match.bottomName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchTournamentDetail, fetchCategoriesById } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'
import { fetchBrackets } from "@/components/View/Brackets/fetchBrackets.js"
import "@/components/View/TournamentDetails/TournamentDetails.css"

const route = useRoute()
const tournament = ref(null)
const categories = ref([])
const selectedCategoryId = ref(null)
const bracketData = ref(null)
const bracketLoading = ref(false)
const isLoading = ref(true)
const error = ref('')

const selectedCategory = computed(() =>
    categories.value.find(cat => cat.id === selectedCategoryId.value) || null
)

const totalAthletesInCategories = computed(() =>
    categories.value.reduce((sum, cat) => sum + (cat.athletes_count || 0), 0)
)

// Правильное формирование ФИО: middle_name — это фамилия
const getAthleteName = (athlete) => {
  if (!athlete) return 'TBD'
  return `${athlete.middle_name || ''} ${athlete.first_name || ''} ${athlete.last_name || ''}`.trim() || 'TBD'
}

// Группировка и сортировка боёв по раундам (по id боя для правильного порядка)
const fightsByRound = computed(() => {
  const groups = {}
  if (!bracketData.value?.fights || !Array.isArray(bracketData.value.fights)) return groups

  bracketData.value.fights.forEach(fight => {
    const r = fight.round || 1
    if (!groups[r]) groups[r] = []

    groups[r].push({
      fightId: fight.id,
      topName: getAthleteName(fight.white_athlete),
      bottomName: getAthleteName(fight.blue_athlete),
      hasFighters: !!(fight.white_athlete || fight.blue_athlete),
      status: fight.status_fight || 'SCHEDULED'
    })
  })

  // Сортируем матчи в каждом раунде по id боя
  Object.keys(groups).forEach(r => {
    groups[r].sort((a, b) => a.fightId - b.fightId)
  })

  return groups
})

// Отсортированные раунды (от первого к финалу)
const sortedRounds = computed(() => {
  if (Object.keys(fightsByRound.value).length === 0) return []

  const roundNumbers = Object.keys(fightsByRound.value).map(Number).sort((a, b) => a - b)

  return roundNumbers.map(num => ({
    roundNumber: num,
    matches: fightsByRound.value[num]
  }))
})

const hasBracketMatches = computed(() => sortedRounds.value.length > 0)

const getRoundClass = (index, total) => {
  if (index === 0) return 'first-round'
  if (index === total - 1) return 'final-round'
  return 'middle-round'
}

// Умные названия раундов на русском
const getRoundName = (roundNumber, totalRounds) => {
  if (totalRounds <= 1) return 'Финал'
  if (roundNumber === totalRounds) return 'Финал'

  const stage = Math.pow(2, totalRounds - roundNumber)
  if (stage === 2) return 'Полуфинал'
  return `1/${stage} финала`
}

// Вспомогательные функции
const formatDate = (startDate, endDate) => {
  if (!startDate) return 'Дата не указана'
  const start = new Date(startDate)
  const end = new Date(endDate || startDate)
  if (startDate === endDate) return start.toLocaleDateString('ru-RU')
  return `${start.toLocaleDateString('ru-RU')} – ${end.toLocaleDateString('ru-RU')}`
}

const getLocation = (t) => {
  const parts = []
  if (t.venue && t.venue !== 'string') parts.push(t.venue)
  if (t.city && t.city !== 'string') parts.push(t.city)
  if (t.country && t.country !== 'string') parts.push(t.country)
  return parts.join(', ') || 'Место не указано'
}

const getStatusClass = (status) => {
  const map = {
    'LIVE': 'status-live',
    'PLANNED': 'status-planned',
    'COMPLETED': 'status-completed',
    'REGISTRATION': 'status-registration',
    'WEIGHING': 'status-weighing',
    'BRACKETS': 'status-brackets'
  }
  return map[status] || 'status-planned'
}

const getStatusText = (status) => {
  const map = {
    'LIVE': 'LIVE',
    'PLANNED': 'Запланирован',
    'COMPLETED': 'Завершен',
    'REGISTRATION': 'Регистрация',
    'WEIGHING': 'Взвешивание',
    'BRACKETS': 'Сетки'
  }
  return map[status] || status
}

// Загрузка деталей турнира и категорий
const loadTournamentDetail = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const tournamentId = Number(route.params.id)
    if (isNaN(tournamentId)) throw new Error('Неверный ID турнира')

    const tournamentResponse = await fetchTournamentDetail(tournamentId)
    if (tournamentResponse && tournamentResponse.success !== false) {
      tournament.value = tournamentResponse.tournament || tournamentResponse
    } else {
      throw new Error('Не удалось загрузить данные турнира')
    }

    const categoriesResponse = await fetchCategoriesById(tournamentId)
    if (categoriesResponse && categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
      categories.value = categoriesResponse.data
    } else {
      categories.value = []
    }
  } catch (err) {
    console.error('Error loading tournament data:', err)
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
}

// Загрузка сетки при выборе категории
watch(selectedCategoryId, async (newId) => {
  bracketData.value = null
  if (newId !== null && tournament.value) {
    bracketLoading.value = true
    try {
      const res = await fetchBrackets(tournament.value.id, newId)

      if (!res.success) {
        throw new Error(res.error || 'Не удалось загрузить сетку')
      }

      bracketData.value = res

      console.log('Loaded bracket data:', res)
    } catch (e) {
      console.error('Ошибка загрузки сетки:', e)
      error.value = 'Не удалось загрузить сетку категории'
      bracketData.value = null
    } finally {
      bracketLoading.value = false
    }
  }
})

onMounted(() => {
  loadTournamentDetail()
})
</script>

<style scoped>
.categories-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.category-dropdown select {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.no-categories {
  text-align: center;
  color: #888;
  padding: 1.5rem 0;
  font-style: italic;
}

.category-details,
.category-summary {
  margin-top: 1.5rem;
}

.category-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.8rem;
  margin-top: 1rem;
}

/* СЕТКА - УЛУЧШЕННЫЕ СТИЛИ */
.tournament-bracket-final {
  margin-top: 4rem; /* Отступ от плеера */
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  border-radius: 20px;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2.5rem;
  color: #2c3e50;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.no-matches {
  text-align: center;
  padding: 3rem;
  background: white;
  border: 3px dashed #c89b3c;
  border-radius: 20px;
  color: #666;
  font-size: 1.1rem;
}

.bracket-canvas {
  background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%);
  border: 3px solid #dee2e6;
  border-radius: 20px;
  padding: 5rem 2rem;
  overflow-x: auto;
  display: flex;
  justify-content: center;
  gap: 140px; /* Увеличен для места под линии */
  position: relative;
  min-height: 650px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
}

.round {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 240px;
}

.round-label {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border: none;
  color: #1a1a1a;
  padding: 0.8rem 2rem;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 50px;
  margin-top: 20px;
}

.match {
  width: 220px;
  background: white;
  border: 3px solid #dee2e6;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  position: relative;
  transition: all 0.3s ease;
}

.match:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

.tbd-match .slot {
  background: #f1f3f5 !important;
  color: #adb5bd;
  font-style: italic;
}
.tbd-match .vs {
  background: #e9ecef;
  color: #adb5bd;
}

.slot {
  padding: 14px 18px;
  font-weight: 600;
  min-height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

/* White athlete (top) - белый цвет */
.slot.top {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-bottom: 2px solid #dee2e6;
  color: #2c3e50;
}

/* Blue athlete (bottom) - голубой цвет */
.slot.bottom {
  background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
  color: white;
}

.name {
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.3;
}

.vs {
  text-align: center;
  padding: 6px;
  background: linear-gradient(90deg, #e9ecef 0%, #dee2e6 100%);
  color: #495057;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ЗОЛОТЫЕ СОЕДИНИТЕЛЬНЫЕ ЛИНИИ (видимые, толстые, золотые) */
.round:not(:last-child) .match::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  width: 100px;
  height: 6px;
  background: linear-gradient(to right, #d4af37, #f4d03f);
  transform: translateY(-50%);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.6);
  z-index: 1;
}

.round:not(:first-child) .match::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  width: 100px;
  height: 6px;
  background: linear-gradient(to right, #d4af37, #f4d03f);
  transform: translateY(-50%);
  border-radius: 4px 0 0 4px;
  box-shadow: 0 2px 8px rgba(212, 175, 55, 0.6);
  z-index: 1;
}

/* Статусы матчей */
.status-scheduled {
  border-color: #adb5bd;
}

.status-live {
  border-color: #fa5252;
  box-shadow: 0 0 25px rgba(250, 82, 82, 0.4);
  animation: pulse-live 2s infinite;
}

@keyframes pulse-live {
  0%, 100% { box-shadow: 0 0 25px rgba(250, 82, 82, 0.4); }
  50% { box-shadow: 0 0 35px rgba(250, 82, 82, 0.6); }
}

.status-completed {
  border-color: #51cf66;
  box-shadow: 0 0 20px rgba(81, 207, 102, 0.3);
  opacity: 0.85;
}

/* Адаптив */
@media (max-width: 768px) {
  .bracket-canvas {
    gap: 80px;
    padding: 4rem 1rem;
  }
  .match {
    width: 180px;
  }
  .round {
    min-width: 200px;
  }
  .round-label {
    font-size: 0.95rem;
    padding: 0.6rem 1.5rem;
    top: -70px;
  }
  .round:not(:last-child) .match::after,
  .round:not(:first-child) .match::before {
    width: 60px;
  }
}
</style>