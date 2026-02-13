<template>
  <div class="tournament-bracket">
    <!-- Лоадер категорий -->
    <div v-if="isLoadingCategories" class="categories-loading">
      <div class="spinner"></div>
      <p>Загрузка весовых категорий...</p>
    </div>

    <!-- Если нет категорий -->
    <div v-else-if="!categories.length" class="no-categories">
      <p>В этом турнире пока нет весовых категорий</p>
    </div>

    <!-- Селектор категорий (весов) -->
    <div v-else class="weight-categories-bar">
      <button
          v-for="cat in categories"
          :key="cat.id"
          class="weight-tab"
          :class="{ active: selectedCategory?.id === cat.id }"
          @click="selectedCategory = cat"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- Контент выбранной категории -->
    <div v-if="selectedCategory" class="page">
      <div class="group-section">
        <span class="group-label">ВЕСОВАЯ КАТЕГОРИЯ</span>
        <span class="group-weight">{{ selectedCategory.name }}</span>
      </div>

      <!-- Лоадер сетки -->
      <div v-if="isLoadingBracket" class="bracket-loading">
        <div class="spinner"></div>
        <p>Загрузка турнирной сетки...</p>
      </div>

      <!-- Если нет схваток -->
      <div v-else-if="!rounds.length" class="no-fights">
        <p>В этой категории пока нет схваток</p>
      </div>

      <!-- Сетка -->
      <div v-else id="bracket-root" ref="bracketRoot">
        <div class="rounds-row">
          <!-- Раунды (кроме финала) -->
          <div
              v-for="(round, ri) in rounds"
              :key="ri"
              class="round-col"
          >
            <div class="round-header">{{ round.label }}</div>
            <div class="round-body">
              <div
                  v-for="(match, mi) in round.matches"
                  :key="mi"
                  class="match-slot"
              >
                <div class="match-card" :data-round="ri" :data-match="mi">
                  <!-- Участник 1 (white) -->
                  <div
                      :class="[
                      'contestant',
                      { winner: match.winner === match.p1 && match.p1 },
                      { loser: match.winner !== null && match.winner !== match.p1 && match.p1 },
                      { tbd: !match.p1 }
                    ]"
                  >
                    <div class="c-name-wrap">
                      <span v-if="getContestant(match.p1)" class="c-first">{{ getContestant(match.p1).first }}</span>
                      <span class="c-name">{{ getContestant(match.p1)?.last || 'TBD' }}</span>
                    </div>
                  </div>

                  <!-- Участник 2 (blue) -->
                  <div
                      :class="[
                      'contestant',
                      'blue-side',
                      { winner: match.winner === match.p2 && match.p2 },
                      { loser: match.winner !== null && match.winner !== match.p2 && match.p2 },
                      { tbd: !match.p2 }
                    ]"
                  >
                    <div class="c-name-wrap">
                      <span v-if="getContestant(match.p2)" class="c-first">{{ getContestant(match.p2).first }}</span>
                      <span class="c-name">{{ getContestant(match.p2)?.last || 'TBD' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Финал (чемпион) -->
          <div class="round-col champion-col">
            <div class="round-header">Final</div>
            <div class="champion-body">
              <div class="match-card champion-card">
                <div v-if="championContestant" class="contestant winner">
                  <div class="c-name-wrap">
                    <span class="c-first">{{ championContestant.first }}</span>
                    <span class="c-name">{{ championContestant.last }}</span>
                  </div>
                </div>
                <div v-else class="contestant tbd">
                  <div class="c-name-wrap">
                    <span class="c-name">TBD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Линии соединения -->
        <svg ref="connectorSvg" id="connector-svg" width="1" height="1"></svg>
      </div>
    </div>

    <!-- Если категории есть, но ничего не выбрано -->
    <div v-else-if="categories.length && !selectedCategory" class="placeholder">
      <p>Выберите весовую категорию выше</p>
    </div>
  </div>
</template>

<script setup>
// (script без изменений)
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchGetCategoryByTournament } from "@/components/View/Brackets/fetchBrackets.js"
import {fetchBrackets} from "@/components/View/Brackets/fetchBrackets.js";

const route = useRoute()
const tournamentId = computed(() => Number(route.params.id))

const categories = ref([])
const selectedCategory = ref(null)
const isLoadingCategories = ref(true)

const contestants = ref([])
const rounds = ref([])
const championId = ref(null)
const isLoadingBracket = ref(false)

const championContestant = computed(() => {
  if (!championId.value) return null
  return contestants.value.find(c => c.id === championId.value)
})

const getContestant = (id) => {
  if (!id) return null
  return contestants.value.find(c => c.id === id)
}

const loadCategories = async () => {
  if (!tournamentId.value) return

  isLoadingCategories.value = true
  try {
    const data = await fetchGetCategoryByTournament(tournamentId.value)
    categories.value = Array.isArray(data) ? data : []

    if (categories.value.length > 0) {
      selectedCategory.value = categories.value[0]
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    categories.value = []
  } finally {
    isLoadingCategories.value = false
  }
}

const loadBracket = async (catId) => {
  if (!catId) return

  isLoadingBracket.value = true
  contestants.value = []
  rounds.value = []
  championId.value = null

  try {
    const data = await fetchBrackets(tournamentId.value, catId)

    if (data.success && data.fights) {
      processBracketData(data.fights)
    }
  } catch (err) {
    console.error('Ошибка загрузки схваток:', err)
  } finally {
    isLoadingBracket.value = false
  }
}

const processBracketData = (fights) => {
  const athletesMap = new Map()
  fights.forEach(fight => {
    ;[fight.white_athlete, fight.blue_athlete].forEach(athlete => {
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

  const stageLabels = ['Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals']
  let labelIndex = stageLabels.length - (maxRound - 1)

  const bracketRounds = []
  for (let r = 1; r < maxRound; r++) {
    const roundFights = fights
        .filter(f => f.round === r)
        .sort((a, b) => a.id - b.id)

    const matches = roundFights.map(f => ({
      p1: f.white_athlete?.id || null,
      p2: f.blue_athlete?.id || null,
      winner: null
    }))

    const label = stageLabels[labelIndex++] || `Раунд ${r}`
    bracketRounds.push({ label, matches })
  }

  rounds.value = bracketRounds
  championId.value = null
}

watch(
    selectedCategory,
    async (newCat) => {
      if (newCat) {
        await loadBracket(newCat.id)
        nextTick(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(drawConnectors)
          })
        })
      }
    },
    { immediate: true }
)

watch(rounds, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(drawConnectors)
    })
  })
}, { deep: true })

const bracketRoot = ref(null)
const connectorSvg = ref(null)

const drawConnectors = () => {
  if (!bracketRoot.value || !connectorSvg.value) return

  const root = bracketRoot.value
  const svg = connectorSvg.value
  const rRect = root.getBoundingClientRect()

  svg.setAttribute('width', root.offsetWidth)
  svg.setAttribute('height', root.offsetHeight)

  while (svg.firstChild) svg.removeChild(svg.firstChild)

  const C_LINE = '#d1d5db'
  const SW = 1.5

  const rel = (r) => ({
    right: r.right - rRect.left,
    left: r.left - rRect.left,
    midY: r.top + r.height / 2 - rRect.top
  })

  const roundCols = root.querySelectorAll('.round-col:not(.champion-col)')
  const roundColsArr = Array.from(roundCols)

  roundColsArr.forEach((col, ri) => {
    const tgtCol = ri < roundColsArr.length - 1
        ? roundColsArr[ri + 1]
        : root.querySelector('.champion-col')
    if (!tgtCol) return

    const srcSlots = Array.from(col.querySelectorAll('.match-slot'))
    const tgtSlots = Array.from(tgtCol.querySelectorAll('.match-slot, .champion-body'))

    const pairCount = Math.ceil(srcSlots.length / 2)

    for (let pi = 0; pi < pairCount; pi++) {
      const slot1 = srcSlots[pi * 2]
      const slot2 = srcSlots[pi * 2 + 1]
      const tSlot = tgtSlots[pi]
      if (!slot1 || !tSlot) continue

      const card1 = slot1.querySelector('.match-card')
      const card2 = slot2 ? slot2.querySelector('.match-card') : null
      const tCard = tSlot.querySelector('.match-card')
      if (!card1 || !tCard) continue

      const r1 = rel(card1.getBoundingClientRect())
      const r2 = card2 ? rel(card2.getBoundingClientRect()) : null
      const rt = rel(tCard.getBoundingClientRect())

      const x1 = r1.right
      const y1 = r1.midY
      const x2 = r2 ? r2.right : x1
      const y2 = r2 ? r2.midY : y1
      const xt = rt.left
      const yt = rt.midY

      const bridgeX = (x1 + xt) / 2
      const bridgeY = r2 ? (y1 + y2) / 2 : y1

      const color = C_LINE

      const parts = [`M ${x1} ${y1} H ${bridgeX}`]
      if (r2) {
        parts.push(`M ${x2} ${y2} H ${bridgeX}`)
        parts.push(`M ${bridgeX} ${y1} V ${y2}`)
      }
      parts.push(`M ${bridgeX} ${bridgeY} H ${xt}`)

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', parts.join(' '))
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', color)
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
        c.setAttribute('r', '2.2')
        c.setAttribute('fill', color)
        svg.appendChild(c)
      })
    }
  })
}

onMounted(() => {
  loadCategories()

  window.addEventListener('resize', () => {
    requestAnimationFrame(drawConnectors)
  })
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
  background: linear-gradient(135deg, #f0f4f8 0%, #dde8f0 40%, #d4e8e0 100%);
  min-height: 100vh;
  color: #1a1a2e;
  overflow-x: auto;
}

.page {
  padding: 28px 32px 60px;
}

.group-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 1.1rem;
  font-weight: 700;
}

.group-label {
  color: #1a1a2e;
}

.group-weight {
  font-weight: 700;
  color: #c89b3c;
  font-size: 1.2rem;
}

.weight-categories-bar {
  padding: 1rem 2rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  display: flex;
  gap: 1rem;
}

.weight-categories-bar::-webkit-scrollbar {
  display: none;
}

.weight-tab {
  padding: 0.75rem 1.8rem;
  border-radius: 50px;
  background: white;
  border: none;
  color: #333;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: fit-content;
}

.weight-tab:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.weight-tab.active {
  background: #c89b3c;
  color: white;
}

#bracket-root {
  position: relative;
  display: inline-flex;
}

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
}

.round-col {
  display: flex;
  flex-direction: column;
}

.round-header {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9ca3af;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
  white-space: nowrap;
}

.round-body {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 12px;
}

.match-slot {
  display: flex;
  align-items: center;
  padding: 0 40px;
  position: relative;
}

.match-card {
  width: 240px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  flex-shrink: 0;
  transition: box-shadow 0.2s;
}

.match-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.13), 0 2px 6px rgba(0, 0, 0, 0.07);
}

.contestant {
  display: flex;
  align-items: center;
  padding: 10px 16px; /* увеличил горизонтальные отступы, т.к. убрали левый блок */
  position: relative;
  cursor: pointer;
  transition: background 0.15s;
}

.contestant:hover {
  background: #f5f5f5;
}

.blue-side {
  background-color: #3b82f6;
  color: #ffffff;
}

.blue-side:hover {
  background-color: #2563eb;
}

.blue-side .c-first {
  color: #bfdbfe;
}

.blue-side .c-name {
  color: #ffffff;
}

.contestant.winner::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 0 2px 2px 0;
  background: #c89b3c;
}

.contestant.loser .c-name-wrap {
  opacity: 0.45;
}

.contestant.loser .c-name {
  text-decoration: line-through;
  text-decoration-color: #9ca3af;
}

.blue-side.loser .c-name {
  text-decoration-color: #93c5fd;
}

.contestant.tbd .c-name-wrap {
  opacity: 0.35;
}

.contestant.tbd .c-name {
  font-style: italic;
  font-weight: 400;
}

.blue-side.tbd .c-name {
  color: #93c5fd;
}

.c-name-wrap {
  flex: 1;
  min-width: 0;
}

.c-first {
  font-size: 0.7rem;
  font-weight: 400;
  color: #6b7280;
  display: block;
}

.c-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.champion-col .round-header {
  padding: 0 40px;
}

.champion-body {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 40px;
}

.champion-card {
  width: 220px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.09), 0 0 0 2px rgba(232, 184, 75, 0.35);
}

.categories-loading,
.no-categories,
.bracket-loading,
.no-fights,
.placeholder {
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

@media (max-width: 700px) {
  .match-card {
    width: 200px;
  }
  .champion-card {
    width: 180px;
  }
  .page {
    padding: 18px 14px 40px;
  }
  .round-header,
  .match-slot,
  .champion-body {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>