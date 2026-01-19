<template>
  <div class="scoreboard-page">
    <!-- ЗАГОЛОВОК -->
    <div class="scoreboard-header">
      <h1>🏆 Турнирное табло</h1>
      <p class="subtitle">Прямые трансляции схваток в реальном времени</p>
      <div class="tournament-stats">
        <div class="stat-item">
          <span class="stat-number">{{ liveFights.length }}</span>
          <span class="stat-label">LIVE схваток</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ completedFightsCount }}</span>
          <span class="stat-label">Завершено</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ totalFightsCount }}</span>
          <span class="stat-label">Всего схваток</span>
        </div>
      </div>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="scoreboard-filters">
      <select v-model="selectedTournament" @change="loadLiveFights" class="filter-select">
        <option value="">Все турниры</option>
        <option v-for="tournament in tournaments" :key="tournament.id" :value="tournament.id">
          {{ tournament.name }}
        </option>
      </select>
      <select v-model="selectedTatami" @change="loadLiveFights" class="filter-select">
        <option value="">Все татами</option>
        <option v-for="tatami in tatamiList" :key="tatami" :value="tatami">
          Татами {{ tatami }}
        </option>
      </select>
      <button @click="loadLiveFights" class="refresh-btn">
        🔄 Обновить
      </button>
    </div>

    <!-- LIVE СХВАТКИ -->
    <div class="live-fights-section">
      <h2>🔴 Прямой эфир</h2>
      <div v-if="liveFights.length === 0" class="no-fights">
        <div class="no-fights-icon">⏸️</div>
        <p>Нет активных схваток</p>
        <p class="subtext">Следующие схватки появятся здесь автоматически</p>
      </div>
      <div v-else class="fights-list">
        <div
            v-for="fight in liveFights"
            :key="fight.id"
            class="fight-card"
            :class="{ 'golden-score': fight.is_golden_score }"
        >
          <!-- Шапка: татами + номер + категория -->
          <div class="fight-header">
            <div class="fight-meta">
              <span class="tatami-badge">Татами {{ fight.tatami }}</span>
              <span class="fight-number">Схватка #{{ fight.fight_number }}</span>
              <span class="category-badge">{{ fight.category?.name || 'Категория' }}</span>
            </div>
          </div>

          <!-- Контейнер для таймера и спортсменов -->
          <div class="fight-athletes-container">
            <!-- ЦЕНТРАЛЬНЫЙ ТАЙМЕР — ВЫШЕ ВСЕХ -->
            <div class="center-timer-section">
              <div class="fight-timer" :class="{ 'golden-score-timer': fight.is_golden_score }">
                <div class="timer-display">{{ formatTime(fight.timer_seconds) }}</div>
                <div v-if="fight.is_golden_score" class="golden-score-label">GOLDEN SCORE</div>
              </div>
            </div>

            <!-- Белый и Синий -->
            <div class="fight-athletes">
              <!-- БЕЛЫЙ -->
              <div class="athlete white">
                <div class="belt white-belt"></div>
                <div class="athlete-info">
                  <div class="name">{{ fight.white_athlete?.full_name || 'TBD' }}</div>
                  <div class="club">{{ fight.white_athlete?.club?.name || '' }}</div>
                </div>
                <div class="score-block">
                  <div class="points">{{ fight.result?.white_score || 0 }}</div>
                  <div class="penalties">
                    <span v-for="(penalty, index) in getPenalties(fight.result, 'WHITE')" :key="index" class="shido">SHIDO</span>
                  </div>
                </div>
              </div>
              <div class="vs">VS</div>
              <!-- СИНИЙ -->
              <div class="athlete blue">
                <div class="score-block">
                  <div class="points">{{ fight.result?.blue_score || 0 }}</div>
                  <div class="penalties">
                    <span v-for="(penalty, index) in getPenalties(fight.result, 'BLUE')" :key="index" class="shido">SHIDO</span>
                  </div>
                </div>
                <div class="athlete-info">
                  <div class="name">{{ fight.blue_athlete?.full_name || 'TBD' }}</div>
                  <div class="club">{{ fight.blue_athlete?.club?.name || '' }}</div>
                </div>
                <div class="belt blue-belt"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- БЛИЖАЙШИЕ СХВАТКИ -->
    <div class="upcoming-fights-section">
      <h2>⏭️ Следующие схватки</h2>
      <div v-if="upcomingFights.length === 0" class="no-upcoming">
        <p>Нет запланированных схваток</p>
      </div>
      <div v-else class="upcoming-list">
        <div v-for="fight in upcomingFights" :key="fight.id" class="upcoming-fight">
          <div class="upcoming-info">
            <span class="time">{{ formatScheduledTime(fight.scheduled_time) }}</span>
            <span class="tatami">Татами {{ fight.tatami }}</span>
            <span class="category">{{ fight.category?.name }}</span>
          </div>
          <div class="athletes-preview">
            <span>{{ fight.white_athlete?.full_name || 'TBD' }}</span>
            <span class="vs-small">vs</span>
            <span>{{ fight.blue_athlete?.full_name || 'TBD' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- АВТО-ОБНОВЛЕНИЕ -->
    <div class="auto-refresh-indicator">
      <div class="refresh-status">
        <span class="dot" :class="{ active: isAutoRefreshing }"></span>
        Авто-обновление: {{ isAutoRefreshing ? 'ВКЛ' : 'ВЫКЛ' }}
      </div>
      <button @click="toggleAutoRefresh" class="toggle-refresh-btn">
        {{ isAutoRefreshing ? '⏸️ Пауза' : '▶️ Возобновить' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import "./Scoreboard.css"
const liveFights = ref([])
const upcomingFights = ref([])
const tournaments = ref([])
const selectedTournament = ref('')
const selectedTatami = ref('')
const isAutoRefreshing = ref(true)
const refreshInterval = ref(null)
const tatamiList = ref([1, 2, 3, 4])
const completedFightsCount = ref(14)
const totalFightsCount = ref(52)

const loadLiveFights = async () => {
  liveFights.value = [
    {
      id: 1,
      tatami: 1,
      fight_number: 24,
      round_number: 3,
      status: 'LIVE',
      timer_seconds: 187,
      is_golden_score: false,
      category: { name: 'Мужчины до 73кг' },
      white_athlete: {
        id: 101,
        full_name: 'Азамат Сарсенбеков',
        club: { name: 'Динамо Алматы' }
      },
      blue_athlete: {
        id: 102,
        full_name: 'Ерлан Серикжанов',
        club: { name: 'Южный ветер' }
      },
      result: {
        white_score: 1,
        blue_score: 0,
        white_penalties: 'SHIDO,SHIDO',
        blue_penalties: 'SHIDO',
        technique_used: 'Uchi-mata',
        victory_type: 'WAZAARI',
        winner_id: 101
      }
    }
  ]
  upcomingFights.value = [
    {
      id: 3,
      tatami: 2,
      scheduled_time: '2025-11-18T14:30:00Z',
      category: { name: 'Мужчины до 81кг' },
      white_athlete: { full_name: 'Нурлан Омаров' },
      blue_athlete: { full_name: 'Алишер Жуманов' }
    },
    {
      id: 4,
      tatami: 1,
      scheduled_time: '2025-11-18T14:45:00Z',
      category: { name: 'Женщины до 63кг' },
      white_athlete: { full_name: 'Гульнара Абдрахманова' },
      blue_athlete: { full_name: 'Камила Бекенова' }
    }
  ]
}

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '5:00'
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec < 10 ? '0' + sec : sec}`
}

const getPenalties = (result, color) => {
  if (!result) return []
  const penalties = color === 'WHITE' ? result.white_penalties : result.blue_penalties
  return penalties ? penalties.split(',') : []
}

const formatScheduledTime = (time) => time ? new Date(time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''

const toggleAutoRefresh = () => {
  isAutoRefreshing.value = !isAutoRefreshing.value
  isAutoRefreshing.value ? startAutoRefresh() : stopAutoRefresh()
}
const startAutoRefresh = () => {
  refreshInterval.value = setInterval(loadLiveFights, 5000)
}
const stopAutoRefresh = () => {
  if (refreshInterval.value) clearInterval(refreshInterval.value)
}

onMounted(() => {
  loadLiveFights()
  startAutoRefresh()
})
onUnmounted(stopAutoRefresh)
</script>

<style scoped>
</style>