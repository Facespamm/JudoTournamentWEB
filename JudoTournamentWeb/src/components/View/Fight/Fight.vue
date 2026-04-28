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

    <!-- Табы переключения блоков -->
    <div v-if="fights.length > 0" class="bracket-tabs">
      <button
          v-for="tab in availableTabs"
          :key="tab.key"
          class="bracket-tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
      <button class="bracket-tab" @click="showChangeModal = true">
        Поменять атлетов в бою
      </button>
    </div>

    <!-- модалка — перед закрывающим </div> компонента -->
    <ChangeAthletesModal
        v-if="showChangeModal"
        :tournament-id="selectedTournament"
        :category-id="selectedCategory"
        @close="showChangeModal = false"
        @swapped="onSwapped"
    />

    <!-- Основная сетка -->
    <div v-if="activeTab === 'main'" class="tatami-sections">
      <div v-for="tatami in mainTatamis" :key="tatami" class="tatami-section">
        <div class="tatami-header">
          <div class="tatami-number">{{ tatami > 0 ? tatami : '—' }}</div>
          <h2 class="tatami-title">{{ tatami > 0 ? `Татами ${tatami}` : 'Не назначено' }}</h2>
        </div>
        <div class="fights-rows">
          <div
              v-for="fight in groupedMainFights[tatami]"
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
              <div class="category-weight">{{ fight.category || '—' }}</div>
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
            <button class="tatami-btn" @click.stop="openTatamiModal(fight)"> 🥋 {{ fight.tatami || '—' }} </button>
          </div>
        </div>
      </div>
    </div>

    <ChangeTatamiModal
        v-if="showTatamiModal && activeFight?.id && selectedTournament"
        :tournamentId="selectedTournament"
        :fightId="activeFight.id"
        :currentTatami="activeFight.tatami"
        @close="showTatamiModal = false"
        @changed="onTatamiChanged"
    />

    <!-- Утешительные бои от полуфиналистов -->
    <div v-if="activeTab === 'semifinalist'" class="tatami-sections">
      <div class="consolation-header-banner semifinalist-banner">
        <span class="banner-icon">🥉</span>
        <div>
          <div class="banner-title">Утешительные от полуфиналистов</div>
          <div class="banner-subtitle">Бои за 3 место — ветки A и B</div>
        </div>
      </div>
      <div class="consolation-groups">
        <div
            v-for="group in ['SEMIFINALIST_CONSOLATION_GROUP_A', 'SEMIFINALIST_CONSOLATION_GROUP_B']"
            :key="group"
            class="consolation-group"
        >
          <div class="group-header">
            <span class="group-label">{{ group === 'SEMIFINALIST_CONSOLATION_GROUP_A' ? 'Ветка A' : 'Ветка B' }}</span>
          </div>
          <div v-if="consolationByType[group]?.length">
            <div
                v-for="fight in consolationByType[group]"
                :key="fight.id"
                class="fight-row consolation-row"
                @click="viewFightDetail(fight.id)"
            >
              <div class="status-bar consolation-bar"></div>
              <div class="status-corner">
                <span v-if="fight.status === 'IN_PROGRESS'" class="dot"></span>
                {{ statusText(fight.status) }}
              </div>
              <div class="row-content">
                <div class="category-weight">{{ fight.category || '—' }}</div>
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
            <button class="tatami-btn" @click.stop="openTatamiModal(fight)"> 🥋 {{ fight.tatami || '—' }} </button>
          </div>
          <div v-else class="empty-group">Нет боёв в этой ветке</div>
        </div>
      </div>
    </div>

    <!-- Утешительные бои от финалистов -->
    <div v-if="activeTab === 'finalist'" class="tatami-sections">
      <div class="consolation-header-banner finalist-banner">
        <span class="banner-icon">🏅</span>
        <div>
          <div class="banner-title">Утешительные от финалистов</div>
          <div class="banner-subtitle">Бои за 3 место — ветки A и B</div>
        </div>
      </div>
      <div class="consolation-groups">
        <div
            v-for="group in ['FINALIST_CONSOLATION_GROUP_A', 'FINALIST_CONSOLATION_GROUP_B']"
            :key="group"
            class="consolation-group"
        >
          <div class="group-header finalist-group-header">
            <span class="group-label">{{ group === 'FINALIST_CONSOLATION_GROUP_A' ? 'Ветка A' : 'Ветка B' }}</span>
          </div>
          <div v-if="consolationByType[group]?.length">
            <div
                v-for="fight in consolationByType[group]"
                :key="fight.id"
                class="fight-row consolation-row"
                @click="viewFightDetail(fight.id)"
            >
              <div class="status-bar finalist-bar"></div>
              <div class="status-corner">
                <span v-if="fight.status === 'IN_PROGRESS'" class="dot"></span>
                {{ statusText(fight.status) }}
              </div>
              <div class="row-content">
                <div class="category-weight">{{ fight.category || '—' }}</div>
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
            <button class="tatami-btn" @click.stop="openTatamiModal(fight)"> 🥋 {{ fight.tatami || '—' }} </button>
          </div>
          <div v-else class="empty-group">Нет боёв в этой ветке</div>
        </div>
      </div>
    </div>

    <div v-if="fights.length === 0 && !tournamentsLoading" class="empty-state">
      <h3>{{ selectedCategory ? 'Схватки не найдены' : 'Выберите категорию для просмотра схваток' }}</h3>
      <button v-if="selectedTournament || selectedCategory" class="reset-filters-btn" @click="resetFilters">
        Сбросить фильтры
      </button>
    </div>
  </div>
</template>

<script>
import { fetchTournaments } from "@/components/View/Tournaments/fetchTournaments.js"
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import { fetchGetScheduledFight } from "@/components/View/Fight/fetchFights.js"
import "./Fight.css"
import ChangeAthletesModal from './ChangeAthletesModal.vue'
import ChangeTatamiModal from "@/components/View/Fight/ChangeTatamiModal.vue";

const CONSOLATION_TYPES = [
  'SEMIFINALIST_CONSOLATION_GROUP_A',
  'SEMIFINALIST_CONSOLATION_GROUP_B',
  'FINALIST_CONSOLATION_GROUP_A',
  'FINALIST_CONSOLATION_GROUP_B',
]

export default {
  name: 'FightsOverview',
  components: { ChangeAthletesModal , ChangeTatamiModal },  // 👈 сюда, на одном уровне с data/computed/methods

  data() {
    return {
      fights: [],
      selectedTournament: null,
      selectedCategory: null,
      tournaments: [],
      tournamentsLoading: false,
      categories: [],
      categoriesLoading: false,
      currentCategoryName: '',
      activeTab: 'main',
      showChangeModal: false,
      showTatamiModal: false,
      activeFight: null,
    }
  },
  computed: {
    mainFights() {
      return this.fights.filter(f => f.type_bracket === 'MAIN')
    },
    consolationByType() {
      const result = {}
      CONSOLATION_TYPES.forEach(type => {
        result[type] = this.fights
            .filter(f => f.type_bracket === type)
            .sort((a, b) => (a.round || 0) - (b.round || 0))
      })
      return result
    },
    hasSemifinalistConsolation() {
      return (
          this.consolationByType['SEMIFINALIST_CONSOLATION_GROUP_A']?.length > 0 ||
          this.consolationByType['SEMIFINALIST_CONSOLATION_GROUP_B']?.length > 0
      )
    },
    hasFinalistConsolation() {
      return (
          this.consolationByType['FINALIST_CONSOLATION_GROUP_A']?.length > 0 ||
          this.consolationByType['FINALIST_CONSOLATION_GROUP_B']?.length > 0
      )
    },
    availableTabs() {
      const tabs = [
        { key: 'main', label: 'Основная сетка', icon: '🏆', count: this.mainFights.length }
      ]
      if (this.hasSemifinalistConsolation) {
        const count =
            (this.consolationByType['SEMIFINALIST_CONSOLATION_GROUP_A']?.length || 0) +
            (this.consolationByType['SEMIFINALIST_CONSOLATION_GROUP_B']?.length || 0)
        tabs.push({ key: 'semifinalist', label: 'Утешительные (полуфин.)', icon: '🥉', count })
      }
      if (this.hasFinalistConsolation) {
        const count =
            (this.consolationByType['FINALIST_CONSOLATION_GROUP_A']?.length || 0) +
            (this.consolationByType['FINALIST_CONSOLATION_GROUP_B']?.length || 0)
        tabs.push({ key: 'finalist', label: 'Утешительные (финал.)', icon: '🏅', count })
      }
      return tabs
    },
    mainTatamis() {
      const tatamis = [...new Set(this.mainFights.map(f => f.tatami))].sort((a, b) => a - b)
      const positive = tatamis.filter(t => t > 0)
      const zero = tatamis.includes(0) ? [0] : []
      return positive.concat(zero)
    },
    groupedMainFights() {
      const grouped = {}
      this.mainFights.forEach(f => {
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
    },
    // ID боёв текущего таба отсортированные по id
    currentTabFightIds() {
      let visibleFights = []
      if (this.activeTab === 'main') {
        visibleFights = this.mainFights
      } else if (this.activeTab === 'semifinalist') {
        visibleFights = [
          ...(this.consolationByType['SEMIFINALIST_CONSOLATION_GROUP_A'] || []),
          ...(this.consolationByType['SEMIFINALIST_CONSOLATION_GROUP_B'] || [])
        ]
      } else if (this.activeTab === 'finalist') {
        visibleFights = [
          ...(this.consolationByType['FINALIST_CONSOLATION_GROUP_A'] || []),
          ...(this.consolationByType['FINALIST_CONSOLATION_GROUP_B'] || [])
        ]
      }
      return visibleFights.map(f => f.id).sort((a, b) => a - b)
    }
  },
  async mounted() {
    await this.loadTournaments()

    const savedTournament = sessionStorage.getItem('selectedTournament')
    const savedCategory = sessionStorage.getItem('selectedCategory')

    if (savedTournament) {
      this.selectedTournament = Number(savedTournament)
      this.categoriesLoading = true
      try {
        const res = await fetchCategories(this.selectedTournament)
        if (res.success) {
          this.categories = res.categories || res.data?.categories || []
        }
      } catch (err) {
        this.categories = []
      } finally {
        this.categoriesLoading = false
      }

      if (savedCategory) {
        this.selectedCategory = Number(savedCategory)
        await this.loadFights()
      }
    }
  },
  methods: {
    formatAthlete(athlete) {
      if (!athlete) return { name: 'Ожидает победителя', club: '' }
      const name = [athlete.last_name, athlete.first_name, athlete.middle_name]
          .filter(Boolean)
          .join(' ')
      return { name, club: '' }
    },
    openTatamiModal(fight) {
      if (!fight || !fight.id) {
        console.error('Попытка открыть модалку смены татами без валидного боя', fight);
        return;
      }

      this.activeFight = fight;
      this.showTatamiModal = true;
    },
    onTatamiChanged() {
      this.loadFights()
    },
    onSwapped() {
      this.loadFights()  // перезагрузить бои после обмена
    },
    async loadTournaments() {
      this.tournamentsLoading = true
      try {
        const res = await fetchTournaments()
        this.tournaments = res?.success && Array.isArray(res.data) ? res.data : []
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
      this.activeTab = 'main'
      sessionStorage.removeItem('selectedCategory')

      if (!this.selectedTournament) {
        sessionStorage.removeItem('selectedTournament')
        return
      }

      sessionStorage.setItem('selectedTournament', this.selectedTournament)

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
      this.activeTab = 'main'

      if (!this.selectedTournament || this.selectedCategory === null) return

      sessionStorage.setItem('selectedCategory', this.selectedCategory)

      try {
        const res = await fetchGetScheduledFight(this.selectedTournament, this.selectedCategory)

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
            round_info: fight.round ? `Раунд ${fight.round}` : (fight.next_fight === null ? 'Финал' : '—'),
            type_bracket: fight.type_bracket || 'MAIN',
          }))
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
      this.activeTab = 'main'
      sessionStorage.removeItem('selectedTournament')
      sessionStorage.removeItem('selectedCategory')
    },
    statusText(s) {
      switch (s) {
        case 'IN_PROGRESS': return 'LIVE'
        case 'SCHEDULED': return 'Запланировано'
        case 'COMPLETED': return 'Завершено'
        default: return 'Неизвестно'
      }
    },
    viewFightDetail(fightId) {
      // Сохраняем только бои текущего таба, отсортированные по id
      sessionStorage.setItem('fightIds', JSON.stringify(this.currentTabFightIds))
      this.$router.push(`/fights/${fightId}`)
    }
  }
}
</script>

<style scoped>
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

.filters-section {
  display: flex;
  gap: 1.5rem;
  margin: 0 auto 2rem;
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

.filter-group select:hover:not(:disabled) { border-color: #c89b3c; }
.filter-group select:disabled { background: #f5f5f5; opacity: 0.7; cursor: not-allowed; }

.bracket-tabs {
  display: flex;
  gap: 0.8rem;
  margin: 0 auto 2rem;
  max-width: 1400px;
  flex-wrap: wrap;
}

.bracket-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.4rem;
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  background: white;
  font-weight: 700;
  font-size: 0.95rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bracket-tab:hover { border-color: #c89b3c; color: #c89b3c; }

.bracket-tab.active {
  border-color: #c89b3c;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.35);
}

.tab-icon { font-size: 1.1rem; }

.tab-count {
  background: rgba(255,255,255,0.3);
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-weight: 800;
}

.bracket-tab:not(.active) .tab-count { background: #f0f0f0; color: #999; }

.consolation-header-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 14px;
  margin-bottom: 1.5rem;
}

.semifinalist-banner { background: linear-gradient(135deg, #fff8e6, #fffdf7); border: 2px solid #c89b3c; }
.finalist-banner { background: linear-gradient(135deg, #f0f7ff, #f8fbff); border: 2px solid #4a90d9; }

.banner-icon { font-size: 2rem; }
.banner-title { font-size: 1.2rem; font-weight: 800; color: #1a1a1a; }
.banner-subtitle { font-size: 0.9rem; color: #888; margin-top: 0.2rem; }

.consolation-groups { display: flex; flex-direction: column; gap: 1.5rem; }

.consolation-group {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
  border-top: 3px solid #c89b3c;
}

.group-header {
  padding: 0.8rem 1.4rem;
  background: linear-gradient(135deg, #fffdf7 0%, #ffffff 100%);
  border-bottom: 1px solid #eee;
}

.finalist-group-header { background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%); }

.group-label { font-size: 1.1rem; font-weight: 800; color: #c89b3c; }
.finalist-group-header .group-label { color: #4a90d9; }

.empty-group { padding: 2rem; text-align: center; color: #aaa; font-size: 0.95rem; }

.tatami-sections { max-width: 1400px; margin: 0 auto; }

.tatami-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
  margin-bottom: 1.5rem;
  border-top: 3px solid #c89b3c;
  transition: all 0.3s ease;
}

.tatami-section:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }

.tatami-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.4rem;
  background: linear-gradient(135deg, #fffdf7 0%, #ffffff 100%);
  border-bottom: 1px solid #eee;
}

.tatami-number { font-size: 2.4rem; font-weight: 900; color: #c89b3c; margin-right: 0.8rem; line-height: 1; }
.tatami-title { font-size: 1.4rem; font-weight: 900; margin: 0; color: #c89b3c; }

.fight-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.3s ease;
  overflow: hidden;
}

.fight-row:hover { background: #fdfdfb; }
.fight-row:last-child { border-bottom: none; }

.status-bar { width: 6px; flex-shrink: 0; background: linear-gradient(180deg, #c89b3c, #e0b456); }
.consolation-bar { background: linear-gradient(180deg, #e0b456, #f4d03f); }
.finalist-bar { background: linear-gradient(180deg, #4a90d9, #74b3f0); }

.status-corner {
  flex-shrink: 0;
  align-self: center;
  margin-left: auto;
  margin-right: 1rem;
  background: white;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 5px;
  color: #c89b3c;
  border: 2px solid #c89b3c;
  white-space: nowrap;
}

.dot { width: 8px; height: 8px; border-radius: 50%; background: #c89b3c; animation: pulse 1.8s infinite; }

.row-content {
  display: flex;
  align-items: center;
  flex: 1;
  padding: 0.9rem 1rem 0.9rem 1.2rem;
  gap: 1rem;
  min-width: 0;
}

.category-weight { font-size: 1rem; font-weight: 800; min-width: 90px; flex-shrink: 0; color: #c89b3c; }

.fighters-matchup {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;
}

.fighter { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.fighter.left { align-items: flex-start; text-align: left; }
.fighter.right { align-items: flex-end; text-align: right; }

.club-code { font-size: 1rem; font-weight: 800; color: #c89b3c; margin-bottom: 0.2rem; }
.fighter-name { font-size: 1.1rem; font-weight: 600; color: #000; }

.round-or-timer {
  font-size: 1.6rem;
  font-weight: 900;
  font-family: 'SF Pro Display', monospace;
  min-width: 130px;
  text-align: center;
  color: #1a1a1a;
}

.live-timer { color: #c89b3c; font-size: 2rem; animation: pulse 2s infinite; }

.empty-state { text-align: center; padding: 80px 20px 50px; color: #666; }
.empty-state h3 { font-size: 1.4rem; margin-bottom: 1.5rem; color: #444; }

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

.reset-filters-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(200, 155, 60, 0.4); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (max-width: 992px) {
  .consolation-groups { grid-template-columns: 1fr; }
  .row-content { flex-wrap: wrap; }
  .fighters-matchup { width: 100%; }
  .round-or-timer { text-align: left; }
}

@media (max-width: 768px) {
  .fights-overview { padding-top: 70px; }
  .bracket-tabs { gap: 0.5rem; }
  .bracket-tab { padding: 0.6rem 1rem; font-size: 0.85rem; }
  .fighters-matchup { flex-direction: column; align-items: center; gap: 0.5rem; }
  .fighter.left, .fighter.right { align-items: center; text-align: center; min-width: auto; }
  .filters-section { flex-direction: column; padding: 1rem; }
  .filter-group { min-width: auto; width: 100%; }
}
</style>