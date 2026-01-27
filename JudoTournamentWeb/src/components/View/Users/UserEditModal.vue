<!-- src/components/UserEditModal.vue -->
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
          <button type="submit" class="btn-save" :disabled="saving">Сохранить</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { UpdateUser } from "@/components/View/Users/fetchUsers.js";

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
      localForm: { ...this.user, password: '' },
      saving: false
    }
  },

  watch: {
    user: {
      immediate: true,
      handler(newUser) {
        this.localForm = { ...newUser, password: '' }
      }
    }
  },

  methods: {
    async handleSave() {
      this.saving = true

      // Формируем данные в формате, который ожидает сервер
      const payload = {
        username: this.localForm.username,
        name: `${this.localForm.last_name || ''} ${this.localForm.first_name || ''} ${this.localForm.middle_name || ''}`.trim(),
        email: this.localForm.email || null,
        phone: this.localForm.phone || null,
        is_active: this.localForm.is_active
      }

      // Если пользователь ввёл новый пароль — добавляем его
      if (this.localForm.password?.trim()) {
        payload.password = this.localForm.password.trim()
      }

      try {
        const response = await UpdateUser(this.localForm.id, payload)
        if (response?.success) {
          this.$emit('save', payload)
          this.$emit('close')
        } else {
          alert('Ошибка при сохранении: ' + (response?.message || 'Неизвестная ошибка'))
        }
      } catch (err) {
        console.error('Ошибка обновления пользователя:', err)
        alert('Произошла ошибка при сохранении данных')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style src="@/components/View/Users/Users.css" scoped></style>