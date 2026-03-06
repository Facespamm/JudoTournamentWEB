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

        <!-- Дата рождения + возраст -->
        <div class="form-group">
          <label>Дата рождения</label>
          <div class="input-with-badge">
            <input v-model="athleteForm.birth_date" type="date" :disabled="isLoading" required />
            <span class="age-badge" v-if="calculatedAge !== null">{{ calculatedAge }} лет</span>
          </div>
        </div>

        <!-- Пол -->
        <div class="form-group">
          <label>Пол</label>
          <select v-model="athleteForm.gender" :disabled="isLoading" required>
            <option value="" disabled>Выберите пол</option>
            <option value="мужской">Мужской</option>
            <option value="женский">Женский</option>
          </select>
        </div>

        <!-- Вес -->
        <div class="form-group">
          <label>Вес (кг)</label>
          <input v-model.number="athleteForm.weight" type="number" min="20" step="0.5" :disabled="isLoading" placeholder="68.5" required />
        </div>

        <!-- Кю/Дан -->
        <div class="form-group">
          <label>Кю / Дан</label>
          <select v-model="athleteForm.rank_id" :disabled="isLoading" required>
            <option value="" disabled>Выберите разряд</option>
            <option v-for="dan in dans" :key="dan.id" :value="dan.id">{{ dan.description }}</option>
          </select>
        </div>

        <!-- Клуб (необязательно) -->
        <div class="form-group">
          <label>Клуб <span class="optional">(необязательно)</span></label>
          <select v-model="athleteForm.club_id" :disabled="isLoading">
            <option value="">Без клуба</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">{{ club.name }}</option>
          </select>
        </div>

        <!-- Лицензия -->
        <div class="form-group">
          <label>Номер лицензии <span class="optional">(необязательно)</span></label>
          <input v-model="athleteForm.license_number" type="text" :disabled="isLoading" placeholder="Введите номер" />
        </div>

        <!-- Страховка -->
        <div class="form-group">
          <label>Номер страховки <span class="optional">(необязательно)</span></label>
          <input v-model="athleteForm.insurance_number" type="text" :disabled="isLoading" placeholder="Введите номер" />
        </div>

        <!-- Чекбокс -->
        <div class="form-group full-width">
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

const calculatedAge = computed(() => {
  if (!athleteForm.value.birth_date) return null
  const birth = new Date(athleteForm.value.birth_date)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
})

const getUserId = () => {
  const token = document.cookie.split('; ').find(r => r.startsWith('jwt_token='))?.split('=')[1]
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    base64 += '='.repeat((4 - base64.length % 4) % 4)
    const payload = JSON.parse(decodeURIComponent(
        Array.from(atob(base64), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ))
    return Number(payload.sub ?? payload.id ?? payload.user_id) || null
  } catch { return null }
}

const loadData = async () => {
  try {
    const [clubsResult, dansResult] = await Promise.all([fetchClubs(), fetchDan()])
    if (clubsResult?.success) {
      clubs.value = Array.isArray(clubsResult.clubs) ? clubsResult.clubs : clubsResult.data || []
    }
    if (dansResult?.success && Array.isArray(dansResult.dans)) {
      dans.value = dansResult.dans.sort((a, b) => a.id - b.id)
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err)
  }
}

const validateForm = () => {
  const f = athleteForm.value
  return f.birth_date && f.gender && f.weight !== null && f.weight !== '' && f.rank_id
}

const saveAthleteProfile = async () => {
  if (!validateForm()) {
    emit('show-toast', 'Пожалуйста, заполните все обязательные поля', 'error')
    return
  }
  const userId = getUserId()
  if (!userId) {
    emit('show-toast', 'Не удалось получить ID пользователя', 'error')
    return
  }

  isLoading.value = true
  try {
    const res = await fetchCreateAthlete({
      birth_date: athleteForm.value.birth_date,
      gender: athleteForm.value.gender,
      club_id: athleteForm.value.club_id ? Number(athleteForm.value.club_id) : null,
      rank_id: Number(athleteForm.value.rank_id),
      license_number: athleteForm.value.license_number || null,
      medical_check: athleteForm.value.medical_check,
      insurance_number: athleteForm.value.insurance_number || null,
      weight: Number(athleteForm.value.weight)
    }, userId)

    if (res?.success) {
      emit('show-toast', 'Профиль успешно сохранён', 'success')
      router.push({ name: 'login' })
    } else {
      emit('show-toast', res?.error || 'Не удалось сохранить профиль', 'error')
    }
  } catch {
    emit('show-toast', 'Ошибка сервера. Попробуйте позже', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.input-with-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.input-with-badge input[type="date"] {
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 0.9rem;
}

.age-badge {
  position: absolute;
  right: 2.2rem;
  background: #c89b3c;
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
}

.optional {
  font-size: 0.75rem;
  font-weight: 400;
  color: #9ca3af;
}
</style>