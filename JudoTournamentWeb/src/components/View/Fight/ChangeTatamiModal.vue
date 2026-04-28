<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">

      <div class="modal-header">
        <div>
          <div class="modal-title">Выберите татами</div>
          <div class="modal-subtitle">Бой #{{ fightId }}</div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">Загрузка татами...</div>

        <div v-else-if="tatamis.length === 0" class="empty-state">
          Татами не найдены
        </div>

        <div v-else class="tatami-grid">
          <div
              v-for="tatami in tatamis"
              :key="tatami.tatami_number"
              class="tatami-card"
              :class="{
              selected: selectedTatami === tatami.tatami_number,
              busy: isBusy(tatami)
            }"
              @click="selectedTatami = tatami.tatami_number"
          >
            <div class="tatami-icon">🥋</div>
            <div class="tatami-name">Татами {{ tatami.tatami_number }}</div>

            <!-- Если идёт бой — показываем атлетов -->
            <div v-if="tatami.fight" class="tatami-fighters">
              <span class="fighter-blue">{{ formatAthlete(tatami.fight.blue_athlete) }}</span>
              <span class="vs">vs</span>
              <span class="fighter-white">{{ formatAthlete(tatami.fight.white_athlete) }}</span>
            </div>
            <div v-else class="tatami-free">Свободно</div>

            <div v-if="selectedTatami === tatami.tatami_number" class="tatami-check">✓</div>
          </div>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Отмена</button>
        <button
            class="btn-confirm"
            :disabled="selectedTatami === null || saving"
            @click="confirmChange"
        >
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import { getTournamentTatamis } from "@/components/View/Tournaments/fetchTournaments.js"
import { fetchChangeTatami } from "@/components/View/Fight/fetchFights.js"

export default {
  name: 'ChangeTatamiModal',
  props: {
    tournamentId:  { type: Number, required: true },
    fightId:       { type: Number, required: true },
    currentTatami: { type: Number, default: null },
  },
  emits: ['close', 'changed'],
  data() {
    return {
      loading: true,
      saving: false,
      errorMsg: '',
      tatamis: [],
      selectedTatami: this.currentTatami,
    }
  },
  async mounted() {
    console.log('=== ChangeTatamiModal mounted ===');
    console.log('Props received:');
    console.log('tournamentId:', this.tournamentId);
    console.log('fightId:', this.fightId);
    console.log('currentTatami:', this.currentTatami);

    if (!this.fightId) {
      console.error('fightId is undefined or null!');
    }
    await this.loadTatamis()
  },
  methods: {
    async loadTatamis() {
      this.loading = true
      try {
        const res = await getTournamentTatamis(this.tournamentId)
        // res — массив tatami_dto
        this.tatamis = Array.isArray(res) ? res : (res?.tatamis || res?.data || [])
      } catch (e) {
        console.error(e)
        this.tatamis = []
      } finally {
        this.loading = false
      }
    },
    formatAthlete(athlete) {
      if (!athlete) return 'TBD'
      return [athlete.last_name, athlete.first_name].filter(Boolean).join(' ') || 'TBD'
    },
    isBusy(tatami) {
      return !!tatami.fight
    },

    async confirmChange() {
      if (this.selectedTatami === null) return
      this.saving = true
      this.errorMsg = ''
      try {
        const res = await fetchChangeTatami(this.fightId, this.selectedTatami)
        if (res?.success) {
          this.$emit('changed')
          this.$emit('close')
        } else {
          this.errorMsg = res?.message || 'Ошибка при смене татами'
        }
      } catch (e) {
        this.errorMsg = 'Сетевая ошибка. Попробуйте ещё раз.'
      } finally {
        this.saving = false
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
  max-width: 580px;
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
  padding: 1.5rem;
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

.tatami-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  padding: 0.5rem 0;
}

.tatami-card {
  position: relative;
  width: 155px;
  min-height: 140px;
  border-radius: 18px;
  border: 2px solid #eee;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  text-align: center;
}

.tatami-card:hover {
  border-color: #c89b3c;
  background: #fffdf7;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(200,155,60,0.15);
}

.tatami-card.selected {
  border-color: #c89b3c;
  background: linear-gradient(135deg, #fffbf0, #fffdf7);
  box-shadow: 0 6px 20px rgba(200,155,60,0.25);
  transform: translateY(-2px);
}

.tatami-icon {
  font-size: 2rem;
  line-height: 1;
}

.tatami-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
}

.tatami-card.selected .tatami-name {
  color: #c89b3c;
}

.tatami-fighters {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
}

.fighter-blue {
  font-size: 0.72rem;
  font-weight: 600;
  color: #2563eb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}

.fighter-white {
  font-size: 0.72rem;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}

.vs {
  font-size: 0.65rem;
  color: #aaa;
  font-weight: 700;
}

.tatami-free {
  font-size: 0.75rem;
  color: #22c55e;
  font-weight: 600;
  margin-top: 4px;
}

.tatami-check {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 22px;
  height: 22px;
  background: #c89b3c;
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-msg {
  margin-top: 1rem;
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