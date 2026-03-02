<template>
  <div class="bracket-selection">
    <h3>Создание утешительной сетки</h3>

    <div class="selection-form">
      <div class="form-grid">
        <!-- Турнир -->
        <div class="form-group">
          <label for="tournament_id">Турнир *</label>
          <select
              v-model="formData.tournament_id"
              id="tournament_id"
              :disabled="isLoading || categoriesLoading"
          >
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
              {{ categoriesLoading ? 'Загрузка категорий...' :
                (formData.tournament_id ? 'Выберите категорию' : 'Сначала выберите турнир') }}
            </option>
            <option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }} ({{ getGenderLabel(c.gender) }})
            </option>
          </select>
        </div>

        <!-- Тип утешительной сетки -->
        <div class="form-group">
          <label for="consolation_type">Тип утешительной сетки *</label>
          <select
              v-model="formData.consolation_type"
              id="consolation_type"
              :disabled="!formData.category_id || isLoading"
          >
            <option value="semifinals">Полуфинал утешения</option>
            <option value="finals">Финал утешения</option>
          </select>
        </div>

        <!-- Номер татами (опционально) -->
        <div class="form-group">
          <label for="tatami_number">Номер татами</label>
          <input
              type="number"
              v-model.number="formData.tatami_number"
              id="tatami_number"
              min="1"
              step="1"
              class="tatami-input"
              placeholder="Опционально, например: 1"
          />
        </div>
      </div>

      <!-- Кнопка создания -->
      <div class="form-actions">
        <button
            @click="submit"
            class="submit-button"
            :disabled="isLoading || !isFormValid || categoriesLoading"
        >
          {{ isLoading ? 'Создание...' : 'Создать утешительную сетку' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { fetchGetCategoryByTournament } from '@/components/View/Brackets/fetchBrackets.js'
import { createBasketSemiFinals, createBasketFinals } from '@/components/View/Brackets/fetchBrackets.js'

const props = defineProps({
  tournaments: {
    type: Array,
    default: () => []
  },
  existingBrackets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['bracket-created'])

const isLoading = ref(false)
const categoriesLoading = ref(false)
const categories = ref([])

const formData = ref({
  tournament_id: null,
  category_id: null,
  tatami_number: null,
  consolation_type: 'semifinals'   // По умолчанию — полуфинал
})

const isFormValid = computed(() =>
    formData.value.tournament_id &&
    formData.value.category_id &&
    formData.value.consolation_type
)

// Функция для корректного отображения пола
const getGenderLabel = (gender) => {
  if (!gender) return '?'
  const lower = gender.toString().toLowerCase().trim()
  if (lower === 'male' || lower.includes('муж') || lower === 'м') return 'М'
  if (lower === 'female' || lower.includes('жен') || lower === 'ж') return 'Ж'
  return '?'
}

// Загрузка категорий при выборе турнира (используем новую функцию)
watch(() => formData.value.tournament_id, async (id) => {
  formData.value.category_id = null
  categories.value = []

  if (!id) {
    categoriesLoading.value = false
    return
  }

  categoriesLoading.value = true
  try {
    const res = await fetchGetCategoryByTournament(id)

    let cats = []

    // Поддержка разных форматов ответа API (точно как в BracketsCreate.vue)
    if (res.success && (res.categories || res.data?.categories)) {
      cats = res.categories || res.data?.categories || []
    } else if (Array.isArray(res)) {
      cats = res
    } else if (res.data && Array.isArray(res.data)) {
      cats = res.data
    }

    categories.value = cats
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    categories.value = []
    alert('Не удалось загрузить категории. Проверьте консоль для деталей.')
  } finally {
    categoriesLoading.value = false
  }
})

// Формирование названия сетки
const getBracketName = () => {
  const c = categories.value.find(cat => cat.id === formData.value.category_id)
  const categoryStr = c ? `${c.name} (${getGenderLabel(c.gender)})` : 'Категория'
  const stage = formData.value.consolation_type === 'semifinals' ? 'Полуфинал' : 'Финал'
  return `Утешительная сетка (${stage}) — ${categoryStr}`
}

// Создание сетки
const submit = async () => {
  if (!isFormValid.value) return

  isLoading.value = true

  try {
    const payload = {
      name: getBracketName(),
      bracket_type: 'consolation',
      consolation_stage: formData.value.consolation_type,
      has_consolation: false
    }

    const tournamentId = Number(formData.value.tournament_id)
    const categoryId = Number(formData.value.category_id)
    const tatamiNumber = formData.value.tatami_number ?? null

    let result
    if (formData.value.consolation_type === 'semifinals') {
      result = await createBasketSemiFinals(payload, tournamentId, categoryId, tatamiNumber)
    } else {
      result = await createBasketFinals(payload, tournamentId, categoryId, tatamiNumber)
    }

    if (result.success) {
      emit('bracket-created', {
        ...payload,
        id: result.data?.id || Date.now(),
        category_id: categoryId,
        tournament_id: tournamentId,
        status: 'GENERATED',
        progress_percentage: 0,
        is_consolation: true,
        consolation_type: formData.value.consolation_type
      })

      formData.value.category_id = null
      alert('Утешительная сетка успешно создана!')
    } else {
      throw new Error(result.error || 'Неизвестная ошибка')
    }
  } catch (err) {
    console.error(err)
    alert('Ошибка создания утешительной сетки: ' + err.message)
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

.form-group select,
.tatami-input {
  padding: 0.8rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.form-group select:disabled,
.tatami-input:disabled {
  background: #f0f0f0;
  color: #888;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  padding: 0.85rem 2.2rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(200, 155, 60, 0.3);
}

.submit-button:disabled {
  background: #aaa;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>