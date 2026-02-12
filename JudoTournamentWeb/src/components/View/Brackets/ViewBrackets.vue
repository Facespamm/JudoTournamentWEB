<template>
  <div class="brackets-view">
    <h3>Турнирные сетки</h3>

    <div class="view-controls">
      <!-- Турнир -->
      <div class="filter-group">
        <label for="tournament_filter">Турнир:</label>
        <select v-model="selectedTournamentId" id="tournament_filter" @change="onTournamentChange">
          <option :value="null">Выберите турнир</option>
          <option v-for="t in tournaments" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>

      <!-- Категория -->
      <div class="filter-group" v-if="selectedTournamentId">
        <label for="category_filter">Категория:</label>
        <select v-model="selectedCategoryId" id="category_filter">
          <option :value="null">Выберите категорию</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }} ({{ c.gender === 'MALE' ? 'М' : 'Ж' }})
          </option>
        </select>
      </div>
    </div>

    <!-- Лоадер -->
    <div v-if="loading" class="loading">Загрузка сетки...</div>

    <!-- Детальная сетка -->
    <div v-else-if="bracketData && bracketData.success && bracketData.fights">
      <BracketDetail :bracket-data="bracketData" />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="selectedTournamentId && selectedCategoryId" class="empty-state">
      <h4>Сетка не сгенерирована</h4>
      <p>Для выбранной категории бои ещё не созданы</p>
    </div>

    <div v-else class="empty-state">
      <h4>Выберите турнир и категорию</h4>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { fetchBrackets } from '@/components/View/Brackets/fetchBrackets.js'
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import BracketDetail from '@/components/View/Brackets/BracketDetail.vue'

const props = defineProps({
  tournaments: { type: Array, default: () => [] }
})

const bracketData = ref(null)
const categories = ref([])
const loading = ref(false)

const selectedTournamentId = ref(null)
const selectedCategoryId = ref(null)

// Сброс и загрузка категорий при смене турнира
const onTournamentChange = async () => {
  selectedCategoryId.value = null
  bracketData.value = null
  categories.value = []

  if (!selectedTournamentId.value) return

  const res = await fetchCategories(selectedTournamentId.value)
  if (res.success) {
    categories.value = res.categories || res.data?.categories || []
  }
}

// Загрузка сетки при выборе категории
watch(selectedCategoryId, async (newVal) => {
  bracketData.value = null

  if (!selectedTournamentId.value || !newVal) return

  loading.value = true
  const res = await fetchBrackets(selectedTournamentId.value, newVal)

  if (res.success) {
    bracketData.value = res
  }

  loading.value = false
})
</script>

<style scoped>
.brackets-view {
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.view-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-weight: 500;
  font-size: 0.95em;
  color: #333;
}

.filter-group select {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 1em;
  min-width: 220px;
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state h4 {
  margin: 0 0 12px 0;
  font-size: 1.4em;
  color: #555;
}
</style>