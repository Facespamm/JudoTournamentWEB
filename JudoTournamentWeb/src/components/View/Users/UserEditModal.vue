<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Редактировать пользователя</h2>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <form @submit.prevent="handleSave" class="user-form">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Фамилия *</label>
            <input v-model="localForm.last_name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Имя *</label>
            <input v-model="localForm.first_name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Отчество</label>
            <input v-model="localForm.middle_name" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Логин *</label>
            <input v-model="localForm.username" type="text" class="form-input" required readonly />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="localForm.email" type="email" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Телефон</label>
            <input v-model="localForm.phone" type="tel" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Статус</label>
            <select v-model="localForm.is_active" class="form-select">
              <option :value="true">Активен</option>
              <option :value="false">Неактивен</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">Отмена</button>
          <button type="submit" class="btn-save" :disabled="saving">
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- МОДАЛКА УСПЕХА (точно как в создании турнира) -->
  <div v-if="showSuccessModal" class="admin-modal-overlay" @click.self="closeSuccessModal">
    <div class="admin-modal-content success-modal">
      <div class="success-icon">✅</div>
      <h2>Успешно!</h2>
      <p class="success-text">{{ successMessage }}</p>
      <div class="admin-modal-actions">
        <button class="admin-modal-button admin-modal-button-submit" @click="closeSuccessModal">
          Отлично, продолжить
        </button>
      </div>
    </div>
  </div>

  <!-- МОДАЛКА ОШИБКИ (точно как в создании турнира) -->
  <div v-if="showErrorModal" class="admin-modal-overlay" @click.self="closeErrorModal">
    <div class="admin-modal-content error-modal">
      <div class="error-icon">❌</div>
      <h2>Ошибка</h2>
      <p class="error-text">{{ errorMessage }}</p>
      <div class="admin-modal-actions">
        <button class="admin-modal-button admin-modal-button-cancel" @click="closeErrorModal">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { UpdateUser } from "@/components/View/Users/fetchUsers.js"

export default {
  name: 'UserEditModal',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localForm: {
        id: null,
        username: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        phone: '',
        is_active: true,
        password: ''
      },
      saving: false,
      // === НОВЫЕ ПОЛЯ ДЛЯ КРАСИВЫХ УВЕДОВ ===
      showSuccessModal: false,
      successMessage: '',
      showErrorModal: false,
      errorMessage: ''
    }
  },
  watch: {
    user: {
      immediate: true,
      deep: true,
      handler(newUser) {
        if (newUser) {
          this.localForm = {
            id: newUser.id || null,
            username: newUser.username || '',
            first_name: newUser.first_name || '',
            last_name: newUser.last_name || '',
            middle_name: newUser.middle_name || '',
            email: newUser.email || '',
            phone: newUser.phone || '',
            is_active: newUser.is_active ?? true,
            password: ''
          }
        }
      }
    }
  },
  methods: {
    async handleSave() {
      if (!this.localForm?.id) {
        this.errorMessage = 'Ошибка: идентификатор пользователя не найден'
        this.showErrorModal = true
        return
      }

      this.saving = true

      const payload = {
        username: this.localForm.username.trim(),
        first_name: this.localForm.first_name.trim(),
        last_name: this.localForm.last_name.trim(),
        middle_name: this.localForm.middle_name?.trim() || '',
        email: this.localForm.email?.trim() || null,
        phone: this.localForm.phone?.trim() || null,
        is_active: this.localForm.is_active
      }

      if (this.localForm.password?.trim()) {
        payload.password = this.localForm.password.trim()
      }

      try {
        const response = await UpdateUser(this.localForm.id, payload)

        if (response?.success) {
          this.successMessage = 'Пользователь успешно обновлён!'
          this.showSuccessModal = true
        } else {
          this.errorMessage = response?.message || 'Не удалось сохранить изменения'
          this.showErrorModal = true
        }
      } catch (err) {
        console.error('Ошибка при обновлении:', err)
        this.errorMessage = 'Произошла ошибка при сохранении данных'
        this.showErrorModal = true
      } finally {
        this.saving = false
      }
    },

    // После нажатия «Отлично» — закрываем редактирование и обновляем список в родителе
    closeSuccessModal() {
      this.showSuccessModal = false
      this.successMessage = ''
      this.$emit('save')   // родитель вызовет loadUsers + loadStats
      this.$emit('close')  // закрываем саму модалку редактирования
    },

    closeErrorModal() {
      this.showErrorModal = false
      this.errorMessage = ''
      // остаёмся в модалке редактирования, чтобы пользователь мог исправить
    }
  }
}
</script>

<style scoped>
/* ==================== СТИЛИ МОДАЛОК УСПЕХА И ОШИБКИ (ТОЧЬ-В-ТОЧЬ КАК В ТУРНИРЕ) ==================== */
.admin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000; /* выше основной модалки */
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
.success-icon, .error-icon {
  font-size: 3.5rem;
  margin-bottom: 10px;
}
.admin-modal-content h2 {
  margin: 0 0 10px;
  font-size: 1.4rem;
}
.success-text, .error-text {
  font-size: 1.05rem;
  line-height: 1.4;
  margin-bottom: 24px;
}
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
</style>