<template>
  <div class="fight-page">
    <div class="header">
      <button class="back" @click="$router.back()">Назад</button>
      <div class="header-content">
        <h1>Судейская панель: Схватка #{{ fight?.fight_number || fightId }}</h1>
        <div class="meta">
          Татами {{ fight?.tatami || '—' }} • Раунд {{ fight?.round_number || '—' }} • <span :class="statusClass">{{ statusText }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <p>Загрузка данных схватки...</p>
    </div>

    <div v-else class="fight-card">
      <!-- Белый -->
      <div class="athlete-section white">
        <h2 class="athlete-name">{{ getAthleteName(fight?.white_athlete) }} (Белый)</h2>
        <div class="scores">
          <div class="score-row"><span class="score-label">Ippon:</span><span class="score-value">{{ scores.white.ippon || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Waza-ari:</span><span class="score-value">{{ scores.white.wazaari || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Shido:</span><span class="score-value">{{ scores.white.penalty_count || 0 }}</span></div>
          <div class="score-row" v-if="osaekomi.active && osaekomi.athlete_color === 'WHITE'">
            <span class="score-label">Osaekomi:</span><span class="score-value">{{ osaekomi.time }}с</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn-action ippon" @click="confirmIppon('WHITE')" :disabled="fightStatus === 'COMPLETED'">Ippon</button>
          <button class="btn-action wazaari" @click="addWazaari('WHITE')" :disabled="fightStatus === 'COMPLETED'">Waza-ari</button>
          <button class="btn-action shido" @click="addPenalty('WHITE', 'SHIDO')" :disabled="fightStatus === 'COMPLETED'">Shido</button>
          <button class="btn-action hansoku" @click="addPenalty('WHITE', 'HANSOKU_MAKE')" :disabled="fightStatus === 'COMPLETED'">Hansoku-make</button>
          <button class="btn-action osaekomi" @click="toggleOsaekomi('WHITE')"
                  :disabled="fightStatus === 'COMPLETED' || (osaekomi.active && osaekomi.athlete_color !== 'WHITE')"
                  :class="{ active: osaekomi.active && osaekomi.athlete_color === 'WHITE' }">
            {{ osaekomi.active && osaekomi.athlete_color === 'WHITE' ? 'Osaekomi (идёт)' : 'Osaekomi' }}
          </button>
        </div>
      </div>

      <!-- Таймер -->
      <div class="timer-section">
        <h3 class="timer-display">
          {{ isGoldenScore ? formatTime(gsSeconds) : formatTime(timerSeconds) }}
        </h3>
        <p v-if="isGoldenScore" class="golden-score">Golden Score (прошедшее время)</p>
        <div class="timer-controls">
          <div class="time-controls-top">
            <button class="time-btn minus" @click="adjustTimer(-10)" :disabled="fightStatus === 'COMPLETED'">-10s</button>
            <div class="quick-time-buttons">
              <button class="quick-time-btn" @click="setTimerTime(120)">2:00</button>
              <button class="quick-time-btn" @click="setTimerTime(180)">3:00</button>
              <button class="quick-time-btn" @click="setTimerTime(240)">4:00</button>
              <button class="quick-time-btn skip-btn" @click="skipToTime(30)">→0:30</button>
            </div>
            <button class="time-btn plus" @click="adjustTimer(10)" :disabled="fightStatus === 'COMPLETED'">+10s</button>
          </div>
          <div class="timer-main-controls">
            <button v-if="!isRunning && fightStatus !== 'COMPLETED'" class="btn-timer start" @click="startTimer">
              {{ fightStatus === 'SCHEDULED' ? 'Hajime (Старт)' : 'Продолжить' }}
            </button>
            <button v-if="isRunning" class="btn-timer pause" @click="pauseTimer">Matte (Пауза)</button>
            <button class="btn-timer golden-score-btn" @click="enterGoldenScore" :disabled="fightStatus === 'COMPLETED'">
              {{ isGoldenScore ? 'Обычное время' : 'Golden Score' }}
            </button>
            <button class="btn-timer reset-scores" @click="resetScores" :disabled="fightStatus === 'COMPLETED'">Сбросить очки</button>
            <button class="btn-timer complete-btn" @click="openCompleteDialog"
                    :disabled="fightStatus !== 'IN_PROGRESS'">
              Завершить матч
            </button>
            <button v-if="fightStatus === 'COMPLETED'" class="btn-timer reset-full" @click="resetFullMatch">
              Сбросить матч
            </button>
          </div>
        </div>

        <div class="osaekomi-section" v-if="osaekomi.active">
          <h4>Osaekomi таймер:</h4>
          <div class="osaekomi-timer">
            <span class="osaekomi-time">{{ formatTime(osaekomi.time) }}</span>
            <span class="osaekomi-athlete">{{ osaekomi.athlete_color === 'WHITE' ? 'Белый' : 'Синий' }}</span>
          </div>
          <div class="osaekomi-progress">
            <div class="progress-bar"><div class="progress-fill" :style="{ width: osaekomiProgress + '%' }"></div></div>
            <span class="progress-text">
              {{ osaekomiProgress }}% ({{ osaekomi.time }}/20с)
              <span v-if="osaekomi.time >= 10" class="progress-notice">WAZA-ARI</span>
              <span v-if="osaekomi.time >= 20" class="progress-notice ippon">IPPON!</span>
            </span>
          </div>
          <button class="btn-osaekomi" @click="stopOsaekomi">Токета</button>
        </div>

        <p class="fight-status">Статус: {{ statusText }}</p>
      </div>

      <!-- Синий -->
      <div class="athlete-section blue">
        <h2 class="athlete-name">{{ getAthleteName(fight?.blue_athlete) }} (Синий)</h2>
        <div class="scores">
          <div class="score-row"><span class="score-label">Ippon:</span><span class="score-value">{{ scores.blue.ippon || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Waza-ari:</span><span class="score-value">{{ scores.blue.wazaari || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Shido:</span><span class="score-value">{{ scores.blue.penalty_count || 0 }}</span></div>
          <div class="score-row" v-if="osaekomi.active && osaekomi.athlete_color === 'BLUE'">
            <span class="score-label">Osaekomi:</span><span class="score-value">{{ osaekomi.time }}с</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn-action ippon" @click="confirmIppon('BLUE')" :disabled="fightStatus === 'COMPLETED'">Ippon</button>
          <button class="btn-action wazaari" @click="addWazaari('BLUE')" :disabled="fightStatus === 'COMPLETED'">Waza-ari</button>
          <button class="btn-action shido" @click="addPenalty('BLUE', 'SHIDO')" :disabled="fightStatus === 'COMPLETED'">Shido</button>
          <button class="btn-action hansoku" @click="addPenalty('BLUE', 'HANSOKU_MAKE')" :disabled="fightStatus === 'COMPLETED'">Hansoku-make</button>
          <button class="btn-action osaekomi" @click="toggleOsaekomi('BLUE')"
                  :disabled="fightStatus === 'COMPLETED' || (osaekomi.active && osaekomi.athlete_color !== 'BLUE')"
                  :class="{ active: osaekomi.active && osaekomi.athlete_color === 'BLUE' }">
            {{ osaekomi.active && osaekomi.athlete_color === 'BLUE' ? 'Osaekomi (идёт)' : 'Osaekomi' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="fightStatus === 'COMPLETED' && !loading" class="result-section">
      <h3>Схватка завершена</h3>
      <div class="result-card">
        <div class="result-item"><span class="result-label">Победитель:</span><span class="result-value">{{ getWinnerName() }}</span></div>
        <div class="result-item"><span class="result-label">Тип победы:</span><span class="result-value">{{ victoryTypeText }}</span></div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h4>Информация о схватке</h4>
        <div class="info-item">Категория: <strong>{{ fight?.category || 'Не указана' }}</strong></div>
        <div class="info-item">Весовая: <strong>{{ fight?.weight_class || 'Не указана' }}</strong></div>
        <div class="info-item">Статус: <strong :class="statusClass">{{ statusText }}</strong></div>
        <div class="info-item">Время: <strong>{{ formatTime(fightDurationPreset) }}</strong></div>
      </div>
      <div class="info-block">
        <h4>Журнал событий</h4>
        <div class="log-entries">
          <div v-for="(e, i) in eventLog" :key="i" class="log-entry" :class="e.type">
            <span class="log-time">{{ e.time }}</span>
            <span class="log-message">{{ e.message }}</span>
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
import "./FightDetail.css"

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
      fightDurationPreset: 240
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
    }
  },

  async mounted() {
    let rawId = this.$route.params.id
    if (typeof rawId === 'object' && rawId !== null) {
      rawId = rawId.id || rawId.fight_number || '???'
    }
    this.fightId = Number(rawId) || rawId || '???'
    this.loading = true

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

  beforeUnmount() {
    clearInterval(this.timerInterval)
    clearInterval(this.osaekomiInterval)
  },

  methods: {
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

    skipToTime(s) {
      this.setTimerTime(s)
    },

    adjustTimer(d) {
      if (this.fightStatus !== 'COMPLETED') this.timerSeconds = Math.max(0, this.timerSeconds + d)
    },

    async startTimer() {
      if (this.fightStatus === 'COMPLETED') return

      // Первый старт — переход из SCHEDULED в IN_PROGRESS
      if (this.fightStatus === 'SCHEDULED') {
        this.fightStatus = 'IN_PROGRESS'
        this.addEvent('fight', 'Hajime!')

        // Попытка отправить статус LIVE на сервер
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

      // Запуск/возобновление таймера (в любом случае)
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
    },

    resetScores() {
      if (confirm('Сбросить все очки и штрафы?')) {
        this.scores = {
          white: { ippon: 0, wazaari: 0, penalty_count: 0 },
          blue: { ippon: 0, wazaari: 0, penalty_count: 0 }
        }
        this.addEvent('reset', 'Очки и штрафы сброшены')
      }
    },

    resetFullMatch() {
      if (confirm('Сбросить весь матч полностью?')) {
        this.scores = {
          white: { ippon: 0, wazaari: 0, penalty_count: 0 },
          blue: { ippon: 0, wazaari: 0, penalty_count: 0 }
        }
        this.osaekomi = { active: false, athlete_color: null, time: 0 }
        this.timerSeconds = this.fightDurationPreset
        this.gsSeconds = 0
        this.isGoldenScore = false
        this.fightStatus = 'IN_PROGRESS'
        this.victoryType = null
        this.winnerColor = null
        this.isRunning = false
        clearInterval(this.timerInterval)
        clearInterval(this.osaekomiInterval)
        this.addEvent('system', 'Матч полностью сброшен')
      }
    }
  }
}
</script>

<style scoped>
.fight-page {
  width: 100%;
  min-height: 100vh;
  background: #f9f9fb;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  color: #1a1a1a;
  padding: 90px 2rem 4rem;
  box-sizing: border-box;
}

.header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  position: relative;
  height: 60px;
}

.back {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #c89b3c;
  padding: 0.5rem 1rem;
  z-index: 10;
}

.back:hover { color: #e0b456; }

.header-content {
  flex: 1;
  text-align: center;
  padding: 0 100px;
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
}

.meta {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.4rem;
}

.fight-card {
  display: flex;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

.athlete-section {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: #fdfdfd;
}

.athlete-name {
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  color: #1a1a1a;
}

.scores { width: 100%; }

.score-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0.4rem 0;
  padding: 0.6rem 0.8rem;
  background: rgba(255,255,255,0.8);
  border-radius: 8px;
  border-left: 4px solid #c89b3c;
}

.score-label { font-weight: 500; font-size: 1rem; color: #333; flex: 1; }
.score-value { font-weight: 700; font-size: 1.3rem; color: #c89b3c; min-width: 50px; text-align: right; }

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
  margin: 1rem 0;
  width: 100%;
}

.btn-action {
  padding: 0.8rem 1.4rem;
  border-radius: 30px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-size: 1rem;
  color: white;
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  box-shadow: 0 6px 20px rgba(200,155,60,0.3);
  flex: 1;
  min-width: 130px;
}

.btn-action:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(200,155,60,0.4);
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
  padding: 2rem 2.5rem;
  border-left: 1px solid #e8e8e8;
  border-right: 1px solid #e8e8e8;
  min-width: 400px;
}

.timer-display {
  font-size: 4.5rem;
  font-weight: 900;
  color: #c89b3c;
  margin-bottom: 0.5rem;
  font-family: 'SF Pro Display', monospace;
}

.golden-score {
  color: #c89b3c;
  font-weight: 700;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
}

.timer-controls { width: 100%; max-width: 420px; }

.time-btn, .quick-time-btn, .btn-timer {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 20px rgba(200,155,60,0.3);
  padding: 0.8rem 1.2rem;
}

.time-btn:hover:not(:disabled), .quick-time-btn:hover:not(:disabled), .btn-timer:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(200,155,60,0.4);
}

.osaekomi-section {
  background: #fdfaf0;
  border-radius: 12px;
  padding: 1.2rem;
  margin-top: 1.5rem;
  width: 100%;
  max-width: 400px;
  border: 2px solid #c89b3c;
}

.osaekomi-time { color: #c89b3c; font-size: 2.5rem; font-weight: 700; }
.progress-fill { background: linear-gradient(90deg, #c89b3c, #f4d03f); }
.progress-text { color: #a67c00; }
.btn-osaekomi { background: #a67c00; color: white; padding: 0.7rem 1.5rem; border: none; border-radius: 30px; cursor: pointer; }

.result-section, .info-block, .result-card {
  background: white;
  border-left: 6px solid #c89b3c;
  border-radius: 12px;
  padding: 1.5rem;
}

.result-label, .info-block h4 { color: #a67c00; }

.log-entry {
  background: #fdfdfb;
  border-left: 4px solid #c89b3c;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(200,155,60,0.4); } 70% { box-shadow: 0 0 0 10px rgba(200,155,60,0); } 100% { box-shadow: 0 0 0 0 rgba(200,155,60,0); } }

@media (max-width: 768px) {
  .fight-card { flex-direction: column; }
  .timer-section { min-width: 100%; order: -1; border: none; border-top: 1px solid #e8e8e8; border-bottom: 1px solid #e8e8e8; }
  .actions { flex-direction: column; }
  .btn-action { width: 100%; }
  .header-content { padding: 0 80px; }
}
</style>