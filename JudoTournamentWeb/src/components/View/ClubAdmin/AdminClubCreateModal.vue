<template>
  <div v-if="isOpen" class="admin-modal-overlay" @click.self="close">
    <div class="admin-modal-content">
      <h2>Создание нового клуба</h2>

      <form @submit.prevent="submit" class="admin-form-grid">
        <!-- поля формы — как в предыдущем примере -->
        <div class="admin-form-group">
          <label>Название клуба *</label>
          <input v-model="form.name" required />
        </div>

        <div class="admin-form-group">
          <label>Короткое название</label>
          <input v-model="form.short_name" />
        </div>

        <div class="admin-form-group">
          <label>Город *</label>
          <input v-model="form.city" required />
        </div>

        <!-- остальные поля: country, address, phone, email, website, coach_name, founded_year -->

        <div class="admin-modal-actions">
          <button type="button" class="admin-modal-button admin-modal-button-cancel" @click="close">
            Отмена
          </button>
          <button type="submit" class="admin-modal-button admin-modal-button-submit" :disabled="saving">
            {{ saving ? 'Создаётся...' : 'Создать клуб' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createClub } from '@/components/View/ClubAdmin/fetchClubAdmin.js'  // добавьте эту функцию, если её нет

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'created'])

const form = ref({
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

const saving = ref(false)

const submit = async () => {
  saving.value = true
  try {
    await createClub(form.value)
    emit('created')
    emit('close')
  } catch (err) {
    alert('Ошибка создания клуба: ' + err.message)
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<style src="@/components/View/ClubAdmin/ClubsAdmin.css" scoped></style>