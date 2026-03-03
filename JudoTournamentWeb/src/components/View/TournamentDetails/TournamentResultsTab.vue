<template>
  <div class="results-tab">

    <!-- ЗАГОЛОВОК -->
    <div class="results-header">
      <h2 class="results-title">Результаты турнира</h2>
      <div class="results-total" v-if="!loading && results.length > 0">
        Всего схваток: <strong>{{ total }}</strong>
      </div>
    </div>

    <!-- ВЫБОР КАТЕГОРИИ -->
    <div v-if="categories.length > 0" class="categories-bar">
      <button
          v-for="cat in categories"
          :key="cat.id"
          class="category-tab"
          :class="{ active: selectedCategory?.id === cat.id }"
          @click="selectCategory(cat)"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- ЗАГРУЗКА КАТЕГОРИЙ -->
    <div v-if="loadingCategories" class="results-loading">
      <div class="spinner"></div>
      <p>Загрузка категорий...</p>
    </div>

    <!-- ЗАГРУЗКА РЕЗУЛЬТАТОВ -->
    <div v-else-if="loading" class="results-loading">
      <div class="spinner"></div>
      <p>Загрузка результатов...</p>
    </div>

    <!-- ОШИБКА -->
    <div v-else-if="error" class="results-error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadResults">Повторить</button>
    </div>

    <!-- ПУСТО -->
    <div v-else-if="results.length === 0" class="results-empty">
      <div class="empty-icon">🏆</div>
      <h3>Результатов пока нет</h3>
      <p>Результаты появятся после завершения схваток</p>
    </div>

    <!-- КОНТЕНТ -->
    <div v-else class="results-content">

      <!-- ТАБЛИЦА -->
      <div class="results-table-wrapper">
        <table class="results-table">
          <thead>
          <tr>
            <th class="th-num">#</th>
            <th class="th-fight">Схватка</th>
            <th class="th-winner">Победитель</th>
            <th class="th-type">Тип победы</th>
            <th class="th-time">Время</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="(result, index) in results"
              :key="result.id"
              class="result-row"
          >
            <td class="td-num">{{ index + 1 }}</td>
            <td class="td-fight">
              <span class="fight-badge">№ {{ result.fight_id }}</span>
            </td>
            <td class="td-winner">
              <div class="winner-info">
                <div class="winner-avatar">
                  {{ getInitials(result.winner_name) }}
                </div>
                <div class="winner-name">
                  <span class="winner-last">{{ result.winner_name.last_name }}</span>
                  <span class="winner-first">
                      {{ result.winner_name.first_name }} {{ result.winner_name.middle_name }}
                    </span>
                </div>
              </div>
            </td>
            <td class="td-type">
                <span class="victory-badge" :class="getVictoryClass(result.victory_type)">
                  {{ result.victory_type }}
                </span>
            </td>
            <td class="td-time">
              <div class="time-display">
                <svg class="time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ formatDuration(result.fight_duration) }}
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchGetCategoryByTournament, getResultTournament } from '@/components/View/Brackets/fetchBrackets.js'

const route = useRoute()
const tournament = inject('tournament')
const tournamentId = computed(() => tournament?.value?.id || Number(route.params.id))

const categories = ref([])
const selectedCategory = ref(null)
const loadingCategories = ref(false)

const results = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

const victoryStats = computed(() => {
  const stats = {}
  for (const r of results.value) {
    stats[r.victory_type] = (stats[r.victory_type] || 0) + 1
  }
  return stats
})

const loadCategories = async () => {
  if (!tournamentId.value) return
  loadingCategories.value = true
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
    loadingCategories.value = false
  }
}

const loadResults = async () => {
  if (!tournamentId.value) return
  loading.value = true
  error.value = ''
  try {
    const catId = selectedCategory.value?.id || null
    const data = await getResultTournament(tournamentId.value, catId)
    if (data.success) {
      results.value = data.results || []
      total.value = data.total || 0
    } else {
      throw new Error(data.message || 'Ошибка загрузки результатов')
    }
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить результаты'
  } finally {
    loading.value = false
  }
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
}

// При смене категории — перезагружаем результаты
watch(selectedCategory, () => {
  loadResults()
})

const getInitials = (name) => {
  if (!name) return '??'
  const l = name.last_name?.[0] || ''
  const f = name.first_name?.[0] || ''
  return (l + f).toUpperCase() || '??'
}

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const getVictoryClass = (type) => {
  if (!type) return 'type-default'
  const t = type.toLowerCase()
  if (t.includes('ипон') || t.includes('ippon')) return 'type-ippon'
  if (t.includes('ваза') || t.includes('waza')) return 'type-wazaari'
  if (t.includes('хансоку') || t.includes('hansoku')) return 'type-hansoku'
  if (t.includes('кэйкоку') || t.includes('keikoku')) return 'type-keikoku'
  if (t.includes('судейск') || t.includes('решени')) return 'type-decision'
  return 'type-default'
}

const getVictoryShort = (type) => {
  if (!type) return '?'
  const t = type.toLowerCase()
  if (t.includes('ипон')) return 'И'
  if (t.includes('ваза')) return 'В'
  if (t.includes('хансоку')) return 'Х'
  if (t.includes('кэйкоку')) return 'К'
  if (t.includes('судейск') || t.includes('решени')) return 'С'
  return type[0].toUpperCase()
}

onMounted(async () => {
  await loadCategories()
  // loadResults вызовется через watch(selectedCategory) после loadCategories
  // но если категорий нет — вызываем вручную
  if (!categories.value.length) {
    await loadResults()
  }
})
</script>

<style scoped>
.results-tab {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.results-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.results-total {
  font-size: 1rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

/* КАТЕГОРИИ */
.categories-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 0.25rem;
}

.categories-bar::-webkit-scrollbar { display: none; }

.category-tab {
  padding: 0.5rem 1.3rem;
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

.category-tab:hover { border-color: #c89b3c; color: #c89b3c; }
.category-tab.active {
  background: #c89b3c;
  border-color: #c89b3c;
  color: #fff;
  box-shadow: 0 4px 12px rgba(200,155,60,0.3);
}

/* ЗАГРУЗКА */
.results-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  color: #666;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #c89b3c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.results-error { text-align: center; padding: 3rem; color: #666; }
.error-icon { font-size: 3rem; margin-bottom: 1rem; }

.retry-btn {
  margin-top: 1rem;
  background: #c89b3c;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.results-empty { text-align: center; padding: 4rem 2rem; color: #999; }
.empty-icon { font-size: 4rem; margin-bottom: 1rem; }
.results-empty h3 { color: #444; margin: 0 0 0.5rem; }

/* СТАТИСТИКА */
.victory-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.victory-stat-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.victory-stat-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: white;
  flex-shrink: 0;
}

.victory-stat-count { font-size: 1.4rem; font-weight: 700; color: #1a1a1a; line-height: 1; }
.victory-stat-label { font-size: 0.8rem; color: #666; max-width: 120px; }

/* ТАБЛИЦА */
.results-table-wrapper {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.results-table { width: 100%; border-collapse: collapse; }
.results-table thead tr { background: #f8f9fa; }

.results-table th {
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #555;
  border-bottom: 1px solid #e8e8e8;
}

.results-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: middle;
}

.result-row:last-child td { border-bottom: none; }
.result-row:hover { background: #fafafa; }
.th-num, .td-num { width: 50px; color: #999; font-weight: 600; }

.fight-badge {
  display: inline-block;
  background: #f0f0f0;
  color: #555;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
}

.winner-info { display: flex; align-items: center; gap: 0.75rem; }

.winner-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.winner-name { display: flex; flex-direction: column; gap: 0.15rem; }
.winner-last { font-weight: 600; color: #1a1a1a; font-size: 0.95rem; }
.winner-first { font-size: 0.82rem; color: #777; }

.victory-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}

.time-display { display: flex; align-items: center; gap: 0.4rem; color: #555; font-weight: 600; font-size: 0.9rem; }
.time-icon { width: 16px; height: 16px; color: #999; flex-shrink: 0; }

/* ЦВЕТА ТИПОВ ПОБЕД */
.type-ippon    { background: #fef3cd; color: #856404; }
.type-wazaari  { background: #d1ecf1; color: #0c5460; }
.type-hansoku  { background: #f8d7da; color: #721c24; }
.type-keikoku  { background: #ffe5d0; color: #7d3c00; }
.type-decision { background: #e2e3ff; color: #3f51b5; }
.type-default  { background: #e9ecef; color: #495057; }

@media (max-width: 768px) {
  .results-tab { padding: 1rem; }
  .results-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .results-table th, .results-table td { padding: 0.75rem 1rem; }
  .th-time, .td-time { display: none; }
}
</style>