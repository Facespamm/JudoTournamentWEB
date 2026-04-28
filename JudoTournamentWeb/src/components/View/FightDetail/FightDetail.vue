<template>
  <div class="board" @keydown.prevent tabindex="0">

    <!-- ══ МОДАЛКА АКТИВАЦИИ ══ -->
    <FocusModal
        :visible="showFocusModal"
        @activate="onActivate"
    />
    <!-- ══ ЭКРАН ОТДЫХА ══ -->
    <div v-if="restMode" class="rest-screen">
      <div class="rest-label">ОТДЫХ</div>
      <div class="rest-timer">{{ fmt(restSeconds) }}</div>
      <div class="rest-sub">Следующий бой начнётся через...</div>
    </div>

    <!-- ══ НЕТ БОЁВ ══ -->
    <div v-else-if="!fight" class="no-fight">
      Нет боёв на татами {{ tatami }}
    </div>

    <!-- ══ ОСНОВНОЕ ТАБЛО ══ -->
    <template v-else>

      <!-- Белый -->
      <div class="athlete-row white" :class="{ flash: flash === 'white' }">
        <div class="name-block">
          <div class="athlete-name">
            {{ getAthleteName(fight.white_athlete) }}
            <span v-if="whitePoints > bluePoints" class="win-dot">●</span>
          </div>
          <div class="club-name">{{ fight.white_athlete?.club || fight.white_athlete?.team_name || '—' }}</div>
        </div>

        <div class="scores-container">
          <div class="score-card" :class="{ 'score-card--active': white.ippon > 0 }">
            <div class="score-card-label">IPPON</div>
            <div class="score-card-value">{{ white.ippon }}</div>
          </div>

          <div class="score-card" :class="{ 'score-card--active': white.wazaari > 0 }">
            <div class="score-card-label">WAZA-ARI</div>
            <div class="score-card-value">{{ white.wazaari }}</div>
          </div>

          <div class="score-card" :class="{ 'score-card--active': white.yuko > 0 }">
            <div class="score-card-label">YUKO</div>
            <div class="score-card-value">{{ white.yuko }}</div>
          </div>
        </div>

        <div class="penalty-block" :class="{ 'penalty-block--danger': white.shido >= 2 }">
          <div class="penalty-label">ШТРАФЫ</div>
          <div class="penalty-value">
            <span v-if="white.hansoku" class="hansoku-badge">H</span>
            <span v-else>{{ white.shido }}</span>
          </div>
        </div>
      </div>

      <!-- Синий -->
      <div class="athlete-row blue" :class="{ flash: flash === 'blue' }">
        <div class="name-block">
          <div class="athlete-name">
            {{ getAthleteName(fight.blue_athlete) }}
            <span v-if="bluePoints > whitePoints" class="win-dot">●</span>
          </div>
          <div class="club-name">{{ fight.blue_athlete?.club || fight.blue_athlete?.team_name || '—' }}</div>
        </div>

        <div class="scores-container">
          <div class="score-card score-card--blue" :class="{ 'score-card--active': blue.ippon > 0 }">
            <div class="score-card-label">IPPON</div>
            <div class="score-card-value">{{ blue.ippon }}</div>
          </div>

          <div class="score-card score-card--blue" :class="{ 'score-card--active': blue.wazaari > 0 }">
            <div class="score-card-label">WAZA-ARI</div>
            <div class="score-card-value">{{ blue.wazaari }}</div>
          </div>

          <div class="score-card score-card--blue" :class="{ 'score-card--active': blue.yuko > 0 }">
            <div class="score-card-label">YUKO</div>
            <div class="score-card-value">{{ blue.yuko }}</div>
          </div>
        </div>

        <div class="penalty-block" :class="{ 'penalty-block--danger': blue.shido >= 2 }">
          <div class="penalty-label">ШТРАФЫ</div>
          <div class="penalty-value">
            <span v-if="blue.hansoku" class="hansoku-badge">H</span>
            <span v-else>{{ blue.shido }}</span>
          </div>
        </div>
      </div>

      <!-- Нижняя полоса -->
      <div class="bottom-bar">
        <div class="category-block">
          <div class="category-text">{{ fight.category || fight.weight_class || 'Senior' }}</div>
          <div class="stage-text">{{ fight.stage || `Раунд ${fight.round_number || '—'}` }}</div>
        </div>

        <div class="timer-block">
          <div v-if="isGoldenScore" class="gs-label">GOLDEN SCORE</div>
          <div class="timer-digits" :class="{ blink: isLow, gold: isGoldenScore }">
            {{ fmt(displayTime) }}
          </div>
        </div>

        <div class="osa-block">
          <template v-if="osa.active">
            <div class="osa-label">
              OSAEKOMI — {{ osa.color === 'white' ? 'БЕЛЫЙ' : 'СИНИЙ' }}
            </div>
            <div class="osa-track">
              <div class="osa-fill" :class="osa.color"
                   :style="{ width: (osa.time / 20 * 100) + '%' }" />
              <div class="osa-mark" title="10s = waza-ari" />
            </div>
            <div class="osa-time">{{ osa.time }}s / 20s</div>
          </template>
          <template v-else>
            <div class="osa-idle">F / J — osaekomi &nbsp;|&nbsp; H — toketa</div>
          </template>
        </div>
      </div>

    </template>
  </div>
</template>

<script>
import { endFight, setLifeFight, resetFight } from "@/components/View/FightDetail/fetchFightPannel.js"
import { fetchGetDetailFight } from "@/components/View/Fight/fetchFights.js"
import FocusModal from "@/components/View/FightDetail/FocusModal.vue";

// ─── Константы ───────────────────────────────────────────────────────────────
const OSAEKOMI_MAX = 20
const OSAEKOMI_WAZAARI = 10
const REST_DURATION = 15

export default {
  name: 'TimerBoard',
  components: {FocusModal},

  props: {
    tatami: { type: Number, default: 1 },
  },

  data() {
    return {
      fightId: null,
      fight: null,
      loading: false,
      showFocusModal: true,        // ← по умолчанию показываем модалку
      isLiveActivated: false,

      seconds: 240,
      gsSeconds: 0,
      running: false,
      isGoldenScore: false,
      fightStatus: 'SCHEDULED',

      white: this.emptyScore(),
      blue: this.emptyScore(),

      historyW: [],
      historyB: [],

      osa: { active: false, color: null, time: 0 },

      restMode: false,
      restSeconds: REST_DURATION,

      flash: null,

      _timerInterval: null,
      _osaInterval: null,
      _restInterval: null,
      _holdTimeout: null,
      _keyDownTime: {},

      // Для переключения боёв (как в старом коде)
      fightIds: [],
      currentIndex: -1,
    }
  },

  computed: {
    canModifyScore() {
      return !this.showFocusModal && this.isLiveActivated && !this.isFightCompleted
    },
    whitePoints() {
      return (this.white.ippon || 0) * 100 + (this.white.wazaari || 0) * 10 + (this.white.yuko || 0)
    },
    bluePoints() {
      return (this.blue.ippon || 0) * 100 + (this.blue.wazaari || 0) * 10 + (this.blue.yuko || 0)
    },
    displayTime() {
      return this.isGoldenScore ? this.gsSeconds : this.seconds
    },
    isLow() {
      return !this.isGoldenScore && this.seconds <= 30 && this.running
    },
    fightDuration() {
      return this.fight?.timer_seconds || 240
    },
    isFightCompleted() {
      return this.fightStatus === 'COMPLETED'
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
        this.fightId = Number(newId) || newId
        this.currentIndex = this.fightIds.indexOf(this.fightId)
        this.showFocusModal = true;
        this.isLiveActivated = false;
        await this.loadFight()
      },
      immediate: true
    }
  },

  async mounted() {
    // Отключаем скролл на body только для этой страницы
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // Фокус на компонент для клавиатуры
    this.$nextTick(() => {
      this.$el.focus()
    })

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)

    // Загружаем ID боёв из sessionStorage (как в старом коде)
    try {
      const saved = sessionStorage.getItem('fightIds')
      if (saved) {
        this.fightIds = JSON.parse(saved)
        console.log('Загружены ID боёв:', this.fightIds)
      }
    } catch (e) {
      this.fightIds = []
    }

    // Если нет сохранённых ID, пробуем загрузить
    if (this.fightIds.length === 0) {
      await this.loadFightIds()
    }

    let rawId = this.$route.params.id
    if (typeof rawId === 'object' && rawId !== null) {
      rawId = rawId.id || rawId.fight_number || '???'
    }
    this.fightId = Number(rawId) || rawId || '???'
    this.currentIndex = this.fightIds.indexOf(this.fightId)

    await this.loadFight()
  },

  beforeUnmount() {
    // Восстанавливаем скролл при уходе со страницы
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''

    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    clearInterval(this._timerInterval)
    clearInterval(this._osaInterval)
    clearInterval(this._restInterval)
    clearTimeout(this._holdTimeout)
  },

  methods: {
    // ─── API методы ─────────────────────────────────────────────────────────
    async loadFightIds() {
      try {
        const response = await fetch(`/api/fights?tatami=${this.tatami}`)
        const data = await response.json()
        if (data.fights && data.fights.length > 0) {
          this.fightIds = data.fights.map(f => f.id || f.fight_number)
          sessionStorage.setItem('fightIds', JSON.stringify(this.fightIds))
          console.log('Сохранены ID боёв:', this.fightIds)
        }
      } catch (err) {
        console.error('Ошибка загрузки списка боёв:', err)
      }
    },

    canStartFight() {
      // Проверяем, является ли раунд вторым (или выше)
      if (this.fight?.status === 'COMPLETED' || this.fight?.status === 'FINISHED') {
        alert("Этот бой уже завершен. Его нельзя начать снова.");
        return false;
      }

      // 2. Проверка участников для раундов 2 и выше
      const isLaterRound = Number(this.fight?.round_number) >= 2;
      if (isLaterRound) {
        const hasWhite = !!this.fight.white_athlete?.id || !!this.fight.white_athlete?.first_name;
        const hasBlue = !!this.fight.blue_athlete?.id || !!this.fight.blue_athlete?.first_name;

        if (!hasWhite || !hasBlue) {
          alert("Нельзя начать бой! Во 2-м раунде и далее должны быть заполнены оба атлета.");
          return false;
        }
      }

      return true;
    },

    async handleTabAction() {
      console.log('Завершение боя и переход...');

      // 1. Если бой не завершен, определяем победителя и ТИП победы
      if (!this.isFightCompleted) {
        let winner = null;
        let victoryType = 'POINTS'; // По умолчанию

        // Проверка на Hansoku-make (Дисквалификация)
        if (this.blue.shido >= 3 || this.blue.hansoku) {
          winner = 'white';
          victoryType = 'HANSOKU_MAKE';
        } else if (this.white.shido >= 3 || this.white.hansoku) {
          winner = 'blue';
          victoryType = 'HANSOKU_MAKE';
        }
        // Проверка на Ippon
        else if (this.white.ippon > 0 || this.white.wazaari >= 2) {
          winner = 'white';
          victoryType = 'IPPON';
        } else if (this.blue.ippon > 0 || this.blue.wazaari >= 2) {
          winner = 'blue';
          victoryType = 'IPPON';
        }
        // Победа по Waza-ari или решению (если основное время вышло)
        else {
          if (this.whitePoints > this.bluePoints) {
            winner = 'white';
            victoryType = 'WAZAARI'; // или 'POINTS'
          } else if (this.bluePoints > this.whitePoints) {
            winner = 'blue';
            victoryType = 'WAZAARI';
          } else {
            // Если баллы равны, можно оставить HANTEI (решение судей) или DRAW
            winner = null;
            victoryType = 'DRAW';
          }
        }

        // Отправляем результат
        await this.completeFight(winner, victoryType);
      }

      // 2. Переходим к следующему бою
      if (this.hasNext) {
        this.nextFight();
      } else {
        console.log('Больше боев нет');
      }
    },

    async loadFight() {
      this.loading = true

      try {
        const res = await fetchGetDetailFight(this.fightId)
        if (res && (res.id || res.fight_number)) {
          this.fight = res
          this.fightStatus = res.status || 'SCHEDULED'
          this.seconds = res.timer_seconds || 240

          if (res.scores) {
            this.white = {
              ippon: res.scores.white?.ippon || 0,
              wazaari: res.scores.white?.wazaari || 0,
              yuko: res.scores.white?.yuko || 0,
              shido: res.scores.white?.shido || 0,
              hansoku: res.scores.white?.hansoku || false
            }
            this.blue = {
              ippon: res.scores.blue?.ippon || 0,
              wazaari: res.scores.blue?.wazaari || 0,
              yuko: res.scores.blue?.yuko || 0,
              shido: res.scores.blue?.shido || 0,
              hansoku: res.scores.blue?.hansoku || false
            }
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки боя:', err)
      } finally {
        this.loading = false
      }
    },

    // ─── Вспомогательные методы ────────────────────────────────────────────
    getAthleteName(a) {
      if (!a) return 'TBD'
      return [a.middle_name, a.first_name, a.last_name].filter(Boolean).join(' ') || a.name || 'Неизвестный'
    },

    emptyScore() {
      return { ippon: 0, wazaari: 0, yuko: 0, shido: 0, hansoku: false }
    },

    triggerFlash(color) {
      this.flash = color
      setTimeout(() => { this.flash = null }, 500)
    },

    async completeFight(winnerColor, victoryType) {
      if (this.isFightCompleted) return

      this.running = false
      clearInterval(this._timerInterval)
      clearInterval(this._osaInterval)
      this.fightStatus = 'COMPLETED'

      const winnerId = winnerColor === 'white'
          ? this.fight?.white_athlete?.id
          : this.fight?.blue_athlete?.id

      const totalSeconds = this.fightDuration - this.seconds + this.gsSeconds
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      const endTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

      let serverVictoryType = victoryType
      if (['IPPON', 'WAZAARI_AWASETE_IPPON', 'OSAEKOMI'].includes(victoryType)) {
        serverVictoryType = 'IPPON'
      }

      const payload = {
        start_time: '0:00',
        end_time: endTime,
        victory_type: serverVictoryType,
        winner_athlete_id: winnerId ?? null
      }

      try {
        await endFight(payload, this.fightId)
        console.log('Бой завершён:', winnerColor, victoryType)
      } catch (err) {
        console.error('Ошибка завершения боя:', err)
      }
    },

    async setLiveStatus() {
      if (this.fightStatus !== 'SCHEDULED') return

      try {
        const result = await setLifeFight(this.fightId, this.fight?.tatami || this.tatami)
        if (result.success) {
          this.fightStatus = 'IN_PROGRESS'
          console.log('Бой переведён в LIVE')
        }
      } catch (err) {
        console.error('Ошибка перевода в LIVE:', err)
      }
    },

    async resetCurrentFight() {
      try {
        const result = await resetFight({}, this.fightId)
        if (result.success) {
          this.resetFight()
        }
      } catch (err) {
        console.error('Ошибка сброса боя:', err)
      }
    },

    // ─── Управление очками ─────────────────────────────────────────────────
    applyScore(color, field, delta = 1) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return

      const sc = color === 'white' ? this.white : this.blue
      const hist = color === 'white' ? this.historyW : this.historyB
      hist.push(JSON.parse(JSON.stringify(sc)))
      if (hist.length > 50) hist.shift()
      sc[field] = Math.max(0, (sc[field] || 0) + delta)
      this.triggerFlash(color)
    },

    undoScore(color) {
      // Если бой завершен, обычно отмену запрещают, но можно разрешить для исправления ошибок
      // if (this.isFightCompleted) return

      if (color === 'white') {
        if (!this.historyW.length) return
        // Заменяем текущий объект white последним из истории
        this.white = this.historyW.pop()
      } else {
        if (!this.historyB.length) return
        // Заменяем текущий объект blue последним из истории
        this.blue = this.historyB.pop()
      }

      // Если была победа из-за баллов/штрафов, сбрасываем статус при отмене
      if (this.fightStatus === 'COMPLETED') {
        this.fightStatus = 'IN_PROGRESS'
        // Если таймер стоял, его нужно будет запустить вручную (Space)
      }
    },

    addWazaari(color) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return

      const sc = color === 'white' ? this.white : this.blue
      const hist = color === 'white' ? this.historyW : this.historyB
      hist.push(JSON.parse(JSON.stringify(sc)))
      sc.wazaari = (sc.wazaari || 0) + 1
      this.triggerFlash(color)

      if (sc.wazaari >= 2 || this.isGoldenScore) {
        this.pauseTimer(); // Просто останавливаем время, не закрывая бой в БД
      }
    },

    addIppon(color) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return

      this.applyScore(color, 'ippon')
      this.pauseTimer();
    },

    addYuko(color) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return

      this.applyScore(color, 'yuko')
      if (this.isGoldenScore) {
        this.pauseTimer();
      }
    },

    addShido(color) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return

      const sc = color === 'white' ? this.white : this.blue
      const hist = color === 'white' ? this.historyW : this.historyB
      hist.push(JSON.parse(JSON.stringify(sc)))
      sc.shido = (sc.shido || 0) + 1
      this.triggerFlash(color)

      if (sc.shido >= 3) {
        const opp = color === 'white' ? 'blue' : 'white'
        this.pauseTimer();
      }
    },

    addHansoku(color) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return

      const opp = color === 'white' ? 'blue' : 'white'
      const sc = this[opp]
      const hist = opp === 'white' ? this.historyW : this.historyB
      hist.push(JSON.parse(JSON.stringify(sc)))
      sc.hansoku = true
      this.triggerFlash(opp)
      this.pauseTimer();
    },

    // ─── Осаэкоми ──────────────────────────────────────────────────────────
    startOsa(color) {
      if (!this.canModifyScore) return
      if (this.isFightCompleted) return
      if (this.osa.active) return

      this.osa = { active: true, color, time: 0 }
      clearInterval(this._osaInterval)
      this._osaInterval = setInterval(() => {
        this.osa.time += 1
        if (this.osa.time === OSAEKOMI_WAZAARI) {
          this.addWazaari(color)
        }
        if (this.osa.time >= OSAEKOMI_MAX) {
          clearInterval(this._osaInterval)
          this.osa = { active: false, color: null, time: 0 }
          this.addIppon(color)
        }
      }, 1000)
    },

    stopOsa() {
      if (this.isFightCompleted) return

      clearInterval(this._osaInterval)
      const { time, color } = this.osa
      this.osa = { active: false, color: null, time: 0 }
      if (time >= OSAEKOMI_WAZAARI && time < OSAEKOMI_MAX) {
        this.addWazaari(color)
      }
    },

    // ─── Таймер ────────────────────────────────────────────────────────────
    startTimer() {
      if (this.isFightCompleted) return;

      // ПРОВЕРКА ПЕРЕД ЗАПУСКОМ
      if (!this.canStartFight()) {
        return; // Прерываем выполнение, если проверка не пройдена
      }

      if (this.fightStatus === 'SCHEDULED') {
        this.setLiveStatus();
      }

      this.running = true;
      clearInterval(this._timerInterval);
      this._timerInterval = setInterval(() => {
        if (this.isGoldenScore) {
          this.gsSeconds += 1;
        } else {
          if (this.seconds > 0) {
            this.seconds -= 1;
          }
          if (this.seconds === 0 && !this.isGoldenScore) {
            clearInterval(this._timerInterval);
            this.running = false;
            this.isGoldenScore = true;
            this.gsSeconds = 0;
          }
        }
      }, 1000);
    },

    pauseTimer() {
      this.running = false
      clearInterval(this._timerInterval)
    },

    toggleTimer() {
      if (this.isFightCompleted) return
      if (this.running) this.pauseTimer()
      else this.startTimer()
    },

    toggleGolden() {
      if (this.isFightCompleted) return

      this.isGoldenScore = !this.isGoldenScore
      if (this.isGoldenScore) {
        this.gsSeconds = 0
        this.running = false
        clearInterval(this._timerInterval)
      }
    },

    // ─── Переключение боёв ─────────────────────────────────────────────────
    goToFight(direction) {
      const newIndex = this.currentIndex + direction
      if (newIndex < 0 || newIndex >= this.fightIds.length) return
      const newId = this.fightIds[newIndex]
      console.log('Переход к бою:', newId, 'направление:', direction)
      this.$router.push(`/fights/${newId}`)
    },

    nextFight() {
      if (this.hasNext) {
        this.goToFight(1)
      } else {
        console.log('Нет следующего боя')
      }
    },

    prevFight() {
      if (this.hasPrev) {
        this.goToFight(-1)
      } else {
        console.log('Нет предыдущего боя')
      }
    },

    resetFight() {
      this.seconds = this.fightDuration
      this.gsSeconds = 0
      this.isGoldenScore = false
      this.fightStatus = 'SCHEDULED'
      this.running = false
      this.white = this.emptyScore()
      this.blue = this.emptyScore()
      this.historyW = []
      this.historyB = []
      this.osa = { active: false, color: null, time: 0 }
      clearInterval(this._osaInterval)
    },

    fmt(s) {
      const abs = Math.abs(s)
      const m = Math.floor(abs / 60)
      const sec = abs % 60
      return `${m}:${sec < 10 ? '0' : ''}${sec}`
    },

    // ─── Клавиатура ─────────────────────────────────────────────────────────
    onKeyDown(e) {
      if (e.repeat) return

      const isNavigationKey = e.key === 'ArrowLeft' || e.code === 'ArrowLeft' ||
          e.key === 'ArrowRight' || e.code === 'ArrowRight' ||
          e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'n';

      if (this.showFocusModal) {
        const key = e.key.toLowerCase()

        // Если это пробел/enter — активируем
        if (key === ' ' || key === 'space' || key === 'enter') {
          e.preventDefault()
          this.onActivate()
          return
        }

        // ЕСЛИ это стрелка (навигация) — НЕ делаем return, а позволяем коду идти ниже
        if (!isNavigationKey) {
          return // Блокируем всё остальное (баллы, таймер и т.д.)
        }
      }

      // Стрелка влево - предыдущий бой
      if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        console.log('Стрелка влево нажата, hasPrev:', this.hasPrev)
        this.prevFight()
        return
      }

      // Стрелка вправо - следующий бой
      if (e.key === 'ArrowRight' || e.code === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        console.log('Стрелка вправо нажата, hasNext:', this.hasNext)
        this.nextFight()
        return
      }

      // B - предыдущий бой (Back)
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        e.stopPropagation()
        console.log('B нажата, hasPrev:', this.hasPrev)
        this.prevFight()
        return
      }

      // N - следующий бой (Next)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        e.stopPropagation()
        console.log('N нажата, hasNext:', this.hasNext)
        this.nextFight()
        return
      }

      // Tab - следующий бой
      if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        console.log('Tab нажат, hasNext:', this.hasNext)
        this.handleTabAction();
        return
      }

      if (this.loading) return

      const key = e.key.toLowerCase()
      this._keyDownTime[key] = Date.now()

      // Пробел - Хаджимэ / Маттэ
      if (e.code === 'Space' || key === ' ' || key === 'space') {
        e.preventDefault()
        e.stopPropagation()
        this.toggleTimer()
        return
      }

      // G - голден скор
      if (key === 'g') {
        e.preventDefault()
        this.toggleGolden()
        return
      }

      // Если бой завершён - блокируем все действия кроме переключения
      if (this.isFightCompleted) {
        if (e.key === 'Escape') {
          e.preventDefault()
          if (window.confirm('Отменить результат схватки?')) {
            this.resetCurrentFight()
          }
        }
        return
      }

      // Q/W/E - иппон/ваза-ари/юко для белого
      if (key === 'q') {
        e.preventDefault()
        this.addIppon('white')
      }
      if (key === 'w') {
        e.preventDefault()
        this.addWazaari('white')
      }
      if (key === 'e') {
        e.preventDefault()
        this.addYuko('white')
      }

      // P/O/I - иппон/ваза-ари/юко для синего
      if (key === 'p') {
        e.preventDefault()
        this.addIppon('blue')
      }
      if (key === 'o') {
        e.preventDefault()
        this.addWazaari('blue')
      }
      if (key === 'i') {
        e.preventDefault()
        this.addYuko('blue')
      }

      // F - осаэкоми белый
      if (key === 'f') {
        e.preventDefault()
        this.startOsa('white')
      }
      // J - осаэкоми синий
      if (key === 'j') {
        e.preventDefault()
        this.startOsa('blue')
      }
      // H - токета
      if (key === 'h') {
        e.preventDefault()
        this.stopOsa()
      }

      // R/U - шидо (удержание = хансоку)
      if (key === 'r') {
        e.preventDefault()
        this._holdTimeout = setTimeout(() => {
          this.addHansoku('white')
        }, 800)
      }
      if (key === 'u') {
        e.preventDefault()
        this._holdTimeout = setTimeout(() => {
          this.addHansoku('blue')
        }, 800)
      }

      // Z/X - отмена последнего действия
      if (key === 'z') {
        e.preventDefault()
        this.undoScore('white')
      }
      if (key === 'x') {
        e.preventDefault()
        this.undoScore('blue')
      }

      if (key === 'z') {
        e.preventDefault()
        this.undoScore('white')
      }
      if (key === 'x') {
        e.preventDefault()
        this.undoScore('blue')
      }

      // Если модалка ещё видна — игнорируем все боевые клавиши
      if (this.showFocusModal) {
        // Если модалка открыта, разрешаем ТОЛЬКО стрелки и Пробел (для активации)
        if (e.code === 'Space') {
          this.onActivate();
          return;
        }

        if (isNavigationKey) {
          if (e.code === 'ArrowLeft') {
            this.prevFight();
          }
          if (e.code === 'ArrowRight') {
            this.nextFight();
          }
        } else {
          return;
        }
      }
    },

    async onActivate() {
      // 1. Закрываем модалку в интерфейсе
      if (!this.canStartFight()) {
        alert("Нельзя начать бой! Во 2-м раунде и далее должны быть заполнены оба атлета.");
        // Важно: НЕ ставим showFocusModal = false,
        // тогда модалка остается, и пробел/клавиши не работают.
        return;
      }

      // Если проверка прошла — активируем управление
      this.showFocusModal = false;
      this.isLiveActivated = true;

      // Возвращаем фокус на главный экран для работы клавиатуры
      this.$nextTick(() => {
        if (this.$el && this.$el.focus) {
          this.$el.focus();
        }
      });

      // Уведомляем сервер, что бой в эфире
      await this.setLiveStatus();
    },

    onKeyUp(e) {
      const key = e.key.toLowerCase()
      const elapsed = Date.now() - (this._keyDownTime[key] || 0)
      delete this._keyDownTime[key]

      if (key === 'r' && !this.isFightCompleted) {
        clearTimeout(this._holdTimeout)
        if (elapsed < 800) this.addShido('white')
      }
      if (key === 'u' && !this.isFightCompleted) {
        clearTimeout(this._holdTimeout)
        if (elapsed < 800) this.addShido('blue')
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&family=Rajdhani:wght@500;700&display=swap');

.board {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  overflow: hidden;
  font-family: 'Rajdhani', 'Segoe UI', sans-serif;
  user-select: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  outline: none;
}

.athlete-row {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 1vw;
  gap: 1vw;
  transition: background 0.2s;
  min-height: 0;
}
.athlete-row.white { background: #d0d0d0; border-bottom: 3px solid #555; }
.athlete-row.blue { background: #0c2b7a; }
.athlete-row.white.flash { background: #e8e8e8; }
.athlete-row.blue.flash { background: #1a4ab0; }

.name-block {
  flex: 1 1 28%;
  min-width: 0;
  overflow: hidden;
}
.athlete-name {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(1.4rem, 3.2vw, 3rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  line-height: 1.1;
  display: flex;
  align-items: center;
  gap: 0.4em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.white .athlete-name { color: #111; }
.blue .athlete-name { color: #fff; }

.win-dot { color: #f4d03f; font-size: 0.45em; flex-shrink: 0; }

.club-name {
  font-size: clamp(0.7rem, 1.3vw, 1.1rem);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 0.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.white .club-name { color: #555; }
.blue .club-name { color: #8ab4f8; }

.scores-container {
  display: flex;
  gap: 0.6vw;
  flex-shrink: 0;
}

.score-card {
  width: clamp(60px, 7vw, 95px);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 0.3vw 0.5vw;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.1);
}
.score-card--blue { background: rgba(255, 255, 255, 0.1); }
.score-card--active {
  background: linear-gradient(135deg, #f4d03f 0%, #e67e22 100%);
  border-color: #fff;
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
.score-card--active .score-card-label,
.score-card--active .score-card-value {
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.score-card-label {
  font-size: clamp(0.45rem, 0.9vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8ab4f8;
  margin-bottom: 0.2vw;
}
.score-card-value {
  font-family: 'Oswald', monospace;
  font-weight: 700;
  font-size: clamp(1.3rem, 3.5vw, 2.8rem);
  line-height: 1;
  color: #fff;
}

.penalty-block {
  width: clamp(60px, 7vw, 95px);
  background: #dc2626;
  border-radius: 8px;
  padding: 0.3vw 0.5vw;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.penalty-block--danger {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  animation: pulse 1s infinite;
}
.penalty-label {
  font-size: clamp(0.45rem, 0.9vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fecaca;
  margin-bottom: 0.2vw;
}
.penalty-value {
  font-family: 'Oswald', monospace;
  font-weight: 700;
  font-size: clamp(1.3rem, 3.5vw, 2.8rem);
  line-height: 1;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.hansoku-badge {
  display: inline-block;
  background: #450a0a;
  padding: 0 6px;
  border-radius: 6px;
  font-size: clamp(1.1rem, 3vw, 2.2rem);
  font-weight: 700;
  animation: shake 0.5s ease;
}

.bottom-bar {
  height: 22vh;
  background: #111;
  border-top: 3px solid #333;
  display: flex;
  align-items: center;
  padding: 0 2vw;
  gap: 2vw;
  flex-shrink: 0;
}
.category-block {
  flex: 0 0 16%;
  min-width: 0;
}
.category-text {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.6rem);
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stage-text {
  font-size: clamp(0.7rem, 1.4vw, 1.2rem);
  font-weight: 700;
  color: #e05555;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.3em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timer-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}
.gs-label {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(0.7rem, 1.6vw, 1.3rem);
  font-weight: 700;
  color: #f4d03f;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  animation: fadeIn 0.4s ease;
  white-space: nowrap;
}
.timer-digits {
  font-family: 'Oswald', monospace;
  font-size: clamp(2.2rem, 7vw, 6rem);
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.05em;
  line-height: 1;
  transition: color 0.3s;
}
.timer-digits.gold { color: #f4d03f; }
.timer-digits.blink { animation: blink 1s infinite; }

.osa-block {
  flex: 0 0 24%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.osa-label {
  color: #f4d03f;
  font-weight: 700;
  font-size: clamp(0.65rem, 1.3vw, 0.95rem);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}
.osa-track {
  width: 100%;
  height: 14px;
  background: #2a2a2a;
  border-radius: 9px;
  position: relative;
  overflow: visible;
}
.osa-fill {
  height: 100%;
  border-radius: 9px;
  transition: width 1s linear;
  position: absolute;
  left: 0;
  top: 0;
}
.osa-fill.white { background: linear-gradient(90deg, #aaa, #fff); }
.osa-fill.blue { background: linear-gradient(90deg, #1565c0, #42a5f5); }
.osa-mark {
  position: absolute;
  left: 50%;
  top: -4px;
  width: 3px;
  height: 22px;
  background: #f4d03f;
  border-radius: 2px;
  transform: translateX(-50%);
}
.osa-time {
  color: #888;
  font-size: clamp(0.6rem, 1.2vw, 0.85rem);
  font-weight: 600;
}
.osa-idle {
  color: #fff;
  opacity: 0.3;
  font-size: clamp(0.55rem, 1.1vw, 0.8rem);
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.rest-screen {
  width: 100%;
  height: 100%;
  background: #050a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}
.rest-label {
  font-family: 'Oswald', sans-serif;
  font-size: clamp(2rem, 6vw, 5rem);
  font-weight: 700;
  color: #f4d03f;
  letter-spacing: 0.3em;
  text-transform: uppercase;
}
.rest-timer {
  font-family: 'Oswald', monospace;
  font-size: clamp(5rem, 18vw, 14rem);
  font-weight: 700;
  color: #fff;
  line-height: 1;
  letter-spacing: 0.05em;
}
.rest-sub {
  color: #445;
  font-size: clamp(0.9rem, 2vw, 1.5rem);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
}

.no-fight {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: 'Oswald', sans-serif;
  font-size: 2rem;
  background: #0a0a0a;
  position: fixed;
  top: 0;
  left: 0;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>