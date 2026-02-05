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
          <input v-model="athleteForm.birth_date" type="date" :disabled="isLoading" required />
        </div>

        <div class="form-group">
          <label>Пол</label>
          <select v-model="athleteForm.gender" :disabled="isLoading" required>
            <option value="" disabled>Выберите пол</option>
            <option value="мужской">Мужской</option>
            <option value="женский">Женский</option>
          </select>
        </div>

        <!-- Автоматически рассчитываемый возраст (только для отображения) -->
        <div class="form-group full-width">
          <label>Возраст</label>
          <p class="age-display">
            {{ calculatedAge !== null ? `${calculatedAge} лет` : 'Укажите дату рождения' }}
          </p>
        </div>

        <div class="form-group">
          <label>Вес (кг)</label>
          <input v-model.number="athleteForm.weight" type="number" min="20" step="0.5" :disabled="isLoading" placeholder="Например, 68.5" required />
        </div>

        <div class="form-group">
          <label>Клуб</label>
          <select v-model="athleteForm.club_id" :disabled="isLoading" required>
            <option value="" disabled>Выберите клуб</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Кю/Дан</label>
          <select v-model="athleteForm.rank_id" :disabled="isLoading" required>
            <option value="" disabled>Выберите кю/дан</option>
            <option v-for="dan in dans" :key="dan.id" :value="dan.id">
              {{ dan.description }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Номер лицензии</label>
          <input v-model="athleteForm.license_number" type="text" :disabled="isLoading" placeholder="Введите номер лицензии" />
        </div>

        <div class="form-group">
          <label>Номер страховки</label>
          <input v-model="athleteForm.insurance_number" type="text" :disabled="isLoading" placeholder="Введите номер страховки" />
        </div>

        <div class="form-group full-width checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="athleteForm.medical_check" :disabled="isLoading" class="hidden-checkbox" />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchClubs, fetchDan, fetchCreateAthlete } from '@/components/View/Authentication/SelectRoleView/fetchGetInformation.js'
import './Roles.css'

const emit = defineEmits(['show-toast'])
const router = useRouter()

const isLoading = ref(false)
const clubs = ref([])
const dans = ref([])

// Форма без поля age (возраст рассчитывается автоматически на основе даты рождения)
const athleteForm = ref({
  birth_date: '',
  gender: '',
  weight: null,
  club_id: '',
  rank_id: '',
  license_number: '',
  insurance_number: '',
  medical_check: false
})

// Расчёт возраста для отображения пользователю
const calculatedAge = computed(() => {
  if (!athleteForm.value.birth_date) return null
  const birth = new Date(athleteForm.value.birth_date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
})

// Функция получения user_id из JWT
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
        Array.from(decoded, c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
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
      clubs.value = Array.isArray(clubsResult.clubs)
          ? clubsResult.clubs
          : Array.isArray(clubsResult.data)
              ? clubsResult.data
              : []
    }

    const dansResult = await fetchDan()
    if (dansResult?.success && Array.isArray(dansResult.dans)) {
      dans.value = dansResult.dans.sort((a, b) => a.id - b.id)
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err)
  }
}

// Валидация формы (убрали проверку age, сделали license_number, insurance_number и medical_check опциональными,
// если они действительно не обязательны на backend; при необходимости верните строгие проверки)
const validateForm = () => {
  if (!athleteForm.value.birth_date) return false
  if (!athleteForm.value.gender) return false
  if (athleteForm.value.weight === null || athleteForm.value.weight === '') return false
  if (!athleteForm.value.club_id) return false
  if (!athleteForm.value.rank_id) return false
  // Опционально: раскомментируйте, если эти поля обязательны
  // if (!athleteForm.value.license_number?.trim()) return false
  // if (!athleteForm.value.insurance_number?.trim()) return false
  // if (!athleteForm.value.medical_check) return false
  return true
}

const saveAthleteProfile = async () => {
  if (!validateForm()) {
    emit('show-toast', 'Пожалуйста, заполните все обязательные поля', 'error')
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
      birth_date: athleteForm.value.birth_date,
      gender: athleteForm.value.gender,
      club_id: Number(athleteForm.value.club_id),
      rank_id: Number(athleteForm.value.rank_id),
      license_number: athleteForm.value.license_number || null,
      medical_check: athleteForm.value.medical_check,
      insurance_number: athleteForm.value.insurance_number || null,
      weight: Number(athleteForm.value.weight)
      // age НЕ передаётся — backend рассчитает его сам по birth_date
    }

    console.log('Данные для отправки (без user_id):', data)

    const res = await fetchCreateAthlete(data, userId)
    console.log('Ответ от fetchCreateAthlete:', res)

    if (res?.success) {
      emit('show-toast', 'Профиль успешно сохранён', 'success')
      router.push({ name: 'login' })
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

<style scoped>
/* Добавьте стили для отображения возраста, если нужно */
.age-display {
  margin: 8px 0 0 0;
  font-size: 1.1em;
  font-weight: 500;
  color: #333;
}
</style>