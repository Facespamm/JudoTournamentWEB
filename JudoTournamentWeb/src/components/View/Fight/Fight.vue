<template>
  <div class="fights-overview">
    <div class="fights-header">
      <h1>Схватки и поединки</h1>
      <p class="subtitle">Управление всеми боями турнира</p>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label>Татами:</label>
        <select v-model="selectedTatami" @change="filterFights">
          <option value="all">Все татами</option>
          <option v-for="t in availableTatamis" :key="t" :value="t">Татами {{ t }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Статус:</label>
        <select v-model="selectedStatus" @change="filterFights">
          <option value="all">Все статусы</option>
          <option value="SCHEDULED">Запланированы</option>
          <option value="IN_PROGRESS">LIVE</option>
          <option value="COMPLETED">Завершены</option>
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
          <div class="tatami-number">{{ tatami }}</div>
          <h2 class="tatami-title">Татами {{ tatami }}</h2>
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
                {{ fight.status === 'IN_PROGRESS'
                  ? formatTimer(fight.timer_seconds || 0)
                  : (fight.round_info || '—') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="availableTatamis.length === 0" class="empty-state">
        <div class="empty-icon">Gi</div>
        <h3>Схватки не найдены</h3>
        <button class="reset-filters-btn" @click="resetFilters">Сбросить фильтры</button>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchGetFights } from '@/components/View/Fight/fetchFights.js'
import "./Fight.css"

export default {
  name: 'FightsOverview',
  data() {
    return {
      fights: [],
      selectedTatami: 'all',
      selectedStatus: 'all',
      refreshInterval: null
    }
  },
  computed: {
    filteredFights() {
      let list = this.fights
      if (this.selectedTatami !== 'all') list = list.filter(f => f.tatami === +this.selectedTatami)
      if (this.selectedStatus !== 'all') list = list.filter(f => f.status === this.selectedStatus)
      return list
    },
    availableTatamis() {
      return [...new Set(this.filteredFights.map(f => f.tatami))].sort((a, b) => a - b)
    },
    groupedFights() {
      const grouped = {}
      this.filteredFights.forEach(f => {
        const key = f.tatami
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(f)
      })
      return grouped
    }
  },
  async mounted() {
    this.fights = this.getMockFights()
    console.log('Установлены мок-данные')
    await this.loadFights()
  },
  beforeUnmount() {
    if (this.refreshInterval) clearInterval(this.refreshInterval)
  },
  methods: {
    getMockFights() {
      return [
        { id: 1, tatami: 1, fight_number: 33, status: 'SCHEDULED', category: '-63 kg', fighter1: { club: 'ALO', name: 'KOZHAKHMETOVA Adina' }, fighter2: { club: 'ZHM', name: 'KOSHKINBEK Aziza' }, round_info: '(Round two #33)' },
        { id: 2, tatami: 1, fight_number: 36, status: 'IN_PROGRESS', timer_seconds: 150, category: '-63 kg', fighter1: { club: 'AST', name: 'GABITOVA Sara' }, fighter2: { club: 'ZSU', name: 'NURFAZYLOVA Zhanel' }, round_info: '(Round two #36)' },
        { id: 3, tatami: 1, fight_number: 29, status: 'SCHEDULED', category: '-63 kg', fighter1: { club: 'ABO', name: 'MURATBEKOVA Dariya' }, fighter2: { club: 'BKO', name: 'ORYNGALI Saya' }, round_info: '(Round one #29)' },
        { id: 4, tatami: 2, fight_number: 30, status: 'SCHEDULED', category: '-66 kg', fighter1: { club: 'ULY', name: 'ABDIKHAMIT Bakarys' }, fighter2: { club: 'ALM', name: 'ADILKHAN Anuar' }, round_info: '(Round one #30)' },
        { id: 5, tatami: 2, fight_number: 31, status: 'IN_PROGRESS', timer_seconds: 90, category: '66 kg', fighter1: { club: 'ZSU', name: 'OMIRZAK Birzhan' }, fighter2: { club: 'SHK', name: 'TILEUBERDY Dimukhammad' }, round_info: '(Round one #31)' },
        { id: 6, tatami: 3, fight_number: 73, status: 'COMPLETED', category: '+73 kg', fighter1: { club: 'ZSU', name: 'GALIBEKOV Madi' }, fighter2: { club: 'KST', name: 'YERBOL Madiyar' }, round_info: '(Round two #73)' },
        { id: 7, tatami: 3, fight_number: 74, status: 'SCHEDULED', category: '+73 kg', fighter1: { club: 'ZSU', name: 'BORAN Madiyar' }, fighter2: { club: 'ALM', name: 'ARIPZHANOV Adnan' }, round_info: '(Round two #74)' },
        { id: 8, tatami: 4, fight_number: 79, status: 'IN_PROGRESS', timer_seconds: 200, category: '-73 kg', fighter1: { club: 'MAN', name: 'KAKHAN Kumisbek' }, fighter2: { club: 'ALM', name: 'KOBTSEV Semen' }, round_info: '(Round two #79)' },
        { id: 9, tatami: 5, fight_number: 87, status: 'SCHEDULED', category: '-57 kg', fighter1: { club: 'ALO', name: 'BEKBOLATKYZY Ayazhan' }, fighter2: { club: 'ABO', name: 'JAKSYBAYEVA Tomiris' }, round_info: '(Round one #87)' },
        { id: 10, tatami: 5, fight_number: 88, status: 'COMPLETED', category: '-57 kg', fighter1: { club: 'ZHM', name: 'NAZHMIDDINOVA Aizere' }, fighter2: { club: 'ZSU', name: 'MEDETHANKYZY Ademi' }, round_info: '(Round one #88)' }
      ]
    },
    async loadFights() {
      try {
        console.log('Загрузка списка боев...')
        const res = await fetchGetFights()
        if (res?.success && res.data?.fights?.length) {
          this.fights = res.data.fights
          console.log('Реальные бои загружены:', this.fights.length)
        }
      } catch (err) {
        console.error('Ошибка загрузки боев:', err)
      }
    },
    filterFights() {},
    resetFilters() {
      this.selectedTatami = 'all'
      this.selectedStatus = 'all'
    },
    statusText(s) {
      return s === 'IN_PROGRESS' ? 'LIVE' : s === 'SCHEDULED' ? 'Запланировано' : 'Завершено'
    },
    formatTimer(sec) {
      const m = String(Math.floor(sec / 60)).padStart(2, '0')
      const s = String(sec % 60).padStart(2, '0')
      return `${m}:${s}`
    },
    viewFightDetail(id) { this.$router.push(`/fights/${id}`) },
    manualRefresh() { this.loadFights() },
    toggleAutoRefresh(enable) {
      if (this.refreshInterval) clearInterval(this.refreshInterval)
      if (enable) {
        this.refreshInterval = setInterval(this.loadFights, 10000)
        console.log('Автообновление включено')
      }
    }
  }
}
</script>

<style scoped>
.fights-overview { min-height: 100vh; background: #f9f9fb; padding: 90px 2rem 4rem; font-family: 'SF Pro Display', -apple-system, sans-serif; color: #1a1a1a; }

.fights-header h1 { font-size: 2.8rem; font-weight: 900; background: linear-gradient(90deg, #c89b3c, #f4d03f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; }
.subtitle { font-size: 1.25rem; color: #666; text-align: center; margin-top: 0.5rem; }

.filters-section {
  display: flex; gap: 2rem; margin: 3rem auto; max-width: 900px; padding: 1rem 1.5rem; background: white; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.08); flex-wrap: wrap; justify-content: center;
}
.filter-group { display: flex; align-items: center; gap: 1rem; }
.filter-group label { font-weight: 600; color: #333; white-space: nowrap; }
.filter-group select { padding: 0.75rem 1rem; border: 2px solid #e0e0e0; border-radius: 14px; font-weight: 600; min-width: 200px; }

.tatami-sections { max-width: 1400px; margin: 0 auto; }

.tatami-section { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); margin-bottom: 3rem; border-top: 6px solid #c89b3c; }

.tatami-header {
  display: flex;
  align-items: center;
  padding: 1.8rem 2rem;
  background: white;
  border-bottom: 1px solid #eee;
}

.tatami-number {
  font-size: 4.5rem;
  font-weight: 900;
  color: #c89b3c;
  margin-right: 1.2rem;
  line-height: 1;
}

.tatami-title {
  font-size: 2.4rem;
  font-weight: 900;
  margin: 0;
  color: #c89b3c;
}

.fights-rows { }

.fight-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 1.8rem 2rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.3s;
}
.fight-row:hover { background: #fdfdfb; }
.fight-row:last-child { border-bottom: none; }

.status-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 12px;
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
}

.status-corner {
  position: absolute;
  top: 12px;
  right: 16px;
  background: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 10;
  color: #c89b3c;
}
.dot { width: 9px; height: 9px; border-radius: 50%; background: #c89b3c; animation: pulse 1.8s infinite; }

.row-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 180px;
}

.category-weight {
  font-size: 1.5rem;
  font-weight: 800;
  min-width: 120px;
  color: #c89b3c;
}

.fighters-matchup {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 0 3rem;
}

.fighter {
  display: flex;
  flex-direction: column;
  min-width: 280px;
}
.fighter.left { align-items: flex-start; text-align: left; }
.fighter.right { align-items: flex-end; text-align: right; }

.club-code {
  font-size: 1.3rem;
  font-weight: 800;
  color: #c89b3c;
  margin-bottom: 0.3rem;
}

.fighter-name {
  font-size: 1.4rem;
  font-weight: 600;
  color: #000;
}

.round-or-timer {
  font-size: 2.2rem;
  font-weight: 900;
  font-family: 'SF Pro Display', monospace;
  min-width: 160px;
  text-align: center;
  color: #1a1a1a;
}
.live-timer {
  color: #c89b3c;
  font-size: 2.6rem;
}

.empty-state { text-align: center; padding: 6rem; color: #666; }
.reset-filters-btn {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  color: white; padding: 1rem 2.5rem; border: none; border-radius: 16px; font-weight: 700; cursor: pointer;
}

@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }

@media (max-width: 992px) {
  .row-content { flex-direction: column; align-items: flex-start; padding-right: 0; }
  .fighters-matchup { padding: 1rem 0; width: 100%; justify-content: space-between; }
  .round-or-timer { margin: 1rem 0; text-align: left; }
  .category-weight { margin-bottom: 1rem; }
  .tatami-header { flex-direction: column; text-align: center; }
  .tatami-number { margin-right: 0; margin-bottom: 0.5rem; }
  .status-corner { right: 50%; transform: translateX(50%); top: 8px; }
}

@media (max-width: 768px) {
  .fighters-matchup { flex-direction: column; align-items: center; gap: 1rem; }
  .fighter.left, .fighter.right { align-items: center; text-align: center; }
  .tatami-number { font-size: 3.5rem; }
  .tatami-title { font-size: 2rem; }
}
</style>