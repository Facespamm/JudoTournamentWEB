<template>
  <div class="weighings-management">
    <!-- ЗАГОЛОВОК -->
    <div class="weighings-header">
      <button class="weighings-back-btn" @click="router.back()">
        ← Назад
      </button>
      <h1>Управление взвешиваниями</h1>
      <p>Управление весом атлетов и статусами взвешивания</p>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="weighings-filters">
      <div class="weighings-filters-grid">
        <div class="weighings-filter-group">
          <label for="tournament-filter">Турнир</label>
          <select
              id="tournament-filter"
              v-model="selectedTournamentId"
              @change="onTournamentChange"
              class="weighings-filter-select"
          >
            <option value="">Выберите турнир</option>
            <option v-for="t in tournaments" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>

        <div class="weighings-filter-group">
          <label for="status-filter">Статус взвешивания</label>
          <select
              id="status-filter"
              v-model="selectedStatus"
              @change="filterWeighings"
              class="weighings-filter-select"
          >
            <option value="">Все</option>
            <option value="valid">Подтверждено</option>
            <option value="not_valid">Не подтверждено</option>
          </select>
        </div>

        <div class="weighings-filter-group">
          <label for="category-filter">Категория веса</label>
          <select
              id="category-filter"
              v-model="selectedCategory"
              @change="loadWeighings"
              class="weighings-filter-select"
              :disabled="!selectedTournamentId || isLoadingCategories || tournamentCategories.length === 0"
          >
            <option value="">Выберите категорию</option>
            <option v-for="cat in tournamentCategories" :key="cat.id" :value="cat.id">
              {{ formatCategoryLabel(cat) }}
            </option>
          </select>

          <div class="weighings-filter-hint">
            <small v-if="isLoadingCategories" class="hint-loading">Загрузка категорий...</small>
            <small v-else-if="selectedTournamentId && tournamentCategories.length === 0" class="hint-no-data">
              Нет доступных категорий для выбранного турнира
            </small>
          </div>
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

    <!-- ПАНЕЛЬ ДЕЙСТВИЙ И ТАБЛИЦА -->
    <div class="weighings-table-container">
      <div class="weighings-table-info">
        <div class="weighings-action-bar">
          <button class="weighings-btn weighings-btn-outline" @click="refreshCurrentData">
            Обновить
          </button>

          <button
              class="weighings-btn weighings-btn-primary"
              @click="openCreateModal"
              :disabled="!isCreateEnabled"
          >
            Создать взвешивание
          </button>

          <button
              class="weighings-btn weighings-btn-outline"
              @click="toggleSelectAll"
              :disabled="filteredWeighings.length === 0"
          >
            {{ allSelected ? 'Снять выделение' : 'Выделить все' }}
          </button>

          <button
              class="weighings-btn weighings-btn-success"
              @click="setStatus(true)"
              :disabled="selectedWeighings.length === 0"
          >
            Подтвердить ({{ selectedWeighings.length }})
          </button>

          <button
              class="weighings-btn weighings-btn-warning"
              @click="setStatus(false)"
              :disabled="selectedWeighings.length === 0"
          >
            Снять подтверждение ({{ selectedWeighings.length }})
          </button>

          <button
              class="weighings-btn weighings-btn-primary"
              @click="editSingle"
              :disabled="selectedWeighings.length !== 1"
          >
            Редактировать вес
          </button>

          <button
              class="weighings-btn required"
              @click="deleteWeight"
              :disabled="selectedWeighings.length !== 1"
          >
            Удалить
          </button>
        </div>
      </div>

      <div class="weighings-table-wrapper">
        <table class="weighings-table">
          <thead>
          <tr>
            <th class="weighings-checkbox-column">
              <input
                  type="checkbox"
                  :checked="allSelected"
                  @change="toggleSelectAll"
                  :disabled="filteredWeighings.length === 0"
              />
            </th>
            <th @click="sortBy('athlete_name')" class="weighings-sortable">
              Атлет
              <span class="weighings-sort-icon" v-if="sortField === 'athlete_name'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th>Категория веса</th>
            <th>Турнир</th>
            <th @click="sortBy('weight')" class="weighings-sortable">
              Вес (кг)
              <span class="weighings-sort-icon" v-if="sortField === 'weight'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th @click="sortBy('weighing_time')" class="weighings-sortable">
              Время взвешивания
              <span class="weighings-sort-icon" v-if="sortField === 'weighing_time'">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
            </th>
            <th>Статус</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="w in sortedWeighings" :key="w.id">
            <td class="weighings-checkbox-column">
              <input type="checkbox" :value="w.id" v-model="selectedWeighings" />
            </td>
            <td>
              <span class="weighings-athlete-name">{{ w.athlete_name || '—' }}</span>
            </td>
            <td>
                <span class="weighings-category-badge">
                  {{ w.weight_category?.name || 'Не указана' }}
                </span>
            </td>
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
          <p v-else-if="selectedTournamentId && tournamentCategories.length > 0 && !selectedCategory">
            Выберите категорию
          </p>
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
              <input
                  :value="editingWeighing?.weight ? editingWeighing.weight + ' кг' : '—'"
                  disabled
              />
            </div>
            <div class="weighings-form-group">
              <label>Новый вес (кг)</label>
              <input
                  v-model.number="editForm.weight"
                  type="number"
                  step="0.1"
                  placeholder="Например: 73.5"
              />
            </div>
          </div>
        </div>
        <div class="weighings-modal-footer">
          <button class="weighings-btn weighings-btn-secondary" @click="closeEditModal">
            Отмена
          </button>
          <button
              class="weighings-btn weighings-btn-primary"
              @click="saveEdit"
              :disabled="!editForm.weight || editForm.weight === editingWeighing?.weight"
          >
            Сохранить изменения
          </button>
        </div>
      </div>
    </div>

    <!-- МОДАЛКА СОЗДАНИЯ ВЗВЕШИВАНИЯ -->
    <div v-if="showCreateModal" class="weighings-modal-overlay" @click.self="closeCreateModal">
      <div class="weighings-modal-content wide-modal">
        <div class="weighings-modal-header">
          <h3>Создание взвешивания</h3>
          <button class="weighings-modal-close" @click="closeCreateModal">×</button>
        </div>

        <div class="weighings-modal-body">
          <div class="weighings-edit-form">
            <div class="weighings-form-group">
              <label>Турнир</label>
              <input :value="currentTournamentName" disabled />
            </div>

            <div class="weighings-form-group">
              <label>Категория веса</label>
              <input :value="currentCategoryLabel" disabled />
            </div>

            <div class="weighings-form-group athlete-selection-group">
              <label>Атлет <span class="required">*</span></label>

              <input
                  v-model="searchAthleteQuery"
                  type="text"
                  placeholder="Поиск по имени атлета..."
                  class="weighings-search-input"
                  style="margin-bottom: 12px;"
              />

              <div class="weighings-athletes-table-wrapper">
                <div v-if="isLoadingAthletes" class="loading-message">
                  Загрузка списка атлетов...
                </div>

                <div v-else-if="categoryAthletes.length === 0" class="no-athletes-message">
                  Нет зарегистрированных атлетов в этой категории
                </div>

                <table v-else class="weighings-athletes-table">
                  <thead>
                  <tr>
                    <th style="width: 60px;">Выбор</th>
                    <th>Полное ФИО</th>
                    <th>Дата рождения</th>
                    <th>Возраст</th>
                    <th>Клуб</th>
                    <th>Пол</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr
                      v-for="ath in filteredCategoryAthletes"
                      :key="ath.athlete_id || ath.id"
                      :class="{ 'selected-row': createForm.athlete_id === (ath.athlete_id || ath.id) }"
                  >
                    <td>
                      <input
                          type="radio"
                          name="selectedAthlete"
                          :value="ath.athlete_id || ath.id"
                          v-model="createForm.athlete_id"
                      />
                    </td>
                    <td>{{ getFullName(ath) }}</td>
                    <td>{{ formatBirthDate(ath.birth_date) }}</td>
                    <td>{{ ath.age ?? '—' }}</td>
                    <td>{{ ath.club_name || '—' }}</td>
                    <td>{{ formatGender(ath.gender) }}</td>
                  </tr>
                  </tbody>
                </table>

                <div v-if="!isLoadingAthletes && filteredCategoryAthletes.length === 0" class="no-athletes-message">
                  Нет атлетов, соответствующих поиску
                </div>
              </div>
            </div>

            <div class="weighings-form-group">
              <label>Вес (кг) <span class="required">*</span></label>
              <input
                  v-model.number="createForm.weight"
                  type="number"
                  step="0.1"
                  placeholder="Например: 73.5"
              />
            </div>

            <div class="weighings-form-group">
              <label>Примечания</label>
              <textarea
                  v-model="createForm.notes"
                  rows="3"
                  placeholder="Дополнительная информация (необязательно)"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="weighings-modal-footer">
          <button class="weighings-btn weighings-btn-secondary" @click="closeCreateModal">
            Отмена
          </button>
          <button
              class="weighings-btn weighings-btn-primary"
              @click="saveCreate"
              :disabled="!createForm.athlete_id || createForm.weight == null || isLoadingAthletes"
          >
            Создать
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
import { useRouter } from 'vue-router'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import {
  fetchWeighings,
  updateWeighing,
  fetchCreateWeight,
  fetchRegister, deleteWeighing
} from '@/components/View/Weighings/fetchWeighings.js'
import { fetchCategoriesById } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'

import './Weighings.css'

const router = useRouter()

// Состояния
const tournaments = ref([])
const weighings = ref([])
const filteredWeighings = ref([])
const selectedTournamentId = ref('')
const selectedStatus = ref('')
const selectedCategory = ref('')
const tournamentCategories = ref([])
const searchQuery = ref('')
const selectedWeighings = ref([])
const isLoading = ref(false)
const isLoadingCategories = ref(false)
const sortField = ref('weighing_time')
const sortDirection = ref('desc')

const showEditModal = ref(false)
const showCreateModal = ref(false)
const editingWeighing = ref(null)
const editForm = ref({ weight: null })

const createForm = ref({
  athlete_id: null,
  weight: null,
  notes: ''
})

const categoryAthletes = ref([])
const isLoadingAthletes = ref(false)
const searchAthleteQuery = ref('')

const toast = ref({ visible: false, message: '', type: 'success' })

// Вычисляемые свойства
const allSelected = computed(() =>
    filteredWeighings.value.length > 0 &&
    filteredWeighings.value.every(w => selectedWeighings.value.includes(w.id))
)

const isCreateEnabled = computed(() => !!selectedTournamentId.value && !!selectedCategory.value)

const currentTournamentName = computed(() => {
  const t = tournaments.value.find(t => t.id === Number(selectedTournamentId.value))
  return t ? t.name : ''
})

const currentCategoryLabel = computed(() => {
  const cat = tournamentCategories.value.find(c => c.id === Number(selectedCategory.value))
  return cat ? formatCategoryLabel(cat) : ''
})

const sortedWeighings = computed(() => {
  return [...filteredWeighings.value].sort((a, b) => {
    let A = a[sortField.value] ?? ''
    let B = b[sortField.value] ?? ''
    if (sortField.value === 'weighing_time') {
      A = new Date(A).getTime() || 0
      B = new Date(B).getTime() || 0
    }
    if (sortField.value === 'weight') {
      A = parseFloat(A) || 0
      B = parseFloat(B) || 0
    }
    return (A < B ? -1 : 1) * (sortDirection.value === 'asc' ? 1 : -1)
  })
})

const filteredCategoryAthletes = computed(() => {
  let list = categoryAthletes.value
  if (searchAthleteQuery.value.trim()) {
    const q = searchAthleteQuery.value.toLowerCase().trim()
    list = list.filter(ath => {
      const name = (getFullName(ath) || '').toLowerCase()
      return name.includes(q) || String(ath.athlete_id || ath.id).includes(q)
    })
  }
  return list
})

// Утилиты
const showToast = (msg, type = 'success') => {
  toast.value = { visible: true, message: msg, type }
  setTimeout(() => (toast.value.visible = false), 3000)
}

const formatDate = d =>
    d
        ? new Date(d).toLocaleString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : '—'

const getStatusClass = w =>
    w.is_valid === true
        ? 'weighings-status-success'
        : w.is_valid === false
            ? 'weighings-status-danger'
            : 'weighings-status-warning'

const getStatusText = w =>
    w.is_valid === true ? 'Подтверждено' : w.is_valid === false ? 'Не подтверждено' : 'Не определён'

const formatCategoryLabel = cat => {
  let label = cat.name || ''
  if (cat.gender) label += ` (${cat.gender})`
  if (cat.weight_range) label += `, ${cat.weight_range} кг`
  if (cat.age_range) label += `, ${cat.age_range} лет`
  return label
}

const getFullName = (ath) => {
  if (ath.full_name) return ath.full_name
  const parts = []
  if (ath.last_name) parts.push(ath.last_name)
  if (ath.first_name) parts.push(ath.first_name)
  return parts.join(' ') || `Атлет #${ath.athlete_id || ath.id}`
}

const formatBirthDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatGender = (gender) => {
  if (gender === 'male') return 'Мужской'
  if (gender === 'female') return 'Женский'
  return '—'
}

// Загрузка категорий
const loadCategories = async () => {
  tournamentCategories.value = []
  if (!selectedTournamentId.value) {
    isLoadingCategories.value = false
    return
  }

  isLoadingCategories.value = true
  try {
    const tournamentId = Number(selectedTournamentId.value)
    const catRes = await fetchCategoriesById(tournamentId)

    if (catRes.success && catRes.data) {
      tournamentCategories.value = (catRes.data || []).sort((a, b) => {
        if (a.min_weight !== undefined && b.min_weight !== undefined) {
          return a.min_weight - b.min_weight
        }
        return (a.name || '').localeCompare(b.name || '')
      })
    } else {
      tournamentCategories.value = []
      showToast('Не удалось загрузить категории', 'error')
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    showToast('Ошибка загрузки категорий', 'error')
    tournamentCategories.value = []
  } finally {
    isLoadingCategories.value = false
  }
}

const onTournamentChange = async () => {
  selectedWeighings.value = []
  selectedCategory.value = ''
  weighings.value = []
  filteredWeighings.value = []

  await loadCategories()
  filterWeighings()
}

// Загрузка взвешиваний
const loadWeighings = async () => {
  selectedWeighings.value = []
  weighings.value = []
  filteredWeighings.value = []

  if (!selectedTournamentId.value || !selectedCategory.value) {
    filterWeighings()
    return
  }

  isLoading.value = true
  try {
    const tournamentId = Number(selectedTournamentId.value)
    const res = await fetchWeighings(tournamentId, selectedCategory.value)

    if (res.success) {
      weighings.value = res.data?.weighings || res.data || []
    }
  } catch (err) {
    console.error('Ошибка загрузки взвешиваний:', err)
    showToast('Ошибка загрузки взвешиваний', 'error')
  } finally {
    filterWeighings()
    isLoading.value = false
  }
}

const deleteWeight = async () => {
    if (selectedWeighings.value.length !== 1) {
      showToast('для удаления нужне только одно взвещивание', 'error')
      return
    }

    const result = await deleteWeighing(selectedWeighings.value[0])
    if (result.success) {
      showToast('Звешивание удаленно', 'success')
      await loadWeighings()
    } else {
      showToast(`Ошибка загрузки взвешиваний ${result.message}`, 'error')
    }
}

const refreshCurrentData = async () => {
  if (!selectedTournamentId.value) return

  isLoading.value = true
  try {
    await loadCategories()

    const validCategory = tournamentCategories.value.find(
        cat => cat.id === selectedCategory.value
    )
    if (selectedCategory.value && !validCategory) {
      selectedCategory.value = ''
      weighings.value = []
      filteredWeighings.value = []
    }

    if (selectedCategory.value) {
      await loadWeighings()
    }
  } finally {
    filterWeighings()
    isLoading.value = false
  }
}

const filterWeighings = () => {
  let list = [...weighings.value]

  if (selectedStatus.value === 'valid') list = list.filter(w => w.is_valid === true)
  if (selectedStatus.value === 'not_valid') list = list.filter(w => w.is_valid === false)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(w => w.athlete_name?.toLowerCase().includes(q))
  }

  filteredWeighings.value = list
  selectedWeighings.value = []
}

// Сортировка и выделение
const sortBy = field => {
  sortDirection.value = sortField.value === field
      ? sortDirection.value === 'asc' ? 'desc' : 'asc'
      : 'asc'
  sortField.value = field
}

const toggleSelectAll = () => {
  selectedWeighings.value = allSelected.value
      ? []
      : filteredWeighings.value.map(w => w.id)
}

// Массовое изменение статуса
const setStatus = async status => {
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

  showToast(
      successCount === selectedWeighings.value.length
          ? `Статус обновлён у ${successCount} записи(ей)`
          : `Успешно: ${successCount}, ошибок: ${selectedWeighings.value.length - successCount}`
  )
}

// Редактирование веса
const editSingle = () => {
  const weighing = weighings.value.find(w => w.id === selectedWeighings.value[0])
  if (!weighing) return

  editingWeighing.value = weighing
  editForm.value.weight = weighing.weight
  showEditModal.value = true
}

const saveEdit = async () => {
  if (!editingWeighing.value || !editForm.value.weight) return

  const res = await updateWeighing(editingWeighing.value.id, { weight: editForm.value.weight })
  console.log(res)
  if (res.success) {
    editingWeighing.value.weight = editForm.value.weight
    showToast('Вес успешно обновлён')
    closeEditModal()
  } else {
    showToast(`Ошибка обновления веса ${res.error}`, 'error')
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editingWeighing.value = null
  editForm.value.weight = null
}

// Создание взвешивания
const openCreateModal = async () => {
  createForm.value = { athlete_id: null, weight: null, notes: '' }
  searchAthleteQuery.value = ''
  categoryAthletes.value = []

  await loadCategoryAthletes()
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
}

const loadCategoryAthletes = async () => {
  if (!selectedTournamentId.value || !selectedCategory.value) {
    categoryAthletes.value = []
    return
  }

  isLoadingAthletes.value = true
  try {
    const tournamentId = Number(selectedTournamentId.value)
    const categoryId = Number(selectedCategory.value)

    const res = await fetchRegister(tournamentId, categoryId)

    if (res.success) {
      categoryAthletes.value = res.data?.athletes || res.data || []
    } else {
      categoryAthletes.value = []
      showToast('Не удалось загрузить список атлетов', 'error')
    }
  } catch (err) {
    console.error('Ошибка загрузки атлетов:', err)
    showToast('Ошибка загрузки списка атлетов', 'error')
    categoryAthletes.value = []
  } finally {
    isLoadingAthletes.value = false
  }
}

const saveCreate = async () => {
  if (!createForm.value.athlete_id || createForm.value.weight == null) return

  const payload = {
    tournament_id: Number(selectedTournamentId.value),
    category_id: Number(selectedCategory.value),
    athlete_id: Number(createForm.value.athlete_id),
    weight: Number(createForm.value.weight),
    notes: createForm.value.notes.trim()
  }

  try {
    const res = await fetchCreateWeight(payload)
    if (res.success) {
      showToast('Взвешивание успешно создано')
      closeCreateModal()
      await loadWeighings()
    } else {
      showToast(res.error || 'Ошибка при создании взвешивания', 'error')
    }
  } catch (err) {
    console.error('Ошибка создания взвешивания:', err)
    showToast('Ошибка при создании взвешивания', 'error')
  }
}

// Инициализация
onMounted(async () => {
  const res = await fetchTournaments()
  if (res.success) {
    tournaments.value = res.data?.tournaments || res.data || []
  }
})
</script>

<style scoped>
.weighings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.weighings-modal-content {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 95%;
  max-width: 600px;
}

.weighings-modal-content.wide-modal {
  width: 95%;
  max-width: 960px;
}

.weighings-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.weighings-modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.weighings-modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.weighings-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
}

.weighings-athletes-table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
}

.weighings-athletes-table {
  width: 100%;
  border-collapse: collapse;
}

.weighings-athletes-table th,
.weighings-athletes-table td {
  padding: 12px 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.weighings-athletes-table th:nth-child(2),
.weighings-athletes-table td:nth-child(2) { width: 25%; }

.weighings-athletes-table th:nth-child(3),
.weighings-athletes-table td:nth-child(3) { width: 15%; }

.weighings-athletes-table th:nth-child(4),
.weighings-athletes-table td:nth-child(4) { width: 10%; }

.weighings-athletes-table th:nth-child(5),
.weighings-athletes-table td:nth-child(5) { width: 25%; }

.weighings-athletes-table th:nth-child(6),
.weighings-athletes-table td:nth-child(6) { width: 10%; }

.weighings-athletes-table th {
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
}

.weighings-athletes-table tr:hover {
  background-color: #f5faff;
}

.weighings-athletes-table tr.selected-row {
  background-color: #e3f2fd;
  font-weight: 500;
}

@media (max-width: 1200px) {
  .weighings-athletes-table-wrapper {
    overflow-x: auto;
  }
  .weighings-athletes-table {
    min-width: 700px;
  }
}

.no-athletes-message,
.loading-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 16px;
}

.weighings-filter-hint {
  margin-top: 6px;
  min-height: 20px;
}

.hint-loading {
  color: #666;
  font-style: italic;
}

.hint-no-data {
  color: #d32f2f;
}

.required {
  color: #d32f2f;
  font-weight: bold;
}
</style>