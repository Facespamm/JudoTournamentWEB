<template>
  <div class="manage-categories">
    <h3>Управление категориями</h3>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Создание категории...</p>
    </div>

    <form @submit.prevent="submit">
      <div class="form-grid">
        <div class="form-group">
          <label for="selected_tournament">Выберите турнир *</label>
          <select
              v-model="selectedTournamentId"
              id="selected_tournament"
              :disabled="isLoading"
              required
          >
            <option value="">Выберите турнир</option>
            <option v-for="tournament in tournaments" :key="tournament.id" :value="tournament.id">
              {{ tournament.name }}
            </option>
          </select>
          <span v-if="errors.tournament_id" class="error">{{ errors.tournament_id }}</span>
        </div>

        <div class="form-group">
          <label for="category_name">Название категории *</label>
          <input
              v-model="formData.name"
              type="text"
              id="category_name"
              placeholder="Например: до 60 кг"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="gender">Пол *</label>
          <select
              v-model="formData.gender"
              id="gender"
              :disabled="isLoading"
              required
          >
            <option value="MALE">Мужской</option>
            <option value="FEMALE">Женский</option>
          </select>
          <span v-if="errors.gender" class="error">{{ errors.gender }}</span>
        </div>

        <div class="form-group">
          <label for="min_age">Минимальный возраст</label>
          <input
              v-model.number="formData.min_age"
              type="number"
              id="min_age"
              min="0"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="max_age">Максимальный возраст</label>
          <input
              v-model.number="formData.max_age"
              type="number"
              id="max_age"
              min="0"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="min_weight">Минимальный вес (кг)</label>
          <input
              v-model.number="formData.min_weight"
              type="number"
              id="min_weight"
              min="0"
              step="0.1"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="max_weight">Максимальный вес (кг)</label>
          <input
              v-model.number="formData.max_weight"
              type="number"
              id="max_weight"
              min="0"
              step="0.1"
              :disabled="isLoading"
          />
        </div>
      </div>

      <div class="form-actions">
        <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
        >
          {{ isLoading ? 'Добавление...' : 'Добавить категорию' }}
        </button>
      </div>
    </form>

    <!-- Список добавленных категорий -->
    <div v-if="categories.length > 0" class="categories-list">
      <h4>Добавленные категории:</h4>
      <div class="categories-grid">
        <div v-for="(category, index) in categories" :key="index" class="category-card">
          <div class="category-name">{{ category.name }}</div>
          <div class="category-details">
            <span class="category-gender">{{ category.gender === 'MALE' ? 'Мужская' : 'Женская' }}</span>
            <span v-if="category.min_age || category.max_age" class="category-age">
              Возраст: {{ category.min_age || 0 }}-{{ category.max_age || '∞' }}
            </span>
            <span v-if="category.min_weight || category.max_weight" class="category-weight">
              Вес: {{ category.min_weight || 0 }}-{{ category.max_weight || '∞' }} кг
            </span>
            <span class="category-tournament">
              Турнир: {{ getTournamentName(category.tournament_id) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import { createCategory } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import "./TournamentManagement.css"


const props = defineProps({
  newTournamentId: {
    type: Number,
    default: null
  }
})

const isLoading = ref(false)
const tournaments = ref([])
const selectedTournamentId = ref(null)

const formData = ref({
  name: '',
  gender: 'MALE',
  min_age: 0,
  max_age: 0,
  min_weight: 0,
  max_weight: 0
})

const errors = ref({})
const categories = ref([])

onMounted(async () => {
  await loadTournaments()
})

// Автоматически выбираем новый турнир если он передан
watch(() => props.newTournamentId, (newId) => {
  if (newId) {
    selectedTournamentId.value = newId
  }
})

const loadTournaments = async () => {
  try {
    const result = await fetchTournaments()
    if (result.success) {
      // API возвращает либо массив напрямую, либо в data.tournaments
      if (Array.isArray(result.data)) {
        tournaments.value = result.data
      } else if (result.data && result.data.tournaments) {
        tournaments.value = result.data.tournaments
      } else {
        tournaments.value = []
      }
      console.log('Загружено турниров:', tournaments.value.length)
    } else {
      console.error('Ошибка загрузки турниров:', result.error)
    }
  } catch (error) {
    console.error('Ошибка при загрузке турниров:', error)
  }
}

const getTournamentName = (tournamentId) => {
  const tournament = tournaments.value.find(t => t.id === tournamentId)
  return tournament ? tournament.name : 'Неизвестный турнир'
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!selectedTournamentId.value) {
    errors.value.tournament_id = 'Выберите турнир'
    isValid = false
  }
  if (!formData.value.name.trim()) {
    errors.value.name = 'Название категории обязательно'
    isValid = false
  }
  if (!formData.value.gender) {
    errors.value.gender = 'Пол обязателен'
    isValid = false
  }
  if (formData.value.min_age > formData.value.max_age && formData.value.max_age > 0) {
    errors.value.max_age = 'Максимальный возраст не может быть меньше минимального'
    isValid = false
  }
  if (formData.value.min_weight > formData.value.max_weight && formData.value.max_weight > 0) {
    errors.value.max_weight = 'Максимальный вес не может быть меньше минимального'
    isValid = false
  }

  return isValid
}

const submit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    // Преобразуем пол в латиницу для API
    const genderForAPI = formData.value.gender === 'MALE' ? 'M' : 'F'

    const payload = {
      name: formData.value.name,
      gender: genderForAPI,
      min_age: formData.value.min_age || 0,
      max_age: formData.value.max_age || 0,
      min_weight: formData.value.min_weight || 0,
      max_weight: formData.value.max_weight || 0,
      tournament_id: selectedTournamentId.value
    }

    const result = await createCategory(payload)

    if (result.success) {
      // Добавляем категорию в локальный список
      categories.value.push({
        ...payload,
        gender: formData.value.gender, // Сохраняем оригинальное значение для отображения
        id: result.data.id || Date.now()
      })

      // Сброс формы
      formData.value = {
        name: '',
        gender: 'MALE',
        min_age: 0,
        max_age: 0,
        min_weight: 0,
        max_weight: 0
      }

      console.log('Категория успешно создана!')
    } else {
      throw new Error(result.error)
    }

  } catch (error) {
    console.error('Ошибка при создании категории:', error)
    alert('Ошибка при создании категории: ' + error.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
</style>