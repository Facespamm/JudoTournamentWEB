<template>
    <div class="bracket-detail-container">
        <!-- Состояние загрузки -->
        <div v-if="loading" class="loading-state">
            Загрузка сетки...
        </div>

        <!-- Состояние ошибки -->
        <div v-else-if="error" class="error-state">
            {{ error }}
        </div>

        <!-- Основной контент — только при успешных данных -->
        <div v-else-if="bracketData && bracketData.success && bracketData.fights" class="bracket-detail" ref="containerRef">
            <div class="header">
                <h1>{{ bracketData.tournament_name }}</h1>
                <h2>{{ bracketData.category.name }}</h2>
                <p class="weight-range">{{ bracketData.category.weight_range }}</p>
            </div>

            <div class="bracket-wrapper" :style="{ height: bracketHeight + 'px' }">
            <div class="rounds">
                <div v-for="roundNum in rounds" :key="roundNum" class="round">
                <h3 class="round-title">{{ getRoundTitle(roundNum) }}</h3>

                <div class="match-list">
                    <div
                        v-for="fight in getFightsForRound(roundNum)"
                    :key="fight.id"
                    class="match"
                    :ref="el => setMatchRef(fight.id, el)"
                    >
                    <div class="participant white">
                        {{ getAthleteName(fight.white_athlete) || 'Ожидается победитель' }}
                    </div>

                    <div class="vs">VS</div>

                    <div class="participant blue">
                        {{ getAthleteName(fight.blue_athlete) || 'Ожидается победитель' }}
                    </div>

                    <div class="fight-info">
                        <span v-if="fight.tatami_number">Татами {{ fight.tatami_number }}</span>
                        <span class="status">{{ getFightStatusText(fight.status_fight) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <svg class="connectors" xmlns="http://www.w3.org/2000/svg">
        <line
            v-for="line in lines"
        :key="line.key"
        :x1="line.x1"
        :y1="line.y1"
        :x2="line.x2"
        :y2="line.y2"
        stroke="#aaa"
        stroke-width="3"
        />
    </svg>
</div>
</div>

<!-- Если данных нет -->
<div v-else class="empty-state">
    Сетка не найдена или данные недоступны
</div>
</div>
</template>

<script setup>
    import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

    const props = defineProps({
    bracketData: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    error: { type: String, default: null }
})

    const containerRef = ref(null)
    const matchRefs = ref({})
    const positions = ref({})
    const lines = ref([])

    const setMatchRef = (id, el) => {
    if (el) matchRefs.value[id] = el
    else delete matchRefs.value[id]
}

    const roundFights = computed(() => {
    if (!props.bracketData?.fights) return {}

    const groups = {}
    props.bracketData.fights.forEach(fight => {
    const r = fight.round
    if (!groups[r]) groups[r] = []
    groups[r].push(fight)
})

    Object.keys(groups).forEach(r => {
    groups[r].sort((a, b) => a.id - b.id)
})

    return groups
})

    const rounds = computed(() => {
    return Object.keys(roundFights.value)
    .map(Number)
    .sort((a, b) => a - b)
})

    const getFightsForRound = roundNum => roundFights.value[roundNum] || []

    const numLeafMatches = computed(() => {
    const firstRound = rounds.value[0]
    return roundFights.value[firstRound]?.length || 1
})

    const bracketHeight = computed(() => numLeafMatches.value * 220 + 300)

    const getAthleteName = athlete => {
    if (!athlete) return null
    return `${athlete.last_name} ${athlete.first_name} ${athlete.middle_name || ''}`.trim()
}

    const getRoundTitle = roundNum => {
    const maxRound = rounds.value[rounds.value.length - 1]
    const matchesInRound = getFightsForRound(roundNum).length

    if (roundNum === maxRound || matchesInRound === 1) return 'Финал'
    if (matchesInRound === 2) return 'Полуфинал'
    if (matchesInRound === 4) return 'Четвертьфинал'
    return `Раунд ${roundNum}`
}

    const getFightStatusText = status => ({
    SCHEDULED: 'Запланирован',
    IN_PROGRESS: 'Идёт',
    COMPLETED: 'Завершён'
}[status] || status)

    // Расчёт соединительных линий
    const calculateLines = async () => {
    if (!props.bracketData?.fights) return
    await nextTick()

    if (!containerRef.value) return

    const containerRect = containerRef.value.getBoundingClientRect()

    positions.value = {}
    Object.entries(matchRefs.value).forEach(([id, el]) => {
    if (el) {
    const rect = el.getBoundingClientRect()
    positions.value[id] = {
    centerX: rect.left - containerRect.left + rect.width / 2,
    centerY: rect.top - containerRect.top + rect.height / 2,
    width: rect.width
}
}
})

    lines.value = []
    let keyIndex = 0

    props.bracketData.fights.forEach(fight => {
    if (!fight.next_fight) return

    const from = positions.value[fight.id]
    const to = positions.value[fight.next_fight]
    if (!from || !to) return

    const offset = 30
    const fromRight = from.centerX + from.width / 2 + offset
    const toLeft = to.centerX - to.width / 2 - offset
    const midX = (fromRight + toLeft) / 2

    lines.value.push({ x1: fromRight, y1: from.centerY, x2: midX, y2: from.centerY, key: keyIndex++ })
    lines.value.push({ x1: midX, y1: from.centerY, x2: midX, y2: to.centerY, key: keyIndex++ })
    lines.value.push({ x1: midX, y1: to.centerY, x2: toLeft, y2: to.centerY, key: keyIndex++ })
})
}

    onMounted(() => {
    calculateLines()
    window.addEventListener('resize', calculateLines)
})

    onUnmounted(() => {
    window.removeEventListener('resize', calculateLines)
})

    watch(() => props.bracketData, calculateLines, { deep: true })
</script>

<style scoped>
    .bracket-detail-container {
    padding: 32px;
    max-width: 1600px;
    margin: 0 auto;
}

    .loading-state, .error-state, .empty-state {
    text-align: center;
    padding: 60px 20px;
    font-size: 1.2em;
    color: #666;
}

    .error-state { color: #dc3545; }

    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { font-size: 2em; margin-bottom: 8px; }
    .header h2 { font-size: 1.5em; color: #e67e22; margin-bottom: 8px; }
    .weight-range { color: #666; font-size: 1.1em; }

    .bracket-wrapper {
    position: relative;
    background: #f8f9fa;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

    .rounds { display: flex; height: 100%; align-items: stretch; }
    .round { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 40px 20px 20px; }
    .round-title { margin-bottom: 30px; font-weight: 600; color: #333; font-size: 1.3em; }

    .match-list { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }

    .match {
    background: white;
    border-radius: 12px;
    padding: 16px;
    width: 300px;
    margin: 0 auto;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    text-align: center;
}

    .participant { font-size: 1.1em; font-weight: 600; padding: 8px 0; }
    .white { color: #2c3e50; }
    .blue { color: #0069d9; }
    .vs { font-weight: bold; color: #dc3545; margin: 12px 0; font-size: 1.2em; }

    .fight-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
    color: #666;
    margin-top: 12px;
    border-top: 1px solid #eee;
    padding-top: 8px;
}

    .connectors {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
}
</style>