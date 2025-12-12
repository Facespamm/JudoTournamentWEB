<template>
  <div class="brackets-view">
    <h3>Созданные сетки</h3>

    <div class="view-controls">
      <!-- Турнир -->
      <div class="filter-group">
        <label for="tournament_filter">Турнир:</label>
        <select
            v-model="selectedTournamentId"
            id="tournament_filter"
            @change="onTournamentChange"
        >
          <option :value="null">Все турниры</option>
          <option v-for="t in tournaments" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>

      <!-- Категория — только после турнира -->
      <div class="filter-group" v-if="selectedTournamentId">
        <label for="category_filter">Категория:</label>
        <select v-model="selectedCategoryId" id="category_filter">
          <option :value="null">Выберите категорию</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.name }} ({{ c.gender === 'MALE' ? 'М' : 'Ж' }})
          </option>
        </select>
      </div>

      <!-- Поиск -->
      <div class="search-group">
        <input
            v-model="searchQuery"
            placeholder="Поиск по названию сетки..."
            class="search-input"
        />
      </div>
    </div>

    <!-- Подсказка -->
    <div v-if="selectedTournamentId && !selectedCategoryId && !loading" class="info-hint">
      ← Выберите категорию, чтобы загрузить сетки
    </div>

    <!-- Лоадер -->
    <div v-if="loading" class="loading">Загрузка сеток...</div>

    <!-- Сетки -->
    <div v-else-if="filteredBrackets.length" class="brackets-grid">
      <div
          v-for="b in filteredBrackets"
          :key="b.id"
          class="bracket-card"
          @click="viewBracket(b.id)"
      >
        <div class="bracket-header">
          <div class="bracket-name">{{ b.name }}</div>
          <div class="bracket-status" :class="getStatusClass(b.status)">
            {{ getStatusText(b.status) }}
          </div>
        </div>

        <div class="bracket-category">
          {{ getCategoryName(b.category_id) }}
        </div>

        <div class="bracket-tournament">
          {{ getTournamentName(b.tournament_id) }}
        </div>

        <div class="bracket-info">
          <span>Участников: {{ b.athletes_count || 0 }}</span>
          <span> · </span>
          <span>{{ getBracketTypeText(b.bracket_type) }}</span>
        </div>

        <div class="bracket-progress">
          <div class="progress-bar">
            <div
                class="progress-fill"
                :style="{ width: b.progress_percentage + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ b.progress_percentage }}% завершено</span>
        </div>

        <!-- Кнопка генерации -->
        <div class="bracket-actions" @click.stop>
          <button
              v-if="b.status !== 'COMPLETED'"
              @click="$emit('generate-fights', b.id)"
              class="generate-btn"
          >
            Сгенерировать бои
          </button>
        </div>
      </div>
    </div>

    <!-- Пусто — без трофея -->
    <div v-else class="empty-state">
      <h4>Сетки не найдены</h4>
      <p>
        {{ selectedTournamentId
          ? selectedCategoryId
              ? 'В этой категории нет сеток'
              : 'Выберите категорию'
          : 'Выберите турнир'
        }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchBrackets } from '@/components/View/Brackets/fetchBrackets.js'
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'

const props = defineProps({
  tournaments: { type: Array, default: () => [] }
})

const emit = defineEmits(['generate-fights'])
const router = useRouter()

const brackets = ref([])
const categories = ref([])
const loading = ref(false)

const selectedTournamentId = ref(null)
const selectedCategoryId = ref(null)
const searchQuery = ref('')

// При смене турнира — только категории
const onTournamentChange = async () => {
  selectedCategoryId.value = null
  brackets.value = []
  categories.value = []

  if (!selectedTournamentId.value) return

  const res = await fetchCategories(selectedTournamentId.value)
  if (res.success) {
    categories.value = res.categories || res.data?.categories || []
  }
}

// Сетки — только после выбора категории
watch(selectedCategoryId, async (newVal) => {
  if (!selectedTournamentId.value || !newVal) {
    brackets.value = []
    return
  }

  loading.value = true
  const res = await fetchBrackets(selectedTournamentId.value, newVal)

  if (res.success) {
    brackets.value = res.brackets
  } else {
    alert('Ошибка: ' + (res.error || 'неизвестная'))
    brackets.value = []
  }

  loading.value = false
})

// Поиск
const filteredBrackets = computed(() => {
  if (!searchQuery.value.trim()) return brackets.value
  const q = searchQuery.value.trim().toLowerCase()
  return brackets.value.filter(b =>
      b.name.toLowerCase().includes(q) ||
      getTournamentName(b.tournament_id).toLowerCase().includes(q) ||
      getCategoryName(b.category_id).toLowerCase().includes(q)
  )
})

// Вспомогательное
const getTournamentName = id => props.tournaments.find(t => t.id === id)?.name || '—'
const getCategoryName = id => categories.value.find(c => c.id === id)?.name || '—'
const getBracketTypeText = type => ({
  олимпийская: 'Олимпийская система',
  двойная_элиминация: 'Двойная элиминация',
  круговая: 'Круговая система'
}[type] || type)

const getStatusClass = s => ({
  GENERATED: 'status-generated',
  DRAFT: 'status-draft',
  COMPLETED: 'status-completed'
}[s] || 'status-draft')

const getStatusText = s => ({
  GENERATED: 'Бои сгенерированы',
  DRAFT: 'Черновик',
  COMPLETED: 'Завершена'
}[s] || 'Черновик')

const viewBracket = id => router.push(`/brackets/${id}`)
</script>

<style scoped>
.brackets-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.view-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
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
}

.search-group {
  margin-left: auto;
}

.search-input {
  padding: 10px 16px;
  width: 340px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
}

.info-hint {
  text-align: center;
  padding: 16px;
  background: #f0f8ff;
  border-radius: 8px;
  color: #0366d6;
  font-style: italic;
  margin-bottom: 20px;
}

.brackets-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
}

.bracket-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.bracket-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0,0,0,0.15);
  border-color: #007bff;
}

.bracket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.bracket-name {
  font-size: 1.3em;
  font-weight: 600;
  color: #2c3e50;
}

.bracket-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-generated { background: #d1ecf1; color: #0c5460; }
.status-draft { background: #fff3cd; color: #856404; }
.status-completed { background: #d4edda; color: #155724; }

.bracket-category { font-weight: 600; color: #e67e22; margin: 8px 0; }
.bracket-tournament { color: #007bff; font-weight: 500; margin-bottom: 8px; }
.bracket-info { color: #666; font-size: 0.95em; margin: 12px 0; }

.bracket-progress { margin-top: 16px; }
.progress-bar { width: 100%; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #007bff, #0056b3); border-radius: 5px; transition: width 0.6s ease; }
.progress-text { font-size: 0.85em; color: #666; text-align: right; margin-top: 6px; }

.bracket-actions { margin-top: 18px; text-align: right; }
.generate-btn {
  padding: 8px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}
.generate-btn:hover { background: #218838; }

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

/* Убрали трофей — как ты просил */
.empty-state h4 {
  margin: 0 0 12px 0;
  font-size: 1.4em;
  color: #555;
}
.empty-state p {
  color: #777;
}
</style>