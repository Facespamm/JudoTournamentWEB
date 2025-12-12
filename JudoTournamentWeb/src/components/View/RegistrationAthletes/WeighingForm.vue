<template>
  <div class="weighing-component">
    <div class="form-section">
      <h3>Взвешивание</h3>

      <!-- Индикатор загрузки -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Регистрация...</p>
      </div>

      <form @submit.prevent="weighAthlete">
        <div class="form-grid form-grid-double">
          <div class="form-group">
            <label for="tournament_id">Турнир *</label>
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

          <div class="form-group">
            <label for="athlete_id">Спортсмен *</label>
            <select
                v-model="weighingForm.athlete_id"
                id="athlete_id"
                required
                :disabled="isLoading || athletes.length === 0"
            >
              <option value="">
                {{ athletes.length === 0 ? 'Загрузка спортсменов...' : 'Выберите спортсмена' }}
              </option>
              <option v-for="athlete in athletes" :key="athlete.id" :value="athlete.id">
                {{ athlete.full_name }}
              </option>
            </select>
            <span v-if="errors.athlete_id" class="error">{{ errors.athlete_id }}</span>
          </div>

          <div class="form-group">
            <label for="weight">Вес (кг) *</label>
            <input
                v-model.number="weighingForm.weight"
                type="number"
                id="weight"
                step="0.1"
                min="0"
                placeholder="Введите вес"
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
                placeholder="Дополнительные заметки (необязательно)"
                rows="3"
                :disabled="isLoading"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="submit-button" :disabled="isLoading">
            {{ isLoading ? 'Регистрация...' : 'Зарегистрировать вес' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Key': 'mobile_app_2024'
}

const emit = defineEmits(['show-toast'])

const isLoading = ref(false)
const weighingForm = ref({
  tournament_id: null,
  athlete_id: null,
  weight: null,
  notes: ''
})

const errors = ref({})
const tournaments = ref([])
const athletes = ref([])
const registrations = ref([])

// API функции как в первом компоненте
const fetchTournaments = async () => {
  try {
    const res = await fetch('/api/tournaments?active=true', {
      headers: API_HEADERS
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { success: true, data: Array.isArray(data) ? data : data.tournaments || [] }
  } catch (e) {
    console.error(e)
    return { success: false, data: [] }
  }
}

const fetchAthletes = async () => {
  try {
    const res = await fetch('/api/athletes', {
      headers: API_HEADERS
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      success: true,
      athletes: data.athletes || (Array.isArray(data) ? data : [])
    }
  } catch (e) {
    console.error(e)
    return { success: false, athletes: [] }
  }
}

const fetchRegistrations = async () => {
  try {
    const res = await fetch('/api/registrations', {
      headers: API_HEADERS
    })
    if (!res.ok) {
      console.warn('Регистрации недоступны, продолжаем без них')
      return { success: false, registrations: [] }
    }
    const data = await res.json()
    return {
      success: true,
      registrations: data.registrations || (Array.isArray(data) ? data : [])
    }
  } catch (e) {
    console.warn('Не удалось загрузить регистрации:', e.message)
    return { success: false, registrations: [] }
  }
}

const createRecordWeight = async (payload) => {
  try {
    const res = await fetch('http://127.0.0.1:5001/weighing/', {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}`)
    }

    const data = await res.json()
    return { success: true, ...data }
  } catch (e) {
    console.error('Ошибка регистрации веса:', e)
    return { success: false, message: e.message }
  }
}

// Загрузка данных
const loadTournaments = async () => {
  try {
    const result = await fetchTournaments()
    if (result.success) {
      tournaments.value = result.data
      console.log('Загружено турниров:', tournaments.value.length)
    }
  } catch (error) {
    console.error('Ошибка загрузки турниров:', error)
  }
}

const loadAthletes = async () => {
  try {
    const result = await fetchAthletes()
    if (result.success) {
      athletes.value = result.athletes
      console.log('Загружено спортсменов:', athletes.value.length)
    }
  } catch (error) {
    console.error('Ошибка загрузки спортсменов:', error)
  }
}

const loadRegistrations = async () => {
  try {
    const result = await fetchRegistrations()
    if (result.success) {
      registrations.value = result.registrations
      console.log('Загружено регистраций:', registrations.value.length)
    }
  } catch (error) {
    console.warn('Не удалось загрузить регистрации:', error.message)
    registrations.value = []
  }
}

// Фильтруем спортсменов по выбранному турниру
const filteredAthletes = computed(() => {
  if (!weighingForm.value.tournament_id) return []

  // Находим регистрации для выбранного турнира
  const tournamentRegistrations = registrations.value.filter(
      reg => reg.tournament_id === weighingForm.value.tournament_id
  )

  // Получаем ID зарегистрированных спортсменов
  const registeredAthleteIds = tournamentRegistrations.map(reg => reg.athlete_id)

  // Фильтруем спортсменов по зарегистрированным ID
  return athletes.value.filter(athlete =>
      registeredAthleteIds.includes(athlete.id)
  )
})

// Обработчик изменения турнира
const onTournamentChange = () => {
  weighingForm.value.athlete_id = null
  errors.value.athlete_id = ''
}

// Валидация формы взвешивания
const validateWeighingForm = () => {
  errors.value = {}
  let isValid = true

  if (!weighingForm.value.tournament_id) {
    errors.value.tournament_id = 'Выберите турнир'
    isValid = false
  }
  if (!weighingForm.value.athlete_id) {
    errors.value.athlete_id = 'Выберите спортсмена'
    isValid = false
  }
  if (!weighingForm.value.weight || weighingForm.value.weight <= 0) {
    errors.value.weight = 'Вес должен быть больше 0'
    isValid = false
  }
  return isValid
}

const weighAthlete = async () => {
  if (!validateWeighingForm()) return

  isLoading.value = true

  try {
    const payload = {
      tournament_id: weighingForm.value.tournament_id,
      athlete_id: weighingForm.value.athlete_id,
      weight: weighingForm.value.weight,
      notes: weighingForm.value.notes || ''
    }

    console.log('Отправка взвешивания:', payload)

    const result = await createRecordWeight(payload)

    if (result.success) {
      emit('show-toast', `Вес зарегистрирован! Категория: ${result.category || 'определяется'}`, 'success')

      // Сбрасываем форму
      weighingForm.value = {
        tournament_id: null,
        athlete_id: null,
        weight: null,
        notes: ''
      }
    } else {
      throw new Error(result.message || 'Ошибка регистрации веса')
    }
  } catch (error) {
    console.error('Ошибка регистрации веса:', error)
    emit('show-toast', 'Ошибка: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadTournaments(),
    loadAthletes(),
    loadRegistrations()
  ])
})
</script>

<style scoped>
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
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

select, input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

select:focus, input:focus, textarea:focus {
  outline: none;
  border-color: #c89b3c;
}

select:disabled, input:disabled, textarea:disabled {
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
  display: block;
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
  min-width: 150px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.form-grid-double {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-grid-double {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .form-actions {
    justify-content: stretch;
  }

  .submit-button {
    min-width: auto;
    width: 100%;
  }
}
</style>