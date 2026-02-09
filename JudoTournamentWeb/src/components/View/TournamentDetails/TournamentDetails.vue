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

      <!-- НОВАЯ ТУРНИРНАЯ СЕТКА -->
      <div v-if="selectedCategory" class="tournament-bracket-final">
        <h2 class="section-title">Турнирная сетка</h2>

        <div v-if="bracketLoading" class="loading">
          <div class="spinner"></div>
          <p>Загрузка сетки...</p>
        </div>

        <div v-else-if="!hasBracketMatches" class="no-matches">
          <p>Турнирная сетка будет опубликована после завершения жеребьёвки.</p>
        </div>

        <div v-else class="bracket-wrapper">
          <div class="bracket-container">
            <!-- SVG для линий -->
            <svg class="bracket-lines" :width="svgWidth" :height="svgHeight">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#d4af37;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#f4d03f;stop-opacity:1" />
                </linearGradient>
              </defs>
              <path
                  v-for="(line, index) in connectionLines"
                  :key="index"
                  :d="line.path"
                  fill="none"
                  stroke="url(#lineGradient)"
                  stroke-width="3"
                  class="connection-line"
              />
            </svg>

            <!-- Раунды с матчами -->
            <div class="bracket-rounds">
              <div
                  v-for="(round, roundIndex) in sortedRounds"
                  :key="round.roundNumber"
                  class="bracket-round"
                  :ref="el => setRoundRef(el, roundIndex)"
              >
                <div class="round-header">
                  <h3>{{ getRoundName(round.roundNumber, sortedRounds.length) }}</h3>
                </div>

                <div class="round-matches">
                  <div
                      v-for="(match, matchIndex) in round.matches"
                      :key="match.fightId"
                      class="bracket-match"
                      :ref="el => setMatchRef(el, roundIndex, matchIndex)"
                      :class="{
                      'tbd-match': !match.hasFighters,
                      'bye-match': match.isBye,
                      ['status-' + match.status.toLowerCase()]: true
                    }"
                  >
                    <div class="match-participant white" :class="{ 'bye-participant': match.topName === 'BYE' }">
                      <div class="participant-name">{{ match.topName }}</div>
                    </div>

                    <div class="match-participant blue" :class="{ 'bye-participant': match.bottomName === 'BYE' }">
                      <div class="participant-name">{{ match.bottomName }}</div>
                    </div>
                  </div>
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
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

// Refs для элементов сетки
const roundRefs = ref([])
const matchRefs = ref({})
const svgWidth = ref(2000)
const svgHeight = ref(1000)
const connectionLines = ref([])

const setRoundRef = (el, index) => {
  if (el) roundRefs.value[index] = el
}

const setMatchRef = (el, roundIndex, matchIndex) => {
  if (el) {
    if (!matchRefs.value[roundIndex]) matchRefs.value[roundIndex] = {}
    matchRefs.value[roundIndex][matchIndex] = el
  }
}

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

// Группировка и сортировка боёв по раундам
const fightsByRound = computed(() => {
  const groups = {}
  if (!bracketData.value?.fights || !Array.isArray(bracketData.value.fights)) return groups

  bracketData.value.fights.forEach(fight => {
    const r = fight.round || 1
    if (!groups[r]) groups[r] = []

    const whiteName = getAthleteName(fight.white_athlete)
    const blueName = getAthleteName(fight.blue_athlete)
    const realCount = (fight.white_athlete ? 1 : 0) + (fight.blue_athlete ? 1 : 0)

    let topName = whiteName
    let bottomName = blueName
    let isBye = false

    if (realCount === 1) {
      isBye = true
      if (!fight.white_athlete) topName = 'BYE'
      if (!fight.blue_athlete) bottomName = 'BYE'
    } else if (realCount === 0) {
      topName = 'TBD'
      bottomName = 'TBD'
    }

    groups[r].push({
      fightId: fight.id,
      topName,
      bottomName,
      hasFighters: realCount > 0,
      isBye,
      status: fight.status_fight || 'SCHEDULED'
    })
  })

  Object.keys(groups).forEach(r => {
    groups[r].sort((a, b) => a.fightId - b.fightId)
  })

  return groups
})

const sortedRounds = computed(() => {
  if (Object.keys(fightsByRound.value).length === 0) return []

  const roundNumbers = Object.keys(fightsByRound.value).map(Number).sort((a, b) => a - b)

  return roundNumbers.map(num => ({
    roundNumber: num,
    matches: fightsByRound.value[num]
  }))
})

const hasBracketMatches = computed(() => sortedRounds.value.length > 0)

// Умные названия раундов на русском
const getRoundName = (roundNumber, totalRounds) => {
  if (totalRounds <= 1) return 'Финал'
  if (roundNumber === totalRounds) return 'Финал'

  const stage = Math.pow(2, totalRounds - roundNumber)
  if (stage === 2) return 'Полуфинал'
  if (stage === 4) return '1/4 финала'
  if (stage === 8) return '1/8 финала'
  if (stage === 16) return '1/16 финала'
  return `1/${stage} финала`
}

// Функция для расчета линий соединения
const calculateConnectionLines = () => {
  connectionLines.value = []

  if (!sortedRounds.value.length || sortedRounds.value.length < 2) return

  nextTick(() => {
    for (let roundIndex = 0; roundIndex < sortedRounds.value.length - 1; roundIndex++) {
      const currentRound = sortedRounds.value[roundIndex]
      const nextRound = sortedRounds.value[roundIndex + 1]

      if (!matchRefs.value[roundIndex] || !matchRefs.value[roundIndex + 1]) continue

      const matchesPerNextMatch = Math.ceil(currentRound.matches.length / nextRound.matches.length)

      nextRound.matches.forEach((nextMatch, nextMatchIndex) => {
        const startMatchIndex = nextMatchIndex * matchesPerNextMatch
        const endMatchIndex = Math.min(startMatchIndex + matchesPerNextMatch, currentRound.matches.length)

        const sourceMatches = []
        for (let i = startMatchIndex; i < endMatchIndex; i++) {
          const matchEl = matchRefs.value[roundIndex][i]
          if (matchEl) sourceMatches.push(matchEl)
        }

        const targetMatchEl = matchRefs.value[roundIndex + 1][nextMatchIndex]
        if (!targetMatchEl || sourceMatches.length === 0) return

        const targetRect = targetMatchEl.getBoundingClientRect()
        const containerRect = targetMatchEl.closest('.bracket-container').getBoundingClientRect()

        const targetX = targetRect.left - containerRect.left
        const targetY = targetRect.top - containerRect.top + targetRect.height / 2

        sourceMatches.forEach(sourceEl => {
          const sourceRect = sourceEl.getBoundingClientRect()
          const sourceX = sourceRect.right - containerRect.left
          const sourceY = sourceRect.top - containerRect.top + sourceRect.height / 2

          const midX = (sourceX + targetX) / 2

          const path = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`

          connectionLines.value.push({ path })
        })
      })
    }

    // Обновить размеры SVG
    const container = document.querySelector('.bracket-container')
    if (container) {
      svgWidth.value = container.scrollWidth
      svgHeight.value = container.scrollHeight
    }
  })
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
  matchRefs.value = {}
  roundRefs.value = []
  connectionLines.value = []

  if (newId !== null && tournament.value) {
    bracketLoading.value = true
    try {
      const res = await fetchBrackets(tournament.value.id, newId)

      if (!res.success) {
        throw new Error(res.error || 'Не удалось загрузить сетку')
      }

      bracketData.value = res
      console.log('Loaded bracket data:', res)

      // Рассчитать линии после загрузки данных
      await nextTick()
      setTimeout(calculateConnectionLines, 100)
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

/* НОВАЯ ТУРНИРНАЯ СЕТКА */
.tournament-bracket-final {
  margin-top: 4rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem;
  border-radius: 16px;
}

.section-title {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.no-matches {
  text-align: center;
  padding: 2rem;
  background: white;
  border: 2px dashed #c89b3c;
  border-radius: 16px;
  color: #666;
  font-size: 1rem;
}

.bracket-wrapper {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  overflow-x: auto;
  overflow-y: hidden;
}

.bracket-container {
  position: relative;
  min-width: max-content;
  padding: 2rem 0;
}

.bracket-lines {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
}

.bracket-rounds {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 120px;
  align-items: center;
}

.bracket-round {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.round-header {
  text-align: center;
  margin-bottom: 1.5rem;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  padding: 0.5rem 0;
}

.round-header h3 {
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  color: #1a1a1a;
  padding: 0.6rem 1.2rem;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1rem;
  display: inline-block;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.round-matches {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  justify-content: center;
  flex: 1;
}

.bracket-match {
  background: white;
  border: 3px solid #dee2e6;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  min-width: 200px;
}

.bracket-match:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-color: #d4af37;
}

.match-participant {
  padding: 1rem 1.2rem;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.match-participant.white {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-bottom: 2px solid #e9ecef;
}

.match-participant.blue {
  background: linear-gradient(135deg, #4dabf7 0%, #339af0 100%);
  color: white;
}

.match-participant:hover {
  filter: brightness(1.05);
}

.participant-name {
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  word-wrap: break-word;
  max-width: 100%;
}

.bye-participant {
  background: #f1f3f5 !important;
  color: #adb5bd !important;
  font-style: italic;
  opacity: 0.7;
}

.tbd-match .match-participant {
  background: #f8f9fa !important;
  color: #868e96 !important;
  font-style: italic;
}

/* Статусы матчей */
.status-scheduled {
  border-color: #adb5bd;
}

.status-live {
  border-color: #fa5252;
  box-shadow: 0 0 20px rgba(250, 82, 82, 0.4);
  animation: pulse-live 2s infinite;
}

@keyframes pulse-live {
  0%, 100% {
    box-shadow: 0 0 20px rgba(250, 82, 82, 0.4);
    border-color: #fa5252;
  }
  50% {
    box-shadow: 0 0 30px rgba(250, 82, 82, 0.6);
    border-color: #ff6b6b;
  }
}

.status-completed {
  border-color: #51cf66;
  box-shadow: 0 0 12px rgba(81, 207, 102, 0.3);
}

/* Адаптивность */
@media (max-width: 1200px) {
  .bracket-rounds {
    gap: 80px;
  }

  .bracket-match {
    min-width: 180px;
  }
}

@media (max-width: 768px) {
  .bracket-wrapper {
    padding: 1rem;
  }

  .bracket-rounds {
    gap: 60px;
  }

  .bracket-match {
    min-width: 150px;
  }

  .round-header h3 {
    font-size: 0.85rem;
    padding: 0.5rem 1rem;
  }

  .participant-name {
    font-size: 0.85rem;
  }

  .match-participant {
    padding: 0.8rem 1rem;
    min-height: 45px;
  }

  .round-matches {
    gap: 1.5rem;
  }
}

@media (max-width: 480px) {
  .tournament-bracket-final {
    padding: 1rem;
  }

  .bracket-rounds {
    gap: 50px;
  }

  .bracket-match {
    min-width: 130px;
  }

  .participant-name {
    font-size: 0.75rem;
  }
}
</style>