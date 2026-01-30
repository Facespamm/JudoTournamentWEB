<!-- AthleteRole.vue -->
<template>
  <div class="role-content">
    <div class="role-header">
      <h3>Профиль спортсмена</h3>
      <p>Заполните данные для регистрации</p>
    </div>

    <div class="loading-overlay" v-if="isLoading">
      <div class="loading-spinner"></div>
      <p>Сохранение...</p>
    </div>

    <form @submit.prevent="saveAthleteProfile" class="role-form" novalidate>
      <div class="form-grid">
        <div class="form-group">
          <label>Дата рождения</label>
          <input
              v-model="athleteForm.birth_day"
              type="date"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label>Пол</label>
          <select
              v-model="athleteForm.gender"
              :disabled="isLoading"
          >
            <option value="" disabled>Выберите пол</option>
            <option value="мужской">Мужской</option>
            <option value="женский">Женский</option>
          </select>
        </div>

        <div class="form-group">
          <label>Возраст</label>
          <input
              v-model.number="athleteForm.age"
              type="number"
              min="5"
              max="120"
              :disabled="isLoading"
              placeholder="Введите возраст"
          />
        </div>

        <div class="form-group">
          <label>Вес (кг)</label>
          <input
              v-model.number="athleteForm.weight"
              type="number"
              min="20"
              step="0.5"
              :disabled="isLoading"
              placeholder="Например, 68.5"
          />
        </div>

        <div class="form-group">
          <label>Клуб</label>
          <select
              v-model="athleteForm.club_id"
              :disabled="isLoading"
          >
            <option value="" disabled>Выберите клуб</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Кю/Дан</label>
          <select
              v-model="athleteForm.rank_id"
              :disabled="isLoading"
          >
            <option value="" disabled>Выберите кю/дан</option>
            <option v-for="dan in dans" :key="dan.id" :value="dan.id">
              {{ dan.description }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Номер лицензии</label>
          <input
              v-model="athleteForm.license_number"
              type="text"
              :disabled="isLoading"
              placeholder="Введите номер лицензии"
          />
        </div>

        <div class="form-group">
          <label>Номер страховки</label>
          <input
              v-model="athleteForm.insurance_number"
              type="text"
              :disabled="isLoading"
              placeholder="Введите номер страховки"
          />
        </div>

        <div class="form-group full-width checkbox-group">
          <label class="checkbox-label">
            <input
                type="checkbox"
                v-model="athleteForm.medical_check"
                :disabled="isLoading"
                class="hidden-checkbox"
            />
            <span class="custom-checkbox"></span>
            <span class="checkbox-text">Медицинская справка в наличии</span>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? 'Сохранение...' : 'Сохранить профиль' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router' // ← Добавили router
import { fetchClubs, fetchDan, fetchCreateAthlete } from '@/components/View/Authentication/SelectRoleView/fetchGetInformation.js'
import './Roles.css'

const emit = defineEmits(['show-toast'])
const router = useRouter() // ← Инициализировали router

const isLoading = ref(false)
const clubs = ref([])
const dans = ref([])

const athleteForm = ref({
  birth_day: '',
  gender: '',
  age: null,
  weight: null,
  club_id: '',
  rank_id: '',
  license_number: '',
  insurance_number: '',
  medical_check: false
})

// Функция получения user_id из JWT (с логами)
const getUserId = () => {
  console.log('=== Пытаемся получить user_id из JWT ===')
  console.log('Все куки:', document.cookie)

  const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('jwt_token='))
      ?.split('=')[1]

  console.log('Найденный токен:', token ? token.substring(0, 20) + '...' : 'НЕ НАЙДЕН')

  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    base64 += '='.repeat((4 - base64.length % 4) % 4)

    const decoded = atob(base64)
    const payloadStr = decodeURIComponent(
        Array.from(decoded, c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
    )

    const payload = JSON.parse(payloadStr)
    console.log('Payload JWT:', payload)

    const userId = payload.sub ?? payload.id ?? payload.user_id ?? null
    console.log('Извлечённый userId:', userId)
    return Number(userId) || userId
  } catch (e) {
    console.error('Ошибка декодирования JWT:', e)
    return null
  }
}

const loadData = async () => {
  try {
    const clubsResult = await fetchClubs()
    if (clubsResult?.success) {
      clubs.value = Array.isArray(clubsResult.clubs) ? clubsResult.clubs :
          Array.isArray(clubsResult.data) ? clubsResult.data : []
    }

    const dansResult = await fetchDan()
    if (dansResult?.success && Array.isArray(dansResult.dans)) {
      dans.value = dansResult.dans.sort((a, b) => a.id - b.id)
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err)
  }
}

const validateForm = () => {
  let valid = true
  if (!athleteForm.value.birth_day) valid = false
  if (!athleteForm.value.gender) valid = false
  if (athleteForm.value.age === null || athleteForm.value.age === '') valid = false
  if (athleteForm.value.weight === null || athleteForm.value.weight === '') valid = false
  if (!athleteForm.value.club_id) valid = false
  if (!athleteForm.value.rank_id) valid = false
  if (!athleteForm.value.license_number) valid = false
  if (!athleteForm.value.insurance_number) valid = false
  if (!athleteForm.value.medical_check) valid = false
  return valid
}

const saveAthleteProfile = async () => {
  if (!validateForm()) {
    emit('show-toast', 'Пожалуйста, заполните все поля', 'error')
    return
  }

  const userId = getUserId()
  console.log('Финальный userId для запроса:', userId)

  if (!userId) {
    emit('show-toast', 'Не удалось получить ID пользователя. Смотрите консоль.', 'error')
    return
  }

  isLoading.value = true

  try {
    const data = {
      birth_day: athleteForm.value.birth_day,
      gender: athleteForm.value.gender,
      club_id: Number(athleteForm.value.club_id),
      rank_id: Number(athleteForm.value.rank_id),
      license_number: athleteForm.value.license_number,
      medical_check: athleteForm.value.medical_check,
      insurance_number: athleteForm.value.insurance_number,
      age: Number(athleteForm.value.age),
      weight: Number(athleteForm.value.weight)
    }

    console.log('Данные для отправки (без user_id):', data)

    const res = await fetchCreateAthlete(data, userId)

    console.log('Ответ от fetchCreateAthlete:', res)

    if (res?.success) {
      emit('show-toast', 'Профиль успешно сохранён', 'success')

      // ← ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ ЛОГИНА ПРИ УСПЕХЕ
      router.push({ name: 'login' }) // или { path: '/login' }, если используешь path
    } else {
      emit('show-toast', res?.error || 'Не удалось сохранить профиль', 'error')
    }
  } catch (err) {
    emit('show-toast', 'Ошибка сервера. Попробуйте позже', 'error')
    console.error('Ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
  console.log('=== Компонент загружен ===')
  getUserId()
})
</script>