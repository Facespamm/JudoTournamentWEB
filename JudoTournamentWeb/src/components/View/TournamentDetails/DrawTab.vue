<template>
  <div class="tournament-bracket">
    <div class="page">
      <div class="group-section">
        <span class="group-label">ГРУППА</span>
        <span class="group-letter">{{ groupLetter }}</span>
        <span class="group-weight">{{ groupWeight }}</span>
      </div>

      <div id="bracket-root" ref="bracketRoot">
        <div class="rounds-row">
          <!-- Rounds -->
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
                  <!-- Contestant 1 -->
                  <div
                      :class="[
                      'contestant',
                      { winner: match.winner === match.p1 && match.p1 },
                      { loser: match.winner !== null && match.winner !== match.p1 && match.p1 },
                      { tbd: !match.p1 }
                    ]"
                  >
                    <div class="c-country">{{ getContestant(match.p1)?.country || '—' }}</div>
                    <div class="c-name-wrap">
                      <span v-if="getContestant(match.p1)" class="c-first">{{ getContestant(match.p1).first }}</span>
                      <span class="c-name">{{ getContestant(match.p1)?.last || 'TBD' }}</span>
                    </div>
                  </div>

                  <!-- Contestant 2 -->
                  <div
                      :class="[
                      'contestant',
                      { winner: match.winner === match.p2 && match.p2 },
                      { loser: match.winner !== null && match.winner !== match.p2 && match.p2 },
                      { tbd: !match.p2 }
                    ]"
                  >
                    <div class="c-country">{{ getContestant(match.p2)?.country || '—' }}</div>
                    <div class="c-name-wrap">
                      <span v-if="getContestant(match.p2)" class="c-first">{{ getContestant(match.p2).first }}</span>
                      <span class="c-name">{{ getContestant(match.p2)?.last || 'TBD' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Champion column -->
          <div class="round-col champion-col">
            <div class="round-header">Final</div>
            <div class="champion-body">
              <div class="match-card champion-card">
                <div v-if="championContestant" class="contestant winner">
                  <div class="c-country">{{ championContestant.country }}</div>
                  <div class="c-name-wrap">
                    <span class="c-first">{{ championContestant.first }}</span>
                    <span class="c-name">{{ championContestant.last }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG connector lines -->
        <svg ref="connectorSvg" id="connector-svg" width="1" height="1"></svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
// ══════════════════════════════════════════════════════
//  PROPS
// ══════════════════════════════════════════════════════
const props = defineProps({
  groupLetter: {
    type: String,
    default: 'A'
  },
  groupWeight: {
    type: String,
    default: '−66 kg'
  }
})

// ══════════════════════════════════════════════════════
//  REFS
// ══════════════════════════════════════════════════════
const bracketRoot = ref(null)
const connectorSvg = ref(null)

// ══════════════════════════════════════════════════════
//  MOCK DATA
// ══════════════════════════════════════════════════════
const contestants = ref([
  { id: 1, country: 'GEO', first: 'Vazha', last: 'MARGVELASHVILI' },
  { id: 2, country: 'FRA', first: 'Romaric Wend-Yam', last: 'BOUDA' },
  { id: 3, country: 'USA', first: 'Isaiah', last: 'RAMIREZ' },
  { id: 4, country: 'CAN', first: 'Julien', last: 'FRASCADORE' },
  { id: 5, country: 'MGL', first: 'Kherlen', last: 'GANBOLD' },
  { id: 6, country: 'AZE', first: 'Rashad', last: 'YELKIYEV' },
  { id: 7, country: 'MNE', first: 'Jusuf', last: 'NURKOVIC' }
])

const rounds = ref([
  {
    label: 'Elimination Round',
    matches: [
      { p1: 1, p2: 2, winner: 1, score: [null, null] },
      { p1: 3, p2: 4, winner: 4, score: [null, null] },
      { p1: 5, p2: 6, winner: 5, score: [null, null] },
      { p1: 7, p2: null, winner: 7, score: [null, null] }
    ]
  },
  {
    label: 'Quarter-Finals',
    matches: [
      { p1: 1, p2: 4, winner: 1, score: [null, null] },
      { p1: 5, p2: 7, winner: 5, score: [null, null] }
    ]
  },
  {
    label: 'Semi-Finals',
    matches: [
      { p1: 1, p2: 5, winner: null, score: [null, null] }
    ]
  }
])

const championId = ref(1)

// ══════════════════════════════════════════════════════
//  COMPUTED
// ══════════════════════════════════════════════════════
const championContestant = computed(() => {
  return contestants.value.find(c => c.id === championId.value)
})

// ══════════════════════════════════════════════════════
//  METHODS
// ══════════════════════════════════════════════════════
const getContestant = (id) => {
  if (!id) return null
  return contestants.value.find(c => c.id === id)
}

// ══════════════════════════════════════════════════════
//  DRAW CONNECTOR LINES
// ══════════════════════════════════════════════════════
const drawConnectors = () => {
  if (!bracketRoot.value || !connectorSvg.value) return

  const root = bracketRoot.value
  const svg = connectorSvg.value
  const rRect = root.getBoundingClientRect()

  svg.setAttribute('width', root.offsetWidth)
  svg.setAttribute('height', root.offsetHeight)

  // Clear old paths
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild)
  }

  const C_LINE = '#d1d5db'
  const C_LIVE = '#e8b84b'
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

      // Determine if live match
      const nextRound = rounds.value[ri + 1]
      const matchAtTgt = nextRound ? nextRound.matches[pi] : null
      const isLive = matchAtTgt && matchAtTgt.winner === null
      const color = isLive ? C_LIVE : C_LINE

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

      // Junction dots
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

// ══════════════════════════════════════════════════════
//  LIFECYCLE
// ══════════════════════════════════════════════════════
onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(drawConnectors)
    })
  })

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

/* ── Page ── */
.page {
  padding: 28px 32px 60px;
}

/* ── Group category section ── */
.group-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  font-size: 1rem;
  font-weight: 700;
}

.group-label {
  color: #1a1a2e;
}

.group-letter {
  background: #1a1a2e;
  color: #fff;
  font-weight: 800;
  font-size: 0.85rem;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-weight {
  font-weight: 400;
  color: #6b7280;
  font-size: 0.9rem;
}

/* ── Root ── */
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
  padding: 0 52px;
  white-space: nowrap;
}

.round-body {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 16px; /* Вертикальный отступ между матчами */
}

/* ── Match slot ── */
.match-slot {
  display: flex;
  align-items: center;
  padding: 0 52px;
  position: relative;
}

/* ── Match card ── */
.match-card {
  width: 300px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  flex-shrink: 0;
  transition: box-shadow 0.2s;
}

.match-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.13), 0 2px 6px rgba(0, 0, 0, 0.07);
}

/* ── Contestant row ── */
.contestant {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  position: relative;
  cursor: pointer;
  transition: background 0.15s;
}

.contestant + .contestant {
  border-top: 1px solid #f3f4f6;
}

.contestant:hover {
  background: #fafafa;
}

/* Blue winner stripe */
.contestant.winner::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: #3b82f6;
}

.contestant.loser .c-name-wrap {
  opacity: 0.45;
}

.contestant.loser .c-name {
  text-decoration: line-through;
  text-decoration-color: #9ca3af;
}

.contestant.tbd .c-name-wrap {
  opacity: 0.35;
}

/* Country code vertical */
.c-country {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #9ca3af;
  width: 14px;
  flex-shrink: 0;
  text-align: center;
}

/* Name */
.c-name-wrap {
  flex: 1;
  min-width: 0;
}

.c-first {
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
  display: block;
}

.c-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #111827;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contestant.tbd .c-name {
  font-style: italic;
  font-weight: 400;
  color: #9ca3af;
}

/* ── Champion column ── */
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
  width: 260px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.09), 0 0 0 2px rgba(232, 184, 75, 0.35);
}

/* ── Responsive ── */
@media (max-width: 700px) {
  .match-card {
    width: 230px;
  }
  .page {
    padding: 18px 14px 40px;
  }
}
</style>