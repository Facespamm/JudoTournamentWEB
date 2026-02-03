<template>
  <div class="bracket-selection">
    <h3>Создание сетки</h3>

    <div class="selection-form">
      <div class="form-grid">
        <!-- Турнир -->
        <div class="form-group">
          <label for="tournament_id">Турнир *</label>
          <select v-model="formData.tournament_id" id="tournament_id" :disabled="isLoading || categoriesLoading">
            <option value="">Выберите турнир</option>
            <option v-for="t in tournaments" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>

        <!-- Категория -->
        <div class="form-group">
          <label for="category_id">Категория *</label>
          <select
              v-model="formData.category_id"
              id="category_id"
              :disabled="!formData.tournament_id || categoriesLoading || isLoading"
          >
            <option value="">
              {{ categoriesLoading ? 'Загрузка категорий...' : (formData.tournament_id ? 'Выберите категорию' : 'Сначала выберите турнир') }}
            </option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }} ({{ c.gender === 'MALE' ? 'М' : 'Ж' }})
            </option>
          </select>
        </div>
      </div>

      <!-- Кнопка создания -->
      <div class="form-actions">
        <button
            @click="submit"
            class="submit-button"
            :disabled="isLoading || !isFormValid || categoriesLoading"
        >
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
const categoriesLoading = ref(false)

const categories = ref([])

const formData = ref({
  tournament_id: null,
  category_id: null
})

const isFormValid = computed(() =>
    formData.value.tournament_id && formData.value.category_id
)

// Загрузка категорий при выборе турнира
watch(() => formData.value.tournament_id, async (id) => {
  formData.value.category_id = null
  categories.value = []

  if (!id) {
    categoriesLoading.value = false
    return
  }

  categoriesLoading.value = true
  try {
    const res = await fetchCategories(id)
    if (res.success) {
      categories.value = res.categories || res.data?.categories || []
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    categories.value = []
    alert('Не удалось загрузить категории')
  } finally {
    categoriesLoading.value = false
  }
})

// Получение имени категории для названия сетки
const getCategoryName = () => {
  const c = categories.value.find(c => c.id === formData.value.category_id)
  return c ? `${c.name} (${c.gender === 'MALE' ? 'М' : 'Ж'})` : 'Сетка'
}

// Создание сетки с дефолтными значениями
const submit = async () => {
  if (!isFormValid.value) return

  isLoading.value = true

  try {
    const payload = {
      name: getCategoryName(),                    // Автоматическое название по категории
      bracket_type: 'олимпийская',                // Дефолт — олимпийская система
      has_consolation: false                      // Без утешительных по умолчанию
    }

    const tournamentId = Number(formData.value.tournament_id)
    const categoryId = Number(formData.value.category_id)

    const result = await createBracket(payload, tournamentId, categoryId)

    if (result.success) {
      emit('bracket-created', {
        ...payload,
        category_id: categoryId,
        id: result.data.id,
        tournament_id: tournamentId,
        status: 'GENERATED',
        progress_percentage: 0
      })

      // Сброс только категории (турнир остаётся выбранным для удобства)
      formData.value.category_id = null

      alert('Сетка успешно создана!')
    } else {
      throw new Error(result.error || 'Неизвестная ошибка')
    }
  } catch (err) {
    alert('Ошибка создания сетки: ' + err.message)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.bracket-selection {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 12px;
}

.selection-form {
  margin-top: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group select {
  padding: 0.8rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.form-group select:disabled {
  background: #f0f0f0;
  color: #888;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: #2c8f3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-button:hover:not(:disabled) {
  background: #257a33;
}

.submit-button:disabled {
  background: #aaa;
  cursor: not-allowed;
}
</style>