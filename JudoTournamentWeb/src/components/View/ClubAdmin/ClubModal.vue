<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <!-- Успешное сохранение -->
      <div v-if="isSuccess" class="success-overlay">
        <div class="success-icon">✅</div>
        <h3 class="success-title">{{ successTitle }}</h3>
        <p class="success-message">{{ successMessage }}</p>
        <button class="success-button" @click="close">Продолжить</button>
      </div>

      <!-- Форма -->
      <template v-else>
        <h2>{{ editingClub?.id ? 'Редактирование клуба' : 'Создание клуба' }}</h2>

        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>{{ editingClub?.id ? 'Сохранение...' : 'Создание...' }}</p>
        </div>

        <form @submit.prevent="submit">
          <div class="form-grid">
            <div class="form-group">
              <label for="club_name">Название клуба *</label>
              <input
                  v-model="formData.name"
                  type="text"
                  id="club_name"
                  placeholder="Введите название клуба"
                  :disabled="isLoading"
                  required
              />
            </div>

            <div class="form-group">
              <label for="short_name">Короткое название</label>
              <input
                  v-model="formData.short_name"
                  type="text"
                  id="short_name"
                  placeholder="Сокращенное название"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="city">Город *</label>
              <input
                  v-model="formData.city"
                  type="text"
                  id="city"
                  placeholder="Введите город"
                  :disabled="isLoading"
                  required
              />
            </div>

            <div class="form-group">
              <label for="country">Страна</label>
              <input
                  v-model="formData.country"
                  type="text"
                  id="country"
                  placeholder="Страна"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="coach_name">Тренер</label>
              <input
                  v-model="formData.coach_name"
                  type="text"
                  id="coach_name"
                  placeholder="ФИО тренера"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="phone">Телефон</label>
              <input
                  v-model="formData.phone"
                  type="tel"
                  id="phone"
                  placeholder="+7 (XXX) XXX-XX-XX"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                  v-model="formData.email"
                  type="email"
                  id="email"
                  placeholder="email@example.com"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="founded_year">Год основания</label>
              <input
                  v-model.number="formData.founded_year"
                  type="number"
                  id="founded_year"
                  placeholder="2020"
                  min="1900"
                  :max="new Date().getFullYear()"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group full-width">
              <label for="website">Веб-сайт</label>
              <input
                  v-model="formData.website"
                  type="url"
                  id="website"
                  placeholder="https://example.com"
                  :disabled="isLoading"
              />
            </div>

            <div class="form-group full-width">
              <label for="address">Адрес</label>
              <textarea
                  v-model="formData.address"
                  id="address"
                  placeholder="Полный адрес клуба"
                  rows="3"
                  :disabled="isLoading"
              ></textarea>
            </div>
          </div>

          <div class="form-notes">
            <p>* - обязательные поля для заполнения</p>
          </div>

          <div class="modal-actions">
            <button
                type="button"
                class="modal-button cancel"
                @click="close"
                :disabled="isLoading"
            >
              Отмена
            </button>
            <button
                type="submit"
                class="modal-button submit"
                :disabled="isLoading"
            >
              {{
                isLoading
                    ? editingClub?.id
                        ? 'Сохранение...'
                        : 'Создание...'
                    : editingClub?.id
                        ? 'Сохранить'
                        : 'Создать'
              }}
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { createClub, UpdateClubs } from '@/components/View/ClubAdmin/fetchClubAdmin.js'
import "./ClubsAdmin.css"

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  editingClub: { type: Object, default: null }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  name: '',
  short_name: '',
  city: '',
  country: 'Казахстан',
  address: '',
  phone: '',
  email: '',
  website: '',
  coach_name: '',
  founded_year: null
})

const isLoading = ref(false)
const isSuccess = ref(false)
const successTitle = ref('')
const successMessage = ref('')

let successTimer = null

const successTexts = computed(() => {
  if (props.editingClub?.id) {
    return {
      title: 'Клуб успешно обновлён!',
      message: `Данные клуба "${formData.value.name || '—'}" были успешно сохранены.`
    }
  }
  return {
    title: 'Клуб успешно создан!',
    message: `Клуб "${formData.value.name || '—'}" был успешно создан и добавлен в систему.`
  }
})

watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal) {
        resetForm()
        if (props.editingClub?.id) {
          console.log('[MODAL] Открыто редактирование клуба ID:', props.editingClub.id)
          Object.assign(formData.value, props.editingClub)
        } else {
          console.log('[MODAL] Открыто создание нового клуба')
        }
      }
    }
)

const resetForm = () => {
  formData.value = {
    name: '',
    short_name: '',
    city: '',
    country: 'Казахстан',
    address: '',
    phone: '',
    email: '',
    website: '',
    coach_name: '',
    founded_year: null
  }
  isLoading.value = false
  isSuccess.value = false
  if (successTimer) clearTimeout(successTimer)
}

const showSuccessAndClose = () => {
  successTitle.value = successTexts.value.title
  successMessage.value = successTexts.value.message
  isSuccess.value = true

  successTimer = setTimeout(() => {
    emit('close')
  }, 3000)
}

const close = () => {
  if (!isLoading.value) {
    emit('close')
  }
}

const submit = async () => {
  console.log('[MODAL] Нажата кнопка "Сохранить/Создать". Текущие данные:', formData.value)
  console.log('[MODAL] editingClub получен:', props.editingClub)

  isLoading.value = true

  try {
    const payload = {
      name: formData.value.name,
      short_name: formData.value.short_name || undefined,
      city: formData.value.city,
      country: formData.value.country || 'Казахстан',
      address: formData.value.address || undefined,
      phone: formData.value.phone || undefined,
      email: formData.value.email || undefined,
      website: formData.value.website || undefined,
      coach_name: formData.value.coach_name || undefined,
      founded_year: formData.value.founded_year || undefined
    }

    console.log('[MODAL] Готов payload для отправки:', payload)

    let result

    if (props.editingClub?.id) {
      console.log(`[MODAL] Запуск UpdateClubs для ID: ${props.editingClub.id}`)
      result = await UpdateClubs(props.editingClub.id, payload)
    } else {
      console.log('[MODAL] Запуск createClub')
      result = await createClub(payload)
    }

    console.log('[MODAL] Успешно получен ответ:', result)

    showSuccessAndClose()
    emit('submit', { success: true, data: result, isEdit: !!props.editingClub?.id })
  } catch (error) {
    console.error('[MODAL] Ошибка сохранения:', error)
    alert('Ошибка: ' + (error.message || 'Не удалось сохранить клуб'))

    emit('submit', {
      success: false,
      error: error.message || 'Произошла неизвестная ошибка',
      isEdit: !!props.editingClub?.id
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* ваши стили */
</style>