<template>
  <div class="fights-overview">
    <div class="fights-header">
      <h1>Схватки и поединки</h1>
      <p class="subtitle">Управление всеми боями турнира</p>
    </div>
    <div class="filters-section">
      <div class="filter-group">
        <label>Турнир:</label>
        <select v-model="selectedTournament" @change="onTournamentChange" :disabled="tournamentsLoading">
          <option :value="null">
            {{ tournamentsLoading ? 'Загрузка турниров...' : 'Выберите турнир' }}
          </option>
          <option v-for="t in tournaments" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Категория:</label>
        <select
            v-model="selectedCategory"
            :disabled="!selectedTournament || categoriesLoading || tournamentsLoading"
            @change="loadFights"
        >
          <option :value="null">
            {{ categoriesLoading ? 'Загрузка категорий...' : 'Выберите категорию' }}
          </option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }} ({{ c.gender === 'MALE' ? 'М' : 'Ж' }})
          </option>
        </select>
      </div>
    </div>
    <div class="tatami-sections">
      <div
          v-for="tatami in availableTatamis"
          :key="tatami"
          class="tatami-section"
      >
        <div class="tatami-header">
          <div class="tatami-number">{{ tatami > 0 ? tatami : '—' }}</div>
          <h2 class="tatami-title">{{ tatami > 0 ? `Татами ${tatami}` : 'Не назначено' }}</h2>
        </div>
        <div class="fights-rows">
          <div
              v-for="fight in groupedFights[tatami]"
              :key="fight.id"
              class="fight-row"
              @click="viewFightDetail(fight.id)"
          >
            <div class="status-bar"></div>
            <div class="status-corner">
              <span v-if="fight.status === 'IN_PROGRESS'" class="dot"></span>
              {{ statusText(fight.status) }}
            </div>
            <div class="row-content">
              <div class="category-weight">
                {{ fight.category || '—' }}
              </div>
              <div class="fighters-matchup">
                <div class="fighter left">
                  <div class="club-code">{{ fight.fighter1?.club || '' }}</div>
                  <div class="fighter-name">{{ fight.fighter1?.name || '' }}</div>
                </div>
                <div class="fighter right">
                  <div class="club-code">{{ fight.fighter2?.club || '' }}</div>
                  <div class="fighter-name">{{ fight.fighter2?.name || '' }}</div>
                </div>
              </div>
              <div class="round-or-timer" :class="{ 'live-timer': fight.status === 'IN_PROGRESS' }">
                {{ fight.round_info || '—' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="availableTatamis.length === 0 && !tournamentsLoading" class="empty-state">
        <h3>
          {{ selectedCategory === null ? 'Выберите категорию для просмотра схваток' : 'Схватки не найдены' }}
        </h3>
        <button v-if="selectedTournament || selectedCategory !== null" class="reset-filters-btn" @click="resetFilters">
          Сбросить фильтры
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchTournaments } from "@/components/View/Tournaments/fetchTournaments.js"
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import { fetchBrackets } from "@/components/View/Brackets/fetchBrackets.js"
import {fetchGetDetailFight} from "@/components/View/Fight/fetchFights.js";
import "./Fight.css"

export default {
  name: 'FightsOverview',
  data() {
    return {
      fights: [],
      selectedTournament: null,
      selectedCategory: null,
      tournaments: [],
      tournamentsLoading: false,
      categories: [],
      categoriesLoading: false,
      currentCategoryName: ''
    }
  },
  computed: {
    filteredFights() {
      return this.fights
    },
    availableTatamis() {
      const tatamis = [...new Set(this.filteredFights.map(f => f.tatami))].sort((a, b) => a - b)
      const positive = tatamis.filter(t => t > 0)
      const zero = tatamis.includes(0) ? [0] : []
      return positive.concat(zero)
    },
    groupedFights() {
      const grouped = {}
      this.filteredFights.forEach(f => {
        const key = f.tatami
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(f)
      })
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => {
          if (a.round !== b.round) return (a.round || 999) - (b.round || 999)
          return a.id - b.id
        })
      })
      return grouped
    }
  },
  async mounted() {
    await this.loadTournaments()
  },
  methods: {
    formatAthlete(athlete) {
      if (!athlete) {
        return { name: 'Ожидает победителя', club: '' }
      }
      const name = [athlete.last_name, athlete.first_name, athlete.middle_name]
          .filter(Boolean)
          .join(' ')
      return { name, club: '' }
    },
    async loadTournaments() {
      this.tournamentsLoading = true
      try {
        const res = await fetchTournaments()
        if (res?.success) {
          this.tournaments = Array.isArray(res.data) ? res.data : []
        } else {
          this.tournaments = []
        }
      } catch (err) {
        console.error('Ошибка загрузки турниров:', err)
        this.tournaments = []
      } finally {
        this.tournamentsLoading = false
      }
    },
    async onTournamentChange() {
      this.selectedCategory = null
      this.categories = []
      this.fights = []
      this.currentCategoryName = ''

      if (!this.selectedTournament) {
        return
      }

      this.categoriesLoading = true
      try {
        const res = await fetchCategories(this.selectedTournament)
        if (res.success) {
          this.categories = res.categories || res.data?.categories || []
        }
      } catch (err) {
        console.error('Ошибка загрузки категорий:', err)
        this.categories = []
      } finally {
        this.categoriesLoading = false
      }
    },
    async loadFights() {
      this.fights = []
      this.currentCategoryName = ''

      if (!this.selectedTournament || this.selectedCategory === null) {
        return
      }

      try {
        console.log('Загрузка боёв для турнира:', this.selectedTournament, 'категория:', this.selectedCategory)
        const res = await fetchBrackets(this.selectedTournament, this.selectedCategory)

        if (res?.success && res.fights?.length) {
          this.currentCategoryName = res.category?.weight_range || res.category?.name || '—'

          this.fights = res.fights.map(fight => ({
            id: fight.id,
            tatami: fight.tatami_number ?? 0,
            status: fight.status_fight || 'SCHEDULED',
            category: this.currentCategoryName,
            fighter1: this.formatAthlete(fight.white_athlete),
            fighter2: this.formatAthlete(fight.blue_athlete),
            round: fight.round || null,
            round_info: fight.round ? `Раунд ${fight.round}` : (fight.next_fight === null ? 'Финал' : '—')
          }))
          console.log('Загружено боев:', this.fights.length)
        } else {
          this.fights = []
        }
      } catch (err) {
        console.error('Ошибка загрузки боев:', err)
        this.fights = []
      }
    },
    resetFilters() {
      this.selectedTournament = null
      this.selectedCategory = null
      this.categories = []
      this.fights = []
      this.currentCategoryName = ''
    },
    statusText(s) {
      switch (s) {
        case 'IN_PROGRESS': return 'LIVE'
        case 'SCHEDULED': return 'Запланировано'
        case 'COMPLETED': return 'Завершено'
        default: return 'Неизвестно'
      }
    },
    viewFightDetail(id) {
      this.$router.push(`/fights/${id}`)
    }
  }
}
</script>

<style scoped>
/* Основной контейнер — унифицирован с остальными страницами */
.fights-overview {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  box-sizing: border-box;
  max-width: calc(100vw - var(--sidebar-width, 120px) - 20px);
  margin-left: 0;
  padding-left: 20px;
  padding-right: 100px;
  padding-top: 80px;
  padding-bottom: 40px;
}

.fights-header {
  text-align: center;
  margin-bottom: 2rem;
}

.fights-header h1 {
  font-size: 2.4rem;
  font-weight: 900;
  background: linear-gradient(90deg, #c89b3c, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.15rem;
  color: #666;
  margin-top: 0.4rem;
}

/* Фильтры */
.filters-section {
  display: flex;
  gap: 1.5rem;
  margin: 0 auto 3rem;
  max-width: 900px;
  padding: 1.2rem 1.5rem;
  background: white;
  border-radius: 18px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  flex-wrap: wrap;
  justify-content: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 280px;
}

.filter-group label {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  font-size: 0.95rem;
}

.filter-group select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.filter-group select:hover:not(:disabled) {
  border-color: #c89b3c;
}

.filter-group select:disabled {
  background: #f5f5f5;
  opacity: 0.7;
  cursor: not-allowed;
}

/* Секции татами */
.tatami-sections {
  max-width: 1400px;
  margin: 0 auto;
}

.tatami-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
  border-top: 3px solid #c89b3c;
  transition: all 0.3s ease;
}

.tatami-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.tatami-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.4rem;
  background: linear-gradient(135deg, #fffdf7 0%, #ffffff 100%);
  border-bottom: 1px solid #eee;
}

.tatami-number {
  font-size: 2.4rem;
  font-weight: 900;
  color: #c89b3c;
  margin-right: 0.8rem;
  line-height: 1;
}

.tatami-title {
  font-size: 1.4rem;
  font-weight: 900;
  margin: 0;
  color: #c89b3c;
}

.fight-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.9rem 1.4rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.3s ease;
}

.fight-row:hover {
  background: #fdfdfb;
}

.fight-row:last-child {
  border-bottom: none;
}

.status-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
}

.status-corner {
  position: absolute;
  top: 10px;
  right: 14px;
  background: white;
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  box-shadow: 0 3px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 10;
  color: #c89b3c;
  border: 2px solid #c89b3c;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c89b3c;
  animation: pulse 1.8s infinite;
}

.row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 140px;
}

.category-weight {
  font-size: 1.2rem;
  font-weight: 800;
  min-width: 110px;
  color: #c89b3c;
}

.fighters-matchup {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0 2rem;
}

.fighter {
  display: flex;
  flex-direction: column;
  min-width: 240px;
}

.fighter.left {
  align-items: flex-start;
  text-align: left;
}

.fighter.right {
  align-items: flex-end;
  text-align: right;
}

.club-code {
  font-size: 1rem;
  font-weight: 800;
  color: #c89b3c;
  margin-bottom: 0.2rem;
}

.fighter-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #000;
}

.round-or-timer {
  font-size: 1.6rem;
  font-weight: 900;
  font-family: 'SF Pro Display', monospace;
  min-width: 130px;
  text-align: center;
  color: #1a1a1a;
}

.live-timer {
  color: #c89b3c;
  font-size: 2rem;
  animation: pulse 2s infinite;
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 80px 20px 50px;
  color: #666;
}

.empty-state h3 {
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  color: #444;
}

.reset-filters-btn {
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.3);
}

.reset-filters-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(200, 155, 60, 0.4);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Адаптивность */
@media (max-width: 1200px) {
  .fights-overview {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 992px) {
  .row-content {
    flex-direction: column;
    align-items: flex-start;
    padding-right: 0;
  }
  .fighters-matchup {
    padding: 1rem 0;
    width: 100%;
    justify-content: space-between;
  }
  .round-or-timer {
    margin: 1rem 0;
    text-align: left;
  }
  .category-weight {
    margin-bottom: 1rem;
  }
  .tatami-header {
    flex-direction: column;
    text-align: center;
    padding: 1rem 1.2rem;
  }
  .tatami-number {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }
  .status-corner {
    right: 50%;
    transform: translateX(50%);
    top: 8px;
  }
}

@media (max-width: 768px) {
  .fights-overview {
    padding-top: 70px;
  }
  .fighters-matchup {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .fighter.left,
  .fighter.right {
    align-items: center;
    text-align: center;
    min-width: auto;
  }
  .tatami-number {
    font-size: 2.2rem;
  }
  .tatami-title {
    font-size: 1.3rem;
  }
  .filters-section {
    flex-direction: column;
    padding: 1rem;
  }
  .filter-group {
    min-width: auto;
    width: 100%;
  }
  .filter-group select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .fights-overview {
    padding-top: 65px;
  }
  .fights-header h1 {
    font-size: 2rem;
  }
  .tatami-number {
    font-size: 2rem;
  }
}
</style>