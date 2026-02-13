<template>
  <div class="fights-overview">
    <div class="fights-header">
      <h1>Схватки и поединки</h1>
      <p class="subtitle">Все бои текущего турнира</p>
    </div>

    <!-- Лоадер категорий -->
    <div v-if="isLoadingCategories" class="categories-loading">
      <div class="spinner"></div>
      <p>Загрузка весовых категорий...</p>
    </div>

    <!-- Нет категорий -->
    <div v-else-if="!categories.length" class="no-categories">
      <p>В этом турнире пока нет весовых категорий</p>
    </div>

    <!-- Дропдаун категорий -->
    <div v-else class="weight-categories-dropdown">
      <select v-model="selectedCategory" class="category-dropdown" @change="loadFights">
        <option v-for="cat in categories" :key="cat.id" :value="cat">
          {{ cat.name }} {{ cat.gender ? `(${cat.gender === 'MALE' ? 'М' : 'Ж'})` : '' }}
        </option>
      </select>
    </div>

    <!-- Заголовок выбранной категории -->
    <div v-if="selectedCategory && selectedCategory.id !== null" class="group-section">
      <span class="group-label">ВЕСОВАЯ КАТЕГОРИЯ</span>
      <span class="group-weight">{{ selectedCategory.name }}</span>
    </div>

    <!-- Лоадер боёв -->
    <div v-if="isLoadingFights" class="fights-loading">
      <div class="spinner"></div>
      <p>Загрузка схваток...</p>
    </div>

    <!-- Нет боёв -->
    <div v-else-if="fights.length === 0" class="no-fights">
      <p>{{ selectedCategory?.id === null ? 'В турнире пока нет схваток' : 'В этой категории пока нет схваток' }}</p>
    </div>

    <!-- Татами с боями -->
    <div v-else class="tatami-sections">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchGetCategoryByTournament } from "@/components/View/Brackets/fetchBrackets.js"
import { fetchBrackets } from "@/components/View/Brackets/fetchBrackets.js"

const route = useRoute()
const router = useRouter()

const tournamentId = computed(() => Number(route.params.id))

const categories = ref([])
const selectedCategory = ref(null)
const isLoadingCategories = ref(true)

const fights = ref([])
const isLoadingFights = ref(false)

const loadCategories = async () => {
  if (!tournamentId.value) {
    router.push('/tournaments')
    return
  }

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
      const catList = categories.value.filter(c => c.id !== null)

      for (const cat of catList) {
        try {
          const res = await fetchBrackets(tournamentId.value, cat.id)
          if (res?.success && res.fights?.length) {
            const catName = `${cat.name} ${cat.gender ? `(${cat.gender === 'MALE' ? 'М' : 'Ж'})` : ''}`
            const catFights = res.fights.map(fight => ({
              id: fight.id,
              tatami: fight.tatami_number ?? 0,
              status: fight.status_fight || 'SCHEDULED',
              category: catName,
              fighter1: formatAthlete(fight.white_athlete),
              fighter2: formatAthlete(fight.blue_athlete),
              round: fight.round || null,
              round_info: fight.round ? `Раунд ${fight.round}` : (fight.next_fight === null ? 'Финал' : '—')
            }))
            allFights.push(...catFights)
          }
        } catch (err) {
          console.error(`Ошибка загрузки боёв для категории ${cat.id}:`, err)
        }
      }
      fights.value = allFights
    } else {
      const res = await fetchBrackets(tournamentId.value, selectedCategory.value.id)
      if (res?.success && res.fights?.length) {
        fights.value = res.fights.map(fight => ({
          id: fight.id,
          tatami: fight.tatami_number ?? 0,
          status: fight.status_fight || 'SCHEDULED',
          category: selectedCategory.value.name,
          fighter1: formatAthlete(fight.white_athlete),
          fighter2: formatAthlete(fight.blue_athlete),
          round: fight.round || null,
          round_info: fight.round ? `Раунд ${fight.round}` : (fight.next_fight === null ? 'Финал' : '—')
        }))
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки боёв:', err)
    fights.value = []
  } finally {
    isLoadingFights.value = false
  }
}

const formatAthlete = (athlete) => {
  if (!athlete) {
    return { name: 'Ожидает победителя', club: '' }
  }
  const name = [athlete.last_name, athlete.first_name, athlete.middle_name]
      .filter(Boolean)
      .join(' ')
  return { name, club: athlete.club_name || '' }
}

const availableTatamis = computed(() => {
  const tatamis = [...new Set(fights.value.map(f => f.tatami || 0))].sort((a, b) => a - b)
  const positive = tatamis.filter(t => t > 0)
  const zero = tatamis.includes(0) ? [0] : []
  return positive.concat(zero)
})

const groupedFights = computed(() => {
  const grouped = {}
  fights.value.forEach(f => {
    const key = f.tatami || 0
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
})

const statusText = (s) => {
  switch (s) {
    case 'IN_PROGRESS': return 'LIVE'
    case 'SCHEDULED': return 'Запланировано'
    case 'COMPLETED': return 'Завершено'
    default: return 'Неизвестно'
  }
}

const viewFightDetail = (id) => {
  router.push(`/fights/${id}`)
}

watch(selectedCategory, loadFights)

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.fights-overview {
  min-height: 100vh;
  background: #f9f9fb;
  padding: 90px 1.5rem 4rem;
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
}

.subtitle {
  font-size: 1.15rem;
  color: #666;
  text-align: center;
  margin-top: 0.4rem;
}

.weight-categories-dropdown {
  display: flex;
  justify-content: center;
  margin: 2.5rem 0 2rem;
}

.category-dropdown {
  padding: 0.8rem 2rem;
  border-radius: 30px;
  border: 2px solid #c89b3c;
  background: white;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 340px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.1);
  transition: all 0.2s;
}

.category-dropdown:hover {
  box-shadow: 0 6px 16px rgba(200, 155, 60, 0.15);
}

.category-dropdown:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(200, 155, 60, 0.2);
}

.group-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.group-label {
  color: #1a1a1a;
}

.group-weight {
  color: #c89b3c;
  font-size: 1.2rem;
}

.tatami-sections {
  max-width: 1300px;
  margin: 0 auto;
}

.tatami-section {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0,0,0,0.09);
  margin-bottom: 2.5rem;
  border-top: 5px solid #c89b3c;
}

.tatami-header {
  display: flex;
  align-items: center;
  padding: 1.4rem 1.6rem;
  background: white;
  border-bottom: 1px solid #eee;
}

.tatami-number {
  font-size: 3.5rem;
  font-weight: 900;
  color: #c89b3c;
  margin-right: 1rem;
  line-height: 1;
}

.tatami-title {
  font-size: 2rem;
  font-weight: 900;
  margin: 0;
  color: #c89b3c;
}

.fight-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 1.4rem 1.6rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.3s;
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
  width: 10px;
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
}

.status-corner {
  position: absolute;
  top: 10px;
  right: 14px;
  background: white;
  padding: 5px 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  box-shadow: 0 3px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 5px;
  z-index: 10;
  color: #c89b3c;
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
  font-size: 1.3rem;
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
  font-size: 1.1rem;
  font-weight: 800;
  color: #c89b3c;
  margin-bottom: 0.2rem;
}

.fighter-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #000;
}

.round-or-timer {
  font-size: 1.8rem;
  font-weight: 900;
  font-family: 'SF Pro Display', monospace;
  min-width: 140px;
  text-align: center;
  color: #1a1a1a;
}

.live-timer {
  color: #c89b3c;
  font-size: 2.2rem;
}

.categories-loading,
.fights-loading,
.no-categories,
.no-fights {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  font-size: 1.1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (max-width: 992px) {
  .row-content {
    flex-direction: column;
    align-items: flex-start;
    padding-right: 0;
  }
  .fighters-matchup {
    padding: 0.8rem 0;
    width: 100%;
    justify-content: space-between;
  }
  .round-or-timer {
    margin: 0.8rem 0;
    text-align: left;
  }
  .category-weight {
    margin-bottom: 0.8rem;
  }
  .tatami-header {
    flex-direction: column;
    text-align: center;
  }
  .tatami-number {
    margin-right: 0;
    margin-bottom: 0.4rem;
  }
  .status-corner {
    right: 50%;
    transform: translateX(50%);
    top: 6px;
  }
}

@media (max-width: 768px) {
  .fighters-matchup {
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }
  .fighter.left,
  .fighter.right {
    align-items: center;
    text-align: center;
  }
  .tatami-number {
    font-size: 3rem;
  }
  .tatami-title {
    font-size: 1.8rem;
  }
  .category-dropdown {
    min-width: 100%;
  }
}

@media (max-width: 480px) {
  .fights-header h1 {
    font-size: 2rem;
  }
}
</style>