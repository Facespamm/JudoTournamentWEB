<template>
  <div class="bracket-detail">
    <div class="bracket-detail-container">
      <div class="bracket-detail-header">
        <button class="back-button" @click="$router.back()">← Назад</button>
        <h1>Сетка соревнований</h1>
      </div>

      <div v-if="isLoading" class="loading"><div class="spinner"></div><p>Загрузка...</p></div>
      <div v-else-if="error" class="error"><p>{{ error }}</p><button @click="loadBracketDetail">Повторить</button></div>

      <div v-else-if="bracket" class="bracket-info">
        <div class="bracket-main-info">
          <h2 class="bracket-name">{{ bracket.bracket }}</h2>
          <div class="bracket-controls">
            <div class="bracket-badge">{{ getBracketTypeName(bracket.bracket_type) }}</div>
          </div>
        </div>

        <div class="bracket-details-grid">
          <div class="detail-section">
            <h3>Информация</h3>
            <div class="detail-item"><span>Статус:</span><span :class="getStatusClass(bracket.status)">{{ getStatusText(bracket.status) }}</span></div>
            <div class="detail-item"><span>Тип:</span><span>{{ getBracketTypeName(bracket.bracket_type) }}</span></div>
            <div class="detail-item"><span>Участников:</span><span>{{ getTotalAthletes() }}</span></div>
            <div class="detail-item"><span>Матчей:</span><span>{{ totalMatches }}</span></div>
          </div>
        </div>

        <!-- ТУРНИРНАЯ СЕТКА -->
        <div class="tournament-bracket-final">
          <h2 class="section-title">Турнирная сетка</h2>

          <!-- Сообщение если нет матчей -->
          <div v-if="!hasMatches" class="no-matches">
            <p>Нет данных о матчах</p>
            <button class="reseed-btn" @click="generateBracket">Сгенерировать сетку</button>
          </div>

          <!-- Динамическая сетка на основе реальных данных -->
          <div v-else class="bracket-canvas">
            <!-- Отображаем раунды в правильном порядке -->
            <div v-for="(round, roundIndex) in sortedRounds"
                 :key="roundIndex"
                 class="round"
                 :class="getRoundClass(roundIndex, sortedRounds.length)">
              <div class="round-label">{{ getRoundName(round.roundNumber, sortedRounds.length) }}</div>
              <div class="matches">
                <div v-for="(match, matchIndex) in round.matches"
                     :key="matchIndex"
                     class="match"
                     :class="{
                       'tbd-match': !match.hasFighters,
                       'connected': shouldConnect(roundIndex, sortedRounds.length)
                     }">
                  <div class="slot top">
                    <span class="name">{{ match.topName || 'TBD' }}</span>
                  </div>
                  <div class="vs">vs</div>
                  <div class="slot bottom">
                    <span class="name">{{ match.bottomName || 'TBD' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Автоматически добавляем TBD раунды если нужно -->
            <div v-if="needsTbdRounds" class="round tbd-round">
              <div class="round-label">{{ getNextRoundName(sortedRounds.length) }}</div>
              <div class="matches">
                <div v-for="n in tbdMatchesCount" :key="n" class="match tbd-match">
                  <div class="slot top">
                    <span class="name">TBD</span>
                  </div>
                  <div class="vs">vs</div>
                  <div class="slot bottom">
                    <span class="name">TBD</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Гранд-финал если это одиночная сетка -->
            <div v-if="isSingleElimination && sortedRounds.length > 1" class="round grand-final">
              <div class="round-label">Финал</div>
              <div class="matches">
                <div class="match tbd-match">
                  <div class="slot top">
                    <span class="name">TBD</span>
                  </div>
                  <div class="vs">vs</div>
                  <div class="slot bottom">
                    <span class="name">TBD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button v-if="hasMatches" class="reseed-btn" @click="generateBracket">Пересоздать</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchBracketDetail } from "@/components/View/Brackets/fetchBrackets.js"

const route = useRoute()
const bracket = ref(null)
const isLoading = ref(true)
const error = ref('')

// Вычисляемые свойства для динамической сетки
const hasMatches = computed(() => {
  return bracket.value?.fights_by_round && Object.keys(bracket.value.fights_by_round).length > 0
})

const totalMatches = computed(() => {
  if (!bracket.value?.fights_by_round) return 0
  return Object.values(bracket.value.fights_by_round).flat().length
})

const isSingleElimination = computed(() => {
  return bracket.value?.bracket_type === 'single_elimination'
})

// Преобразуем данные из API в структуру для отображения
const sortedRounds = computed(() => {
  if (!hasMatches.value) return []

  const rounds = []
  const fightRounds = bracket.value.fights_by_round

  // Сортируем раунды по номеру
  const roundNumbers = Object.keys(fightRounds).sort((a, b) => parseInt(a) - parseInt(b))

  roundNumbers.forEach(roundNum => {
    const roundFights = fightRounds[roundNum]
    const matches = []

    roundFights.forEach(fight => {
      matches.push({
        topName: fight.white_athlete?.name || null,
        bottomName: fight.blue_athlete?.name || null,
        hasFighters: !!(fight.white_athlete || fight.blue_athlete),
        fightNumber: fight.fight_number
      })
    })

    rounds.push({
      roundNumber: parseInt(roundNum),
      matches: matches
    })
  })

  return rounds
})

// Нужны ли дополнительные TBD раунды
const needsTbdRounds = computed(() => {
  if (!sortedRounds.value.length) return false
  const firstRound = sortedRounds.value[0]
  return firstRound.matches.length > 1 && sortedRounds.value.length === 1
})

// Количество TBD матчей для следующего раунда
const tbdMatchesCount = computed(() => {
  if (!sortedRounds.value.length) return 0
  return Math.ceil(sortedRounds.value[0].matches.length / 2)
})

// Функции для определения классов и названий раундов
const getRoundClass = (index, totalRounds) => {
  if (index === 0) return 'first-round'
  if (index === totalRounds - 1) return 'final-round'
  return 'middle-round'
}

const getRoundName = (roundNumber, totalRounds) => {
  // Простые названия раундов без дробей
  if (totalRounds === 1) return 'Матчи'
  if (roundNumber === 1) return 'Первый раунд'
  if (roundNumber === 2) return 'Второй раунд'
  if (roundNumber === 3) return 'Третий раунд'
  if (roundNumber === totalRounds) return 'Финал'
  return `Раунд ${roundNumber}`
}

const getNextRoundName = (currentRoundsCount) => {
  const nextRound = currentRoundsCount + 1
  if (nextRound === 2) return 'Следующий раунд'
  if (nextRound === 3) return 'Финал'
  return `Раунд ${nextRound}`
}

const shouldConnect = (roundIndex, totalRounds) => {
  return roundIndex < totalRounds - 1
}

// Функция для генерации сетки (заглушка)
const generateBracket = () => {
  console.log('Генерация сетки...')
  alert('Функция генерации сетки будет реализована позже')
}

const loadBracketDetail = async () => {
  isLoading.value = true
  try {
    const res = await fetchBracketDetail(route.params.id)
    if (res.success) bracket.value = res
  } catch (e) {
    error.value = 'Ошибка загрузки'
    console.error('Ошибка загрузки сетки:', e)
  }
  finally { isLoading.value = false }
}

const getStatusClass = s => ({ COMPLETED: 'status-completed', LIVE: 'status-live' }[s] || '')
const getStatusText = s => ({ GENERATED: 'Сгенерирована', DRAFT: 'Черновик', COMPLETED: 'Завершена', LIVE: 'Идёт' }[s] || s)
const getBracketTypeName = t => ({ single_elimination: 'Олимпийская', double_elimination: 'Двойная', round_robin: 'Круговая' }[t] || t)
const getTotalAthletes = () => bracket.value ? new Set(Object.values(bracket.value.fights_by_round).flat().flatMap(f => [f.white_athlete?.id, f.blue_athlete?.id]).filter(Boolean)).size : 0

onMounted(loadBracketDetail)
</script>

<style scoped>
.bracket-detail { min-height: 100vh; background: #f8f9fa; padding: 90px 0 4rem; }
.bracket-detail-container { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
.back-button { background: #c89b3c; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }
.bracket-name { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
.bracket-badge { background: #c89b3c; color: #fff; padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; display: inline-block; }

.bracket-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.detail-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.detail-section h3 {
  margin: 0 0 1rem 0;
  color: #1a1a1a;
  font-size: 1.2rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

/* === ТУРНИРНАЯ СЕТКА === */
.tournament-bracket-final { margin-top: 3rem; }
.section-title { text-align: center; font-size: 1.8rem; margin-bottom: 2rem; color: #1a1a1a; font-weight: 700; }

.no-matches {
  text-align: center;
  padding: 3rem;
  background: white;
  border: 2px dashed #c89b3c;
  border-radius: 16px;
}

.no-matches p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.bracket-canvas {
  background: white;
  border: 2px solid #c89b3c;
  border-radius: 16px;
  padding: 4rem 2rem;
  overflow-x: auto;
  display: flex;
  justify-content: center;
  gap: 60px;
  position: relative;
  min-height: 500px;
}

.round {
  position: relative;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 200px;
}

.round-label {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #fff9e6 0%, #fff 100%);
  border: 2px solid #c89b3c;
  color: #c89b3c;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
  z-index: 10;
}

.matches {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 10px;
}

.match {
  width: 180px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,.05);
  position: relative;
}

.tbd-match .slot {
  background: #f5f5f5 !important;
  color: #999;
}
.tbd-match .vs {
  background: #eaeaea;
  color: #999;
}

.slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-weight: 500;
  min-height: 40px;
}
.slot.top {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}
.slot.bottom {
  background: #e7f3ff;
}

.name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  text-align: center;
}

.vs {
  text-align: center;
  padding: 5px;
  background: #f0f0f0;
  color: #666;
  font-weight: 600;
  font-size: 0.7rem;
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}

/* Соединительные линии между раундами */
.round:not(:last-child) .match {
  position: relative;
}

/* Горизонтальная линия от каждого матча */
.round:not(:last-child) .match::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -60px;
  width: 30px;
  height: 2px;
  background: #c89b3c;
  z-index: 1;
  transform: translateY(-50%);
}

/* Вертикальная линия соединяющая пары матчей */
.round:not(:last-child) .match:nth-child(4n+1)::before,
.round:not(:last-child) .match:nth-child(4n+2)::before {
  content: '';
  position: absolute;
  right: -30px;
  width: 2px;
  background: #c89b3c;
  z-index: 1;
}

/* Вертикальная линия вниз от нечетного матча */
.round:not(:last-child) .match:nth-child(4n+1)::before {
  top: 50%;
  height: calc(100% + 30px);
}

/* Вертикальная линия вверх от четного матча */
.round:not(:last-child) .match:nth-child(4n+2)::before {
  bottom: 50%;
  height: calc(100% + 30px);
}

/* Для второй пары в группе из 4 */
.round:not(:last-child) .match:nth-child(4n+3)::before {
  content: '';
  position: absolute;
  right: -30px;
  top: 50%;
  width: 2px;
  background: #c89b3c;
  z-index: 1;
  height: calc(100% + 30px);
}

.round:not(:last-child) .match:nth-child(4n)::before {
  content: '';
  position: absolute;
  right: -30px;
  bottom: 50%;
  width: 2px;
  background: #c89b3c;
  z-index: 1;
  height: calc(100% + 30px);
}

.reseed-btn {
  margin: 2rem auto 0;
  display: block;
  background: transparent;
  color: #c89b3c;
  border: 2px solid #c89b3c;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reseed-btn:hover {
  background: #c89b3c;
  color: #fff;
}

/* Статусы */
.status-completed { color: #10b981; font-weight: 600; }
.status-live { color: #ef4444; font-weight: 600; animation: pulse 2s infinite; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Адаптивность */
@media (max-width: 768px) {
  .bracket-canvas {
    gap: 40px;
    padding: 3rem 1rem;
  }

  .match {
    width: 160px;
  }

  .round {
    min-width: 170px;
  }

  .bracket-detail-container {
    padding: 0 1rem;
  }
}
</style>