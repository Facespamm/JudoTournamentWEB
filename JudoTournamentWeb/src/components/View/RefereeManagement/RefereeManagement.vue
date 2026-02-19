<template>
  <div class="referees-management">

    <div class="page-header">
      <div>
        <h1>Управление судьями</h1>
        <p>Регистрация, редактирование и назначение судей дзюдо</p>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        <span class="btn-icon">+</span> Добавить судью
      </button>
    </div>

    <div class="filters-bar">
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.8"/>
          <path d="M14 14l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        <input
            v-model="searchQuery"
            type="search"
            placeholder="Поиск по ФИО, категории, телефону..."
            class="search-input"
        />
      </div>
      <select v-model="categoryFilter" class="filter-select">
        <option value="">Все категории</option>
        <option
            v-for="cat in categories"
            :key="cat.id ?? cat.name ?? cat"
            :value="cat.name ?? cat"
        >
          {{ cat.name ?? cat }}
        </option>
      </select>
    </div>

    <div class="table-card">
      <div class="card-toolbar">
        <span class="count-label">
          {{ filteredReferees.length }} {{ pluralReferees(filteredReferees.length) }}
        </span>
        <div class="toolbar-actions">
          <button class="tb-btn tb-edit"   :disabled="!selectedRefereeId" @click="openEditModal">Редактировать</button>
          <button class="tb-btn tb-assign" :disabled="!selectedRefereeId" @click="openAssignModal">Назначить</button>
          <button class="tb-btn tb-delete" :disabled="!selectedRefereeId" @click="confirmDelete">Удалить</button>
        </div>
      </div>

      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Загрузка судей…</p>
      </div>

      <div v-else-if="filteredReferees.length === 0" class="state-box">
        <div class="state-icon">⚖️</div>
        <h3>Судьи не найдены</h3>
        <p>Измените параметры поиска или добавьте нового судью</p>
        <button class="btn-primary" style="margin-top:8px" @click="openCreateModal">+ Добавить судью</button>
      </div>

      <div v-else class="table-scroll">
        <table class="ref-table">
          <thead>
          <tr>
            <th class="th-radio"></th>
            <th class="th-name">ФИО</th>
            <th class="th-cat">Категория</th>
            <th class="th-phone">Телефон</th>
            <th class="th-email">Email</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="ref in filteredReferees"
              :key="ref.id"
              :class="['ref-row', { 'ref-row--selected': selectedRefereeId === ref.id }]"
              @click="selectReferee(ref.id)"
          >
            <td class="td-radio">
              <span class="radio-dot" :class="{ active: selectedRefereeId === ref.id }"></span>
            </td>
            <td class="td-name" data-label="ФИО">
              {{ ref.last_name }} {{ ref.first_name }} {{ ref.middle_name || '' }}
            </td>
            <td class="td-cat" data-label="Категория">
              <span v-if="ref.certification_level" class="badge" :class="badgeClass(ref.certification_level)">
                {{ ref.certification_level }}
              </span>
              <span v-else class="muted">—</span>
            </td>
            <td class="td-phone" data-label="Телефон">
              <span :class="ref.phone ? '' : 'muted'">{{ ref.phone || '—' }}</span>
            </td>
            <td class="td-email" data-label="Email">
              <span :class="ref.email ? '' : 'muted'">{{ ref.email || '—' }}</span>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AddRefereeModal
        :is-open="showModal && !editingRefereeData"
        @close="closeModal"
        @submit="handleModalSubmit"
    />
    <UpdateRefereeModal
        :is-open="showModal && !!editingRefereeData"
        :referee="editingRefereeData"
        @close="closeModal"
        @submit="handleModalSubmit"
    />

    <div v-if="showAssignModal" class="overlay" @click="closeAssignModal">
      <div class="modal" @click.stop>
        <h3>Назначение судьи</h3>
        <p>Выберите турнир для назначения:</p>
        <div class="assign-placeholder">(список турниров)</div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="closeAssignModal">Отмена</button>
          <button class="btn-primary">Назначить</button>
        </div>
      </div>
    </div>

    <div v-if="refereeToDelete" class="overlay" @click="cancelDelete">
      <div class="modal modal--danger" @click.stop>
        <div class="danger-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <h3>Удалить судью?</h3>
        <p class="modal-name">{{ refereeToDelete.last_name }} {{ refereeToDelete.first_name }}</p>
        <p class="modal-warn">Это действие нельзя отменить</p>
        <div class="modal-actions">
          <button class="btn-ghost" @click="cancelDelete">Отмена</button>
          <button class="btn-danger" @click="executeDelete">Удалить</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getReferees } from '@/components/View/Referee/fetchReferee.js'
import { DeleteReferee } from '@/components/View/RefereeManagement/fetchRefereeManagement.js'
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import AddRefereeModal from '@/components/View/RefereeManagement/AddRefereeModal.vue'
import UpdateRefereeModal from '@/components/View/RefereeManagement/UpdateRefereeModal.vue'

const referees           = ref([])
const categories         = ref([])
const searchQuery        = ref('')
const categoryFilter     = ref('')
const loading            = ref(false)
const showModal          = ref(false)
const editingRefereeData = ref(null)
const selectedRefereeId  = ref(null)
const refereeToDelete    = ref(null)
const showAssignModal    = ref(false)

const filteredReferees = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return referees.value.filter(r => {
    const full = `${r.last_name||''} ${r.first_name||''} ${r.middle_name||''}`.toLowerCase()
    const match = full.includes(q)
        || (r.certification_level||'').toLowerCase().includes(q)
        || (r.phone||'').includes(q)
        || (r.email||'').toLowerCase().includes(q)
    const cat = !categoryFilter.value || r.certification_level === categoryFilter.value
    return match && cat
  })
})

function pluralReferees(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'судья'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'судьи'
  return 'судей'
}

function badgeClass(level) {
  if (!level) return 'badge--gray'
  if (level.includes('Международный')) return 'badge--gold'
  if (level.includes('1')) return 'badge--blue'
  if (level.includes('2')) return 'badge--teal'
  if (level.includes('3')) return 'badge--green'
  return 'badge--gray'
}

async function loadReferees() {
  loading.value = true
  try {
    const data = await getReferees()
    referees.value = Array.isArray(data) ? data : data?.referees || []
  } catch (e) {
    console.error('Ошибка загрузки судей:', e)
    referees.value = []
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const result = await fetchCategories()
    if (result.success && Array.isArray(result.data?.categories)) {
      categories.value = result.data.categories
    } else {
      console.warn('Категории не загружены:', result.error)
      categories.value = []
    }
  } catch (e) {
    console.error('Ошибка загрузки категорий:', e)
    categories.value = []
  }
}

const openCreateModal   = () => { editingRefereeData.value = null; showModal.value = true }
const openEditModal     = () => {
  const r = referees.value.find(r => r.id === selectedRefereeId.value)
  if (r) { editingRefereeData.value = { ...r }; showModal.value = true }
}
const closeModal        = () => { showModal.value = false; editingRefereeData.value = null }
const handleModalSubmit = ({ success }) => { if (success) loadReferees() }
const selectReferee     = (id) => { selectedRefereeId.value = selectedRefereeId.value === id ? null : id }
const openAssignModal   = () => { showAssignModal.value = true }
const closeAssignModal  = () => { showAssignModal.value = false }
const confirmDelete     = () => {
  const r = referees.value.find(r => r.id === selectedRefereeId.value)
  if (r) refereeToDelete.value = r
}
const cancelDelete  = () => { refereeToDelete.value = null }
const executeDelete = async () => {
  try {
    await DeleteReferee(refereeToDelete.value.id)
    refereeToDelete.value   = null
    selectedRefereeId.value = null
    await loadReferees()
  } catch (e) {
    alert(`Не удалось удалить судью:\n${e.message || e}`)
  }
}

onMounted(() => {
  loadReferees()
  loadCategories()
})
</script>

<style scoped>

/* ══════════════════════════════════════
   Страница
══════════════════════════════════════ */
.referees-management {
  padding: 80px 28px 60px;
  margin-right: 60px;
  max-width: 1200px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #1a1a1a;
}

/* ══════════════════════════════════════
   Шапка
══════════════════════════════════════ */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.page-header h1 {
  font-size: 1.7rem;
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.2;
}
.page-header p {
  margin: 0;
  color: #6b7280;
  font-size: 0.93rem;
}

/* ══════════════════════════════════════
   Кнопки
══════════════════════════════════════ */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #c89b3c;
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.93rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, transform 0.12s;
}
.btn-primary:hover { background: #b5892e; transform: translateY(-1px); }
.btn-icon { font-size: 1.1rem; line-height: 1; }

.btn-ghost {
  padding: 9px 16px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover { background: #f3f4f6; }

.btn-danger {
  padding: 9px 16px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-danger:hover { background: #dc2626; }

/* ══════════════════════════════════════
   Фильтры
══════════════════════════════════════ */
.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9ca3af;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.92rem;
  background: #fff;
  color: #1a1a1a;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.search-input:focus { outline: none; border-color: #c89b3c; }
.search-input::placeholder { color: #9ca3af; }

.filter-select {
  min-width: 210px;
  padding: 10px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.92rem;
  background: #fff;
  color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.15s;
}
.filter-select:focus { outline: none; border-color: #c89b3c; }

/* ══════════════════════════════════════
   Карточка
══════════════════════════════════════ */
.table-card {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 20px;
  border-bottom: 1.5px solid #e5e7eb;
  gap: 12px;
  flex-wrap: wrap;
  background: #fafafa;
}
.count-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tb-btn {
  padding: 7px 13px;
  border: 1.5px solid transparent;
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.13s;
  white-space: nowrap;
}
.tb-btn:disabled { opacity: 0.38; cursor: not-allowed; pointer-events: none; }

.tb-edit   { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
.tb-edit:hover:not(:disabled)   { background: #dbeafe; }
.tb-assign { background: #f5f3ff; border-color: #ddd6fe; color: #6d28d9; }
.tb-assign:hover:not(:disabled) { background: #ede9fe; }
.tb-delete { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
.tb-delete:hover:not(:disabled) { background: #ffe4e6; }

/* ══════════════════════════════════════
   Скролл таблицы
══════════════════════════════════════ */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ══════════════════════════════════════
   Таблица
══════════════════════════════════════ */
.ref-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
  table-layout: fixed;
}

.ref-table thead tr {
  background: #f9fafb;
  border-bottom: 1.5px solid #e5e7eb;
}

.ref-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

/* Ширины колонок */
.th-radio, .td-radio { width: 48px; text-align: center; padding-left: 16px; padding-right: 0; }
.th-name,  .td-name  { width: 27%; }
.th-cat,   .td-cat   { width: 27%; }
.th-phone, .td-phone { width: 18%; }
.th-email, .td-email { width: 28%; }

/* Строки */
.ref-row {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.1s;
}
.ref-row:last-child            { border-bottom: none; }
.ref-row:hover                 { background: #f9fafb; }
.ref-row--selected             { background: #fef9ec; }
.ref-row--selected:hover       { background: #fdf3d7; }

.ref-table td {
  padding: 13px 16px;
  font-size: 0.92rem;
  color: #1a1a1a;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Радио */
.radio-dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: border-color 0.15s;
  flex-shrink: 0;
}
.radio-dot.active { border-color: #c89b3c; }
.radio-dot.active::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: #c89b3c;
  border-radius: 50%;
}

.td-name { font-weight: 600; }

/* Бейджи */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge--gold  { background: #fef9ec; color: #92610a; border: 1px solid #f5d27a; }
.badge--blue  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.badge--teal  { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
.badge--green { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.badge--gray  { background: #f3f4f6; color: #4b5563; border: 1px solid #d1d5db; }

.muted { color: #9ca3af; }

/* ══════════════════════════════════════
   Состояния
══════════════════════════════════════ */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  text-align: center;
  gap: 8px;
  color: #6b7280;
}
.state-box h3 { margin: 0; font-size: 1.05rem; color: #374151; }
.state-box p  { margin: 0; font-size: 0.9rem; }
.state-icon   { font-size: 3rem; opacity: 0.45; margin-bottom: 4px; }

.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #e5e7eb;
  border-top-color: #c89b3c;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  margin-bottom: 4px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════
   Оверлей + модалки
══════════════════════════════════════ */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  backdrop-filter: blur(2px);
}
.modal {
  background: #fff;
  border-radius: 14px;
  padding: 26px 26px 22px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.16);
}
.modal h3      { margin: 0 0 10px; font-size: 1.1rem; font-weight: 700; }
.modal p       { margin: 0 0 6px; font-size: 0.9rem; color: #4b5563; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

.modal--danger { text-align: center; }
.danger-icon {
  width: 50px;
  height: 50px;
  background: #fff1f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  color: #ef4444;
}
.danger-icon svg { width: 24px; height: 24px; }
.modal-name { font-weight: 700 !important; font-size: 1rem !important; color: #1a1a1a !important; margin: 4px 0 6px !important; }
.modal-warn { font-size: 0.8rem !important; color: #ef4444 !important; }
.modal--danger .modal-actions { justify-content: center; }

.assign-placeholder {
  background: #f9fafb;
  border: 1.5px dashed #e5e7eb;
  border-radius: 8px;
  padding: 18px;
  font-size: 0.85rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 10px;
}

/* ══════════════════════════════════════
   Адаптив — планшет
══════════════════════════════════════ */
@media (max-width: 860px) {
  .th-email, .td-email { display: none; }
  .th-name  { width: 32%; }
  .th-cat   { width: 32%; }
  .th-phone { width: 22%; }
}

/* ══════════════════════════════════════
   Адаптив — мобильный
══════════════════════════════════════ */
@media (max-width: 600px) {
  .referees-management { padding: 16px 12px 40px; }

  .page-header { flex-direction: column; align-items: stretch; }
  .page-header .btn-primary { width: 100%; justify-content: center; }

  .filters-bar { flex-direction: column; }
  .filter-select { min-width: auto; width: 100%; }

  .table-scroll { overflow-x: visible; }
  .ref-table    { min-width: unset; table-layout: auto; }
  .ref-table thead { display: none; }

  .ref-row {
    display: grid;
    grid-template-columns: 36px 1fr;
    grid-template-rows: auto auto auto;
    column-gap: 10px;
    row-gap: 3px;
    padding: 12px 14px;
    cursor: pointer;
  }

  .ref-table td {
    display: block;
    padding: 0;
    overflow: visible;
    white-space: normal;
    text-overflow: unset;
  }

  .td-radio {
    grid-column: 1;
    grid-row: 1 / 4;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .td-name  { grid-column: 2; grid-row: 1; font-size: 0.93rem; }
  .td-cat   { grid-column: 2; grid-row: 2; margin-top: 2px; }
  .td-phone { grid-column: 2; grid-row: 3; font-size: 0.83rem; color: #6b7280; margin-top: 2px; }
  .td-email { display: none; }

  .card-toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-actions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .tb-btn { text-align: center; padding: 8px 6px; font-size: 0.82rem; }
}

@media (max-width: 400px) {
  .toolbar-actions { grid-template-columns: 1fr; }
}
</style>