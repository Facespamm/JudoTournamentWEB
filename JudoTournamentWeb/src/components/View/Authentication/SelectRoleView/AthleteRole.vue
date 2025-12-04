<!-- [file name]: AthleteRole.vue -->
<template>
  <div class="role-content">
    <div class="role-header">
      <h3>Панель спортсмена</h3>
      <p>Управление вашим профилем и регистрациями на турниры</p>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Сохранение данных...</p>
    </div>

    <form @submit.prevent="saveAthleteProfile" class="role-form">
      <div class="form-grid form-grid-multi">
        <!-- Основные поля -->
        <div class="form-group">
          <label for="last_name">Фамилия *</label>
          <input
              v-model="athleteForm.last_name"
              type="text"
              id="last_name"
              placeholder="Введите фамилию"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.last_name" class="error">{{ errors.last_name }}</span>
        </div>

        <div class="form-group">
          <label for="first_name">Имя *</label>
          <input
              v-model="athleteForm.first_name"
              type="text"
              id="first_name"
              placeholder="Введите имя"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.first_name" class="error">{{ errors.first_name }}</span>
        </div>

        <div class="form-group">
          <label for="middle_name">Отчество</label>
          <input
              v-model="athleteForm.middle_name"
              type="text"
              id="middle_name"
              placeholder="Введите отчество"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="gender">Пол *</label>
          <select v-model="athleteForm.gender" id="gender" :disabled="isLoading" required>
            <option value="">Выберите пол</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
          <span v-if="errors.gender" class="error">{{ errors.gender }}</span>
        </div>

        <div class="form-group">
          <label for="birth_day">Дата рождения *</label>
          <input
              v-model="athleteForm.birth_day"
              type="date"
              id="birth_day"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.birth_day" class="error">{{ errors.birth_day }}</span>
        </div>

        <!-- Спортивная информация -->
        <div class="form-group">
          <label for="club_id">Клуб *</label>
          <select v-model="athleteForm.club_id" id="club_id" :disabled="isLoading" required>
            <option value="">Выберите клуб</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.name }}
            </option>
          </select>
          <span v-if="errors.club_id" class="error">{{ errors.club_id }}</span>
        </div>

        <div class="form-group">
          <label for="rank_id">Разряд *</label>
          <select v-model="athleteForm.rank_id" id="rank_id" :disabled="isLoading" required>
            <option value="">Выберите разряд</option>
            <option v-for="rank in ranks" :key="rank.id" :value="rank.id">
              {{ rank.name }}
            </option>
          </select>
          <span v-if="errors.rank_id" class="error">{{ errors.rank_id }}</span>
        </div>

        <div class="form-group">
          <label for="license_number">Номер лицензии *</label>
          <input
              v-model="athleteForm.license_number"
              type="text"
              id="license_number"
              placeholder="Введите номер лицензии"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.license_number" class="error">{{ errors.license_number }}</span>
        </div>

        <div class="form-group">
          <label for="insurance_number">Номер страховки *</label>
          <input
              v-model="athleteForm.insurance_number"
              type="text"
              id="insurance_number"
              placeholder="Введите номер страховки"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.insurance_number" class="error">{{ errors.insurance_number }}</span>
        </div>

        <!-- Контактная информация -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
              v-model="athleteForm.email"
              type="email"
              id="email"
              placeholder="Введите email"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="phone">Телефон</label>
          <input
              v-model="athleteForm.phone"
              type="tel"
              id="phone"
              placeholder="+7 (999) 123-45-67"
              :disabled="isLoading"
          />
        </div>

        <!-- Медицинская справка -->
        <div class="form-group checkbox-group full-width">
          <div class="medical-check-container">
            <input
                v-model="athleteForm.medical_check"
                type="checkbox"
                id="medical_check"
                :disabled="isLoading"
                class="medical-checkbox"
            />
            <label for="medical_check" class="medical-check-label">
              Медицинская справка есть *
            </label>
          </div>
          <span v-if="errors.medical_check" class="error">{{ errors.medical_check }}</span>
        </div>
      </div>

      <div class="form-actions">
        <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
        >
          {{ isLoading ? 'Сохранение...' : 'Сохранить профиль спортсмена' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { createAthlete, fetchAthletes } from '@/components/View/RegistrationAthletes/fetchRegistrationAthletes'
import {fetchClubs} from "@/components/View/Authentication/SelectRoleView/fetchGetInformation.js";

const emit = defineEmits(['show-toast'])

// Состояние загрузки
const isLoading = ref(false)

// Списки для выбора
const clubs = ref([])
const ranks = ref([])

// Данные для формы - соответствуют API
const athleteForm = ref({
  last_name: '',
  first_name: '',
  middle_name: '',
  gender: '',
  birth_day: '',
  club_id: '',
  rank_id: '',
  license_number: '',
  medical_check: false,
  insurance_number: '',
  email: '',
  phone: ''
})

const errors = ref({})
const athletes = ref([])

// Загрузка списков клубов и разрядов
const loadClubsAndRanks = async () => {
  try {
    const [clubsResult, ranksResult] = await Promise.all([
      fetchClubs(),
      fetchRanks()
    ])

    if (clubsResult.success) {
      clubs.value = clubsResult.data
    } else {
      console.error('Ошибка загрузки клубов:', clubsResult.error)
    }

    if (ranksResult.success) {
      ranks.value = ranksResult.data
    } else {
      console.error('Ошибка загрузки разрядов:', ranksResult.error)
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  }
}

// Получение данных спортсменов
const loadAthletes = async () => {
  try {
    const result = await fetchAthletes()
    if (result.success) {
      athletes.value = result.data
      athletes.value = athletes.value.map(athlete => ({
        ...athlete,
        full_name: `${athlete.last_name} ${athlete.first_name} ${athlete.middle_name || ''}`.trim()
      }))
    } else {
      console.error('Ошибка загрузки спортсменов:', result.error)
    }
  } catch (error) {
    console.error('Ошибка:', error)
  }
}

// Валидация формы
const validateAthleteForm = () => {
  errors.value = {}
  let isValid = true

  // Обязательные поля
  const requiredFields = {
    last_name: 'Фамилия обязательна',
    first_name: 'Имя обязательно',
    gender: 'Пол обязателен',
    birth_day: 'Дата рождения обязательна',
    club_id: 'Клуб обязателен',
    rank_id: 'Разряд обязателен',
    license_number: 'Номер лицензии обязателен',
    insurance_number: 'Номер страховки обязателен'
  }

  Object.keys(requiredFields).forEach(field => {
    if (!athleteForm.value[field]) {
      errors.value[field] = requiredFields[field]
      isValid = false
    }
  })

  // Проверка медицинской справки
  if (!athleteForm.value.medical_check) {
    errors.value.medical_check = 'Необходимо подтвердить наличие медицинской справки'
    isValid = false
  }

  // Валидация email если указан
  if (athleteForm.value.email && !isValidEmail(athleteForm.value.email)) {
    errors.value.email = 'Введите корректный email'
    isValid = false
  }

  return isValid
}

// Валидация email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Подготовка данных для отправки
const prepareAthleteData = () => {
  const formData = { ...athleteForm.value }

  // Преобразуем club_id и rank_id в числа
  if (formData.club_id) formData.club_id = parseInt(formData.club_id)
  if (formData.rank_id) formData.rank_id = parseInt(formData.rank_id)

  // Убираем лишние поля если они пустые
  if (!formData.middle_name) delete formData.middle_name
  if (!formData.email) delete formData.email
  if (!formData.phone) delete formData.phone

  return formData
}

const saveAthleteProfile = async () => {
  if (!validateAthleteForm()) {
    emit('show-toast', 'Пожалуйста, заполните все обязательные поля', 'error')
    return
  }

  isLoading.value = true

  try {
    const athleteData = prepareAthleteData()
    console.log('Отправляемые данные:', athleteData)

    const result = await createAthlete(athleteData)

    if (result.success) {
      emit('show-toast', 'Профиль спортсмена успешно сохранен!', 'success')

      // Сброс формы
      athleteForm.value = {
        last_name: '',
        first_name: '',
        middle_name: '',
        gender: '',
        birth_day: '',
        club_id: '',
        rank_id: '',
        license_number: '',
        medical_check: false,
        insurance_number: '',
        email: '',
        phone: ''
      }

      await loadAthletes() // Обновляем список спортсменов
    } else {
      emit('show-toast', result.error || 'Ошибка при сохранении профиля', 'error')
    }

  } catch (error) {
    console.error('Ошибка при сохранении профиля:', error)
    emit('show-toast', 'Ошибка при сохранении профиля: ' + error.message, 'error')
  } finally {
    isLoading.value = false
  }
}

// Загружаем данные при монтировании
onMounted(() => {
  loadClubsAndRanks()
  loadAthletes()
})
</script>

<style scoped>
.full-width {
  grid-column: 1 / -1;
}

.error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Стили для контейнера медицинской справки */
.medical-check-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

/* Стили для самого чекбокса */
.medical-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

/* Стили для метки чекбокса */
.medical-check-label {
  cursor: pointer;
  font-weight: normal;
  margin: 0;
}

/* Убедимся, что чекбокс виден */
.checkbox-group {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>