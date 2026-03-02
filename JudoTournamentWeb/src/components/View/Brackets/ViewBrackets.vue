<template>

  <div class="tournament-bracket">

    <!-- Выбор турнира -->

    <div class="tournament-selector">

      <label for="tournament_filter">Турнир:</label>

      <select

          v-model="selectedTournamentId"

          id="tournament_filter"

          @change="onTournamentChange"

          :disabled="isLoadingCategories"

      >

        <option :value="null">Выберите турнир</option>

        <option v-for="t in tournaments" :key="t.id" :value="t.id">

          {{ t.name }}

        </option>

      </select>

    </div>

    <!-- Лоадер категорий -->

    <div v-if="isLoadingCategories" class="categories-loading">

      <div class="spinner"></div>

      <p>Загрузка весовых категорий...</p>

    </div>

    <!-- Если нет категорий после выбора турнира -->

    <div v-else-if="selectedTournamentId && !categories.length" class="no-categories">

      <p>В этом турнире пока нет весовых категорий</p>

    </div>

    <!-- Основной контент (только после выбора турнира) -->

    <template v-else-if="selectedTournamentId">

      <!-- Основные вкладки -->

      <div class="main-tabs">

        <button

            class="main-tab"

            :class="{ active: mainTab === 'bracket' }"

            @click="mainTab = 'bracket'"

        >

          Турнирная сетка

        </button>

        <button

            class="main-tab"

            :class="{ active: mainTab === 'consolation' }"

            @click="mainTab = 'consolation'"

        >

          Утешительные бои

        </button>

      </div>

      <!-- Панель категорий -->

      <div class="weight-categories-bar">

        <button

            v-for="cat in categories"

            :key="cat.id"

            class="weight-tab"

            :class="{ active: selectedCategory?.id === cat.id }"

            @click="selectedCategory = cat"

        >

          {{ cat.name }} ({{ cat.gender === 'MALE' ? 'М' : 'Ж' }})

        </button>

      </div>

      <!-- Вкладка Утешительные бои -->

      <template v-if="mainTab === 'consolation'">

        <ConsolationBracket

            v-if="selectedCategory"

            :tournament-id="selectedTournamentId"

            :category-id="selectedCategory.id"

        />

        <div v-else class="placeholder">

          <p>Выберите весовую категорию выше</p>

        </div>

      </template>

      <!-- Вкладка Турнирная сетка -->

      <template v-else>

        <div v-if="selectedCategory" class="page">

          <div class="group-section">

            <span class="group-label">ВЕСОВАЯ КАТЕГОРИЯ</span>

            <span class="group-weight">{{ selectedCategory.name }}</span>

          </div>

          <div v-if="isLoadingBracket" class="bracket-loading">

            <div class="spinner"></div>

            <p>Загрузка турнирной сетки...</p>

          </div>

          <div v-else-if="!rounds.length" class="no-fights">

            <p>В этой категории пока нет схваток</p>

          </div>

          <div v-else id="bracket-root" ref="bracketRoot">

            <div class="rounds-row">

              <div v-for="(round, ri) in rounds" :key="ri" class="round-col">

                <div class="round-header">{{ round.label }}</div>

                <div class="round-body">

                  <div v-for="(match, mi) in round.matches" :key="mi" class="match-slot">

                    <div class="match-card">

                      <!-- Белый -->

                      <div :class="['contestant', { winner: match.winner === match.p1 && match.p1 }, { loser: match.winner !== null && match.winner !== match.p1 && match.p1 }, { tbd: !match.p1 }]">

                        <div class="c-name-wrap">

                          <span v-if="getContestant(match.p1)" class="c-first">{{ getContestant(match.p1).first }}</span>

                          <span class="c-name">{{ getContestant(match.p1)?.last || 'TBD' }}</span>

                        </div>

                      </div>

                      <!-- Синий -->

                      <div :class="['contestant', 'blue-side', { winner: match.winner === match.p2 && match.p2 }, { loser: match.winner !== null && match.winner !== match.p2 && match.p2 }, { tbd: !match.p2 }]">

                        <div class="c-name-wrap">

                          <span v-if="getContestant(match.p2)" class="c-first">{{ getContestant(match.p2).first }}</span>

                          <span class="c-name">{{ getContestant(match.p2)?.last || 'TBD' }}</span>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              <!-- Чемпион -->

              <div class="round-col champion-col">

                <div class="round-header">Чемпион</div>

                <div class="champion-body">

                  <div class="match-slot">

                    <div class="match-card champion-card">

                      <div v-if="championContestant" class="contestant winner champion-contestant">

                        <div class="c-name-wrap">

                          <span class="c-first">{{ championContestant.first }}</span>

                          <span class="c-name">{{ championContestant.last }}</span>

                        </div>

                      </div>

                      <div v-else class="contestant tbd">

                        <div class="c-name-wrap"><span class="c-name">TBD</span></div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            <svg ref="connectorSvg" id="connector-svg" width="1" height="1"></svg>

          </div>

        </div>

        <div v-else class="placeholder">

          <p>Выберите весовую категорию выше</p>

        </div>

      </template>

    </template>

    <!-- Если турнир не выбран -->

    <div v-else class="empty-state">

      <p>Выберите турнир выше</p>

    </div>

  </div>

</template>

<script setup>

import { ref, onMounted, nextTick, computed, watch } from 'vue'

import { fetchGetCategoryByTournament, fetchBrackets, getResultTournament } from '@/components/View/Brackets/fetchBrackets.js'

import ConsolationBracket from '@/components/View/TournamentDetails/ConsolationBracket.vue'

const props = defineProps({

  tournaments: { type: Array, default: () => [] }

})

const selectedTournamentId = ref(null)

const categories = ref([])

const selectedCategory = ref(null)

const isLoadingCategories = ref(false)

const mainTab = ref('bracket')

const contestants = ref([])

const rounds = ref([])

const championId = ref(null)

const isLoadingBracket = ref(false)

const championContestant = computed(() =>

    championId.value ? contestants.value.find(c => c.id === championId.value) : null

)

const getContestant = (id) => contestants.value.find(c => c.id === id)

// Загрузка категорий

const loadCategories = async () => {

  if (!selectedTournamentId.value) return

  isLoadingCategories.value = true

  categories.value = []

  try {

    const data = await fetchGetCategoryByTournament(selectedTournamentId.value)

    let cats = []

    if (data?.success && (data.categories || data.data?.categories)) {

      cats = data.categories || data.data?.categories || []

    } else if (Array.isArray(data)) {

      cats = data

    } else if (data?.data && Array.isArray(data.data)) {

      cats = data.data

    }

    categories.value = cats

    if (cats.length > 0) selectedCategory.value = cats[0]

  } catch (err) {

    console.error('Ошибка загрузки категорий:', err)

    categories.value = []

  } finally {

    isLoadingCategories.value = false

  }

}

// Смена турнира

const onTournamentChange = async () => {

  selectedCategory.value = null

  categories.value = []

  rounds.value = []

  if (selectedTournamentId.value) {

    await loadCategories()

  }

}

// Загрузка сетки

const loadBracket = async (catId) => {

  if (!selectedTournamentId.value || !catId) return

  isLoadingBracket.value = true

  contestants.value = []

  rounds.value = []

  championId.value = null

  try {

    const [bracketData, resultsData] = await Promise.all([

      fetchBrackets(selectedTournamentId.value, catId),

      getResultTournament(selectedTournamentId.value, catId)

    ])

    if (bracketData?.success && bracketData.fights) {

      const mainFights = bracketData.fights.filter(f => !f.type_bracket || f.type_bracket === 'MAIN')

      const resultsMap = new Map()

      if (resultsData?.success && resultsData.results) {

        resultsData.results.forEach(r => resultsMap.set(r.fight_id, r.winner_name))

      }

      processBracketData(mainFights, resultsMap)

    }

  } catch (err) {

    console.error('Ошибка загрузки схваток:', err)

  } finally {

    isLoadingBracket.value = false

  }

}

const processBracketData = (fights, resultsMap = new Map()) => {

  // ... (тот же код processBracketData, что был раньше — оставлен без изменений)

  const athletesMap = new Map()

  fights.forEach(fight => {

    [fight.white_athlete, fight.blue_athlete].forEach(athlete => {

      if (athlete) {

        athletesMap.set(athlete.id, {

          id: athlete.id,

          first: athlete.first_name,

          last: athlete.last_name.toUpperCase(),

        })

      }

    })

  })

  contestants.value = Array.from(athletesMap.values())

  const maxRound = fights.length ? Math.max(...fights.map(f => f.round)) : 0

  if (maxRound === 0) return

  const stageLabels = ['1/32 финала', '1/16 финала', '1/4 финала', 'Полуфинал']

  let labelIndex = stageLabels.length - (maxRound - 1)

  const bracketRounds = []

  for (let r = 1; r <= maxRound; r++) {

    const roundFights = fights.filter(f => f.round === r).sort((a, b) => a.id - b.id)

    const matches = roundFights.map(f => {

      const result = resultsMap.get(f.id)

      let winnerId = null

      if (result) {

        const white = f.white_athlete

        const blue = f.blue_athlete

        if (white && white.last_name === result.last_name && white.first_name === result.first_name) winnerId = white.id

        else if (blue && blue.last_name === result.last_name && blue.first_name === result.first_name) winnerId = blue.id

      }

      return { p1: f.white_athlete?.id || null, p2: f.blue_athlete?.id || null, winner: winnerId }

    })

    const label = r === maxRound ? 'Финал' : (stageLabels[labelIndex++] || `Раунд ${r}`)

    bracketRounds.push({ label, matches })

  }

  rounds.value = bracketRounds

  if (maxRound > 0) {

    const finalFight = fights.find(f => f.round === maxRound)

    if (finalFight) {

      const result = resultsMap.get(finalFight.id)

      if (result) {

        const white = finalFight.white_athlete

        const blue = finalFight.blue_athlete

        if (white && white.last_name === result.last_name) championId.value = white.id

        else if (blue && blue.last_name === result.last_name) championId.value = blue.id

      }

    }

  }

}

// Реактивность

watch(selectedCategory, async (newCat) => {

  if (newCat) {

    await loadBracket(newCat.id)

    nextTick(() => requestAnimationFrame(() => requestAnimationFrame(drawConnectors)))

  }

}, { immediate: true })

watch(rounds, () => {

  nextTick(() => requestAnimationFrame(() => requestAnimationFrame(drawConnectors)))

}, { deep: true })

watch(mainTab, (tab) => {

  if (tab === 'bracket') {

    nextTick(() => requestAnimationFrame(() => requestAnimationFrame(drawConnectors)))

  }

})

// SVG-коннекторы (drawConnectors полностью сохранён из предыдущей версии)

const bracketRoot = ref(null)

const connectorSvg = ref(null)

const drawConnectors = () => {

  if (!bracketRoot.value || !connectorSvg.value) return

  // ... (полный код drawConnectors из предыдущей версии — оставлен без изменений)

  const root = bracketRoot.value

  const svg = connectorSvg.value

  const rRect = root.getBoundingClientRect()

  svg.setAttribute('width', root.offsetWidth)

  svg.setAttribute('height', root.offsetHeight)

  svg.innerHTML = ''

  const C_LINE = '#d4aa5a'

  const SW = 1.5

  const rel = (r) => ({

    right: r.right - rRect.left,

    left: r.left - rRect.left,

    midY: r.top + r.height / 2 - rRect.top

  })

  const roundCols = Array.from(root.querySelectorAll('.round-col'))

  roundCols.forEach((col, ri) => {

    const tgtCol = roundCols[ri + 1]

    if (!tgtCol) return

    const srcSlots = Array.from(col.querySelectorAll('.match-slot'))

    const tgtSlots = Array.from(tgtCol.querySelectorAll('.match-slot'))

    const pairCount = Math.ceil(srcSlots.length / 2)

    for (let pi = 0; pi < pairCount; pi++) {

      const slot1 = srcSlots[pi * 2]

      const slot2 = srcSlots[pi * 2 + 1]

      const tSlot = tgtSlots[pi]

      if (!slot1 || !tSlot) continue

      const card1 = slot1.querySelector('.match-card')

      const card2 = slot2?.querySelector('.match-card')

      const tCard = tSlot.querySelector('.match-card')

      if (!card1 || !tCard) continue

      const r1 = rel(card1.getBoundingClientRect())

      const r2 = card2 ? rel(card2.getBoundingClientRect()) : null

      const rt = rel(tCard.getBoundingClientRect())

      const x1 = r1.right, y1 = r1.midY

      const x2 = r2 ? r2.right : x1, y2 = r2 ? r2.midY : y1

      const xt = rt.left

      const bridgeX = (x1 + xt) / 2

      const bridgeY = r2 ? (y1 + y2) / 2 : y1

      const parts = [`M ${x1} ${y1} H ${bridgeX}`]

      if (r2) {

        parts.push(`M ${x2} ${y2} H ${bridgeX}`)

        parts.push(`M ${bridgeX} ${y1} V ${y2}`)

      }

      parts.push(`M ${bridgeX} ${bridgeY} H ${xt}`)

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

      path.setAttribute('d', parts.join(' '))

      path.setAttribute('fill', 'none')

      path.setAttribute('stroke', C_LINE)

      path.setAttribute('stroke-width', SW)

      path.setAttribute('stroke-linecap', 'round')

      path.setAttribute('stroke-linejoin', 'round')

      svg.appendChild(path)

      const dots = [[bridgeX, y1], [bridgeX, bridgeY]]

      if (r2) dots.push([bridgeX, y2])

      dots.forEach(([cx, cy]) => {

        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')

        c.setAttribute('cx', cx)

        c.setAttribute('cy', cy)

        c.setAttribute('r', '2.5')

        c.setAttribute('fill', C_LINE)

        svg.appendChild(c)

      })

    }

  })

}

onMounted(() => {

  window.addEventListener('resize', () => requestAnimationFrame(drawConnectors))

})

</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.tournament-bracket {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: transparent;
  color: #1a1a2e;
}

.main-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.main-tab {
  padding: 0.55rem 1.4rem;
  border-radius: 50px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.main-tab:hover { border-color: #c89b3c; color: #c89b3c; }
.main-tab.active {
  background: #1a1a2e;
  border-color: #1a1a2e;
  color: #fff;
  box-shadow: 0 4px 12px rgba(26,26,46,0.25);
}

.page {
  padding: 12px 0 32px;
}

.group-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.group-label {
  color: #9ca3af;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  font-weight: 600;
  text-transform: uppercase;
}

.group-weight {
  font-weight: 700;
  color: #c89b3c;
  font-size: 1rem;
}

.weight-categories-bar {
  padding: 0.5rem 0 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  display: flex;
  gap: 0.6rem;
}

.weight-categories-bar::-webkit-scrollbar { display: none; }

.weight-tab {
  padding: 0.5rem 1.3rem;
  border-radius: 50px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.weight-tab:hover { border-color: #c89b3c; color: #c89b3c; }
.weight-tab.active {
  background: #c89b3c;
  border-color: #c89b3c;
  color: #fff;
  box-shadow: 0 4px 12px rgba(200,155,60,0.3);
}

#bracket-root {
  position: relative;
  width: 100%;
  min-height: 520px;
  background: #ffffff;
  border: 2px solid #e0b456;
  border-radius: 14px;
  box-shadow:
      0 0 0 1px rgba(224,180,86,0.10),
      0 6px 32px rgba(200,155,60,0.09),
      inset 0 1px 0 rgba(255,255,255,0.9);
  overflow-x: auto;
  overflow-y: visible;
  padding: 20px 16px 28px;
  scrollbar-width: thin;
  scrollbar-color: #e0b456 #fafafa;
}

#bracket-root::-webkit-scrollbar { height: 5px; }
#bracket-root::-webkit-scrollbar-track { background: #fafafa; border-radius: 3px; }
#bracket-root::-webkit-scrollbar-thumb { background: #e0b456; border-radius: 3px; }

#connector-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}

.rounds-row {
  display: flex;
  align-items: stretch;
  justify-content: space-evenly;
  min-width: 100%;
}

.round-col {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.round-header {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c89b3c;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  white-space: nowrap;
  border-bottom: 1px solid rgba(224,180,86,0.25);
  margin-bottom: 16px;
}

.champion-col .round-header {
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: #a07830;
}

.round-body {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 8px;
}

.champion-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  padding: 0 12px;
}

.match-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  position: relative;
}

.match-card {
  width: 172px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
  flex-shrink: 0;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.match-card:hover {
  border-color: #e0b456;
  box-shadow: 0 3px 14px rgba(200,155,60,0.18);
}

.champion-card {
  width: 184px;
  border: 2px solid #c89b3c;
  box-shadow: 0 2px 18px rgba(200,155,60,0.22);
  background: linear-gradient(135deg, #fffdf5 0%, #fef9e4 100%);
}

.champion-contestant {
  padding: 12px 10px;
  justify-content: center;
  min-height: 42px;
}

.contestant {
  display: flex;
  align-items: center;
  padding: 6px 9px;
  position: relative;
  cursor: pointer;
  transition: background 0.12s;
  min-height: 32px;
}

.contestant:not(:last-child) { border-bottom: 1px solid #f0f0f0; }
.contestant:hover { background: #fdfcf8; }

.blue-side { background-color: #2563eb; }
.blue-side:hover { background-color: #1d4ed8; }
.blue-side .c-first { color: #93c5fd; }
.blue-side .c-name  { color: #fff; }

.contestant.winner::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: #c89b3c;
}

.contestant.loser .c-name-wrap { opacity: 0.4; }
.contestant.loser .c-name { text-decoration: line-through; text-decoration-color: #9ca3af; }
.blue-side.loser .c-name { text-decoration-color: #93c5fd; }

.contestant.tbd .c-name-wrap { opacity: 0.28; }
.contestant.tbd .c-name { font-style: italic; font-weight: 400; }
.blue-side.tbd .c-name { color: #bfdbfe; }

.c-name-wrap {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.c-first {
  font-size: 0.58rem;
  font-weight: 400;
  color: #9ca3af;
  display: block;
  line-height: 1;
  margin-bottom: 1px;
}

.c-name {
  font-size: 0.76rem;
  font-weight: 700;
  color: #111827;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.categories-loading,
.no-categories,
.bracket-loading,
.no-fights,
.placeholder {
  text-align: center;
  padding: 3rem 2rem;
  color: #9ca3af;
  font-size: 0.9rem;
}

.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #c89b3c;
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
  margin: 0 auto 0.75rem;
}

/* ==================== СТИЛЬ ДРОПДАУНА ТУРНИРА ==================== */
.tournament-selector {
  margin-bottom: 1.8rem;
  max-width: 420px;
}

.tournament-selector label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 0.96rem;
  letter-spacing: 0.02em;
}

.tournament-selector select {
  width: 100%;
  padding: 13px 16px;
  font-size: 1.02rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background-color: #ffffff;
  color: #1f2937;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.25s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='%236b7280' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E");
  background-position: right 14px center;
  background-repeat: no-repeat;
  background-size: 18px;
}

.tournament-selector select:hover {
  border-color: #c89b3c;
  box-shadow: 0 4px 15px rgba(200, 155, 60, 0.18);
}

.tournament-selector select:focus {
  outline: none;
  border-color: #c89b3c;
  box-shadow: 0 0 0 4px rgba(200, 155, 60, 0.25);
}

.tournament-selector select:disabled {
  background-color: #f8f9fa;
  color: #9ca3af;
  cursor: not-allowed;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 700px) {
  .match-card    { width: 140px; }
  .champion-card { width: 152px; }
  .page          { padding: 10px 0 20px; }
  .match-slot, .champion-body { padding-left: 6px; padding-right: 6px; }
  #bracket-root  { border-radius: 10px; padding: 14px 6px 20px; }
}
</style>