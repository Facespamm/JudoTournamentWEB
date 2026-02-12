<template>
  <div class="manage-categories">
    <h3>Создание категории</h3>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Создание категории...</p>
    </div>

    <form @submit.prevent="submit">
      <div class="form-grid">
        <div class="form-group">
          <label for="gender">Пол *</label>
          <select
              v-model="formData.gender"
              id="gender"
              :disabled="isLoading"
              required
          >
            <option value="мужской">Мужской</option>
            <option value="женский">Женский</option>
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
              placeholder="0 — без ограничения"
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
              placeholder="0 — без ограничения"
              :disabled="isLoading"
          />
          <span v-if="errors.max_age" class="error">{{ errors.max_age }}</span>
        </div>

        <div class="form-group">
          <label for="min_weight">Минимальный вес (кг)</label>
          <input
              v-model.number="formData.min_weight"
              type="number"
              id="min_weight"
              min="0"
              step="0.1"
              placeholder="0 — без ограничения"
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
              placeholder="0 — без ограничения"
              :disabled="isLoading"
          />
          <span v-if="errors.max_weight" class="error">{{ errors.max_weight }}</span>
        </div>
      </div>

      <!-- Предпросмотр сгенерированного названия -->
      <div class="preview-section">
        <label>Название категории (автоматически):</label>
        <p class="generated-name"><strong>{{ generatedName }}</strong></p>
      </div>

      <div class="form-actions">
        <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
        >
          {{ isLoading ? 'Создание...' : 'Создать категорию' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createCategory } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import "./TournamentManagement.css"

const isLoading = ref(false)

const formData = ref({
  gender: 'мужской',
  min_age: 0,
  max_age: 0,
  min_weight: 0,
  max_weight: 0
})

const errors = ref({})

const generateCategoryName = (data) => {
  const genderTitle = data.gender === 'мужской' ? 'Мужская' : 'Женская'
  const parts = [genderTitle]

  // Возраст
  let agePart = ''
  if (data.min_age > 0 || data.max_age > 0) {
    if (data.min_age > 0 && data.max_age > 0) {
      agePart = `${data.min_age}-${data.max_age} лет`
    } else if (data.min_age > 0) {
      agePart = `${data.min_age}+ лет`
    } else if (data.max_age > 0) {
      agePart = `до ${data.max_age} лет`
    }
  }
  if (agePart) parts.push(agePart)

  // Вес
  let weightPart = ''
  if (data.min_weight > 0 || data.max_weight > 0) {
    const minW = data.min_weight.toString().replace('.', ',')
    const maxW = data.max_weight.toString().replace('.', ',')
    if (data.min_weight > 0 && data.max_weight > 0) {
      weightPart = `${minW}-${maxW} кг`
    } else if (data.min_weight > 0) {
      weightPart = `${minW}+ кг`
    } else if (data.max_weight > 0) {
      weightPart = `до ${maxW} кг`
    }
  }
  if (weightPart) parts.push(weightPart)

  return parts.join(' ')
}

const generatedName = computed(() => generateCategoryName(formData.value))

const validateForm = () => {
  errors.value = {}
  let isValid = true

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
    const payload = {
      name: generatedName.value,
      gender: formData.value.gender,
      min_age: formData.value.min_age || 0,
      max_age: formData.value.max_age || 0,
      min_weight: formData.value.min_weight || 0,
      max_weight: formData.value.max_weight || 0
    }

    const result = await createCategory(payload)

    if (result.success) {
      // Сброс формы
      formData.value = {
        gender: 'мужской',
        min_age: 0,
        max_age: 0,
        min_weight: 0,
        max_weight: 0
      }
      errors.value = {}

      alert('Категория успешно создана!')
      console.log('Категория успешно создана!', result.data)
    } else {
      throw new Error(result.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('Ошибка при создании категории:', error)
    alert('Ошибка при создании категории: ' + (error.message || 'Неизвестная ошибка'))
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.preview-section {
  margin: 20px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.preview-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.generated-name {
  font-size: 1.2em;
  color: #333;
}
</style>