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
            <input
                v-model="localForm.username"
                type="text"
                class="form-input"
                required
                readonly
            />
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
      saving: false
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
        console.error('Нет id пользователя при сохранении')
        alert('Ошибка: идентификатор пользователя не найден')
        return
      }

      this.saving = true

      // Формируем тело запроса в том формате, который ожидает сервер
      const payload = {
        username: this.localForm.username.trim(),
        first_name: this.localForm.first_name.trim(),
        last_name: this.localForm.last_name.trim(),
        middle_name: this.localForm.middle_name?.trim() || '',
        email: this.localForm.email?.trim() || null,
        phone: this.localForm.phone?.trim() || null,
        is_active: this.localForm.is_active
      }

      // Если введён пароль — добавляем
      if (this.localForm.password?.trim()) {
        payload.password = this.localForm.password.trim()
      }

      console.log('Отправляем на сервер (ID:', this.localForm.id, '):', payload)

      try {
        const response = await UpdateUser(this.localForm.id, payload)

        if (response?.success) {
          console.log('Успешно обновлено:', response)
          alert('Пользователь успешно обновлён')
          this.$emit('save', { ...this.localForm, ...payload })
          this.$emit('close')
        } else {
          alert('Ошибка сохранения: ' + (response?.message || 'Неизвестная ошибка'))
        }
      } catch (err) {
        console.error('Ошибка при обновлении:', err)
        alert('Не удалось сохранить изменения')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style src="@/components/View/Users/Users.css" scoped></style>