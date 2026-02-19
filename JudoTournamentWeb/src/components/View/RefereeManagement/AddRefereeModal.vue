<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Добавить судью</h2>
        <button class="modal-close-btn" @click="close">×</button>
      </div>

      <form @submit.prevent="handleSubmit" class="referee-form">
        <div class="form-row">
          <div class="form-group">
            <label>Фамилия <span class="required">*</span></label>
            <input
                v-model.trim="form.last_name"
                type="text"
                required
                placeholder="Фамилия"
                :class="{ 'input-error': errors.last_name }"
            />
            <div v-if="errors.last_name" class="error-text">{{ errors.last_name }}</div>
          </div>

          <div class="form-group">
            <label>Имя <span class="required">*</span></label>
            <input
                v-model.trim="form.first_name"
                type="text"
                required
                placeholder="Имя"
                :class="{ 'input-error': errors.first_name }"
            />
            <div v-if="errors.first_name" class="error-text">{{ errors.first_name }}</div>
          </div>
        </div>

        <div class="form-group">
          <label>Отчество</label>
          <input v-model.trim="form.middle_name" type="text" placeholder="Отчество" />
        </div>

        <div class="form-group">
          <label>Категория судейства <span class="required">*</span></label>
          <select
              v-model="form.certification_level"
              required
              :class="{ 'input-error': errors.certification_level }"
              :disabled="categoriesLoading"
          >
            <option value="" disabled>
              {{ categoriesLoading ? 'Загрузка...' : 'Выберите категорию' }}
            </option>
            <option
                v-for="cat in certificationCategories"
                :key="cat"
                :value="cat"
            >
              {{ cat }}
            </option>
          </select>
          <div v-if="errors.certification_level" class="error-text">{{ errors.certification_level }}</div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Телефон</label>
            <input
                v-model.trim="form.phone"
                type="tel"
                placeholder="+7 (XXX) XXX-XX-XX"
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input
                v-model.trim="form.email"
                type="email"
                placeholder="example@judo.kz"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="close">Отмена</button>
          <button type="submit" class="btn-save" :disabled="isSubmitting">
            {{ isSubmitting ? 'Сохранение...' : 'Добавить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { CreateReferee } from '@/components/View/RefereeManagement/fetchRefereeManagement.js'
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'

const props = defineProps({
  isOpen: { type: Boolean, required: true }
})

const emit = defineEmits(['close', 'submit'])

const form = ref({
  last_name: '',
  first_name: '',
  middle_name: '',
  certification_level: '',
  phone: '',
  email: ''
})

const errors             = ref({})
const isSubmitting       = ref(false)
const certificationCategories = ref([])
const categoriesLoading  = ref(false)

// Судейские категории — отдельный список, не связан с категориями турниров.
// Грузим с API и извлекаем уникальные certification_level из судей,
// либо используем фиксированный список если API не вернул нужное.
const FALLBACK_CATEGORIES = [
  'Международный',
  'Национальный 1 категории',
  'Национальный 2 категории',
  'Национальный 3 категории',
  'Региональный',
]

async function loadCertificationCategories() {
  categoriesLoading.value = true
  try {
    const result = await fetchCategories()
    if (result.success && Array.isArray(result.data?.categories)) {
      // Извлекаем уникальные названия из поля name
      const names = [...new Set(result.data.categories.map(c => c.name).filter(Boolean))]
      certificationCategories.value = names.length ? names : FALLBACK_CATEGORIES
    } else {
      certificationCategories.value = FALLBACK_CATEGORIES
    }
  } catch {
    certificationCategories.value = FALLBACK_CATEGORIES
  } finally {
    categoriesLoading.value = false
  }
}

const resetForm = () => {
  form.value = {
    last_name: '',
    first_name: '',
    middle_name: '',
    certification_level: '',
    phone: '',
    email: ''
  }
  errors.value = {}
}

const validateForm = () => {
  errors.value = {}
  let isValid = true
  if (!form.value.last_name.trim())       { errors.value.last_name = 'Обязательное поле'; isValid = false }
  if (!form.value.first_name.trim())      { errors.value.first_name = 'Обязательное поле'; isValid = false }
  if (!form.value.certification_level)   { errors.value.certification_level = 'Выберите категорию'; isValid = false }
  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return
  isSubmitting.value = true
  try {
    await CreateReferee(form.value)
    emit('submit', { success: true })
    close()
  } catch (err) {
    console.error('Ошибка создания судьи:', err)
    alert('Не удалось добавить судью\n' + (err.message || 'Неизвестная ошибка'))
  } finally {
    isSubmitting.value = false
  }
}

const close = () => {
  resetForm()
  emit('close')
}

watch(() => props.isOpen, (val) => {
  if (val) {
    resetForm()
    loadCertificationCategories()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}
.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 540px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}
.modal-header h2 { margin: 0; font-size: 1.4rem; }
.modal-close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: #888;
}
.modal-close-btn:hover { color: #333; }
.referee-form { padding: 20px 24px 24px; }
.form-row { display: flex; gap: 16px; }
.form-group { flex: 1; margin-bottom: 18px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.95rem; }
.required { color: #e53e3e; }
input, select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
input:focus, select:focus {
  outline: none;
  border-color: #c89b3c;
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.15);
}
select:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
.input-error { border-color: #e53e3e; }
.error-text { color: #e53e3e; font-size: 0.82rem; margin-top: 4px; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.btn-cancel, .btn-save {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
  border: none;
}
.btn-cancel { background: #f1f5f9; color: #334155; }
.btn-save { background: #c89b3c; color: white; }
.btn-save:hover:not(:disabled) { background: #b5892e; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>