<template>

  <div class="weighings-management">

    <!-- ЗАГОЛОВОК -->

    <div class="weighings-header">

      <h1>Управление взвешиваниями</h1>

      <p>Управление весом атлетов и статусами взвешивания</p>

    </div>

    <!-- ФИЛЬТРЫ -->

    <div class="weighings-filters">

      <div class="weighings-filters-grid">

        <div class="weighings-filter-group">

          <label for="tournament-filter">Турнир</label>

          <select id="tournament-filter" v-model="selectedTournamentId" @change="onTournamentChange" class="weighings-filter-select">

            <option value="">Выберите турнир</option>

            <option v-for="t in tournaments" :key="t.id" :value="t.id">{{ t.name }}</option>

          </select>

        </div>

        <div class="weighings-filter-group">

          <label for="status-filter">Статус взвешивания</label>

          <select id="status-filter" v-model="selectedStatus" @change="filterWeighings" class="weighings-filter-select">

            <option value="">Все</option>

            <option value="valid">Подтверждено</option>

            <option value="not_valid">Не подтверждено</option>

          </select>

        </div>

        <!-- НОВЫЙ ФИЛЬТР ПО КАТЕГОРИИ (из турнира) -->

        <div class="weighings-filter-group">

          <label for="category-filter">Категория веса</label>

          <select

              id="category-filter"

              v-model="selectedCategory"

              @change="filterWeighings"

              class="weighings-filter-select"

              :disabled="!selectedTournamentId || tournamentCategories.length === 0"

          >

            <option value="">Все категории</option>

            <option

                v-for="cat in tournamentCategories"

                :key="cat.id"

                :value="cat.name"

            >

              {{ formatCategoryLabel(cat) }}

            </option>

          </select>

        </div>

        <div class="weighings-filter-group weighings-search-group">

          <label for="search">Поиск</label>

          <div class="weighings-search-input-wrapper">

            <input

                id="search"

                v-model="searchQuery"

                @input="filterWeighings"

                type="text"

                placeholder="Поиск по имени атлета..."

                class="weighings-search-input"

            />

          </div>

        </div>

      </div>

    </div>

    <!-- ПАНЕЛЬ ДЕЙСТВИЙ -->

    <div class="weighings-table-container">

      <div class="weighings-table-info">

        <div class="weighings-action-bar">

          <button class="weighings-btn weighings-btn-outline" @click="loadInitialData">

            Обновить

          </button>

          <button class="weighings-btn weighings-btn-outline" @click="toggleSelectAll" :disabled="filteredWeighings.length === 0">

            {{ allSelected ? 'Снять выделение' : 'Выделить все' }}

          </button>

          <button class="weighings-btn weighings-btn-success" @click="setStatus(true)" :disabled="selectedWeighings.length === 0">

            Подтвердить ({{ selectedWeighings.length }})

          </button>

          <button class="weighings-btn weighings-btn-warning" @click="setStatus(false)" :disabled="selectedWeighings.length === 0">

            Снять подтверждение ({{ selectedWeighings.length }})

          </button>

          <button class="weighings-btn weighings-btn-primary" @click="editSingle" :disabled="selectedWeighings.length !== 1">

            Редактировать вес

          </button>

        </div>

      </div>

      <!-- ТАБЛИЦА -->

      <div class="weighings-table-wrapper">

        <table class="weighings-table">

          <thead>

          <tr>

            <th class="weighings-checkbox-column">

              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" :disabled="filteredWeighings.length === 0" />

            </th>

            <th @click="sortBy('athlete_name')" class="weighings-sortable">

              Атлет

              <span class="weighings-sort-icon" v-if="sortField === 'athlete_name'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>

            </th>

            <th>Категория веса</th>

            <th>Турнир</th>

            <th @click="sortBy('weight')" class="weighings-sortable">

              Вес (кг)

              <span class="weighings-sort-icon" v-if="sortField === 'weight'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>

            </th>

            <th @click="sortBy('weighing_time')" class="weighings-sortable">

              Время взвешивания

              <span class="weighings-sort-icon" v-if="sortField === 'weighing_time'">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>

            </th>

            <th>Статус</th>

          </tr>

          </thead>

          <tbody>

          <tr v-for="w in sortedWeighings" :key="w.id">

            <td class="weighings-checkbox-column">

              <input type="checkbox" :value="w.id" v-model="selectedWeighings" />

            </td>

            <td><span class="weighings-athlete-name">{{ w.athlete_name || '—' }}</span></td>

            <td><span class="weighings-category-badge">{{ w.weight_category || 'Не указана' }}</span></td>

            <td>{{ w.tournament_name || '—' }}</td>

            <td class="weighings-weight-cell">

              <span class="weighings-weight-value">{{ w.weight || '—' }}</span>

              <span v-if="w.weight" class="weighings-weight-unit">кг</span>

            </td>

            <td>{{ formatDate(w.weighing_time) }}</td>

            <td>

                <span class="weighings-status" :class="getStatusClass(w)">

                  {{ getStatusText(w) }}

                </span>

            </td>

          </tr>

          </tbody>

        </table>

        <div v-if="filteredWeighings.length === 0" class="weighings-no-data-message">

          <div class="weighings-no-data-icon">Список</div>

          <p v-if="!selectedTournamentId">Выберите турнир</p>

          <p v-else-if="isLoading">Загрузка...</p>

          <p v-else>Нет взвешиваний</p>

        </div>

      </div>

    </div>

    <!-- МОДАЛКА РЕДАКТИРОВАНИЯ ВЕСА -->

    <div v-if="showEditModal" class="weighings-modal-overlay" @click.self="closeEditModal">

      <div class="weighings-modal-content">

        <div class="weighings-modal-header">

          <h3>Редактирование веса</h3>

          <button class="weighings-modal-close" @click="closeEditModal">×</button>

        </div>

        <div class="weighings-modal-body">

          <div class="weighings-edit-form">

            <div class="weighings-form-group">

              <label>Атлет</label>

              <input :value="editingWeighing?.athlete_name" disabled />

            </div>

            <div class="weighings-form-group">

              <label>Текущий вес</label>

              <input :value="editingWeighing?.weight ? editingWeighing.weight + ' кг' : '—'" disabled />

            </div>

            <div class="weighings-form-group">

              <label>Новый вес (кг)</label>

              <input v-model.number="editForm.weight" type="number" step="0.1" placeholder="Например: 73.5" />

            </div>

          </div>

        </div>

        <div class="weighings-modal-footer">

          <button class="weighings-btn weighings-btn-secondary" @click="closeEditModal">Отмена</button>

          <button class="weighings-btn weighings-btn-primary" @click="saveEdit" :disabled="!editForm.weight || editForm.weight === editingWeighing?.weight">

            Сохранить изменения

          </button>

        </div>

      </div>

    </div>

    <!-- TOAST -->

    <div v-if="toast.visible" class="weighings-toast-notification" :class="toast.type">

      <div class="weighings-toast-content">

        <span class="weighings-toast-icon">{{ toast.type === 'success' ? '✓' : '✗' }}</span>

        <span class="weighings-toast-message">{{ toast.message }}</span>

      </div>

    </div>

  </div>

</template>

<script setup>

import { ref, computed, onMounted } from 'vue'

import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'

import { fetchWeighings, updateWeighing } from '@/components/View/Weighings/fetchWeighings.js'

import { fetchCategoriesById } from "@/components/View/TournamentDetails/fetchTournamentDetail.js"

import './Weighings.css'
// === Состояния ===

const tournaments = ref([])

const weighings = ref([])

const filteredWeighings = ref([])

const selectedTournamentId = ref('')

const selectedStatus = ref('')

const selectedCategory = ref('')           // выбранная категория (по имени)

const tournamentCategories = ref([])       // категории текущего турнира

const searchQuery = ref('')

const selectedWeighings = ref([])

const isLoading = ref(false)

const sortField = ref('weighing_time')

const sortDirection = ref('desc')

const showEditModal = ref(false)

const editingWeighing = ref(null)

const editForm = ref({ weight: null })

const toast = ref({ visible: false, message: '', type: 'success' })

// === Вычисляемые ===

const allSelected = computed(() => filteredWeighings.value.length > 0 && filteredWeighings.value.every(w => selectedWeighings.value.includes(w.id)))

const singleWeighing = computed(() => selectedWeighings.value.length === 1 ? weighings.value.find(w => w.id === selectedWeighings.value[0]) : null)

const sortedWeighings = computed(() => {

  return [...filteredWeighings.value].sort((a, b) => {

    let A = a[sortField.value] ?? ''

    let B = b[sortField.value] ?? ''

    if (sortField.value === 'weighing_time') { A = new Date(A).getTime() || 0; B = new Date(B).getTime() || 0 }

    if (sortField.value === 'weight') { A = parseFloat(A) || 0; B = parseFloat(B) || 0 }

    return (A < B ? -1 : 1) * (sortDirection.value === 'asc' ? 1 : -1)

  })

})

// === Утилиты ===

const showToast = (msg, type = 'success') => {

  toast.value = { visible: true, message: msg, type }

  setTimeout(() => toast.value.visible = false, 3000)

}

const formatDate = d => d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const getStatusClass = w => w.is_valid === true ? 'weighings-status-success' : w.is_valid === false ? 'weighings-status-danger' : 'weighings-status-warning'

const getStatusText = w => w.is_valid === true ? 'Подтверждено' : w.is_valid === false ? 'Не подтверждено' : 'Не определён'

// Форматирование подписи категории в селекте

const formatCategoryLabel = (cat) => {

  let label = cat.name

  if (cat.gender) label += ` (${cat.gender})`

  if (cat.min_weight != null && cat.max_weight != null) {

    label += `, ${cat.min_weight}-${cat.max_weight} кг`

  }

  if (cat.min_age != null && cat.max_age != null) {

    label += `, ${cat.min_age}-${cat.max_age} лет`

  }

  return label

}

// === Загрузка турниров ===

const loadInitialData = async () => {

  const res = await fetchTournaments()

  if (res.success) tournaments.value = res.data?.tournaments || res.data || []

}

// === Загрузка взвешиваний и категорий при смене турнира ===

const onTournamentChange = async () => {

  selectedWeighings.value = []

  weighings.value = []

  filteredWeighings.value = []

  selectedCategory.value = ''

  tournamentCategories.value = []

  if (!selectedTournamentId.value) {

    filterWeighings()

    return

  }

  isLoading.value = true

  try {

    const tournamentId = Number(selectedTournamentId.value)

    // Параллельно загружаем взвешивания и категории

    const [weighRes, catRes] = await Promise.all([

      fetchWeighings(tournamentId),

      fetchCategoriesById(tournamentId)

    ])

    if (weighRes.success) {

      weighings.value = weighRes.data?.weighings || weighRes.data || []

    }

    if (catRes.success && catRes.data) {

      // Сортируем по min_weight

      tournamentCategories.value = catRes.data.sort((a, b) => (a.min_weight || 0) - (b.min_weight || 0))

    }

  } catch (err) {

    console.error('Ошибка загрузки данных турнира:', err)

    showToast('Ошибка загрузки данных', 'error')

  } finally {

    filterWeighings()

    isLoading.value = false

  }

}

// === Фильтрация ===

const filterWeighings = () => {

  let list = [...weighings.value]

  // Статус

  if (selectedStatus.value === 'valid') list = list.filter(w => w.is_valid === true)

  if (selectedStatus.value === 'not_valid') list = list.filter(w => w.is_valid === false)

  // Категория (по имени категории)

  if (selectedCategory.value) {

    list = list.filter(w => w.weight_category === selectedCategory.value)

  }

  // Поиск по имени

  if (searchQuery.value.trim()) {

    const q = searchQuery.value.toLowerCase().trim()

    list = list.filter(w => w.athlete_name?.toLowerCase().includes(q))

  }

  filteredWeighings.value = list

  selectedWeighings.value = [] // сбрасываем выделение

}

// === Сортировка и выбор ===

const sortBy = field => {

  sortDirection.value = sortField.value === field ? (sortDirection.value === 'asc' ? 'desc' : 'asc') : 'asc'

  sortField.value = field

}

const toggleSelectAll = () => {

  selectedWeighings.value = allSelected.value ? [] : filteredWeighings.value.map(w => w.id)

}

// === МАССОВОЕ ИЗМЕНЕНИЕ СТАТУСА ===

const setStatus = async (status) => {

  if (selectedWeighings.value.length === 0) return

  if (!confirm(`Изменить статус у ${selectedWeighings.value.length} записи(ей)?`)) return

  const results = await Promise.all(

      selectedWeighings.value.map(id => updateWeighing(id, { is_valid: status }))

  )

  const successCount = results.filter(r => r.success).length

  selectedWeighings.value.forEach(id => {

    const w = weighings.value.find(x => x.id === id)

    if (w) w.is_valid = status

  })

  filterWeighings()

  showToast(successCount === selectedWeighings.value.length

      ? `Статус обновлён у ${successCount} записи(ей)`

      : `Успешно: ${successCount}, ошибок: ${selectedWeighings.value.length - successCount}`)

}

// === Редактирование веса ===

const editSingle = () => {

  if (!singleWeighing.value) return

  editingWeighing.value = singleWeighing.value

  editForm.value.weight = singleWeighing.value.weight

  showEditModal.value = true

}

const saveEdit = async () => {

  if (!editingWeighing.value || !editForm.value.weight) return

  const res = await updateWeighing(editingWeighing.value.id, { weight: editForm.value.weight })

  if (res.success) {

    editingWeighing.value.weight = editForm.value.weight

    showToast('Вес успешно обновлён')

    closeEditModal()

  } else {

    showToast('Ошибка обновления веса', 'error')

  }

}

const closeEditModal = () => {

  showEditModal.value = false

  editingWeighing.value = null

  editForm.value.weight = null

}

onMounted(loadInitialData)

</script>

<style scoped>
</style>