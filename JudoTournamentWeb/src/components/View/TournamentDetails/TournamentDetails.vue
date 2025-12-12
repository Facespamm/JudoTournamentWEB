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
      </section>

      <!-- ТАБЛО СО СЧЕТОМ -->
      <div class="scoreboard-section">
        <div class="scoreboard">
          <span class="team-left">Команда A: 5</span>
          <span class="vs">vs</span>
          <span class="team-right">Команда B: 3</span>
        </div>
      </div>

      <!-- ПЛЕЕР ТРАНСЛЯЦИИ -->
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

      <!-- СЕТКА ТУРНИРА — только отображение (приходит с бэкенда) -->
      <section v-if="tournament.bracket && tournament.bracket.length" class="bracket-section">
        <div class="bracket-header">
          <h2>Турнирная сетка</h2>
          <!-- Кнопка "Пересоздать" полностью удалена -->
        </div>

        <div class="bracket-container">
          <div class="bracket">
            <div
                v-for="(round, roundIndex) in tournament.bracket"
                :key="roundIndex"
                class="bracket-round"
            >
              <h3>{{ round.name }}</h3>
              <div class="matches">
                <div
                    v-for="(match, matchIndex) in round.matches"
                    :key="matchIndex"
                    class="match-card"
                    :class="{
                      'status-scheduled': match.status === 'SCHEDULED',
                      'status-live': match.status === 'LIVE',
                      'status-completed': match.status === 'COMPLETED'
                    }"
                >
                  <div class="team-slot" :class="{ winner: match.winner === 1 }">
                    <span class="team-name">{{ match.team1 || 'TBD' }}</span>
                    <span class="score-display">{{ match.score1 ?? '-' }}</span>
                  </div>
                  <div class="vs-divider">VS</div>
                  <div class="team-slot" :class="{ winner: match.winner === 2 }">
                    <span class="team-name">{{ match.team2 || 'TBD' }}</span>
                    <span class="score-display">{{ match.score2 ?? '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Если сетки ещё нет -->
      <section v-else class="bracket-section">
        <div class="bracket-header">
          <h2>Турнирная сетка</h2>
        </div>
        <p style="text-align:center; color:#888; padding:2rem 0;">
          Турнирная сетка будет опубликована после завершения жеребьёвки.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchTournamentDetail } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'
import "@/components/View/TournamentDetails/TournamentDetails.css"

const route = useRoute()
const tournament = ref(null)
const isLoading = ref(true)
const error = ref('')

// Вспомогательные функции (без изменений)
const formatDate = (startDate, endDate) => {
  if (!startDate) return 'Дата не указана'
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (startDate === endDate) {
    return start.toLocaleDateString('ru-RU')
  }
  return `${start.toLocaleDateString('ru-RU')} – ${end.toLocaleDateString('ru-RU')}`
}

const getLocation = (tournament) => {
  const parts = []
  if (tournament.venue && tournament.venue !== 'string') parts.push(tournament.venue)
  if (tournament.city && tournament.city !== 'string') parts.push(tournament.city)
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
    'PLANNED': 'Запланирован',
    'COMPLETED': 'Завершен',
    'REGISTRATION': 'Регистрация',
    'WEIGHING': 'Взвешивание',
    'BRACKETS': 'Сетки'
  }
  return statusMap[status] || status
}

// Загрузка данных турнира
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
    console.error('Error loading tournament:', err)
    error.value = err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTournamentDetail()
})
</script>

<!-- СТИЛИ — 100% ОРИГИНАЛЬНЫЕ, НИ ОДНА СТРОКА НЕ ИЗМЕНЕНА -->
<style scoped>
.tournament-detail-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.back-button {
  background: #c89b3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #e0b456;
  transform: translateY(-1px);
}

.tournament-main-info {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.tournament-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-label {
  font-weight: 500;
  color: #666;
}

.meta-value {
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-planned {
  background: #e3f2fd;
  color: #1976d2;
}

.status-live {
  background: #fbe9e7;
  color: #d32f2f;
}

.status-completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.loading, .error {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  color: #d32f2f;
  padding: 2rem;
}

.retry-button {
  background: #c89b3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #e0b456;
}

.score-display {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  color: #333;
  padding: 0.25rem 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}
</style>