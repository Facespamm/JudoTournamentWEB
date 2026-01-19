<template>
  <div class="create-tournament">
    <h3>Создать новый турнир</h3>

    <!-- Индикатор загрузки -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Создание турнира...</p>
    </div>

    <form @submit.prevent="submit">
      <div class="form-grid">
        <div class="form-group">
          <label for="name">Название турнира *</label>
          <input
              v-model="formData.name"
              type="text"
              id="name"
              placeholder="Введите название"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.name" class="error">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="organizer">Организатор</label>
          <input
              v-model="formData.organizer"
              type="text"
              id="organizer"
              placeholder="Введите организатора"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="tatami_count">Количество татами *</label>
          <input
              v-model.number="formData.tatami_count"
              type="number"
              id="tatami_count"
              min="1"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.tatami_count" class="error">{{ errors.tatami_count }}</span>
        </div>

        <div class="form-group">
          <label for="fight_duration">Длительность схватки (сек)</label>
          <input
              v-model.number="formData.fight_duration"
              type="number"
              id="fight_duration"
              min="60"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="start_date">Дата начала *</label>
          <input
              v-model="formData.start_date"
              type="date"
              id="start_date"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.start_date" class="error">{{ errors.start_date }}</span>
        </div>

        <div class="form-group">
          <label for="end_date">Дата окончания *</label>
          <input
              v-model="formData.end_date"
              type="date"
              id="end_date"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.end_date" class="error">{{ errors.end_date }}</span>
        </div>

        <div class="form-group">
          <label for="venue">Место проведения *</label>
          <input
              v-model="formData.venue"
              type="text"
              id="venue"
              placeholder="Введите место"
              :disabled="isLoading"
              required
          />
          <span v-if="errors.venue" class="error">{{ errors.venue }}</span>
        </div>

        <div class="form-group">
          <label for="city">Город</label>
          <input
              v-model="formData.city"
              type="text"
              id="city"
              placeholder="Введите город"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group">
          <label for="country">Страна</label>
          <input
              v-model="formData.country"
              type="text"
              id="country"
              :disabled="isLoading"
          />
        </div>

        <div class="form-group full-width">
          <label for="description">Описание турнира</label>
          <textarea
              v-model="formData.description"
              id="description"
              placeholder="Введите описание турнира"
              :disabled="isLoading"
              rows="3"
          ></textarea>
        </div>
      </div>

      <div class="form-actions">
        <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
        >
          {{ isLoading ? 'Создание...' : 'Создать турнир' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createTournament } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import "./TournamentManagement.css"
const emit = defineEmits(['tournament-created'])

const isLoading = ref(false)

const formData = ref({
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  venue: '',
  city: '',
  country: 'Казахстан',
  tatami_count: 1,
  status: 'PLANNED',
  fight_duration: 300,
  organizer: ''
})

const errors = ref({})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.name.trim()) {
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
  if (!formData.value.venue.trim()) {
    errors.value.venue = 'Место проведения обязательно'
    isValid = false
  }
  if (formData.value.tatami_count < 1) {
    errors.value.tatami_count = 'Минимум 1 татами'
    isValid = false
  }

  return isValid
}

const submit = async () => {
  if (!validateForm()) return

  isLoading.value = true

  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description || '',
      start_date: formData.value.start_date,
      end_date: formData.value.end_date,
      venue: formData.value.venue,
      city: formData.value.city || '',
      country: formData.value.country || 'Казахстан',
      tatami_count: formData.value.tatami_count || 1,
      status: formData.value.status || 'PLANNED',
      fight_duration: formData.value.fight_duration || 300,
      organizer: formData.value.organizer || ''
    }

    const result = await createTournament(payload)

    if (result.success) {
      emit('tournament-created', result.data.id)

      // Сбрасываем форму
      formData.value = {
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        venue: '',
        city: '',
        country: 'Казахстан',
        tatami_count: 1,
        status: 'PLANNED',
        fight_duration: 300,
        organizer: ''
      }
    } else {
      throw new Error(result.error)
    }

  } catch (error) {
    console.error('Ошибка при создании турнира:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
</style>