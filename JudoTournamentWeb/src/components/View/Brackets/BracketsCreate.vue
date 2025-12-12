<template>
  <div class="bracket-creation">
    <h3>Создание сетки турнира</h3>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Создание сетки...</p>
    </div>

    <div class="creation-form">
      <div class="form-grid">
        <!-- Турнир -->
        <div class="form-group">
          <label for="tournament_id">Турнир *</label>
          <select v-model="formData.tournament_id" id="tournament_id" :disabled="isLoading" required>
            <option value="">Выберите турнир</option>
            <option v-for="t in tournaments" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
          <span v-if="errors.tournament_id" class="error">{{ errors.tournament_id }}</span>
        </div>

        <!-- Категория -->
        <div class="form-group">
          <label for="category_id">Категория *</label>
          <select
              v-model="formData.category_id"
              id="category_id"
              :disabled="isLoading || !formData.tournament_id || categories.length === 0"
              required
          >
            <option value="">
              {{ formData.tournament_id ? 'Выберите категорию' : 'Сначала выберите турнир' }}
            </option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.gender === 'MALE' ? 'М' : 'Ж' }})
            </option>
          </select>
          <span v-if="errors.category_id" class="error">{{ errors.category_id }}</span>
        </div>

        <!-- Тип сетки — русские значения -->
        <div class="form-group">
          <label for="bracket_type">Тип сетки *</label>
          <select v-model="formData.bracket_type" id="bracket_type" :disabled="isLoading" required>
            <option value="">Выберите тип</option>
            <option value="олимпийская">Олимпийская система</option>
            <option value="двойная_элиминация">Двойная элиминация</option>
            <option value="круговая">Круговая система</option>
          </select>
          <span v-if="errors.bracket_type" class="error">{{ errors.bracket_type }}</span>
        </div>

        <!-- Утешительные -->
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="formData.has_consolation" :disabled="isLoading" />
            <span class="checkmark"></span>
            Утешительные встречи
          </label>
        </div>

        <!-- Название -->
        <div class="form-group full-width">
          <label for="name">Название сетки *</label>
          <input
              type="text"
              v-model="formData.name"
              id="name"
              placeholder="Например: Мужчины -73 кг"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>
      </div>

      <!-- Предпросмотр -->
      <div v-if="previewData" class="preview-section">
        <h4>Предварительный просмотр:</h4>
        <div class="preview-card">
          <div class="preview-row"><span class="preview-label">Турнир:</span><span class="preview-value">{{ getTournamentName(formData.tournament_id) }}</span></div>
          <div class="preview-row"><span class="preview-label">Категория:</span><span class="preview-value">{{ getCategoryName(formData.category_id) }}</span></div>
          <div class="preview-row"><span class="preview-label">Тип сетки:</span><span class="preview-value">{{ getBracketTypeName(formData.bracket_type) }}</span></div>
          <div class="preview-row"><span class="preview-label">Утешительные:</span><span class="preview-value">{{ formData.has_consolation ? 'Да' : 'Нет' }}</span></div>
          <div class="preview-row"><span class="preview-label">Название:</span><span class="preview-value">{{ formData.name }}</span></div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="form-actions">
        <button @click="preview" class="preview-button" :disabled="isLoading || !isFormValid">
          Предварительный просмотр
        </button>
        <button @click="submit" class="submit-button" :disabled="isLoading || !previewData">
          {{ isLoading ? 'Создание...' : 'Создать сетку' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import { createBracket } from '@/components/View/Brackets/fetchBrackets.js'

const props = defineProps({
  tournaments: { type: Array, default: () => [] }
})

const emit = defineEmits(['bracket-created'])

const isLoading = ref(false)
const categories = ref([])
const previewData = ref(null)

const formData = ref({
  tournament_id: null,
  category_id: null,
  bracket_type: '',
  has_consolation: false,
  name: ''
})

const errors = ref({})

const isFormValid = computed(() =>
    formData.value.tournament_id &&
    formData.value.category_id &&
    formData.value.bracket_type &&
    formData.value.name.trim()
)

// Загрузка категорий при выборе турнира
watch(() => formData.value.tournament_id, async (id) => {
  formData.value.category_id = null
  previewData.value = null
  categories.value = []

  if (!id) return

  const res = await fetchCategories(id)
  if (res.success) {
    categories.value = res.categories || res.data?.categories || []
  }
})

// Вспомогательные
const getTournamentName = (id) => props.tournaments.find(t => t.id === id)?.name || '—'
const getCategoryName = (id) => {
  const c = categories.value.find(c => c.id === id)
  return c ? `${c.name} (${c.gender === 'MALE' ? 'М' : 'Ж'})` : '—'
}
const getBracketTypeName = (type) => ({
  олимпийская: 'Олимпийская система',
  двойная_элиминация: 'Двойная элиминация',
  круговая: 'Круговая система'
}[type] || type)

// Валидация
const validateForm = () => {
  errors.value = {}
  if (!formData.value.tournament_id) errors.value.tournament_id = 'Выберите турнир'
  if (!formData.value.category_id) errors.value.category_id = 'Выберите категорию'
  if (!formData.value.bracket_type) errors.value.bracket_type = 'Выберите тип'
  if (!formData.value.name.trim()) errors.value.name = 'Введите название'
  return Object.keys(errors.value).length === 0
}

const preview = () => {
  if (validateForm()) previewData.value = { ...formData.value }
}

// ГЛАВНОЕ — передаём tournament_id как второй параметр
const submit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    const payload = {
      name: formData.value.name.trim(),
      category_id: Number(formData.value.category_id),
      bracket_type: formData.value.bracket_type,
      has_consolation: formData.value.has_consolation
    }

    // ВАЖНО: tournament_id идёт вторым аргументом!
    const result = await createBracket(payload, formData.value.tournament_id)

    if (result.success) {
      emit('bracket-created', {
        ...payload,
        id: result.data.id,
        tournament_id: formData.value.tournament_id,
        status: 'GENERATED',
        progress_percentage: 0
      })

      // Оставляем турнир выбранным — удобно создавать ещё сетки
      formData.value.category_id = null
      formData.value.bracket_type = ''
      formData.value.has_consolation = false
      formData.value.name = ''
      previewData.value = null

      alert('Сетка успешно создана!')
    } else {
      throw new Error(result.error || 'Неизвестная ошибка')
    }
  } catch (err) {
    alert('Ошибка: ' + err.message)
  } finally {
    isLoading.value = false
  }
}
</script>