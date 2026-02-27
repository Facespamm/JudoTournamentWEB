<template>
  <div class="fight-detail">
    <div class="header">
      <button class="back" @click="$router.back()">←</button>
      <div class="header-content">
        <h1>Схватка #{{ fight?.fight_number || fightId }}</h1>
        <div class="meta">
          Татами {{ fight?.tatami || '—' }} • Раунд {{ fight?.round_number || '—' }} • <span :class="statusClass">{{ statusText }}</span>
        </div>
      </div>
      <button class="forward" @click="goToFight(1)" :disabled="!hasNext">→</button>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Загрузка данных схватки...</p>
    </div>

    <div v-else class="fight-card">
      <!-- Белый -->
      <div class="athlete-section white">
        <h2 class="athlete-name">{{ getAthleteName(fight?.white_athlete) }}</h2>
        <span class="color-badge">Белый</span>
        <div class="scores">
          <div class="score-row"><span class="score-label">Ippon:</span><span class="score-value">{{ scores.white.ippon || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Waza-ari:</span><span class="score-value">{{ scores.white.wazaari || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Shido:</span><span class="score-value">{{ scores.white.penalty_count || 0 }}</span></div>
        </div>
        <div class="actions">
          <button class="btn-action ippon" @click="confirmIppon('WHITE')" :disabled="fightStatus === 'COMPLETED'">Ippon</button>
          <button class="btn-action wazaari" @click="addWazaari('WHITE')" :disabled="fightStatus === 'COMPLETED'">Waza-ari</button>
          <button class="btn-action shido" @click="addPenalty('WHITE', 'SHIDO')" :disabled="fightStatus === 'COMPLETED'">Shido</button>
          <button class="btn-action hansoku" @click="addPenalty('WHITE', 'HANSOKU_MAKE')" :disabled="fightStatus === 'COMPLETED'">Hansoku</button>
          <button class="btn-action osaekomi" @click="toggleOsaekomi('WHITE')"
                  :disabled="fightStatus === 'COMPLETED' || (osaekomi.active && osaekomi.athlete_color !== 'WHITE')"
                  :class="{ active: osaekomi.active && osaekomi.athlete_color === 'WHITE' }">
            {{ osaekomi.active && osaekomi.athlete_color === 'WHITE' ? 'Osaekomi ✓' : 'Osaekomi' }}
          </button>
        </div>
      </div>

      <!-- Таймер -->
      <div class="timer-section">
        <h3 class="timer-display">
          {{ isGoldenScore ? formatTime(gsSeconds) : formatTime(timerSeconds) }}
        </h3>
        <p v-if="isGoldenScore" class="golden-score">Golden Score</p>
        <div class="timer-controls">
          <div class="time-adjust">
            <button class="time-btn" @click="adjustTimer(-10)" :disabled="fightStatus === 'COMPLETED'">-10s</button>
            <div class="quick-times">
              <button class="quick-btn" @click="setTimerTime(120)">2:00</button>
              <button class="quick-btn" @click="setTimerTime(180)">3:00</button>
              <button class="quick-btn" @click="setTimerTime(240)">4:00</button>
            </div>
            <button class="time-btn" @click="adjustTimer(10)" :disabled="fightStatus === 'COMPLETED'">+10s</button>
          </div>
          <div class="main-controls">
            <button v-if="!isRunning && fightStatus !== 'COMPLETED'" class="btn-timer start" @click="startTimer">
              {{ fightStatus === 'SCHEDULED' ? 'Hajime' : 'Продолжить' }}
            </button>
            <button v-if="isRunning" class="btn-timer pause" @click="pauseTimer">Matte</button>
            <button class="btn-timer golden" @click="enterGoldenScore" :disabled="fightStatus === 'COMPLETED'">
              {{ isGoldenScore ? 'Обычное время' : 'Golden Score' }}
            </button>
            <button class="btn-timer complete" @click="openCompleteDialog" :disabled="fightStatus !== 'IN_PROGRESS'">
              Завершить
            </button>
          </div>
        </div>

        <div class="osaekomi-box" v-if="osaekomi.active">
          <div class="osaekomi-header">
            <span class="osaekomi-time">{{ formatTime(osaekomi.time) }}</span>
            <span class="osaekomi-athlete">{{ osaekomi.athlete_color === 'WHITE' ? 'Белый' : 'Синий' }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: osaekomiProgress + '%' }"></div>
          </div>
          <button class="btn-stop" @click="stopOsaekomi">Токета</button>
        </div>

        <p class="status-text">{{ statusText }}</p>
      </div>

      <!-- Синий -->
      <div class="athlete-section blue">
        <h2 class="athlete-name">{{ getAthleteName(fight?.blue_athlete) }}</h2>
        <span class="color-badge">Синий</span>
        <div class="scores">
          <div class="score-row"><span class="score-label">Ippon:</span><span class="score-value">{{ scores.blue.ippon || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Waza-ari:</span><span class="score-value">{{ scores.blue.wazaari || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Shido:</span><span class="score-value">{{ scores.blue.penalty_count || 0 }}</span></div>
        </div>
        <div class="actions">
          <button class="btn-action ippon" @click="confirmIppon('BLUE')" :disabled="fightStatus === 'COMPLETED'">Ippon</button>
          <button class="btn-action wazaari" @click="addWazaari('BLUE')" :disabled="fightStatus === 'COMPLETED'">Waza-ari</button>
          <button class="btn-action shido" @click="addPenalty('BLUE', 'SHIDO')" :disabled="fightStatus === 'COMPLETED'">Shido</button>
          <button class="btn-action hansoku" @click="addPenalty('BLUE', 'HANSOKU_MAKE')" :disabled="fightStatus === 'COMPLETED'">Hansoku</button>
          <button class="btn-action osaekomi" @click="toggleOsaekomi('BLUE')"
                  :disabled="fightStatus === 'COMPLETED' || (osaekomi.active && osaekomi.athlete_color !== 'BLUE')"
                  :class="{ active: osaekomi.active && osaekomi.athlete_color === 'BLUE' }">
            {{ osaekomi.active && osaekomi.athlete_color === 'BLUE' ? 'Osaekomi ✓' : 'Osaekomi' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="fightStatus === 'COMPLETED' && !loading" class="result-box">
      <h3>Результат</h3>
      <div class="result-info">
        <div class="result-row"><span>Победитель:</span><strong>{{ getWinnerName() }}</strong></div>
        <div class="result-row"><span>Тип победы:</span><strong>{{ victoryTypeText }}</strong></div>
      </div>
    </div>

    <div class="info-section">
      <div class="info-card">
        <h4>Информация</h4>
        <div class="info-row">Категория: <strong>{{ fight?.category || '—' }}</strong></div>
        <div class="info-row">Весовая: <strong>{{ fight?.weight_class || '—' }}</strong></div>
        <div class="info-row">Время: <strong>{{ formatTime(fightDurationPreset) }}</strong></div>
        <div class="info-row" v-if="fightIds.length > 1">
          Бой: <strong>{{ currentIndex + 1 }} из {{ fightIds.length }}</strong>
        </div>
      </div>
      <div class="info-card">
        <h4>Журнал событий</h4>
        <div class="log-box">
          <div v-for="(e, i) in eventLog" :key="i" class="log-item">
            <span class="log-time">{{ e.time }}</span>
            <span class="log-msg">{{ e.message }}</span>
          </div>
          <div v-if="!eventLog.length" class="no-events">Событий пока нет</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { endFight, setLifeFight } from "@/components/View/FightDetail/fetchFightPannel.js"
import { fetchGetDetailFight } from "@/components/View/Fight/fetchFights.js"

export default {
  name: 'RefereePanel',

  data() {
    return {
      fightId: null,
      fight: null,
      loading: true,
      scores: {
        white: { ippon: 0, wazaari: 0, penalty_count: 0 },
        blue: { ippon: 0, wazaari: 0, penalty_count: 0 }
      },
      osaekomi: { active: false, athlete_color: null, time: 0 },
      osaekomiInterval: null,
      timerSeconds: 240,
      gsSeconds: 0,
      isRunning: false,
      timerInterval: null,
      fightStatus: 'SCHEDULED',
      isGoldenScore: false,
      victoryType: null,
      winnerColor: null,
      eventLog: [],
      fightDurationPreset: 240,
      fightIds: [],
      currentIndex: -1
    }
  },

  computed: {
    statusText() {
      if (this.loading || !this.fight) return 'Загрузка...'
      return { SCHEDULED: 'Запланировано', IN_PROGRESS: 'LIVE', COMPLETED: 'Завершено' }[this.fightStatus] || this.fightStatus
    },
    statusClass() {
      return this.fightStatus.toLowerCase().replace('_', '-')
    },
    osaekomiProgress() {
      return Math.min(100, (this.osaekomi.time / 20) * 100)
    },
    victoryTypeText() {
      const map = {
        IPPON: 'Иппон',
        WAZAARI_AWASETE_IPPON: 'Ваза-ари авасетэ иппон',
        SHIDO: 'По штрафам (3 шидо)',
        HANSOKU_MAKE: 'Хансоку-макэ',
        OSAEKOMI: 'Осаэкоми (20 сек)',
        POINTS: 'По очкам',
        DECISION: 'Решение судей'
      }
      return map[this.victoryType] || this.victoryType || '—'
    },
    hasPrev() {
      return this.currentIndex > 0
    },
    hasNext() {
      return this.currentIndex !== -1 && this.currentIndex < this.fightIds.length - 1
    }
  },

  watch: {
    '$route.params.id': {
      async handler(newId) {
        if (!newId) return
        clearInterval(this.timerInterval)
        clearInterval(this.osaekomiInterval)

        // Сохраняем список перед сбросом
        const savedFightIds = [...this.fightIds]

        // Сброс состояния
        this.fight = null
        this.loading = true
        this.scores = {
          white: { ippon: 0, wazaari: 0, penalty_count: 0 },
          blue: { ippon: 0, wazaari: 0, penalty_count: 0 }
        }
        this.osaekomi = { active: false, athlete_color: null, time: 0 }
        this.osaekomiInterval = null
        this.timerSeconds = 240
        this.gsSeconds = 0
        this.isRunning = false
        this.timerInterval = null
        this.fightStatus = 'SCHEDULED'
        this.isGoldenScore = false
        this.victoryType = null
        this.winnerColor = null
        this.eventLog = []
        this.fightDurationPreset = 240

        // Восстанавливаем список и обновляем индекс
        this.fightIds = savedFightIds
        this.fightId = Number(newId) || newId
        this.currentIndex = this.fightIds.indexOf(this.fightId)

        await this.loadFight()
      }
    }
  },

  async mounted() {
    let rawId = this.$route.params.id
    if (typeof rawId === 'object' && rawId !== null) {
      rawId = rawId.id || rawId.fight_number || '???'
    }
    this.fightId = Number(rawId) || rawId || '???'

    // Читаем список ID из sessionStorage
    try {
      const saved = sessionStorage.getItem('fightIds')
      if (saved) {
        this.fightIds = JSON.parse(saved)
        this.currentIndex = this.fightIds.indexOf(this.fightId)
      }
    } catch (e) {
      this.fightIds = []
    }

    this.loading = true
    await this.loadFight()
  },

  beforeUnmount() {
    clearInterval(this.timerInterval)
    clearInterval(this.osaekomiInterval)
  },

  methods: {
    async loadFight() {
      try {
        const res = await fetchGetDetailFight(this.fightId)

        if (res && (res.id || res.fight_number)) {
          this.fight = res
          this.fightStatus = res.status || 'SCHEDULED'
          this.fightDurationPreset = res.timer_seconds || 240
          this.timerSeconds = this.fightDurationPreset

          console.log('Загруженный fight:', this.fight)
          if (!this.fight.white_athlete?.id || !this.fight.blue_athlete?.id) {
            this.addEvent('warning', 'Внимание: ID атлетов отсутствуют в данных! Победитель будет отправлен как null.')
          }
        } else {
          throw new Error('Нет данных или неверный формат ответа')
        }
      } catch (err) {
        console.error('Ошибка загрузки деталей боя:', err)
        alert('Не удалось загрузить данные схватки')

        this.fight = {
          fight_number: this.fightId,
          tatami: '—',
          round_number: '—',
          white_athlete: { first_name: 'Белый', last_name: 'атлет' },
          blue_athlete: { first_name: 'Синий', last_name: 'атлет' }
        }
      } finally {
        this.loading = false
      }
    },

    goToFight(direction) {
      const newIndex = this.currentIndex + direction
      if (newIndex < 0 || newIndex >= this.fightIds.length) return
      const newId = this.fightIds[newIndex]
      this.$router.push(`/fights/${newId}`)
    },

    getAthleteName(a) {
      if (!a) return 'TBD'
      const surname = a.middle_name || ''
      const name = a.first_name || ''
      const patronymic = a.last_name || ''
      return `${surname} ${name} ${patronymic}`.trim() || 'Неизвестный'
    },

    getWinnerName() {
      if (!this.winnerColor || !this.fight) return 'Решение судей'
      const a = this.winnerColor === 'WHITE' ? this.fight.white_athlete : this.fight.blue_athlete
      return `${this.getAthleteName(a)} (${this.winnerColor === 'WHITE' ? 'Белый' : 'Синий'})`
    },

    addEvent(type, msg) {
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      this.eventLog.unshift({ time, type, message: msg })
      if (this.eventLog.length > 100) this.eventLog.pop()
    },

    addWazaari(color) {
      const side = color.toLowerCase()
      this.scores[side].wazaari += 1
      this.addEvent('score', `${color === 'WHITE' ? 'Белый' : 'Синий'}: Waza-ari`)
      if (this.scores[side].wazaari >= 2) {
        this.completeFight(color, 'WAZAARI_AWASETE_IPPON')
      }
    },

    confirmIppon(color) {
      if (confirm('Ippon — бой завершится!')) {
        this.completeFight(color, 'IPPON')
      }
    },

    addPenalty(color, type) {
      const side = color.toLowerCase()
      if (type === 'SHIDO') {
        this.scores[side].penalty_count += 1
        this.addEvent('penalty', `${color === 'WHITE' ? 'Белый' : 'Синий'}: Shido`)
        if (this.scores[side].penalty_count >= 3) {
          const opposite = color === 'WHITE' ? 'BLUE' : 'WHITE'
          this.completeFight(opposite, 'HANSOKU_MAKE')
        }
      } else if (type === 'HANSOKU_MAKE') {
        const opposite = color === 'WHITE' ? 'BLUE' : 'WHITE'
        this.completeFight(opposite, 'HANSOKU_MAKE')
      }
    },

    toggleOsaekomi(color) {
      if (this.osaekomi.active && this.osaekomi.athlete_color === color) {
        this.stopOsaekomi()
      } else {
        this.startOsaekomi(color)
      }
    },

    startOsaekomi(color) {
      this.osaekomi.active = true
      this.osaekomi.athlete_color = color
      this.osaekomi.time = 0
      clearInterval(this.osaekomiInterval)
      this.osaekomiInterval = setInterval(() => {
        this.osaekomi.time += 1
        if (this.osaekomi.time === 10) {
          this.addWazaari(color)
          this.addEvent('osaekomi', `${color === 'WHITE' ? 'Белый' : 'Синий'}: Waza-ari (10 сек осаэкоми)`)
        }
        if (this.osaekomi.time === 20) {
          clearInterval(this.osaekomiInterval)
          this.osaekomi.active = false
          this.osaekomi.time = 0
          this.osaekomi.athlete_color = null
          this.addEvent('osaekomi', `${color === 'WHITE' ? 'Белый' : 'Синий'}: Ippon (20 сек осаэкоми)`)
          this.completeFight(color, 'OSAEKOMI')
        }
      }, 1000)
      this.addEvent('osaekomi', `${color === 'WHITE' ? 'Белый' : 'Синий'}: Osaekomi начат`)
    },

    stopOsaekomi() {
      clearInterval(this.osaekomiInterval)
      const time = this.osaekomi.time
      const color = this.osaekomi.athlete_color
      this.osaekomi.active = false
      this.osaekomi.time = 0
      this.osaekomi.athlete_color = null
      if (time >= 10 && time < 20) {
        this.addWazaari(color)
        this.addEvent('osaekomi', `${color === 'WHITE' ? 'Белый' : 'Синий'}: Waza-ari (${time} сек осаэкоми)`)
      }
      this.addEvent('osaekomi', 'Токета')
    },

    completeFight(color, localVictoryType) {
      this.winnerColor = color
      this.victoryType = localVictoryType
      this.scores[color.toLowerCase()].ippon = 1
      this.fightStatus = 'COMPLETED'
      this.isRunning = false
      clearInterval(this.timerInterval)
      this.addEvent('system', `Победа ${color === 'WHITE' ? 'Белый' : 'Синий'} — ${this.victoryTypeText}`)

      let serverVictoryType = localVictoryType
      if (['IPPON', 'WAZAARI_AWASETE_IPPON', 'OSAEKOMI'].includes(localVictoryType)) {
        serverVictoryType = 'IPPON'
      }

      const winnerId = color === 'WHITE' ? this.fight?.white_athlete?.id : this.fight?.blue_athlete?.id

      console.log('winner ID:', winnerId)
      if (!winnerId) {
        this.addEvent('warning', 'ID победителя не найден — отправляем winner_athlete_id: null')
      }

      const elapsedSeconds = this.fightDurationPreset - this.timerSeconds + this.gsSeconds
      const minutes = Math.floor(elapsedSeconds / 60)
      const seconds = elapsedSeconds % 60
      const endTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

      const payload = {
        start_time: '0:00',
        end_time: endTime,
        victory_type: serverVictoryType,
        winner_athlete_id: winnerId ?? null
      }

      endFight(payload, this.fightId)
          .then(() => {
            this.addEvent('system', 'Результат успешно отправлен на сервер')
          })
          .catch(e => {
            this.addEvent('error', `Ошибка отправки результата: ${e.message || e}`)
          })
    },

    async openCompleteDialog() {
      if (!confirm('Завершить схватку вручную?')) return

      const winnerChoice = prompt('Победитель:\n"white" — белый, "blue" — синий, пусто — решение судей', '')
      const winnerColor = winnerChoice === 'white' ? 'WHITE' : winnerChoice === 'blue' ? 'BLUE' : null
      const winnerId = winnerChoice === 'white' ? this.fight?.white_athlete?.id :
          winnerChoice === 'blue' ? this.fight?.blue_athlete?.id : null

      if (winnerColor && !winnerId) {
        this.addEvent('warning', 'ID выбранного победителя не найден — отправляем null')
      }

      const victoryType = prompt('Тип победы (IPPON, POINTS, DECISION, HANSOKU_MAKE и т.д.)', 'POINTS').toUpperCase()

      const elapsedSeconds = this.fightDurationPreset - this.timerSeconds + this.gsSeconds
      const minutes = Math.floor(elapsedSeconds / 60)
      const seconds = elapsedSeconds % 60
      const endTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

      const payload = {
        start_time: '0:00',
        end_time: endTime,
        victory_type: victoryType,
        winner_athlete_id: winnerId ?? null
      }

      this.winnerColor = winnerColor
      this.victoryType = victoryType
      this.fightStatus = 'COMPLETED'
      this.isRunning = false
      clearInterval(this.timerInterval)
      this.addEvent('system', `Матч завершён вручную: ${victoryType}, время ${endTime}`)

      try {
        await endFight(payload, this.fightId)
        this.addEvent('system', 'Результат успешно отправлен на сервер')
      } catch (e) {
        this.addEvent('error', `Ошибка отправки результата: ${e.message || e}`)
      }
    },

    enterGoldenScore() {
      this.isGoldenScore = !this.isGoldenScore
      if (this.isGoldenScore) this.gsSeconds = 0
      this.addEvent('timer', this.isGoldenScore ? 'Переход в Golden Score' : 'Возврат к обычному времени')
    },

    formatTime(s) {
      const m = Math.floor(Math.max(0, s) / 60)
      const sec = Math.max(0, s) % 60
      return `${m}:${sec < 10 ? '0' : ''}${sec}`
    },

    setTimerTime(s) {
      if (this.fightStatus !== 'COMPLETED') this.timerSeconds = s
    },

    adjustTimer(d) {
      if (this.fightStatus !== 'COMPLETED') this.timerSeconds = Math.max(0, this.timerSeconds + d)
    },

    async startTimer() {
      if (this.fightStatus === 'COMPLETED') return

      if (this.fightStatus === 'SCHEDULED') {
        this.fightStatus = 'IN_PROGRESS'
        this.addEvent('fight', 'Hajime!')

        if (this.fightId && this.fight?.tatami != null) {
          try {
            const result = await setLifeFight(this.fightId, this.fight.tatami)
            if (result.success) {
              this.addEvent('system', `Схватка переведена в LIVE на татами ${this.fight.tatami}`)
            } else {
              this.addEvent('error', `Не удалось перевести в LIVE: ${result.error || 'неизвестная ошибка'}`)
              console.error('setLifeFight error:', result)
            }
          } catch (err) {
            this.addEvent('error', `Ошибка сети при переводе в LIVE: ${err.message || err}`)
            console.error('setLifeFight exception:', err)
          }
        } else {
          this.addEvent('warning', 'Нет fightId или номера татами — перевод в LIVE пропущен')
        }
      }

      this.isRunning = true
      clearInterval(this.timerInterval)
      this.timerInterval = setInterval(() => {
        if (this.isGoldenScore) {
          this.gsSeconds += 1
        } else if (this.timerSeconds > 0) {
          this.timerSeconds -= 1
          if (this.timerSeconds === 0) {
            this.enterGoldenScore()
          }
        }
      }, 1000)
    },

    pauseTimer() {
      if (this.isRunning) {
        this.isRunning = false
        clearInterval(this.timerInterval)
        this.addEvent('timer', 'Matte')
      }
    }
  }
}
</script>

<style scoped>
.fight-detail {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  box-sizing: border-box;
  margin-left: 0;
  padding-top: 80px;
  max-width: calc(100vw - var(--sidebar-width, 120px) - 40px);
  padding-left: 20px;
}

.header {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  position: relative;
  height: 50px;
}

.back {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #c89b3c;
  padding: 0.4rem 0.8rem;
  z-index: 10;
  transition: color 0.2s;
}

.back:hover { color: #e0b456; }

/* Кнопка вперёд — полное зеркало кнопки назад */
.forward {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #c89b3c;
  padding: 0.4rem 0.8rem;
  z-index: 10;
  transition: color 0.2s;
}

.forward:hover:not(:disabled) { color: #e0b456; }

.forward:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.header-content {
  flex: 1;
  text-align: center;
  padding: 0 80px;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.meta {
  color: #666;
  font-size: 0.85rem;
  margin-top: 0.3rem;
}

.fight-card {
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.athlete-section {
  flex: 1;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  background: #fdfdfd;
}

.athlete-name {
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  color: #1a1a1a;
  margin: 0;
}

.color-badge {
  font-size: 0.85rem;
  font-weight: 700;
  color: #c89b3c;
  background: #fdfaf0;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
}

.scores { width: 100%; }

.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.3rem 0;
  padding: 0.5rem 0.7rem;
  background: rgba(255,255,255,0.8);
  border-radius: 6px;
  border-left: 3px solid #c89b3c;
}

.score-label { font-weight: 500; font-size: 0.9rem; color: #333; flex: 1; }
.score-value { font-weight: 700; font-size: 1.1rem; color: #c89b3c; min-width: 40px; text-align: right; }

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
  margin: 0.6rem 0;
  width: 100%;
}

.btn-action {
  padding: 0.6rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 0.85rem;
  color: white;
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  box-shadow: 0 4px 12px rgba(200,155,60,0.2);
  flex: 1;
  min-width: 100px;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(200,155,60,0.3);
}

.btn-action.active {
  background: linear-gradient(135deg, #a67c00, #d4af37);
  animation: pulse 2s infinite;
}

.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

.timer-section {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-left: 1px solid #e8e8e8;
  border-right: 1px solid #e8e8e8;
  min-width: 350px;
}

.timer-display {
  font-size: 3.5rem;
  font-weight: 900;
  color: #c89b3c;
  margin: 0 0 0.4rem 0;
  font-family: 'SF Pro Display', monospace;
}

.golden-score {
  color: #c89b3c;
  font-weight: 700;
  font-size: 1rem;
  margin: 0 0 1rem 0;
}

.timer-controls { width: 100%; max-width: 380px; }

.time-adjust {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.time-btn {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(200,155,60,0.2);
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.quick-times {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.quick-btn {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 16px;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  flex: 1;
  color: #333;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #c89b3c;
  color: white;
  border-color: #c89b3c;
}

.main-controls {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.btn-timer {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(200,155,60,0.2);
  padding: 0.7rem 1.2rem;
  font-size: 0.9rem;
}

.btn-timer:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(200,155,60,0.3);
}

.btn-timer:disabled { opacity: 0.5; cursor: not-allowed; }

.osaekomi-box {
  background: #fdfaf0;
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  width: 100%;
  max-width: 350px;
  border: 2px solid #c89b3c;
}

.osaekomi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.osaekomi-time { color: #c89b3c; font-size: 2rem; font-weight: 700; font-family: monospace; }
.osaekomi-athlete { font-weight: 600; color: #a67c00; font-size: 1rem; }

.progress-bar {
  width: 100%;
  height: 10px;
  background: #e8e8e8;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 0.6rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #c89b3c, #f4d03f);
  transition: width 1s ease;
}

.btn-stop {
  background: #a67c00;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  width: 100%;
  font-weight: 700;
  font-size: 0.9rem;
}

.status-text {
  margin-top: 1rem;
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.result-box {
  background: white;
  border-left: 5px solid #c89b3c;
  border-radius: 12px;
  padding: 1.2rem;
  max-width: 1200px;
  margin: 1.5rem auto;
}

.result-box h3 {
  margin: 0 0 0.8rem 0;
  color: #a67c00;
  font-size: 1.1rem;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 0.9rem;
}

.result-row:last-child { border-bottom: none; }

.info-section {
  max-width: 1200px;
  margin: 1.5rem auto 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
}

.info-card {
  background: white;
  padding: 1.2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  border: 1px solid #e8e8e8;
}

.info-card h4 {
  margin: 0 0 0.8rem 0;
  color: #a67c00;
  font-size: 1rem;
  font-weight: 600;
  border-bottom: 2px solid #f5f5f5;
  padding-bottom: 0.6rem;
}

.info-row {
  margin: 0.3rem 0;
  font-size: 0.85rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f9f9f9;
}

.info-row:last-child { border-bottom: none; }

.log-box {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 0.6rem;
}

.log-item {
  padding: 0.5rem 0.6rem;
  margin-bottom: 0.4rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background: #fdfdfb;
  border-left: 3px solid #c89b3c;
  display: flex;
  gap: 0.8rem;
}

.log-time {
  font-weight: 600;
  color: #666;
  min-width: 60px;
  font-size: 0.75rem;
}

.log-msg { flex: 1; color: #333; }

.no-events {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 1rem;
  font-size: 0.85rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(200,155,60,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(200,155,60,0); }
  100% { box-shadow: 0 0 0 0 rgba(200,155,60,0); }
}

@media (max-width: 768px) {
  .fight-card { flex-direction: column; }
  .timer-section { min-width: 100%; order: -1; border: none; border-bottom: 1px solid #e8e8e8; }
  .actions { flex-direction: column; }
  .btn-action { width: 100%; }
  .header-content { padding: 0 60px; }
  .time-adjust { flex-direction: column; }
  .quick-times { width: 100%; }
}
</style>