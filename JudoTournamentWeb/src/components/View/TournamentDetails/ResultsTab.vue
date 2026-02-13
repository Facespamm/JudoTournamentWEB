<template>
  <div class="weighing-component">
    <div class="form-section">
      <h3>Взвешивание</h3>

      <!-- Индикатор общей загрузки -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Обработка...</p>
      </div>

      <form @submit.prevent="weighAthlete">
        <div class="form-fields">
          <!-- Турнир -->
          <div class="form-group">
            <label for="tournament_id">Турнир <span class="required">*</span></label>
            <select
                v-model="weighingForm.tournament_id"
                id="tournament_id"
                required
                @change="onTournamentChange"
                :disabled="isLoading"
            >
              <option value="">Выберите турнир</option>
              <option v-for="tournament in tournaments" :key="tournament.id" :value="tournament.id">
                {{ tournament.name }}
              </option>
            </select>
            <span v-if="errors.tournament_id" class="error">{{ errors.tournament_id }}</span>
          </div>

          <!-- Категория веса -->
          <div class="form-group">
            <label for="category_id">Категория веса <span class="required">*</span></label>
            <select
                v-model="weighingForm.category_id"
                id="category_id"
                :disabled="!weighingForm.tournament_id || isLoadingCategories"
                @change="onCategoryChange"
            >
              <option value="">Выберите категорию</option>
              <option v-for="cat in tournamentCategories" :key="cat.id" :value="cat.id">
                {{ formatCategoryLabel(cat) }}
              </option>
            </select>

            <div class="weighings-filter-hint">
              <small v-if="isLoadingCategories" class="hint-loading">Загрузка категорий...</small>
              <small v-else-if="weighingForm.tournament_id && tournamentCategories.length === 0" class="hint-no-data">
                Нет доступных категорий для выбранного турнира
              </small>
            </div>

            <span v-if="errors.category_id" class="error">{{ errors.category_id }}</span>
          </div>

          <!-- Выбор атлета через таблицу -->
          <div class="form-group athlete-selection-group">
            <label>Спортсмен <span class="required">*</span></label>

            <input
                v-model="searchAthleteQuery"
                type="text"
                placeholder="Поиск по имени атлета..."
                class="weighings-search-input"
                :disabled="!weighingForm.category_id || isLoadingAthletes"
            />

            <div class="athletes-table-wrapper">
              <div v-if="isLoadingAthletes" class="loading-message">
                Загрузка списка атлетов...
              </div>

              <div v-else-if="categoryAthletes.length === 0 && weighingForm.category_id" class="no-athletes-message">
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
                    :class="{ 'selected-row': weighingForm.athlete_id === (ath.athlete_id || ath.id) }"
                >
                  <td>
                    <input
                        type="radio"
                        name="selectedAthlete"
                        :value="ath.athlete_id || ath.id"
                        v-model="weighingForm.athlete_id"
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

              <div v-if="!isLoadingAthletes && filteredCategoryAthletes.length === 0 && searchAthleteQuery" class="no-athletes-message">
                Нет атлетов, соответствующих поиску
              </div>
            </div>

            <span v-if="errors.athlete_id" class="error">{{ errors.athlete_id }}</span>
          </div>

          <!-- Вес и примечания -->
          <div class="form-grid-double">
            <div class="form-group">
              <label for="weight">Вес (кг) <span class="required">*</span></label>
              <input
                  v-model.number="weighingForm.weight"
                  type="number"
                  id="weight"
                  step="0.1"
                  min="0"
                  placeholder="Например: 73.5"
                  required
                  :disabled="isLoading"
              />
              <span v-if="errors.weight" class="error">{{ errors.weight }}</span>
            </div>

            <div class="form-group">
              <label for="notes">Примечания</label>
              <textarea
                  v-model="weighingForm.notes"
                  id="notes"
                  placeholder="Дополнительная информация (необязательно)"
                  rows="3"
                  :disabled="isLoading"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-button" :disabled="isLoading || submitDisabled">
            {{ isLoading ? 'Регистрация...' : 'Зарегистрировать вес' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Импортируем готовые функции из проекта
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import { fetchCreateWeight, fetchRegister } from '@/components/View/Weighings/fetchWeighings.js'
import { fetchCategoriesById } from '@/components/View/TournamentDetails/fetchTournamentDetail.js'

const emit = defineEmits(['show-toast'])

const isLoading = ref(false)

// Форма
const weighingForm = ref({
  tournament_id: null,
  category_id: null,
  athlete_id: null,
  weight: null,
  notes: ''
})

const errors = ref({})

// Данные
const tournaments = ref([])
const tournamentCategories = ref([])
const categoryAthletes = ref([])

// Состояния загрузки и поиска
const isLoadingCategories = ref(false)
const isLoadingAthletes = ref(false)
const searchAthleteQuery = ref('')

// Вычисляемые
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

const submitDisabled = computed(() => {
  return !weighingForm.value.tournament_id ||
      !weighingForm.value.category_id ||
      !weighingForm.value.athlete_id ||
      weighingForm.value.weight == null
})

// Утилиты (точно как в большом компоненте)
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

// Загрузчики с использованием импортированных функций
const loadTournaments = async () => {
  const res = await fetchTournaments()
  if (res.success) {
    tournaments.value = res.data?.tournaments || res.data || []
  } else {
    emit('show-toast', 'Ошибка загрузки турниров', 'error')
  }
}

const loadCategories = async () => {
  if (!weighingForm.value.tournament_id) {
    tournamentCategories.value = []
    return
  }

  isLoadingCategories.value = true
  try {
    const tournamentId = Number(weighingForm.value.tournament_id)
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
      emit('show-toast', 'Не удалось загрузить категории', 'error')
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    tournamentCategories.value = []
    emit('show-toast', 'Ошибка загрузки категорий', 'error')
  } finally {
    isLoadingCategories.value = false
  }
}

const loadCategoryAthletes = async () => {
  if (!weighingForm.value.tournament_id || !weighingForm.value.category_id) {
    categoryAthletes.value = []
    return
  }

  isLoadingAthletes.value = true
  try {
    const tournamentId = Number(weighingForm.value.tournament_id)
    const categoryId = Number(weighingForm.value.category_id)

    const res = await fetchRegister(tournamentId, categoryId)

    if (res.success) {
      categoryAthletes.value = res.data?.athletes || res.data || []
    } else {
      categoryAthletes.value = []
      emit('show-toast', 'Не удалось загрузить список атлетов', 'error')
    }
  } catch (err) {
    console.error('Ошибка загрузки атлетов:', err)
    categoryAthletes.value = []
    emit('show-toast', 'Ошибка загрузки списка атлетов', 'error')
  } finally {
    isLoadingAthletes.value = false
  }
}

// Обработчики изменений
const onTournamentChange = () => {
  weighingForm.value.category_id = null
  weighingForm.value.athlete_id = null
  weighingForm.value.weight = null
  weighingForm.value.notes = ''
  searchAthleteQuery.value = ''
  loadCategories()
}

const onCategoryChange = () => {
  weighingForm.value.athlete_id = null
  weighingForm.value.weight = null
  weighingForm.value.notes = ''
  searchAthleteQuery.value = ''
  loadCategoryAthletes()
}

// Валидация
const validateWeighingForm = () => {
  errors.value = {}
  let valid = true

  if (!weighingForm.value.tournament_id) {
    errors.value.tournament_id = 'Выберите турнир'
    valid = false
  }
  if (!weighingForm.value.category_id) {
    errors.value.category_id = 'Выберите категорию'
    valid = false
  }
  if (!weighingForm.value.athlete_id) {
    errors.value.athlete_id = 'Выберите спортсмена'
    valid = false
  }
  if (weighingForm.value.weight == null || weighingForm.value.weight <= 0) {
    errors.value.weight = 'Вес должен быть больше 0'
    valid = false
  }
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

      // Сбрасываем всё ниже турнира
      weighingForm.value.category_id = null
      weighingForm.value.athlete_id = null
      weighingForm.value.weight = null
      weighingForm.value.notes = ''
      searchAthleteQuery.value = ''
      categoryAthletes.value = []
      tournamentCategories.value = [] // опционально, можно оставить
      loadCategories() // если оставляем турнир
    } else {
      emit('show-toast', res.message || 'Ошибка при создании взвешивания', 'error')
    }
  } catch (err) {
    console.error('Ошибка создания взвешивания:', err)
    emit('show-toast', 'Ошибка при создании взвешивания', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadTournaments()
})
</script>

<style scoped>
/* Все стили из предыдущей версии — оставляем без изменений */
.weighing-component {
  width: 100%;
  position: relative;
}

.form-section h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid-double {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

select,
input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

select:focus,
input:focus,
textarea:focus {
  outline: none;
  border-color: #c89b3c;
}

select:disabled,
input:disabled,
textarea:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.error {
  color: #ff4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.required {
  color: #d32f2f;
  font-weight: bold;
}

/* Таблица атлетов */
.athletes-table-wrapper {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  margin-top: 0.5rem;
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

.loading-message,
.no-athletes-message {
  text-align: center;
  padding: 30px 20px;
  color: #666;
  font-size: 15px;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.submit-button {
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-grid-double {
    grid-template-columns: 1fr;
  }

  .athletes-table-wrapper {
    overflow-x: auto;
  }

  .weighings-athletes-table {
    min-width: 700px;
  }
}
</style>