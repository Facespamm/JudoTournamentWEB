<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">

      <div class="modal-header">
        <div>
          <div class="modal-title">Смена атлетов</div>
          <div class="modal-subtitle">Выберите по одному атлету из каждого боя (только 1-й раунд)</div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">Загрузка боёв...</div>

        <div v-else-if="round1Fights.length === 0" class="empty-state">
          Бои 1-го раунда не найдены
        </div>

        <template v-else>
          <div class="fights-grid">
            <div v-for="fight in round1Fights" :key="fight.id" class="fight-card">
              <div class="fight-card-header">
                Бой #{{ fight.id }} · Татами {{ fight.tatami_number }}
              </div>

              <!-- Синий угол -->
              <div
                v-if="fight.blue_athlete"
                class="athlete-row"
                :class="{
                  selected: isSelected(fight, fight.blue_athlete),
                  disabled: isDisabled(fight, fight.blue_athlete)
                }"
                @click="selectAthlete(fight, fight.blue_athlete, 'blue')"
              >
                <span class="color-dot dot-blue"></span>
                <div class="athlete-info">
                  <div class="athlete-name">{{ fullName(fight.blue_athlete) }}</div>
                  <div class="athlete-label">Синий угол</div>
                </div>
                <div v-if="isSelected(fight, fight.blue_athlete)" class="check-mark">✓</div>
              </div>
              <div v-else class="tbd-row">
                <span class="color-dot dot-blue"></span>
                <span class="tbd-badge">TBD</span>
              </div>

              <!-- Белый угол -->
              <div
                v-if="fight.white_athlete"
                class="athlete-row"
                :class="{
                  selected: isSelected(fight, fight.white_athlete),
                  disabled: isDisabled(fight, fight.white_athlete)
                }"
                @click="selectAthlete(fight, fight.white_athlete, 'white')"
              >
                <span class="color-dot dot-white"></span>
                <div class="athlete-info">
                  <div class="athlete-name">{{ fullName(fight.white_athlete) }}</div>
                  <div class="athlete-label">Белый угол</div>
                </div>
                <div v-if="isSelected(fight, fight.white_athlete)" class="check-mark">✓</div>
              </div>
              <div v-else class="tbd-row">
                <span class="color-dot dot-white"></span>
                <span class="tbd-badge">TBD</span>
              </div>
            </div>
          </div>

          <!-- Итог выбора -->
          <div v-if="selected1 && selected2" class="summary-box">
            <div class="summary-label">Будет выполнен обмен</div>
            <div class="summary-row">
              <span>{{ fullName(selected1.athlete) }}</span>
              <span class="summary-arrow">⇄</span>
              <span>{{ fullName(selected2.athlete) }}</span>
            </div>
          </div>

          <!-- Ошибка -->
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        </template>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Отмена</button>
        <button
          class="btn-confirm"
          :disabled="!selected1 || !selected2 || swapping"
          @click="confirmSwap"
        >
          {{ swapping ? 'Сохранение...' : 'Поменять местами' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import {fetchGetFirstFights, fetchChangeAthletes} from "@/components/View/Fight/fetchFights.js"

export default {
  name: 'ChangeAthletesModal',
  props: {
    tournamentId: { type: Number, required: true },
    categoryId:   { type: Number, required: true },
  },
  emits: ['close', 'swapped'],
  data() {
    return {
      loading:   true,
      swapping:  false,
      errorMsg:  '',
      rawFights: [],
      selected1: null,
      selected2: null,
    }
  },
  computed: {
    round1Fights() {
      return this.rawFights.filter(f => f.round === 1)
    },
  },
  async mounted() {
    await this.loadFights()
  },
  methods: {
    async loadFights() {
      this.loading = true
      try {
        const res = await fetchGetFirstFights(this.tournamentId, this.categoryId)
        this.rawFights = res?.fights || res || []
      } catch (e) {
        console.error(e)
        this.rawFights = []
      } finally {
        this.loading = false
      }
    },

    fullName(athlete) {
      if (!athlete) return '—'
      const { last_name, first_name, middle_name } = athlete
      return [last_name, first_name, middle_name].filter(Boolean).join(' ')
    },

    isSelected(fight, athlete) {
      return (
        (this.selected1?.fight.id === fight.id && this.selected1?.athlete.id === athlete.id) ||
        (this.selected2?.fight.id === fight.id && this.selected2?.athlete.id === athlete.id)
      )
    },

    isDisabled(fight, athlete) {
      if (this.isSelected(fight, athlete)) return false
      return (
        this.selected1?.fight.id === fight.id ||
        this.selected2?.fight.id === fight.id
      )
    },

    selectAthlete(fight, athlete, color) {
      this.errorMsg = ''

      // Снять выбор если уже выбран
      if (this.selected1?.fight.id === fight.id && this.selected1?.athlete.id === athlete.id) {
        this.selected1 = null; return
      }
      if (this.selected2?.fight.id === fight.id && this.selected2?.athlete.id === athlete.id) {
        this.selected2 = null; return
      }

      // Нельзя выбрать двух из одного боя
      if (this.selected1?.fight.id === fight.id || this.selected2?.fight.id === fight.id) return

      const entry = { fight, athlete, color }
      if (!this.selected1)      this.selected1 = entry
      else if (!this.selected2) this.selected2 = entry
    },

    async confirmSwap() {
      if (!this.selected1 || !this.selected2) return
      this.swapping = true
      this.errorMsg = ''

      try {
        const res = await fetchChangeAthletes(this.tournamentId, {
          first_fight_id:    this.selected1.fight.id,
          first_athlete_id:  this.selected1.athlete.id,
          second_fight_id:   this.selected2.fight.id,
          second_athlete_id: this.selected2.athlete.id,
        })

        if (res?.success) {
          this.$emit('swapped')
          this.$emit('close')
        } else {
          this.errorMsg = res?.message || 'Ошибка при смене атлетов'
        }
      } catch (e) {
        this.errorMsg = 'Сетевая ошибка. Попробуйте ещё раз.'
      } finally {
        this.swapping = false
      }
    },
  },
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 640px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1a1a1a;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: #888;
  margin-top: 3px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.close-btn:hover { background: #f5f5f5; color: #333; }

.modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-size: 0.95rem;
}

.fights-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 1rem;
}

@media (max-width: 540px) {
  .fights-grid { grid-template-columns: 1fr; }
}

.fight-card {
  border-radius: 10px;
  border: 1.5px solid #eee;
  overflow: hidden;
  background: #fafafa;
}

.fight-card-header {
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #eee;
  font-size: 0.8rem;
  font-weight: 700;
  color: #c89b3c;
}

.athlete-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.15s;
}
.athlete-row:last-child { border-bottom: none; }
.athlete-row:hover:not(.disabled) { background: #fffdf7; }

.athlete-row.selected {
  background: #fffbf0;
  border-left: 3px solid #c89b3c;
}

.athlete-row.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tbd-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}
.tbd-row:last-child { border-bottom: none; }

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-blue  { background: #2563eb; }
.dot-white { background: transparent; border: 1.5px solid #bbb; }

.athlete-info { flex: 1; min-width: 0; }

.athlete-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.athlete-label {
  font-size: 0.75rem;
  color: #999;
  margin-top: 1px;
}

.check-mark {
  color: #c89b3c;
  font-weight: 900;
  font-size: 1rem;
  flex-shrink: 0;
}

.tbd-badge {
  font-size: 0.75rem;
  color: #aaa;
  font-style: italic;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 6px;
}

.summary-box {
  background: #fffbf0;
  border: 1.5px solid #c89b3c;
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 0.75rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #c89b3c;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
}

.summary-arrow {
  font-size: 1.2rem;
  color: #c89b3c;
}

.error-msg {
  background: #fff0f0;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.88rem;
  color: #cc3333;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.btn-cancel {
  padding: 0.6rem 1.4rem;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: #c89b3c; color: #c89b3c; }

.btn-confirm {
  padding: 0.6rem 1.6rem;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(200,155,60,0.3);
}
.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(200,155,60,0.4);
}
.btn-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
