<template>
  <div class="weighing-wrap">

    <!-- ШАПКА -->
    <div class="weighing-header">
      <div>
        <h2 class="weighing-title">Взвешивание атлета</h2>
        <p class="weighing-subtitle">Заполните форму для регистрации веса</p>
      </div>
    </div>

    <!-- ПРОГРЕСС ШАГОВ -->
    <div class="steps-bar">
      <div
          v-for="(step, i) in steps"
          :key="i"
          class="step-item"
          :class="{
            'step-done': currentStep > i + 1,
            'step-active': currentStep === i + 1
          }"
      >
        <div class="step-circle">
          <span v-if="currentStep > i + 1">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="step-label">{{ step }}</span>
        <div v-if="i < steps.length - 1" class="step-line" :class="{ 'line-done': currentStep > i + 1 }"></div>
      </div>
    </div>

    <!-- ПОЛОСКА ЗАГРУЗКИ -->
    <div v-if="isLoading" class="loading-bar">
      <div class="loading-bar-fill"></div>
    </div>

    <form @submit.prevent="weighAthlete" class="weighing-form">

      <!-- ШАГ 1: Турнир и категория -->
      <div class="form-step step-visible">
        <div class="step-heading">
          <span class="step-badge">1</span>
          Выберите турнир и категорию
        </div>

        <div class="form-row-two">
          <!-- Турнир -->
          <div class="form-group" :class="{ 'has-error': errors.tournament_id, 'is-filled': weighingForm.tournament_id }">
            <label for="tournament_id">Турнир <span class="req">*</span></label>
            <div class="select-wrapper">
              <select
                  v-model="weighingForm.tournament_id"
                  id="tournament_id"
                  @change="onTournamentChange"
                  :disabled="isLoading"
              >
                <option value="">— Выберите турнир —</option>
                <option v-for="t in tournaments" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <span class="select-arrow">▾</span>
            </div>
            <span v-if="errors.tournament_id" class="field-error">{{ errors.tournament_id }}</span>
          </div>

          <!-- Категория -->
          <div class="form-group" :class="{ 'has-error': errors.category_id, 'is-filled': weighingForm.category_id }">
            <label for="category_id">Категория веса <span class="req">*</span></label>
            <div class="select-wrapper">
              <select
                  v-model="weighingForm.category_id"
                  id="category_id"
                  :disabled="!weighingForm.tournament_id || isLoadingCategories"
                  @change="onCategoryChange"
              >
                <option value="">— Выберите категорию —</option>
                <option v-for="cat in tournamentCategories" :key="cat.id" :value="cat.id">
                  {{ formatCategoryLabel(cat) }}
                </option>
              </select>
              <span class="select-arrow">▾</span>
            </div>
            <div class="field-hint">
              <span v-if="isLoadingCategories" class="hint-loading">⟳ Загрузка...</span>
              <span v-else-if="weighingForm.tournament_id && tournamentCategories.length === 0" class="hint-warn">
                Нет категорий для этого турнира
              </span>
            </div>
            <span v-if="errors.category_id" class="field-error">{{ errors.category_id }}</span>
          </div>
        </div>
      </div>

      <!-- ШАГ 2: Выбор атлета -->
      <div class="form-step" :class="currentStep >= 2 ? 'step-visible' : 'step-locked'">
        <div class="step-heading">
          <span class="step-badge" :class="{ 'badge-inactive': currentStep < 2 }">2</span>
          Выберите спортсмена
        </div>

        <div class="athlete-search-row">
          <span class="search-icon">🔍</span>
          <input
              v-model="searchAthleteQuery"
              type="text"
              placeholder="Поиск по имени атлета..."
              class="athlete-search"
              :disabled="!weighingForm.category_id || isLoadingAthletes"
          />
        </div>

        <div class="athletes-table-box">
          <div v-if="!weighingForm.category_id" class="table-placeholder">
            <div class="placeholder-icon">👤</div>
            <p>Сначала выберите категорию</p>
          </div>

          <div v-else-if="isLoadingAthletes" class="table-placeholder">
            <div class="spinner"></div>
            <p>Загружаем список атлетов...</p>
          </div>

          <div v-else-if="categoryAthletes.length === 0" class="table-placeholder">
            <div class="placeholder-icon">😕</div>
            <p>Нет зарегистрированных атлетов в этой категории</p>
          </div>

          <template v-else>
            <div class="athletes-count">
              Найдено: <strong>{{ filteredCategoryAthletes.length }}</strong>
              <span v-if="searchAthleteQuery"> из {{ categoryAthletes.length }}</span>
              атлетов
            </div>

            <div class="athletes-scroll">
              <table class="athletes-table">
                <thead>
                <tr>
                  <th class="col-select"></th>
                  <th>ФИО</th>
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
                    class="athlete-row"
                    :class="{ 'row-selected': weighingForm.athlete_id === (ath.athlete_id || ath.id) }"
                    @click="weighingForm.athlete_id = ath.athlete_id || ath.id"
                >
                  <td class="col-select">
                    <div class="radio-custom" :class="{ 'radio-checked': weighingForm.athlete_id === (ath.athlete_id || ath.id) }">
                      <div class="radio-dot"></div>
                    </div>
                  </td>
                  <td class="col-name">{{ getFullName(ath) }}</td>
                  <td>{{ formatBirthDate(ath.birth_date) }}</td>
                  <td><span class="age-badge">{{ ath.age ?? '—' }}</span></td>
                  <td class="col-club">{{ ath.club_name || '—' }}</td>
                  <td>
                    <span class="gender-tag" :class="ath.gender === 'male' ? 'gender-m' : 'gender-f'">
                      {{ formatGender(ath.gender) }}
                    </span>
                  </td>
                </tr>
                </tbody>
              </table>

              <div v-if="filteredCategoryAthletes.length === 0 && searchAthleteQuery" class="table-placeholder small">
                <p>Ничего не найдено по запросу «{{ searchAthleteQuery }}»</p>
              </div>
            </div>
          </template>
        </div>

        <!-- Карточка выбранного атлета -->
        <div v-if="selectedAthleteInfo" class="selected-athlete-card">
          <div class="selected-avatar">{{ selectedAthleteInitials }}</div>
          <div class="selected-info">
            <div class="selected-name">{{ selectedAthleteInfo }}</div>
            <div class="selected-label">Выбранный спортсмен</div>
          </div>
          <button type="button" class="deselect-btn" @click="weighingForm.athlete_id = null" title="Отменить выбор">✕</button>
        </div>

        <span v-if="errors.athlete_id" class="field-error">{{ errors.athlete_id }}</span>
      </div>

      <!-- ШАГ 3: Вес и примечания -->
      <div class="form-step" :class="currentStep >= 3 ? 'step-visible' : 'step-locked'">
        <div class="step-heading">
          <span class="step-badge" :class="{ 'badge-inactive': currentStep < 3 }">3</span>
          Укажите вес и примечания
        </div>

        <div class="form-row-two">
          <div class="form-group" :class="{ 'has-error': errors.weight }">
            <label for="weight">Вес (кг) <span class="req">*</span></label>
            <div class="weight-input-wrap">
              <input
                  v-model.number="weighingForm.weight"
                  type="number"
                  id="weight"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  :disabled="isLoading"
                  class="weight-input"
              />
              <span class="weight-unit">кг</span>
            </div>
            <span v-if="errors.weight" class="field-error">{{ errors.weight }}</span>
          </div>

          <div class="form-group">
            <label for="notes">Примечания</label>
            <textarea
                v-model="weighingForm.notes"
                id="notes"
                placeholder="Дополнительная информация (необязательно)"
                rows="3"
                :disabled="isLoading"
                class="notes-input"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- СВОДКА + КНОПКА -->
      <div class="form-footer">
        <div v-if="currentStep === 4" class="summary-row">
          <div class="summary-chip">
            <span class="chip-label">Турнир</span>
            <span class="chip-val">{{ currentTournamentName }}</span>
          </div>
          <div class="summary-chip">
            <span class="chip-label">Категория</span>
            <span class="chip-val">{{ currentCategoryName }}</span>
          </div>
          <div class="summary-chip">
            <span class="chip-label">Атлет</span>
            <span class="chip-val">{{ selectedAthleteInfo }}</span>
          </div>
          <div class="summary-chip chip-weight">
            <span class="chip-label">Вес</span>
            <span class="chip-val">{{ weighingForm.weight }} кг</span>
          </div>
        </div>

        <button
            type="submit"
            class="submit-btn"
            :disabled="isLoading || submitDisabled"
            :class="{ 'btn-ready': !submitDisabled && !isLoading }"
        >
          <span v-if="isLoading" class="btn-spinner">⟳</span>
          {{ isLoading ? 'Регистрация...' : 'Зарегистрировать вес' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import { fetchCreateWeight, fetchRegister } from '@/components/View/Weighings/fetchWeighings.js'
import { fetchCategoriesById } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'

const emit = defineEmits(['show-toast'])

const isLoading = ref(false)

const weighingForm = ref({
  tournament_id: null,
  category_id: null,
  athlete_id: null,
  weight: null,
  notes: ''
})

const errors = ref({})
const tournaments = ref([])
const tournamentCategories = ref([])
const categoryAthletes = ref([])
const isLoadingCategories = ref(false)
const isLoadingAthletes = ref(false)
const searchAthleteQuery = ref('')

const steps = ['Турнир и категория', 'Спортсмен', 'Вес']

// Шаг прогресса
const currentStep = computed(() => {
  if (!weighingForm.value.tournament_id || !weighingForm.value.category_id) return 1
  if (!weighingForm.value.athlete_id) return 2
  if (!weighingForm.value.weight) return 3
  return 4
})

const filteredCategoryAthletes = computed(() => {
  let list = categoryAthletes.value
  if (searchAthleteQuery.value.trim()) {
    const q = searchAthleteQuery.value.toLowerCase().trim()
    list = list.filter(ath => {
      const name = (getFullName(ath) || '').toLowerCase()
      return name.includes(q) || String(ath.athlete_id || ath.id || '').includes(q)
    })
  }
  return list
})

const submitDisabled = computed(() =>
    !weighingForm.value.tournament_id ||
    !weighingForm.value.category_id ||
    !weighingForm.value.athlete_id ||
    weighingForm.value.weight == null
)

const currentTournamentName = computed(() => {
  const t = tournaments.value.find(x => x.id === weighingForm.value.tournament_id)
  return t?.name || '—'
})

const currentCategoryName = computed(() => {
  const c = tournamentCategories.value.find(x => x.id === weighingForm.value.category_id)
  return c ? formatCategoryLabel(c) : '—'
})

const selectedAthleteInfo = computed(() => {
  if (!weighingForm.value.athlete_id) return null
  const ath = categoryAthletes.value.find(
      x => (x.athlete_id || x.id) === weighingForm.value.athlete_id
  )
  return ath ? getFullName(ath) : null
})

const selectedAthleteInitials = computed(() => {
  if (!selectedAthleteInfo.value) return '?'
  return selectedAthleteInfo.value
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase()
})

// Утилиты
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
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatGender = (gender) => {
  if (gender === 'male') return 'М'
  if (gender === 'female') return 'Ж'
  return '—'
}

// Загрузчики
const loadTournaments = async () => {
  const res = await fetchTournaments()
  if (res.success) {
    tournaments.value = res.data?.tournaments || res.data || []
  } else {
    emit('show-toast', 'Ошибка загрузки турниров', 'error')
  }
}

const loadCategories = async () => {
  if (!weighingForm.value.tournament_id) { tournamentCategories.value = []; return }
  isLoadingCategories.value = true
  try {
    const catRes = await fetchCategoriesById(Number(weighingForm.value.tournament_id))
    if (catRes.success && catRes.data) {
      tournamentCategories.value = (catRes.data || []).sort((a, b) => {
        if (a.min_weight !== undefined && b.min_weight !== undefined) return a.min_weight - b.min_weight
        return (a.name || '').localeCompare(b.name || '')
      })
    } else {
      tournamentCategories.value = []
      emit('show-toast', 'Не удалось загрузить категории', 'error')
    }
  } catch (err) {
    tournamentCategories.value = []
    emit('show-toast', 'Ошибка загрузки категорий', 'error')
  } finally {
    isLoadingCategories.value = false
  }
}

const loadCategoryAthletes = async () => {
  if (!weighingForm.value.tournament_id || !weighingForm.value.category_id) { categoryAthletes.value = []; return }
  isLoadingAthletes.value = true
  try {
    const res = await fetchRegister(
        Number(weighingForm.value.tournament_id),
        Number(weighingForm.value.category_id)
    )
    if (res.success) {
      categoryAthletes.value = res.data?.athletes || res.data || []
    } else {
      categoryAthletes.value = []
      emit('show-toast', 'Не удалось загрузить список атлетов', 'error')
    }
  } catch (err) {
    categoryAthletes.value = []
    emit('show-toast', 'Ошибка загрузки списка атлетов', 'error')
  } finally {
    isLoadingAthletes.value = false
  }
}

// Обработчики
const onTournamentChange = () => {
  weighingForm.value.category_id = null
  weighingForm.value.athlete_id = null
  weighingForm.value.weight = null
  weighingForm.value.notes = ''
  searchAthleteQuery.value = ''
  tournamentCategories.value = []
  categoryAthletes.value = []
  loadCategories()
}

const onCategoryChange = () => {
  weighingForm.value.athlete_id = null
  weighingForm.value.weight = null
  weighingForm.value.notes = ''
  searchAthleteQuery.value = ''
  categoryAthletes.value = []
  loadCategoryAthletes()
}

// Валидация
const validateWeighingForm = () => {
  errors.value = {}
  let valid = true
  if (!weighingForm.value.tournament_id) { errors.value.tournament_id = 'Выберите турнир'; valid = false }
  if (!weighingForm.value.category_id) { errors.value.category_id = 'Выберите категорию'; valid = false }
  if (!weighingForm.value.athlete_id) { errors.value.athlete_id = 'Выберите спортсмена'; valid = false }
  if (weighingForm.value.weight == null || weighingForm.value.weight <= 0) { errors.value.weight = 'Вес должен быть больше 0'; valid = false }
  return valid
}

// Отправка
const weighAthlete = async () => {
  if (!validateWeighingForm()) return
  isLoading.value = true
  try {
    const payload = {
      tournament_id: Number(weighingForm.value.tournament_id),
      category_id: Number(weighingForm.value.category_id),
      athlete_id: Number(weighingForm.value.athlete_id),
      weight: Number(weighingForm.value.weight),
      notes: weighingForm.value.notes.trim()
    }
    const res = await fetchCreateWeight(payload)
    if (res.success) {
      emit('show-toast', 'Взвешивание успешно создано', 'success')
      weighingForm.value.category_id = null
      weighingForm.value.athlete_id = null
      weighingForm.value.weight = null
      weighingForm.value.notes = ''
      searchAthleteQuery.value = ''
      categoryAthletes.value = []
      tournamentCategories.value = []
      loadCategories()
      alert(res.data.message)
    } else {
      emit('show-toast', res.message || 'Ошибка при создании взвешивания', 'error')
    }
  } catch (err) {
    emit('show-toast', 'Ошибка при создании взвешивания', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTournaments)
</script>

<style scoped>
/* ── ПЕРЕМЕННЫЕ ── */
.weighing-wrap {
  --gold: #c89b3c;
  --gold-light: #e8b84b;
  --gold-pale: #fdf6e3;
  --ink: #1a1a2e;
  --ink-mid: #3d3d5c;
  --ink-soft: #6b6b8a;
  --border: #e4e4f0;
  --surface: #ffffff;
  --surface-2: #f8f8fc;
  --success: #27ae60;
  --danger: #e74c3c;
  --radius: 14px;
  --shadow: 0 4px 24px rgba(26, 26, 46, 0.08);

  font-family: 'Segoe UI', 'Helvetica Neue', sans-serif;
  background: var(--surface);
  border-radius: 20px;
  box-shadow: var(--shadow);
  overflow: hidden;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

/* ── ШАПКА ── */
.weighing-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px 20px;
  background: var(--surface);
  border-bottom: 2px solid var(--border);
}

.weighing-title {
  font-size: 1.45rem;
  font-weight: 700;
  margin: 0 0 4px;
  letter-spacing: -0.3px;
  color: var(--ink);
}

.weighing-subtitle {
  font-size: 0.87rem;
  margin: 0;
  color: var(--ink-soft);
}

/* ── ПРОГРЕСС ── */
.steps-bar {
  display: flex;
  align-items: center;
  padding: 16px 32px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.step-item {
  display: flex;
  align-items: center;
  flex: 1;
}

.step-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ink-soft);
  flex-shrink: 0;
  transition: all 0.3s;
}

.step-active .step-circle {
  border-color: var(--gold);
  background: var(--gold);
  color: white;
  box-shadow: 0 0 0 4px rgba(200, 155, 60, 0.18);
}

.step-done .step-circle {
  border-color: var(--success);
  background: var(--success);
  color: white;
}

.step-label {
  margin-left: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-soft);
  white-space: nowrap;
  transition: color 0.3s;
}

.step-active .step-label { color: var(--ink); }
.step-done .step-label { color: var(--success); }

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 10px;
  transition: background 0.3s;
}

.line-done { background: var(--success); }

/* ── ЗАГРУЗКА ── */
.loading-bar {
  height: 3px;
  background: var(--border);
  overflow: hidden;
}

.loading-bar-fill {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  animation: loadSlide 1.4s ease-in-out infinite;
}

@keyframes loadSlide {
  0% { transform: translateX(-200%); }
  100% { transform: translateX(500%); }
}

/* ── ФОРМА ── */
.weighing-form {
  padding: 28px 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-step {
  transition: opacity 0.3s;
}

.step-visible { opacity: 1; }

.step-locked {
  opacity: 0.3;
  pointer-events: none;
}

.step-heading {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--border);
}

.step-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gold);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  flex-shrink: 0;
}

.badge-inactive {
  background: var(--border);
  color: var(--ink-soft);
}

/* ── ПОЛЯ ── */
.form-row-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.req { color: var(--danger); }

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  width: 100%;
  padding: 11px 40px 11px 14px;
  border: 2px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  font-size: 0.95rem;
  color: var(--ink);
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.select-wrapper select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.15);
}

.select-wrapper select:disabled {
  background: var(--surface-2);
  cursor: not-allowed;
  color: var(--ink-soft);
}

.select-arrow {
  position: absolute;
  right: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-soft);
  pointer-events: none;
  font-size: 0.85rem;
}

.is-filled .select-wrapper select { border-color: rgba(200, 155, 60, 0.45); }
.has-error .select-wrapper select,
.has-error .weight-input { border-color: var(--danger) !important; }

.field-hint {
  min-height: 18px;
  font-size: 0.78rem;
}

.hint-loading { color: var(--ink-soft); font-style: italic; }
.hint-warn { color: var(--danger); }

.field-error {
  font-size: 0.78rem;
  color: var(--danger);
  font-weight: 600;
}

/* ── ПОИСК ── */
.athlete-search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.search-icon { font-size: 1rem; flex-shrink: 0; }

.athlete-search {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 0.95rem;
  color: var(--ink);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.athlete-search:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.15);
}

.athlete-search:disabled {
  background: var(--surface-2);
  cursor: not-allowed;
}

/* ── ТАБЛИЦА АТЛЕТОВ ── */
.athletes-table-box {
  border: 2px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
}

.athletes-count {
  padding: 9px 16px;
  font-size: 0.8rem;
  color: var(--ink-soft);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.athletes-count strong { color: var(--ink); }

.athletes-scroll {
  max-height: 320px;
  overflow-y: auto;
}

.athletes-scroll::-webkit-scrollbar { width: 4px; }
.athletes-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }

.athletes-table {
  width: 100%;
  border-collapse: collapse;
}

.athletes-table thead tr {
  position: sticky;
  top: 0;
  z-index: 2;
}

.athletes-table th {
  padding: 9px 14px;
  text-align: left;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ink-soft);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: var(--surface-2);
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

.athletes-table td {
  padding: 10px 14px;
  font-size: 0.9rem;
  color: var(--ink);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.athlete-row {
  cursor: pointer;
  transition: background 0.12s;
}

.athlete-row:hover td { background: var(--gold-pale); }
.athlete-row:last-child td { border-bottom: none; }

.row-selected td { background: #fff8e8 !important; }
.row-selected .col-name { font-weight: 700; color: var(--gold); }

.col-select { width: 44px; text-align: center; }
.col-name { min-width: 150px; }
.col-club { max-width: 150px; overflow: hidden; text-overflow: ellipsis; }

.radio-custom {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  transition: border-color 0.2s;
}

.radio-checked { border-color: var(--gold); }

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: background 0.2s;
}

.radio-checked .radio-dot { background: var(--gold); }

.age-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 20px;
  background: var(--surface-2);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ink-mid);
}

.gender-tag {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.gender-m { background: #e8f0fe; color: #1a73e8; }
.gender-f { background: #fce8f3; color: #c2185b; }

.table-placeholder {
  text-align: center;
  padding: 36px 20px;
  color: var(--ink-soft);
}

.table-placeholder.small { padding: 18px; }
.table-placeholder p { margin: 0; font-size: 0.88rem; }
.placeholder-icon { font-size: 2.2rem; margin-bottom: 8px; opacity: 0.45; }

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--border);
  border-top-color: var(--gold);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── ВЫБРАННЫЙ АТЛЕТ ── */
.selected-athlete-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fff8e8, #fdf3d4);
  border: 2px solid rgba(200, 155, 60, 0.28);
}

.selected-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--gold);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 800;
  flex-shrink: 0;
}

.selected-info { flex: 1; }

.selected-name {
  font-weight: 700;
  color: var(--ink);
  font-size: 0.93rem;
}

.selected-label {
  font-size: 0.75rem;
  color: var(--ink-soft);
  margin-top: 1px;
}

.deselect-btn {
  background: none;
  border: none;
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.95rem;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
  line-height: 1;
}

.deselect-btn:hover { background: rgba(231, 76, 60, 0.1); color: var(--danger); }

/* ── ВЕС ── */
.weight-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.weight-input {
  width: 100%;
  padding: 12px 52px 12px 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--ink);
  text-align: center;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.weight-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.15);
}

.weight-input:disabled {
  background: var(--surface-2);
  cursor: not-allowed;
}

.weight-unit {
  position: absolute;
  right: 15px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ink-soft);
  pointer-events: none;
}

.notes-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--border);
  border-radius: 10px;
  font-size: 0.93rem;
  color: var(--ink);
  resize: vertical;
  min-height: 76px;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  box-sizing: border-box;
}

.notes-input:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.15);
}

/* ── СВОДКА + КНОПКА ── */
.form-footer {
  border-top: 2px solid var(--border);
  padding-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-chip {
  display: flex;
  flex-direction: column;
  padding: 7px 13px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  min-width: 110px;
}

.chip-weight {
  background: var(--gold-pale);
  border-color: rgba(200, 155, 60, 0.3);
}

.chip-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ink-soft);
  letter-spacing: 0.4px;
  margin-bottom: 2px;
}

.chip-val {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--ink);
}

.chip-weight .chip-val {
  color: var(--gold);
  font-size: 1.05rem;
  font-weight: 800;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  background: #ccc;
  color: white;
  transition: all 0.3s;
  letter-spacing: 0.3px;
}

.btn-ready {
  background: linear-gradient(135deg, var(--gold), var(--gold-light));
  box-shadow: 0 4px 16px rgba(200, 155, 60, 0.32);
}

.btn-ready:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(200, 155, 60, 0.42);
}

.btn-ready:active { transform: translateY(0); }

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.btn-spinner {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

/* ── АДАПТИВ ── */
@media (max-width: 680px) {
  .weighing-header { padding: 18px 20px; }
  .steps-bar { padding: 12px 20px; }
  .step-label { display: none; }
  .weighing-form { padding: 20px; gap: 20px; }

  .form-row-two { grid-template-columns: 1fr; }

  .athletes-scroll { overflow-x: auto; }
  .athletes-table { min-width: 560px; }

  .summary-row { flex-direction: column; }
  .summary-chip { min-width: auto; }
}
</style>