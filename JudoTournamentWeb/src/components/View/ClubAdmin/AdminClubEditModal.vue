<!-- src/components/View/Clubs/AdminClubEditModal.vue -->
<template>
  <div v-if="isOpen" class="admin-modal-overlay" @click.self="close">
    <div class="admin-modal-content">
      <h2>Редактирование клуба</h2>

      <form @submit.prevent="submit" class="admin-form-grid">
        <!-- поля аналогично, но с id -->
        <div class="admin-form-group">
          <label>Название клуба *</label>
          <input v-model="form.name" required />
        </div>

        <!-- все остальные поля как в create, но с v-model="form.xxx" -->

        <div class="admin-modal-actions">
          <button type="button" class="admin-modal-button admin-modal-button-cancel" @click="close">
            Отмена
          </button>
          <button type="submit" class="admin-modal-button admin-modal-button-submit" :disabled="saving">
            {{ saving ? 'Сохраняется...' : 'Сохранить изменения' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { UpdateClubs } from '@/components/View/Clubs/fetchClubs.js'
import "./ClubsAdmin.css"
const props = defineProps({
  isOpen: Boolean,
  club: Object  // передаём существующий клуб
})

const emit = defineEmits(['close', 'updated'])

const form = ref({})
const saving = ref(false)

watch(() => props.club, (club) => {
  if (club) {
    form.value = { ...club }  // копия объекта
  }
}, { immediate: true })

const submit = async () => {
  saving.value = true
  try {
    await UpdateClubs(form.value)
    emit('updated')
    emit('close')
  } catch (err) {
    alert('Ошибка обновления: ' + err.message)
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<style src="@/components/View/ClubAdmin/ClubsAdmin.css" scoped></style>