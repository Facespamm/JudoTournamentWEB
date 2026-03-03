<template>
  <div class="create-tournament">
    <h3>Создать новый турнир</h3>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Создание турнира...</p>
    </div>

    <!-- Модалка УСПЕХА -->
    <div v-if="showSuccessModal" class="admin-modal-overlay" @click.self="closeSuccessModal">
      <div class="admin-modal-content success-modal">
        <div class="success-icon">✅</div>
        <h2>Турнир успешно создан!</h2>
        <p class="success-text">
          Турнир «<strong>{{ successTournamentName }}</strong>» успешно создан!
        </p>
        <div class="admin-modal-actions">
          <button class="admin-modal-button admin-modal-button-submit" @click="closeSuccessModal">
            Отлично, продолжить
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка ОШИБКИ -->
    <div v-if="showErrorModal" class="admin-modal-overlay" @click.self="closeErrorModal">
      <div class="admin-modal-content error-modal">
        <div class="error-icon">❌</div>
        <h2>Ошибка создания</h2>
        <p class="error-text">{{ errorMessage }}</p>
        <div class="admin-modal-actions">
          <button class="admin-modal-button admin-modal-button-cancel" @click="closeErrorModal">
            Закрыть
          </button>
        </div>
      </div>
    </div>

    <form @submit.prevent="submit">
      <div class="form-grid">
        <!-- Основные поля -->
        <div class="form-group">
          <label>Название турнира *</label>
          <input v-model="formData.name" required />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>

        <!-- Даты рядом и компактно -->
        <div class="form-group date-group">
          <label>Дата начала *</label>
          <input type="date" v-model="formData.start_date" />
          <span v-if="errors.start_date" class="error">{{ errors.start_date }}</span>
        </div>

        <div class="form-group date-group">
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
              size="8"
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
                <th class="action-header">Действие</th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="(catId, index) in formData.list_category"
                  :key="catId"
              >
                <td>{{ index + 1 }}</td>
                <td class="category-name">{{ getCategoryName(catId) }}</td>
                <td class="action-cell">
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
          <textarea v-model="formData.description" rows="3"></textarea>
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
const showSuccessModal = ref(false)
const successTournamentName = ref('')

const showErrorModal = ref(false)
const errorMessage = ref('')

const formData = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  venue: '',
  city: '',
  country: 'Казахстан',
  tatami_count: 0,
  list_category: []
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

const closeSuccessModal = () => {
  showSuccessModal.value = false
  successTournamentName.value = ''
}

const closeErrorModal = () => {
  showErrorModal.value = false
  errorMessage.value = ''
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
      const tournamentName = formData.value.name.trim()
      successTournamentName.value = tournamentName

      emit('tournament-created', result.data?.id)

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

      showSuccessModal.value = true
    } else {
      throw new Error(result.error || 'Ошибка создания')
    }
  } catch (error) {
    console.error('Ошибка создания турнира:', error)
    errorMessage.value = error.message || 'Не удалось создать турнир: неизвестная ошибка'
    showErrorModal.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* ==================== КОМПАКТНЫЙ ГРИД ==================== */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.full-width { grid-column: 1 / -1; }
.date-group { max-width: 260px; }

.form-group label {
  font-size: 0.95rem;
  margin-bottom: 5px;
  display: block;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 9px 12px;
  font-size: 0.96rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

/* ==================== ТАБЛИЦА ==================== */
.table-wrapper {
  margin-top: 8px;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.selected-categories-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  background: #fff;
}

.selected-categories-table th,
.selected-categories-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.selected-categories-table th {
  background: #f8f8f8;
  font-weight: 600;
  font-size: 0.93rem;
  color: #444;
  white-space: nowrap;
}

.selected-categories-table th:nth-child(1) { width: 50px; }
.selected-categories-table th:nth-child(2) { width: auto; }
.selected-categories-table th:nth-child(3) {
  width: 100px;
  text-align: center;
  white-space: nowrap;
}

.category-name {
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.action-cell { text-align: center; }

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
}

.remove-btn:hover { background: #c62828; }

/* ==================== ОСТАЛЬНЫЕ СТИЛИ ==================== */
.error {
  color: #e53935;
  font-size: 0.82rem;
  margin-top: 3px;
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}

.form-actions button {
  padding: 10px 24px;
  font-size: 1rem;
  border-radius: 8px;
}

/* ====================== МОДАЛКИ ====================== */
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.admin-modal-content {
  background: white;
  border-radius: 16px;
  width: 380px;
  max-width: 92vw;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  padding: 30px 24px;
  text-align: center;
}

.success-icon, .error-icon { font-size: 3.5rem; margin-bottom: 10px; }
.admin-modal-content h2 { margin: 0 0 10px; font-size: 1.4rem; }
.success-text, .error-text { font-size: 1.05rem; line-height: 1.4; margin-bottom: 24px; }

.admin-modal-button-submit {
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
}

.admin-modal-button-cancel {
  background: #e53935;
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
}

.error-modal .error-icon { color: #e53935; }
.error-modal h2 { color: #e53935; }

/* Лоадер */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 46px;
  height: 46px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>