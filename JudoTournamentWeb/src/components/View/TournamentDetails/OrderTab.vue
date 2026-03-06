<template>
  <div class="fights-overview">
    <div class="fights-header">
      <h1>Схватки и поединки</h1>
      <p class="subtitle">Все бои текущего турнира</p>
    </div>

    <div v-if="isLoadingCategories" class="categories-loading">
      <div class="spinner"></div>
      <p>Загрузка весовых категорий...</p>
    </div>

    <div v-else-if="!categories.length" class="no-categories">
      <p>В этом турнире пока нет весовых категорий</p>
    </div>

    <div v-else class="weight-categories-dropdown">
      <select v-model="selectedCategory" class="category-dropdown" @change="loadFights">
        <option v-for="cat in categories" :key="cat.id" :value="cat">
          {{ cat.name }} {{ cat.gender ? `(${cat.gender === 'MALE' ? 'М' : 'Ж'})` : '' }}
        </option>
      </select>
    </div>

    <div v-if="selectedCategory && selectedCategory.id !== null" class="group-section">
      <span class="group-label">ВЕСОВАЯ КАТЕГОРИЯ</span>
      <span class="group-weight">{{ selectedCategory.name }}</span>
    </div>

    <div v-if="isLoadingFights" class="fights-loading">
      <div class="spinner"></div>
      <p>Загрузка схваток...</p>
    </div>

    <div v-else-if="fights.length === 0" class="no-fights">
      <p>{{ selectedCategory?.id === null ? 'В турнире пока нет схваток' : 'В этой категории пока нет схваток' }}</p>
    </div>

    <div v-else class="tatami-sections">
      <div v-for="tatami in availableTatamis" :key="tatami" class="tatami-section">
        <div class="tatami-header">
          <div class="tatami-badge">
            <span class="tatami-label">ТАТАМИ</span>
            <span class="tatami-num">{{ tatami > 0 ? tatami : '—' }}</span>
          </div>
          <div class="tatami-meta">
            <span class="fights-count">{{ groupedFights[tatami]?.length || 0 }} схваток</span>
          </div>
        </div>

        <div class="fights-grid">
          <div
              v-for="fight in groupedFights[tatami]"
              :key="fight.id"
              class="fight-card"
              :class="{
              'fight-live': getLiveStatus(fight) === 'IN_PROGRESS',
              'fight-done': getLiveStatus(fight) === 'COMPLETED'
            }"
          >
            <div class="fight-status-badge">
              <span v-if="getLiveStatus(fight) === 'IN_PROGRESS'" class="pulse-dot"></span>
              <span class="status-text" :class="getLiveStatus(fight)">{{ statusText(getLiveStatus(fight)) }}</span>
            </div>

            <div class="fight-meta">
              <span class="fight-category">{{ fight.category }}</span>
              <span class="fight-round">{{ fight.round_info }}</span>
            </div>

            <div class="scoreboard">
              <!-- Белый боец -->
              <div class="fighter-row white-side">
                <div class="fighter-info">
                  <div class="fighter-color-dot white-dot"></div>
                  <div class="fighter-details">
                    <span class="fighter-club">{{ fight.fighter1?.club || '' }}</span>
                    <span class="fighter-name">{{ fight.fighter1?.name || 'TBD' }}</span>
                  </div>
                </div>
                <div class="scores">
                  <div class="score-block"><span class="score-label">I</span><span class="score-val">{{ getScore(fight.id, 'white', 'ippon') }}</span></div>
                  <div class="score-block"><span class="score-label">W</span><span class="score-val">{{ getScore(fight.id, 'white', 'wazaari') }}</span></div>
                  <div class="score-block"><span class="score-label">Y</span><span class="score-val">{{ getScore(fight.id, 'white', 'yuko') }}</span></div>
                  <div class="score-block shido-block"><span class="score-label">S</span><span class="score-val shido">{{ getScore(fight.id, 'white', 'shido') }}</span></div>
                </div>
              </div>

              <div class="vs-divider">
                <div class="divider-line"></div>
                <span class="vs-text">VS</span>
                <div class="divider-line"></div>
              </div>

              <!-- Синий боец -->
              <div class="fighter-row blue-side">
                <div class="fighter-info">
                  <div class="fighter-color-dot blue-dot"></div>
                  <div class="fighter-details">
                    <span class="fighter-club">{{ fight.fighter2?.club || '' }}</span>
                    <span class="fighter-name">{{ fight.fighter2?.name || 'TBD' }}</span>
                  </div>
                </div>
                <div class="scores">
                  <div class="score-block"><span class="score-label">I</span><span class="score-val">{{ getScore(fight.id, 'blue', 'ippon') }}</span></div>
                  <div class="score-block"><span class="score-label">W</span><span class="score-val">{{ getScore(fight.id, 'blue', 'wazaari') }}</span></div>
                  <div class="score-block"><span class="score-label">Y</span><span class="score-val">{{ getScore(fight.id, 'blue', 'yuko') }}</span></div>
                  <div class="score-block shido-block"><span class="score-label">S</span><span class="score-val shido">{{ getScore(fight.id, 'blue', 'shido') }}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchGetCategoryByTournament, fetchBrackets } from "@/components/View/Brackets/fetchBrackets.js"
import { fightScores, initFight } from "@/stores/fightScoresStore.js"

const route = useRoute()
const router = useRouter()
const tournamentId = computed(() => Number(route.params.id))

const categories = ref([])
const selectedCategory = ref(null)
const isLoadingCategories = ref(true)
const fights = ref([])
const isLoadingFights = ref(false)

const getScore = (fightId, color, field) => fightScores[fightId]?.[color]?.[field] ?? 0
const getLiveStatus = (fight) => fightScores[fight.id]?.status || fight.status

const loadCategories = async () => {
  if (!tournamentId.value) { router.push('/tournaments'); return }
  isLoadingCategories.value = true
  try {
    const res = await fetchGetCategoryByTournament(tournamentId.value)
    const fetchedCats = Array.isArray(res) ? res : res.categories || res.data?.categories || []
    categories.value = [{ id: null, name: 'Все категории' }, ...fetchedCats]
    selectedCategory.value = categories.value[0]
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    categories.value = [{ id: null, name: 'Все категории' }]
    selectedCategory.value = categories.value[0]
  } finally {
    isLoadingCategories.value = false
  }
}

const loadFights = async () => {
  if (!tournamentId.value) return
  isLoadingFights.value = true
  fights.value = []
  try {
    if (selectedCategory.value.id === null) {
      const allFights = []
      for (const cat of categories.value.filter(c => c.id !== null)) {
        try {
          const res = await fetchBrackets(tournamentId.value, cat.id)
          if (res?.success && res.fights?.length) {
            const catName = `${cat.name} ${cat.gender ? `(${cat.gender === 'MALE' ? 'М' : 'Ж'})` : ''}`
            allFights.push(...res.fights.map(fight => { initFight(fight.id); return mapFight(fight, catName) }))
          }
        } catch {}
      }
      fights.value = allFights
    } else {
      const res = await fetchBrackets(tournamentId.value, selectedCategory.value.id)
      if (res?.success && res.fights?.length) {
        fights.value = res.fights.map(fight => { initFight(fight.id); return mapFight(fight, selectedCategory.value.name) })
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки боёв:', err)
    fights.value = []
  } finally {
    isLoadingFights.value = false
  }
}

const mapFight = (fight, catName) => ({
  id: fight.id,
  tatami: fight.tatami_number ?? 0,
  status: fight.status_fight || 'SCHEDULED',
  category: catName,
  fighter1: formatAthlete(fight.white_athlete),
  fighter2: formatAthlete(fight.blue_athlete),
  round: fight.round || null,
  round_info: fight.round ? `Раунд ${fight.round}` : (fight.next_fight === null ? 'Финал' : '—')
})

const formatAthlete = (athlete) => {
  if (!athlete) return { name: 'Ожидает победителя', club: '' }
  return { name: [athlete.last_name, athlete.first_name, athlete.middle_name].filter(Boolean).join(' '), club: athlete.club_name || '' }
}

const availableTatamis = computed(() => {
  const tatamis = [...new Set(fights.value.map(f => f.tatami || 0))].sort((a, b) => a - b)
  return tatamis.filter(t => t > 0).concat(tatamis.includes(0) ? [0] : [])
})

const groupedFights = computed(() => {
  const grouped = {}
  fights.value.forEach(f => {
    const key = f.tatami || 0
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(f)
  })
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => ((a.round || 999) - (b.round || 999)) || (a.id - b.id))
  })
  return grouped
})

const statusText = (s) => ({ IN_PROGRESS: 'LIVE', SCHEDULED: 'Запланировано', COMPLETED: 'Завершено' }[s] || 'Неизвестно')

watch(selectedCategory, loadFights)
onMounted(() => { loadCategories() })
</script>

<style scoped>
.fights-overview {
  min-height: 100vh;
  background: #ffffff;
  padding: 40px 2rem 4rem;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  color: #1a1a1a;
}

.fights-header h1 {
  font-size: 2.4rem;
  font-weight: 900;
  background: linear-gradient(90deg, #c89b3c, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-bottom: 0.3rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #888;
  text-align: center;
  margin-bottom: 2rem;
}

.weight-categories-dropdown {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.category-dropdown {
  padding: 0.8rem 2rem;
  border-radius: 30px;
  border: 2px solid #c89b3c;
  background: white;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  min-width: 340px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(200,155,60,0.1);
  transition: all 0.2s;
}

.category-dropdown:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(200,155,60,0.2);
}

.group-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  font-weight: 700;
}

.group-label { color: #888; }
.group-weight { color: #c89b3c; font-size: 1.1rem; }

.tatami-sections { max-width: 1300px; margin: 0 auto; }
.tatami-section { margin-bottom: 2.5rem; }

.tatami-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.tatami-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a1a2e;
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 30px;
}

.tatami-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; opacity: 0.7; }
.tatami-num { font-size: 1.4rem; font-weight: 900; color: #c89b3c; line-height: 1; }
.fights-count { font-size: 0.85rem; color: #888; font-weight: 500; }

.fights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 1rem;
}

/* КАРТОЧКА */
.fight-card {
  background: white;
  border-radius: 16px;
  padding: 1.2rem 1.4rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  border: 1.5px solid #e8e8e8;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.fight-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: #e8e8e8;
}

.fight-card.fight-live { border-color: #c89b3c; box-shadow: 0 4px 20px rgba(200,155,60,0.15); }
.fight-card.fight-live::before { background: linear-gradient(90deg, #c89b3c, #f4d03f); }
.fight-card.fight-done { opacity: 0.7; }
.fight-card.fight-done::before { background: #10b981; }

.fight-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.6rem;
}

.pulse-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #c89b3c;
  animation: pulse 1.5s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.status-text { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; }
.status-text.IN_PROGRESS { color: #c89b3c; }
.status-text.SCHEDULED { color: #64748b; }
.status-text.COMPLETED { color: #10b981; }

.fight-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.fight-category {
  font-size: 0.85rem;
  font-weight: 700;
  color: #c89b3c;
  background: rgba(200,155,60,0.1);
  padding: 3px 10px;
  border-radius: 20px;
}

.fight-round { font-size: 0.8rem; font-weight: 600; color: #888; }

/* ТАБЛО — ключевое исправление */
.scoreboard { display: flex; flex-direction: column; gap: 0; }

.fighter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  gap: 0.5rem;
  /* ✅ Одинаковая высота у обеих строк */
  min-height: 60px;
  box-sizing: border-box;
}

.white-side {
  background: #f8f9fa;
  /* ✅ border такой же ширины как у blue-side (border: none = 0px, добавляем явно) */
  border: 1.5px solid #e8e8e8;
}

.blue-side {
  background: #1a3a6e;
  border: 1.5px solid transparent;
}

.fighter-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
}

.fighter-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.white-dot { background: white; border: 2px solid #ccc; }
.blue-dot { background: #4a9eff; border: 2px solid #3b7fd4; }

.fighter-details { display: flex; flex-direction: column; min-width: 0; }

.fighter-club { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
.white-side .fighter-club { color: #c89b3c; }
.blue-side .fighter-club { color: rgba(200,155,60,0.9); }

.fighter-name { font-size: 0.9rem; font-weight: 700; white-space: nowrap; }
.white-side .fighter-name { color: #1a1a1a; }
.blue-side .fighter-name { color: white; }

.scores { display: flex; gap: 4px; flex-shrink: 0; }

.score-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  border-radius: 6px;
  padding: 4px 0;
}

.white-side .score-block { background: white; border: 1px solid #e0e0e0; }
.blue-side .score-block { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); }

.score-label { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
.white-side .score-label { color: #999; }
.blue-side .score-label { color: rgba(255,255,255,0.5); }

.score-val { font-size: 1.2rem; font-weight: 900; line-height: 1; }
.white-side .score-val { color: #1a1a1a; }
.blue-side .score-val { color: white; }

/* Шидо — красный фон */
.shido-block { overflow: hidden; }
.white-side .shido-block .score-val.shido,
.blue-side .shido-block .score-val.shido { color: white; }
.shido-block { background: #e53e3e !important; border-color: #e53e3e !important; }
.shido-block .score-label { color: rgba(255,255,255,0.7) !important; }

.vs-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0.9rem;
}

.divider-line { flex: 1; height: 1px; background: #e8e8e8; }
.vs-text { font-size: 0.65rem; font-weight: 900; color: #bbb; letter-spacing: 1px; }

.categories-loading, .fights-loading, .no-categories, .no-fights {
  text-align: center; padding: 4rem 2rem; color: #888; font-size: 1rem;
}

.spinner {
  width: 36px; height: 36px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .fights-grid { grid-template-columns: 1fr; }
  .category-dropdown { min-width: 100%; }
  .fights-header h1 { font-size: 1.8rem; }
}

@media (max-width: 480px) {
  .score-block { width: 30px; }
  .score-val { font-size: 1rem; }
  .fighter-name { font-size: 0.82rem; }
}
</style>