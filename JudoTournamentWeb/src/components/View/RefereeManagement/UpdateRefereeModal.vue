<template>
  <div v-if="isOpen" class="overlay" @click="emitClose">
    <div class="modal" @click.stop>
      <h3>Редактировать судью</h3>

      <!-- ФИО — только просмотр -->
      <div class="referee-info">
        <strong>Судья:</strong><br>
        {{ fullName }}
      </div>

      <form @submit.prevent="handleSubmit" class="referee-form">

        <!-- Категория судьи (редактируемое) -->
        <div class="form-group">
          <label for="certification_level">Категория судьи</label>
          <input
              id="certification_level"
              v-model="formData.certification_level"
              type="text"
              class="modal-input"
              placeholder="Например: Национальный 3 категории"
          />
        </div>

        <!-- Телефон (редактируемое) -->
        <div class="form-group">
          <label for="phone">Телефон</label>
          <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              class="modal-input"
              placeholder="+7 (___) ___-__-__"
          />
        </div>

        <!-- Email (редактируемое) -->
        <div class="form-group">
          <label for="email">Email</label>
          <input
              id="email"
              v-model="formData.email"
              type="email"
              class="modal-input"
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="emitClose">
            Отмена
          </button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Сохранение...' : 'Сохранить изменения' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { UpdateReferee } from '@/components/View/RefereeManagement/fetchRefereeManagement.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  referee: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  email: '',
  phone: '',
  certification_level: ''
})

const loading = ref(false)

// Вычисляем полное ФИО для отображения
const fullName = computed(() => {
  const r = props.referee || {}
  return `${r.last_name || ''} ${r.first_name || ''} ${r.middle_name || ''}`.trim() || '—'
})

// Заполняем только редактируемые поля
onMounted(() => {
  if (props.referee && props.isOpen) {
    formData.value = {
      email: props.referee.email || '',
      phone: props.referee.phone || '',
      certification_level: props.referee.certification_level || ''
    }
  }
})

watch(() => props.referee, (newVal) => {
  if (newVal && props.isOpen) {
    formData.value = {
      email: newVal.email || '',
      phone: newVal.phone || '',
      certification_level: newVal.certification_level || ''
    }
  }
}, { deep: true })

const handleSubmit = async () => {
  if (!props.referee?.id) return

  loading.value = true

  try {
    const result = await UpdateReferee(props.referee.id, formData.value)

    if (result.success !== false) {
      emit('submit', { success: true })
      emit('close')
    } else {
      alert('Ошибка сохранения: ' + (result.error || 'Неизвестная ошибка'))
    }
  } catch (err) {
    console.error(err)
    alert('Не удалось сохранить данные судьи')
  } finally {
    loading.value = false
  }
}

const emitClose = () => {
  emit('close')
}
</script>

<style scoped>
/* Стили остаются в едином стиле вашего приложения */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
  backdrop-filter: blur(2px);
}

.modal {
  background: #fff;
  border-radius: 14px;
  padding: 28px 28px 24px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}

.modal h3 {
  margin: 0 0 16px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

.referee-info {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #374151;
  border-left: 4px solid #c89b3c;
}

.referee-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group label {
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.modal-input {
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  background: #fff;
  transition: border-color 0.15s;
}

.modal-input:focus {
  outline: none;
  border-color: #c89b3c;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-primary {
  background: #c89b3c;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ghost {
  padding: 10px 20px;
  border: 1.5px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
}
</style>