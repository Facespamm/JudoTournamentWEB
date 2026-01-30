<template>
  <div class="create-tournament">
    <h3>Создать новый турнир</h3>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner计算机"></div>
      <p>Создание турнира...</p>
    </div>

    <form @submit.prevent="submit">
      <div class="form-grid">
        <!-- Основные поля -->
        <div class="form-group">
          <label>Название турнира *</label>
          <input v-model="formData.name" required />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label>Дата начала *</label>
          <input type="date" v-model="formData.start_date" />
          <span v-if="errors.start_date" class="error">{{ errors.start_date }}</span>
        </div>

        <div class="form-group">
          <label>Дата окончания *</label>
          <input type="date" v-model="formData.end_date" />
          <span v-if="errors.end_date" class="error">{{ errors.end_date }}</span>
        </div>

        <div class="form-group">
          <label>Место проведения *</label>
          <input v-model="formData.venue" />
          <span v-if="errors.venue" class="error">{{ errors.venue }}</span>
        </div>

        <div class="form-group">
          <label>Город</label>
          <input v-model="formData.city" />
        </div>

        <div class="form-group">
          <label>Страна</label>
          <input v-model="formData.country" placeholder="Казахстан" />
        </div>

        <div class="form-group">
          <label>Количество татами</label>
          <input type="number" v-model.number="formData.tatami_count" min="0" />
        </div>

        <!-- Выбор категорий -->
        <div class="form-group full-width">
          <label>Категории турнира *</label>

          <div v-if="isCategoriesLoading">Загрузка категорий...</div>
          <div v-else-if="categories.length === 0">Категории не найдены</div>
          <select
              v-else
              v-model="formData.list_category"
              multiple
              size="10"
              class="multi-select"
              :disabled="isLoading || isCategoriesLoading"
          >
            <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>

          <small>Выберите одну или несколько категорий (Ctrl/Cmd + клик)</small>
          <span v-if="errors.list_category" class="error">{{ errors.list_category }}</span>
        </div>

        <!-- Таблица выбранных категорий -->
        <div class="form-group full-width" v-if="formData.list_category.length > 0">
          <label>Выбранные категории</label>
          <div class="table-wrapper">
            <table class="selected-categories-table">
              <thead>
              <tr>
                <th>#</th>
                <th>Название категории</th>
                <th>Действие</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="(catId, index) in formData.list_category"
                  :key="catId"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ getCategoryName(catId) }}</td>
                <td>
                  <button
                      type="button"
                      class="remove-btn"
                      @click="removeCategory(catId)"
                      title="Удалить"
                  >×</button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <small>Всего выбрано: {{ formData.list_category.length }}</small>
        </div>

        <!-- Описание -->
        <div class="form-group full-width">
          <label for="description">Описание турнира</label>
          <textarea v-model="formData.description"></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button
            type="submit"
            :disabled="isLoading || isCategoriesLoading || formData.list_category.length === 0"
        >
          {{ isLoading ? 'Создание...' : 'Создать турнир' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createTournament, fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'

const emit = defineEmits(['tournament-created'])

const isLoading = ref(false)
const isCategoriesLoading = ref(false)

const formData = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  venue: '',
  city: '',
  country: 'Казахстан',
  tatami_count: 0,
  list_category: [] // массив ID: [1, 2, 3, ...]
})

const categories = ref([])

const errors = ref({})

const loadCategories = async () => {
  isCategoriesLoading.value = true
  try {
    const result = await fetchCategories()
    if (result.success) {
      categories.value = result.data.categories.map(c => ({
        id: Number(c.id),
        name: c.name
      }))
    }
  } catch (err) {
    console.error(err)
  } finally {
    isCategoriesLoading.value = false
  }
}

onMounted(loadCategories)

const getCategoryName = (id) => {
  const cat = categories.value.find(c => c.id === id)
  return cat ? cat.name : `Категория #${id}`
}

const removeCategory = (id) => {
  formData.value.list_category = formData.value.list_category.filter(cid => cid !== id)
}

const validateForm = () => {
  errors.value = {}
  let isValid = true

  const nameTrimmed = formData.value.name?.trim() ?? ''
  if (!nameTrimmed) {
    errors.value.name = 'Название обязательно'
    isValid = false
  }

  if (!formData.value.start_date) {
    errors.value.start_date = 'Дата начала обязательна'
    isValid = false
  }

  if (!formData.value.end_date) {
    errors.value.end_date = 'Дата окончания обязательна'
    isValid = false
  }

  if (formData.value.start_date && formData.value.end_date && formData.value.start_date > formData.value.end_date) {
    errors.value.end_date = 'Дата окончания не может быть раньше начала'
    isValid = false
  }

  const venueTrimmed = formData.value.venue?.trim() ?? ''
  if (!venueTrimmed) {
    errors.value.venue = 'Место проведения обязательно'
    isValid = false
  }

  if (formData.value.list_category.length === 0) {
    errors.value.list_category = 'Выберите хотя бы одну категорию'
    isValid = false
  }

  return isValid
}

const submit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    const payload = {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || '',
      start_date: formData.value.start_date,
      end_date: formData.value.end_date,
      venue: formData.value.venue.trim(),
      city: formData.value.city.trim() || '',
      country: formData.value.country.trim() || 'Казахстан',
      tatami_count: Number(formData.value.tatami_count) || 0,
      status: 'PLANNED',
      list_category: formData.value.list_category
    }

    const result = await createTournament(payload)

    if (result.success) {
      emit('tournament-created', result.data?.id)

      // Сброс формы
      formData.value = {
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        venue: '',
        city: '',
        country: 'Казахстан',
        tatami_count: 0,
        list_category: []
      }
    } else {
      throw new Error(result.error || 'Ошибка создания')
    }
  } catch (error) {
    console.error('Ошибка создания турнира:', error)
    alert('Не удалось создать турнир: ' + (error.message || 'неизвестная ошибка'))
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.full-width {
  grid-column: 1 / -1;
}

.multi-select {
  width: 100%;
  padding: 8px;
}

.table-wrapper {
  margin-top: 12px;
  overflow-x: auto;
}

.selected-categories-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.selected-categories-table th,
.selected-categories-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.selected-categories-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.selected-categories-table tr:hover {
  background: #f9f9f9;
}

.selected-categories-table td:last-child {
  text-align: center;
}

.remove-btn {
  background: #e53935;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #c62828;
}

.error {
  color: #e53935;
  font-size: 0.85rem;
}

.form-actions {
  margin-top: 24px;
  text-align: right;
}

.form-actions button {
  padding: 10px 20px;
  font-size: 1rem;
}
</style>