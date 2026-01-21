<template>
  <div class="clubs-management">
    <!-- ЗАГОЛОВОК -->
    <div class="management-header">
      <h1>Управление клубами</h1>
      <p>Регистрация и редактирование клубов дзюдо</p>
    </div>

    <!-- ПОИСК И ФИЛЬТРЫ -->
    <div class="management-filters">
      <input
          v-model="searchQuery"
          type="search"
          placeholder="Поиск клубов..."
          class="search-input"
      />
      <select v-model="cityFilter" class="filter-select">
        <option value="">Все города</option>
        <option value="Астана">Астана</option>
        <option value="Алматы">Алматы</option>
        <option value="Шымкент">Шымкент</option>
        <option value="Актобе">Актобе</option>
        <option value="Караганда">Караганда</option>
      </select>
      <button class="add-button" @click="openCreateModal">
        + Добавить клуб
      </button>
    </div>

    <!-- ТАБЛИЦА КЛУБОВ -->
    <div class="clubs-table">
      <div class="table-header">
        <div class="table-cell">Название</div>
        <div class="table-cell">Город</div>
        <div class="table-cell">Тренер</div>
        <div class="table-cell">Участников</div>
        <div class="table-cell">Контакты</div>
        <div class="table-cell">Действия</div>
      </div>

      <div
          v-for="club in filteredClubs"
          :key="club.id"
          class="table-row"
      >
        <div class="table-cell">
          <strong>{{ club.name }}</strong>
          <div v-if="club.short_name" class="short-name">
            {{ club.short_name }}
          </div>
        </div>
        <div class="table-cell">
          {{ club.city }}
          <div class="country">{{ club.country }}</div>
        </div>
        <div class="table-cell">
          {{ club.coach_name || 'Не указан' }}
        </div>
        <div class="table-cell">
          <span class="athletes-count">{{ club.athletes_count || 0 }}</span>
        </div>
        <div class="table-cell contacts">
          <div v-if="club.phone" class="contact-item">
            📞 {{ club.phone }}
          </div>
          <div v-if="club.email" class="contact-item">
            ✉️ {{ club.email }}
          </div>
          <div v-if="club.website" class="contact-item">
            🌐 {{ club.website }}
          </div>
        </div>
        <div class="table-cell actions">
          <button class="edit-btn" @click="editClub(club)" title="Редактировать">
            ✏️
          </button>
          <button class="delete-btn" @click="deleteClub(club.id)" title="Удалить">
            🗑️
          </button>
        </div>
      </div>

      <div v-if="filteredClubs.length === 0" class="no-data">
        <div class="no-data-icon">🏢</div>
        <p>Клубы не найдены</p>
        <button class="create-first-btn" @click="openCreateModal">
          Создать первый клуб
        </button>
      </div>
    </div>

    <!-- МОДАЛКА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ КЛУБА -->
    <ClubModal
        :is-open="isModalOpen"
        :editing-club="editingClub"
        @close="closeModal"
        @submit="handleClubSubmission"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ClubModal from '@/components/View/Clubs/ClubModal.vue'
import "./Clubs.css"

const clubs = ref([])
const searchQuery = ref('')
const cityFilter = ref('')

// Модалки
const isModalOpen = ref(false)
const editingClub = ref(null)

// Фильтрация клубов
const filteredClubs = computed(() => {
  return clubs.value.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (club.short_name && club.short_name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
        (club.coach_name && club.coach_name.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesCity = !cityFilter.value || club.city === cityFilter.value

    return matchesSearch && matchesCity
  })
})

// Загрузка данных с сервера
const loadClubs = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5001/clubs/', {
      headers: { 'X-API-Key': 'mobile_app_2024' }
    })

    if (response.ok) {
      const data = await response.json()
      clubs.value = data.clubs || data || []
    } else {
      console.error('Ошибка загрузки клубов:', response.status, response.statusText)
      clubs.value = [] // Очищаем список при ошибке
    }
  } catch (error) {
    console.error('Ошибка загрузки клубов:', error)
    clubs.value = [] // Очищаем список при любой ошибке
  }
}

// Управление модалками
const openCreateModal = () => {
  isModalOpen.value = true
  editingClub.value = null
}

const closeModal = () => {
  isModalOpen.value = false
}

const editClub = (club) => {
  isModalOpen.value = true
  editingClub.value = { ...club } // создаём копию, чтобы не менять оригинал
}

// Обработка сохранения клуба
const handleClubSubmission = (result) => {
  if (result.success) {
    // Успешное сохранение — перезагружаем список
    loadClubs()
  } else {
    alert('Ошибка: ' + (result.error || 'Не удалось сохранить клуб'))
  }
}

// Удаление клуба
const deleteClub = async (clubId) => {
  if (!confirm('Вы уверены, что хотите удалить клуб? Все связанные данные будут потеряны.')) {
    return
  }

  try {
    const response = await fetch(`http://127.0.0.1:5000/api/clubs/${clubId}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': 'mobile_app_2024' }
    })

    if (!response.ok) {
      throw new Error('Ошибка удаления клуба')
    }

    alert('Клуб успешно удалён!')
    loadClubs()
  } catch (error) {
    alert('Ошибка удаления: ' + error.message)
  }
}

onMounted(() => {
  loadClubs()
})
</script>

<style scoped>
</style>