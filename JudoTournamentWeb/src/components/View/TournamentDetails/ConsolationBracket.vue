<template>
  <div class="page">

    <!-- Вкладки полуфиналисты / финалисты -->
    <div class="consolation-tabs">
      <button class="consolation-tab" :class="{ active: consolationTab === 'semifinalists' }" @click="consolationTab = 'semifinalists'">
        Полуфиналисты
      </button>
      <button class="consolation-tab" :class="{ active: consolationTab === 'finalists' }" @click="consolationTab = 'finalists'">
        Финалисты
      </button>
    </div>

    <div v-if="isLoading" class="bracket-loading">
      <div class="spinner"></div>
      <p>Загрузка утешительных боёв...</p>
    </div>

    <div v-else-if="!groupA.length && !groupB.length" class="no-fights">
      <p>Утешительные бои ещё не сформированы</p>
    </div>

    <div v-else class="groups-wrapper">

      <!-- Группа A -->
      <div class="group-outer">
        <div class="group-label-title">Группа A</div>
        <div class="bracket-root" ref="rootA">
          <div class="rounds-row">
            <div v-for="(round, ri) in roundsA" :key="'a'+ri" class="round-col">
              <div class="round-header">{{ ri === roundsA.length - 1 ? 'Бронза' : `Раунд ${ri + 1}` }}</div>
              <div class="round-body">
                <div v-for="(fight, fi) in round" :key="fi" class="match-slot">
                  <div :class="['match-card', { 'card-done': fight.result }]">

                    <!-- Белый угол -->
                    <div :class="['contestant', { tbd: !fight.white_athlete, loser: fight.result && fight.result.winner_id !== fight.white_athlete?.id && fight.white_athlete }]">
                      <div class="c-name-wrap">
                        <span v-if="fight.white_athlete" class="c-first">{{ fight.white_athlete.first_name }}</span>
                        <span class="c-name">{{ fight.white_athlete ? fight.white_athlete.last_name.toUpperCase() : 'TBD' }}</span>
                      </div>
                    </div>

                    <!-- Синий угол -->
                    <div :class="['contestant', 'blue-side', { tbd: !fight.blue_athlete, loser: fight.result && fight.result.winner_id !== fight.blue_athlete?.id && fight.blue_athlete }]">
                      <div class="c-name-wrap">
                        <span v-if="fight.blue_athlete" class="c-first">{{ fight.blue_athlete.first_name }}</span>
                        <span class="c-name">{{ fight.blue_athlete ? fight.blue_athlete.last_name.toUpperCase() : 'TBD' }}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Бронза колонка -->
            <div class="round-col bronze-col">
              <div class="round-header">🥉</div>
              <div class="champion-body">
                <div class="match-slot">
                  <div class="match-card champion-card">
                    <div :class="['contestant', bronzeWinnerA ? '' : 'tbd']">
                      <div class="c-name-wrap">
                        <span v-if="bronzeWinnerA" class="c-first">{{ bronzeWinnerA.first_name }}</span>
                        <span class="c-name">{{ bronzeWinnerA ? bronzeWinnerA.last_name.toUpperCase() : 'TBD' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <svg class="connector-svg" ref="svgA" width="1" height="1"></svg>
        </div>
      </div>

      <!-- Группа B -->
      <div class="group-outer">
        <div class="group-label-title">Группа B</div>
        <div class="bracket-root" ref="rootB">
          <div class="rounds-row">
            <div v-for="(round, ri) in roundsB" :key="'b'+ri" class="round-col">
              <div class="round-header">{{ ri === roundsB.length - 1 ? 'Бронза' : `Раунд ${ri + 1}` }}</div>
              <div class="round-body">
                <div v-for="(fight, fi) in round" :key="fi" class="match-slot">
                  <div :class="['match-card', { 'card-done': fight.result }]">

                    <!-- Белый угол -->
                    <div :class="['contestant', { tbd: !fight.white_athlete, loser: fight.result && fight.result.winner_id !== fight.white_athlete?.id && fight.white_athlete }]">
                      <div class="c-name-wrap">
                        <span v-if="fight.white_athlete" class="c-first">{{ fight.white_athlete.first_name }}</span>
                        <span class="c-name">{{ fight.white_athlete ? fight.white_athlete.last_name.toUpperCase() : 'TBD' }}</span>
                      </div>
                    </div>

                    <!-- Синий угол -->
                    <div :class="['contestant', 'blue-side', { tbd: !fight.blue_athlete, loser: fight.result && fight.result.winner_id !== fight.blue_athlete?.id && fight.blue_athlete }]">
                      <div class="c-name-wrap">
                        <span v-if="fight.blue_athlete" class="c-first">{{ fight.blue_athlete.first_name }}</span>
                        <span class="c-name">{{ fight.blue_athlete ? fight.blue_athlete.last_name.toUpperCase() : 'TBD' }}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Бронза колонка -->
            <div class="round-col bronze-col">
              <div class="round-header">🥉</div>
              <div class="champion-body">
                <div class="match-slot">
                  <div class="match-card champion-card">
                    <div :class="['contestant', bronzeWinnerB ? '' : 'tbd']">
                      <div class="c-name-wrap">
                        <span v-if="bronzeWinnerB" class="c-first">{{ bronzeWinnerB.first_name }}</span>
                        <span class="c-name">{{ bronzeWinnerB ? bronzeWinnerB.last_name.toUpperCase() : 'TBD' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <svg class="connector-svg" ref="svgB" width="1" height="1"></svg>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { getSemifinalists, getFinalists } from '@/components/View/Brackets/fetchBrackets.js'

const props = defineProps({
  tournamentId: { type: Number, required: true },
  categoryId:   { type: Number, required: true },
})

const consolationTab = ref('semifinalists')
const isLoading      = ref(false)
const groupA         = ref([])
const groupB         = ref([])

const rootA = ref(null)
const rootB = ref(null)
const svgA  = ref(null)
const svgB  = ref(null)

// ← Сортировка по id вместо fight_number
const buildRounds = (fights) => {
  if (!fights.length) return []
  const max = Math.max(...fights.map(f => f.round))
  const rounds = []
  for (let r = 1; r <= max; r++) {
    rounds.push(
        fights
            .filter(f => f.round === r)
            .sort((a, b) => a.id - b.id)
    )
  }
  return rounds
}

const roundsA = computed(() => buildRounds(groupA.value))
const roundsB = computed(() => buildRounds(groupB.value))

// ← Сортировка по id для корректного определения последнего боя
const getBronzeWinner = (fights) => {
  if (!fights.length) return null
  const maxRound = Math.max(...fights.map(f => f.round))
  const finalFights = fights
      .filter(f => f.round === maxRound)
      .sort((a, b) => a.id - b.id)
  if (!finalFights.length) return null
  const lastFight = finalFights[finalFights.length - 1]
  if (!lastFight.result) return null
  const winnerId = lastFight.result.winner_id
  if (lastFight.white_athlete?.id === winnerId) return lastFight.white_athlete
  if (lastFight.blue_athlete?.id === winnerId)  return lastFight.blue_athlete
  return null
}

const bronzeWinnerA = computed(() => getBronzeWinner(groupA.value))
const bronzeWinnerB = computed(() => getBronzeWinner(groupB.value))

// ===== SVG коннекторы =====
const drawConnectors = (root, svg) => {
  if (!root || !svg) return
  const rRect = root.getBoundingClientRect()
  svg.setAttribute('width',  root.offsetWidth)
  svg.setAttribute('height', root.offsetHeight)
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  const C_LINE = '#d4aa5a'
  const SW = 1.5

  const rel = (r) => ({
    right: r.right - rRect.left,
    left:  r.left  - rRect.left,
    midY:  r.top + r.height / 2 - rRect.top,
  })

  const cols = Array.from(root.querySelectorAll('.round-col'))
  cols.forEach((col, ri) => {
    const tgtCol = cols[ri + 1]
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
      const card2 = slot2 ? slot2.querySelector('.match-card') : null
      const tCard = tSlot.querySelector('.match-card')
      if (!card1 || !tCard) continue

      const r1 = rel(card1.getBoundingClientRect())
      const r2 = card2 ? rel(card2.getBoundingClientRect()) : null
      const rt = rel(tCard.getBoundingClientRect())

      const x1 = r1.right, y1 = r1.midY
      const x2 = r2 ? r2.right : x1
      const y2 = r2 ? r2.midY  : y1
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
        c.setAttribute('cx', cx); c.setAttribute('cy', cy)
        c.setAttribute('r', '2.5'); c.setAttribute('fill', C_LINE)
        svg.appendChild(c)
      })
    }
  })
}

const redraw = () => {
  nextTick(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      drawConnectors(rootA.value, svgA.value)
      drawConnectors(rootB.value, svgB.value)
    }))
  })
}

const loadData = async () => {
  isLoading.value = true
  groupA.value = []
  groupB.value = []
  try {
    if (consolationTab.value === 'semifinalists') {
      const data = await getSemifinalists(props.tournamentId, props.categoryId)
      groupA.value = data.groups?.A?.fights || []
      groupB.value = data.groups?.B?.fights || []
    } else {
      const data = await getFinalists(props.tournamentId, props.categoryId)
      groupA.value = data.group_A || []
      groupB.value = data.group_B || []
    }
  } catch (err) {
    console.error('Ошибка загрузки утешительных:', err)
  } finally {
    isLoading.value = false
    redraw()
  }
}

watch([consolationTab, () => props.categoryId], loadData)
watch([roundsA, roundsB], redraw, { deep: true })
onMounted(() => {
  loadData()
  window.addEventListener('resize', redraw)
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.page { padding: 12px 0 32px; }

.consolation-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.consolation-tab {
  padding: 0.5rem 1.3rem; border-radius: 50px; background: #fff;
  border: 1.5px solid #e5e7eb; color: #374151; font-weight: 600;
  font-size: 0.875rem; cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
}
.consolation-tab:hover { border-color: #c89b3c; color: #c89b3c; }
.consolation-tab.active {
  background: #c89b3c; border-color: #c89b3c; color: #fff;
  box-shadow: 0 4px 12px rgba(200,155,60,0.3);
}

.groups-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
@media (max-width: 900px) { .groups-wrapper { grid-template-columns: 1fr; } }

.group-label-title {
  font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: #c89b3c; margin-bottom: 8px;
}

.bracket-root {
  position: relative; width: 100%; min-height: 200px;
  background: #ffffff; border: 2px solid #e0b456; border-radius: 14px;
  box-shadow: 0 0 0 1px rgba(224,180,86,0.10), 0 6px 32px rgba(200,155,60,0.09), inset 0 1px 0 rgba(255,255,255,0.9);
  overflow-x: auto; overflow-y: visible; padding: 20px 16px 28px;
  scrollbar-width: thin; scrollbar-color: #e0b456 #fafafa;
}
.bracket-root::-webkit-scrollbar { height: 5px; }
.bracket-root::-webkit-scrollbar-track { background: #fafafa; border-radius: 3px; }
.bracket-root::-webkit-scrollbar-thumb { background: #e0b456; border-radius: 3px; }

.connector-svg { position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible; }

.rounds-row { display: flex; align-items: stretch; justify-content: space-evenly; min-width: 100%; }

.round-col { display: flex; flex-direction: column; flex: 1; min-width: 0; }

.round-header {
  font-size: 0.58rem; font-weight: 800; letter-spacing: 0.12em;
  text-transform: uppercase; color: #c89b3c; height: 28px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 8px; white-space: nowrap;
  border-bottom: 1px solid rgba(224,180,86,0.25); margin-bottom: 16px;
}
.bronze-col .round-header { font-size: 1rem; letter-spacing: 0; }

.round-body { display: flex; flex-direction: column; justify-content: space-around; flex: 1; gap: 8px; }

.champion-body { display: flex; flex-direction: column; justify-content: center; flex: 1; padding: 0 12px; }

.match-slot { display: flex; align-items: center; justify-content: center; padding: 0 12px; position: relative; }

.match-card {
  width: 172px; background: #fff; border-radius: 8px;
  border: 1px solid #e9ecef; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden; flex-shrink: 0; transition: border-color 0.2s, box-shadow 0.2s;
}
.match-card:hover { border-color: #e0b456; box-shadow: 0 3px 14px rgba(200,155,60,0.18); }
.match-card.card-done { border-color: #d1d5db; }

.champion-card {
  width: 172px; border: 2px solid #c89b3c;
  box-shadow: 0 2px 18px rgba(200,155,60,0.22);
  background: linear-gradient(135deg, #fffdf5 0%, #fef9e4 100%);
}

.contestant {
  display: flex; align-items: center; padding: 6px 9px;
  position: relative; cursor: pointer; transition: background 0.12s; min-height: 32px;
}
.contestant:not(:last-child) { border-bottom: 1px solid #f0f0f0; }
.contestant:hover { background: #fdfcf8; }

.contestant.loser .c-name  { color: #9ca3af; }
.contestant.loser .c-first { color: #c4c9d1; }
.blue-side.loser .c-name   { color: #93c5fd; opacity: 0.5; }
.blue-side.loser .c-first  { opacity: 0.4; }

.blue-side { background-color: #2563eb; }
.blue-side:hover { background-color: #1d4ed8; }
.blue-side .c-first { color: #93c5fd; }
.blue-side .c-name  { color: #fff; }

.contestant.tbd .c-name-wrap { opacity: 0.28; }
.contestant.tbd .c-name { font-style: italic; font-weight: 400; }
.blue-side.tbd .c-name { color: #bfdbfe; }

.c-name-wrap { flex: 1; min-width: 0; text-align: left; }
.c-first { font-size: 0.58rem; font-weight: 400; color: #9ca3af; display: block; line-height: 1; margin-bottom: 1px; }
.c-name { font-size: 0.76rem; font-weight: 700; color: #111827; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }

.bracket-loading, .no-fights { text-align: center; padding: 3rem 2rem; color: #9ca3af; font-size: 0.9rem; }

.spinner {
  width: 34px; height: 34px; border: 3px solid #f3f3f3;
  border-top: 3px solid #c89b3c; border-radius: 50%;
  animation: spin 0.85s linear infinite; margin: 0 auto 0.75rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 700px) {
  .match-card { width: 140px; }
  .bracket-root { padding: 14px 6px 20px; border-radius: 10px; }
  .match-slot { padding-left: 6px; padding-right: 6px; }
}
</style>