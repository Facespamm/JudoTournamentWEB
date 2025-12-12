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

        <div class="weighings-filter-group weighings-search-group">
          <label for="search">Поиск</label>
          <div class="weighings-search-input-wrapper">
            <input id="search" v-model="searchQuery" @input="filterWeighings" type="text" placeholder="Поиск по имени атлета..." class="weighings-search-input" />
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

          <!-- МАССОВОЕ ПОДТВЕРЖДЕНИЕ -->
          <button class="weighings-btn weighings-btn-success" @click="setStatus(true)" :disabled="selectedWeighings.length === 0">
            Подтвердить ({{ selectedWeighings.length }})
          </button>

          <!-- МАССОВОЕ СНЯТИЕ ПОДТВЕРЖДЕНИЯ -->
          <button class="weighings-btn weighings-btn-warning" @click="setStatus(false)" :disabled="selectedWeighings.length === 0">
            Снять подтверждение ({{ selectedWeighings.length }})
          </button>

          <!-- РЕДАКТИРОВАНИЕ ВЕСА (только одна запись) -->
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
              <span class="weighings-sort-icon" v-if="sortField === 'athlete_name'">{{ sortDirection === 'asc' ? 'Up Arrow' : 'Down Arrow' }}</span>
            </th>
            <th>Категория веса</th>
            <th>Турнир</th>
            <th @click="sortBy('weight')" class="weighings-sortable">
              Вес (кг)
              <span class="weighings-sort-icon" v-if="sortField === 'weight'">{{ sortDirection === 'asc' ? 'Up Arrow' : 'Down Arrow' }}</span>
            </th>
            <th @click="sortBy('weighing_time')" class="weighings-sortable">
              Время взвешивания
              <span class="weighings-sort-icon" v-if="sortField === 'weighing_time'">{{ sortDirection === 'asc' ? 'Up Arrow' : 'Down Arrow' }}</span>
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
              <input :value="editingWeighing?.weight + ' кг'" disabled />
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
        <span class="weighings-toast-icon">{{ toast.type === 'success' ? 'Check' : 'Error' }}</span>
        <span class="weighings-toast-message">{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import { fetchWeighings, updateWeighing } from '@/components/View/Weighings/fetchWeighings.js'

// === Состояния ===
const tournaments = ref([])
const weighings = ref([])
const filteredWeighings = ref([])
const selectedTournamentId = ref('')
const selectedStatus = ref('')
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

// === Загрузка турниров ===
const loadInitialData = async () => {
  const res = await fetchTournaments()
  if (res.success) tournaments.value = res.data?.tournaments || res.data || []
}

// === Загрузка взвешиваний ===
const onTournamentChange = async () => {
  selectedWeighings.value = []
  weighings.value = []
  filteredWeighings.value = []

  if (!selectedTournamentId.value) return

  isLoading.value = true
  try {
    const tournamentId = Number(selectedTournamentId.value)
    const res = await fetchWeighings(tournamentId)
    if (res.success) weighings.value = res.data?.weighings || res.data || []
  } finally {
    filterWeighings()
    isLoading.value = false
  }
}
// === Фильтрация ===
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

// === Сортировка и выбор ===
const sortBy = field => {
  sortDirection.value = sortField.value === field ? (sortDirection.value === 'asc' ? 'desc' : 'asc') : 'asc'
  sortField.value = field
}
const toggleSelectAll = () => selectedWeighings.value = allSelected.value ? [] : filteredWeighings.value.map(w => w.id)

// === МАССОВОЕ ИЗМЕНЕНИЕ СТАТУСА (через updateWeighing) ===
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
.weighings-management {
  padding: 90px 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.weighings-header {
  text-align: center;
  margin-bottom: 2rem;
}

.weighings-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.weighings-header p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 0;
}

.weighings-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.weighings-filters-grid {
  display: flex;
  gap: 1rem;
  flex: 1;
  flex-wrap: wrap;
}

.weighings-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 200px;
}

.weighings-filter-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}

.weighings-filter-select, .weighings-filter-input {
  padding: 0.75rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  background: white;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

.weighings-filter-select:focus, .weighings-filter-input:focus {
  outline: none;
  border-color: #c89b3c;
}

.weighings-search-group {
  flex: 1;
  min-width: 250px;
}

.weighings-search-input-wrapper {
  position: relative;
  flex: 1;
}

.weighings-search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.weighings-search-input:focus {
  outline: none;
  border-color: #c89b3c;
}

.weighings-table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.weighings-action-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.weighings-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;
  min-width: 140px;
  text-align: center;
}

.weighings-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.weighings-btn-outline {
  background: white;
  color: #555;
  border: 2px solid #ddd;
}
.weighings-btn-outline:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #bbb;
}

.weighings-btn-success {
  background: #27ae60;
  color: white;
}
.weighings-btn-success:hover:not(:disabled) {
  background: #219653;
}

.weighings-btn-warning {
  background: #f39c12;
  color: white;
}
.weighings-btn-warning:hover:not(:disabled) {
  background: #e67e22;
}

.weighings-btn-primary {
  background: #3498db;
  color: white;
}
.weighings-btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.weighings-btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.weighings-btn-secondary:hover {
  background: #e0e0e0;
}

.weighings-athlete-name {
  font-weight: 600;
  font-size: 1.05rem;
}

/* Стили таблицы */
.weighings-table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 400px;
}

.weighings-table {
  width: 100%;
  border-collapse: collapse;
}

.weighings-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #e8e8e8;
  background: #f8f9fa;
}

.weighings-table td {
  padding: 1rem;
  border-bottom: 1px solid #e8e8e8;
}

.weighings-table tbody tr:hover {
  background: #f8f9fa;
}

.weighings-checkbox-column {
  width: 50px;
  text-align: center;
}

.weighings-checkbox-column input[type="checkbox"] {
  cursor: pointer;
}

.weighings-sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.weighings-sortable:hover {
  background: #e9ecef;
}

.weighings-sort-icon {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  display: inline-block;
  min-width: 1em;
}

.weighings-weight-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.weighings-weight-value {
  font-weight: 600;
  color: #1a1a1a;
}

.weighings-weight-unit {
  font-size: 0.85rem;
  color: #666;
}

.weighings-category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background: rgba(156, 39, 176, 0.1);
  color: #9c27b0;
}

.weighings-status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.weighings-status-success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.weighings-status-warning {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.weighings-status-danger {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.weighings-no-data-message {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  background: white;
}

.weighings-no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Модальное окно */
.weighings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.weighings-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
}

.weighings-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.weighings-modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1a1a1a;
}

.weighings-modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.weighings-modal-close:hover {
  background: #f8f9fa;
}

.weighings-modal-body {
  padding: 1.5rem;
}

.weighings-edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.weighings-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.weighings-form-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.weighings-form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.weighings-form-group input:focus {
  outline: none;
  border-color: #007bff;
}

.weighings-form-group input:disabled {
  background: #f8f9fa;
  color: #666;
}

.weighings-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

/* Toast */
.weighings-toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 300px;
  animation: weighings-slide-in 0.3s ease;
}

.weighings-toast-notification.success {
  background: #4CAF50;
  color: white;
}

.weighings-toast-notification.error {
  background: #f44336;
  color: white;
}

.weighings-toast-notification.info {
  background: #2196F3;
  color: white;
}

.weighings-toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.weighings-toast-icon {
  font-size: 1.2rem;
}

.weighings-toast-message {
  font-weight: 500;
}

@keyframes weighings-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .weighings-management {
    padding: 80px 1rem 1rem;
  }

  .weighings-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .weighings-filters-grid {
    flex-direction: column;
  }

  .weighings-filter-group {
    min-width: auto;
    width: 100%;
  }

  .weighings-table-info {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .weighings-action-bar {
    flex-direction: column;
    width: 100%;
  }

  .weighings-action-bar .weighings-btn {
    width: 100%;
  }

  .weighings-table {
    display: block;
    overflow-x: auto;
  }
}
</style>