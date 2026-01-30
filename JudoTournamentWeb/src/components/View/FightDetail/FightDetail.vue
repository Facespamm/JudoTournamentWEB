<template>
  <div class="fight-page">
    <div class="header">
      <button class="back" @click="$router.back()">Назад</button>
      <div class="header-content">
        <h1>Судейская панель: Схватка #{{ fight?.fight_number }}</h1>
        <div class="meta">
          Татами {{ fight?.tatami }} • Раунд {{ fight?.round_number }} • <span :class="statusClass">{{ statusText }}</span>
        </div>
      </div>
    </div>

    <div class="fight-card">
      <!-- Белый -->
      <div class="athlete-section white">
        <h2 class="athlete-name">{{ getAthleteName(fight?.white_athlete) }} (Белый)</h2>
        <div class="scores">
          <div class="score-row"><span class="score-label">Ippon:</span><span class="score-value">{{ scores.white.ippon || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Waza-ari:</span><span class="score-value">{{ scores.white.wazaari || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Yuko:</span><span class="score-value">{{ scores.white.yuko || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Shido:</span><span class="score-value">{{ scores.white.penalty_count || 0 }}</span></div>
          <div class="score-row" v-if="osaekomi.active && osaekomi.athlete_color === 'WHITE'">
            <span class="score-label">Osaekomi:</span><span class="score-value">{{ osaekomi.time }}с</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn-action ippon" @click="confirmIppon('WHITE')" :disabled="fightStatus === 'COMPLETED'">Ippon</button>
          <button class="btn-action wazaari" @click="addWazaari('WHITE')" :disabled="fightStatus === 'COMPLETED'">Waza-ari</button>
          <button class="btn-action yuko" @click="addYuko('WHITE')" :disabled="fightStatus === 'COMPLETED'">Yuko</button>
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
        <h3 class="timer-display">{{ formatTime(timerSeconds) }}</h3>
        <p v-if="isGoldenScore" class="golden-score">Golden Score</p>

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
            <button class="btn-timer undo" @click="undoLast" :disabled="fightStatus === 'COMPLETED'">Отменить</button>
            <button class="btn-timer reset-scores" @click="resetScores" :disabled="fightStatus === 'COMPLETED'">Сбросить очки</button>
            <button v-if="fightStatus === 'COMPLETED'" class="btn-timer reset-full" @click="resetFullMatch">Сбросить матч</button>
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
          <div class="score-row"><span class="score-label">Yuko:</span><span class="score-value">{{ scores.blue.yuko || 0 }}</span></div>
          <div class="score-row"><span class="score-label">Shido:</span><span class="score-value">{{ scores.blue.penalty_count || 0 }}</span></div>
          <div class="score-row" v-if="osaekomi.active && osaekomi.athlete_color === 'BLUE'">
            <span class="score-label">Osaekomi:</span><span class="score-value">{{ osaekomi.time }}с</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn-action ippon" @click="confirmIppon('BLUE')" :disabled="fightStatus === 'COMPLETED'">Ippon</button>
          <button class="btn-action wazaari" @click="addWazaari('BLUE')" :disabled="fightStatus === 'COMPLETED'">Waza-ari</button>
          <button class="btn-action yuko" @click="addYuko('BLUE')" :disabled="fightStatus === 'COMPLETED'">Yuko</button>
          <button class="btn-action shido" @click="addPenalty('BLUE', 'SHIDO')" :disabled="fightStatus === 'COMPLETED'">

            Shido</button>
          <button class="btn-action hansoku" @click="addPenalty('BLUE', 'HANSOKU_MAKE')" :disabled="fightStatus === 'COMPLETED'">Hansoku-make</button>
          <button class="btn-action osaekomi" @click="toggleOsaekomi('BLUE')"
                  :disabled="fightStatus === 'COMPLETED' || (osaekomi.active && osaekomi.athlete_color !== 'BLUE')"
                  :class="{ active: osaekomi.active && osaekomi.athlete_color === 'BLUE' }">
            {{ osaekomi.active && osaekomi.athlete_color === 'BLUE' ? 'Osaekomi (идёт)' : 'Osaekomi' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="fightStatus === 'COMPLETED'" class="result-section">
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
import { fetchGetDetail } from '@/components/View/Fight/fetchFights.js'
import { startFight } from "@/components/View/FightDetail/fetchFightPannel.js"
import "./FightDetail.css"

const API_BASE = 'http://127.0.0.1:5001/'

async function api(method, url, data = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'X-API-Key': 'mobile_app_2024' } }
  if (data) opts.body = JSON.stringify(data)
  const res = await fetch(`${API_BASE}${url}`, opts)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'API error')
  return res.json()
}

const getFightTimeline = async (fightId) => {
  try {
    const res = await fetch(`${API_BASE}/api/scores/fight/${fightId}/timeline`, { headers: { 'X-API-Key': 'mobile_app_2024' } })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

const saveEventsBatch = async (fightId, events) => {
  const res = await fetch(`${API_BASE}/api/scores/fight/${fightId}/events/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': 'mobile_app_2024' },
    body: JSON.stringify({ events })
  })
  if (!res.ok) throw new Error('Ошибка сохранения')
  return await res.json()
}

export default {
  name: 'RefereePanel',
  data() {
    return {
      fight: null,
      scores: { white: {}, blue: {} },
      osaekomi: { active: false, athlete_color: null, time: 0 },
      timerSeconds: 300,
      isRunning: false,
      timerInterval: null,
      fightStatus: 'SCHEDULED',
      isGoldenScore: false,
      victoryType: null,
      winnerColor: null,
      eventLog: [],
      fightDurationPreset: 300,
      pollInterval: null
    }
  },
  computed: {
    fightId() { return this.$route.params.id },
    statusText() {
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
        HANSOKU_MAKE: 'Хансоку-маке',
        OSAEKOMI: 'Осаекоми (20 сек)'
      }
      return map[this.victoryType] || '—'
    }
  },
  async created() {
    await this.loadFight()
    this.startPolling()
    await this.loadTimelineFromServer()
  },
  beforeUnmount() {
    clearInterval(this.timerInterval)
    clearInterval(this.pollInterval)
  },
  methods: {
    getAthleteName(a) {
      return a ? (a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Неизвестный') : 'TBD'
    },
    getWinnerName() {
      if (!this.winnerColor) return 'Решение судей'
      const a = this.winnerColor === 'WHITE' ? this.fight.white_athlete : this.fight.blue_athlete
      return `${this.getAthleteName(a)} (${this.winnerColor === 'WHITE' ? 'Белый' : 'Синий'})`
    },
    async loadFight() {
      this.fight = await fetchGetDetail(this.fightId)
      this.fightStatus = this.fight.status
      this.timerSeconds = this.fightDurationPreset = this.fight.timer_seconds || 300
      this.isGoldenScore = this.fight.is_golden_score || false
      await this.refreshScores()
    },
    async refreshScores() {
      try {
        const data = await api('GET', `/api/scores/fight/${this.fightId}/current`)
        this.scores = { white: data.white || {}, blue: data.blue || {} }
        this.osaekomi = data.osaekomi || { active: false, time: 0, athlete_color: null }
        this.victoryType = data.victory_type
        this.winnerColor = data.winner_id ? (data.winner_id === this.fight.white_athlete?.id ? 'WHITE' : 'BLUE') : null
        if (data.fight_status && data.fight_status !== this.fightStatus) {
          this.fightStatus = data.fight_status
          if (this.fightStatus === 'COMPLETED') {
            this.isRunning = false
            clearInterval(this.timerInterval)
            await this.syncEventsOnComplete()
          }
        }
      } catch (e) {
        this.addEvent('error', `Ошибка: ${e.message}`)
      }
    },
    startPolling() {
      this.pollInterval = setInterval(() => this.refreshScores(), 1000)
    },
    addEvent(type, msg) {
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      this.eventLog.unshift({ time, type, message: msg })
      if (this.eventLog.length > 100) this.eventLog.pop()
    },
    async loadTimelineFromServer() {
      const timeline = await getFightTimeline(this.fightId)
      if (timeline?.events?.length) {
        this.eventLog = timeline.events.map(e => ({
          time: new Date(e.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          type: e.type.toLowerCase(),
          message: e.description
        })).reverse()
        this.addEvent('system', 'Журнал загружен с сервера')
      }
    },
    async syncEventsOnComplete() {
      if (!this.eventLog.length) return
      try {
        const eventsToSend = this.eventLog.map(e => {
          const msg = e.message.toLowerCase()
          let type = 'CUSTOM', subtype = 'ACTION', athlete_color = null
          if (msg.includes('ippon')) { type = 'SCORE'; subtype = 'IPPON'; athlete_color = msg.includes('белый') ? 'WHITE' : 'BLUE' }
          else if (msg.includes('waza-ari')) { type = 'SCORE'; subtype = 'WAZAARI'; athlete_color = msg.includes('белый') ? 'WHITE' : 'BLUE' }
          else if (msg.includes('yuko')) { type = 'SCORE'; subtype = 'YUKO'; athlete_color = msg.includes('белый') ? 'WHITE' : 'BLUE' }
          else if (msg.includes('shido') || msg.includes('hansoku')) { type = 'PENALTY'; subtype = msg.includes('hansoku') ? 'HANSOKU_MAKE' : 'SHIDO'; athlete_color = msg.includes('белый') ? 'WHITE' : 'BLUE' }
          else if (msg.includes('osaekomi')) { type = 'OSAEKOMI'; subtype = msg.includes('начат') ? 'START' : 'STOP'; athlete_color = msg.includes('белый') ? 'WHITE' : 'BLUE' }
          else if (msg.includes('hajime')) type = subtype = 'FIGHT_START'
          else if (msg.includes('сброшен')) type = subtype = 'RESET'
          return { type, subtype, description: e.message, athlete_color, match_time: this.formatTime(this.timerSeconds), timestamp: new Date().toISOString(), details: { source: 'referee_panel', local_time: e.time } }
        }).reverse()
        await saveEventsBatch(this.fightId, eventsToSend)
        this.addEvent('system', 'Журнал сохранён на сервер')
      } catch {
        this.addEvent('error', 'Не удалось сохранить журнал')
      }
    },
    async addYuko(c) { await api('POST', `/api/scores/fight/${this.fightId}/yuko`, { athlete_color: c }); this.addEvent('score', `${c === 'WHITE' ? 'Белый' : 'Синий'}: Yuko`); await this.refreshScores() },
    async addWazaari(c) { await api('POST', `/api/scores/fight/${this.fightId}/wazaari`, { athlete_color: c }); this.addEvent('score', `${c === 'WHITE' ? 'Белый' : 'Синий'}: Waza-ari`); await this.refreshScores() },
    async addIppon(c) { await api('POST', `/api/scores/fight/${this.fightId}/ippon`, { athlete_color: c }); this.addEvent('score', `${c === 'WHITE' ? 'Белый' : 'Синий'}: IPPON — ПОБЕДА!`); await this.refreshScores(); await this.syncEventsOnComplete() },
    async addPenalty(c, t) { await api('POST', `/api/scores/fight/${this.fightId}/penalty`, { athlete_color: c, penalty_type: t }); this.addEvent('penalty', `${c === 'WHITE' ? 'Белый' : 'Синий'}: ${t}`); await this.refreshScores() },
    async startOsaekomi(c) { await api('POST', `/api/scores/fight/${this.fightId}/osaekomi/start`, { athlete_color: c }); this.addEvent('osaekomi', `${c === 'WHITE' ? 'Белый' : 'Синий'}: Osaekomi начат`) },
    async stopOsaekomi() { await api('POST', `/api/scores/fight/${this.fightId}/osaekomi/stop`); this.addEvent('osaekomi', 'Osaekomi остановлен'); await this.refreshScores() },
    async toggleOsaekomi(c) { this.osaekomi.active && this.osaekomi.athlete_color === c ? this.stopOsaekomi() : this.startOsaekomi(c) },
    async undoLast() { await api('POST', `/api/scores/fight/${this.fightId}/undo`); this.addEvent('undo', 'Отменено последнее действие'); await this.refreshScores() },
    async enterGoldenScore() { await api('POST', `/api/scores/fight/${this.fightId}/golden-score`); this.addEvent('timer', 'Golden Score'); await this.refreshScores() },
    async resetScores() { if (confirm('Сбросить все очки и штрафы?')) { await api('POST', `/api/scores/fight/${this.fightId}/reset`); this.addEvent('reset', 'Очки и штрафы сброшены'); await this.refreshScores() } },
    async resetFullMatch() { if (confirm('Сбросить весь результат матча?')) { await api('POST', `/api/fights/${this.fightId}/reset`, { reason: 'Переигровка' }); await this.loadFight() } },
    confirmIppon(c) { if (confirm('Ippon — бой завершится!')) this.addIppon(c) },
    formatTime(s) {
      const m = Math.floor(s / 60)
      const sec = s % 60
      return `${m}:${sec < 10 ? '0' : ''}${sec}`
    },
    setTimerTime(s) { if (this.fightStatus !== 'COMPLETED') this.timerSeconds = s },
    skipToTime(s) { this.setTimerTime(s) },
    adjustTimer(d) { if (this.fightStatus !== 'COMPLETED') this.timerSeconds = Math.max(0, this.timerSeconds + d) },
    async startTimer() {
      if (this.fightStatus === 'COMPLETED') return
      if (!this.isRunning) {
        if (this.fightStatus === 'SCHEDULED') {
          await startFight({ status: 'IN_PROGRESS', started_at: new Date().toISOString() }, this.fightId)
          this.fightStatus = 'IN_PROGRESS'
          this.addEvent('fight', 'Hajime!')
        }
        this.isRunning = true
        this.timerInterval = setInterval(() => {
          if (this.timerSeconds > 0) {
            this.timerSeconds--
            if (this.timerSeconds === 0 && !this.isGoldenScore) this.enterGoldenScore()
          } else {
            clearInterval(this.timerInterval)
            this.isRunning = false
          }
        }, 1000)
      }
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
.fight-page {
  width: 100%;
  min-height: 100vh;
  background: #f9f9fb;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  color: #1a1a1a;
  padding: 90px 2rem 4rem;
  box-sizing: border-box;
}

/* Header — кнопка слева, текст строго по центру */
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
  padding: 0 100px; /* увеличил отступы, чтобы текст был точно по центру */
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