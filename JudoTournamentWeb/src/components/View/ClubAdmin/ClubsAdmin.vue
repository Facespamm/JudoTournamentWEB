<template>
  <div class="admin-clubs-management">
    <!-- Заголовок -->
    <div class="admin-management-header">
      <h1>Управление клубами</h1>
      <p>Регистрация и редактирование клубов дзюдо</p>
    </div>

    <!-- Фильтры и кнопка создания -->
    <div class="admin-management-filters">
      <input
          v-model="adminSearchQuery"
          type="search"
          placeholder="Поиск по названию, короткому имени, тренеру..."
          class="admin-search-input"
      />
      <select v-model="adminCityFilter" class="admin-filter-select">
        <option value="">Все города</option>
        <option value="Астана">Астана</option>
        <option value="Алматы">Алматы</option>
        <option value="Шымкент">Шымкент</option>
        <option value="Актобе">Актобе</option>
        <option value="Караганда">Караганда</option>
      </select>
      <button class="admin-add-button" @click="openCreateModal">
        + Добавить клуб
      </button>
    </div>

    <!-- Карточка с таблицей -->
    <div class="admin-clubs-table-card">
      <div class="admin-table-header">
        <h3>Список клубов</h3>
        <div class="admin-table-actions">
          <button
              class="admin-btn-edit"
              :disabled="!selectedClubId"
              @click="openEditModal"
          >
            Редактировать
          </button>
          <button
              class="admin-btn-delete"
              :disabled="!selectedClubId"
              @click="confirmDelete"
          >
            Удалить
          </button>
        </div>
      </div>

      <div class="admin-table-container">
        <div v-if="loading" class="admin-loading-state">
          <p>Загрузка данных...</p>
        </div>

        <table v-else-if="filteredClubs.length > 0" class="admin-clubs-table">
          <thead>
          <tr>
            <th class="admin-col-select"></th>
            <th>Название клуба</th>
            <th>Город</th>
            <th>Тренер</th>
            <th>Участников</th>
            <th>Контакты</th>
          </tr>
          </thead>
          <tbody>
          <tr
              v-for="club in filteredClubs"
              :key="club.id"
              class="admin-table-row"
              :class="{ 'admin-selected-row': selectedClubId === club.id }"
              @click="selectClub(club.id)"
          >
            <td class="admin-col-select">
              <input
                  type="radio"
                  :checked="selectedClubId === club.id"
                  @click.stop="selectClub(club.id)"
              />
            </td>
            <td data-label="Название">
              <div class="admin-club-name">{{ club.name }}</div>
              <div v-if="club.short_name" class="admin-short-name">{{ club.short_name }}</div>
            </td>
            <td data-label="Город">
              {{ club.city || '—' }}
              <div v-if="club.country && club.country !== 'Казахстан'" class="admin-country">
                {{ club.country }}
              </div>
            </td>
            <td data-label="Тренер">
              {{ club.coach_name || 'Не указан' }}
            </td>
            <td data-label="Участников">
              <span class="admin-athletes-count">{{ club.athletes_count || 0 }}</span>
            </td>
            <td data-label="Контакты" class="admin-contacts-cell">
              <div v-if="club.phone" class="admin-contact-item">📞 {{ club.phone }}</div>
              <div v-if="club.email" class="admin-contact-item">✉️ {{ club.email }}</div>
              <div v-if="club.website" class="admin-contact-item">
                <a :href="club.website" target="_blank" rel="noopener noreferrer">🌐 Сайт</a>
              </div>
              <div v-if="!club.phone && !club.email && !club.website" class="admin-no-contacts">
                контакты отсутствуют
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-else class="admin-empty-state">
          <div class="admin-empty-icon">🏢</div>
          <h3>Клубы не найдены</h3>
          <p>Попробуйте изменить параметры поиска или добавить новый клуб</p>
          <button class="admin-add-button" @click="openCreateModal">
            + Добавить клуб
          </button>
        </div>
      </div>
    </div>

    <!-- Единая модалка для создания и редактирования -->
    <AdminClubModal
        :is-open="showModal"
        :editing-club="editingClubData"
        @close="closeModal"
        @submit="handleModalSubmit"
    />

    <!-- Подтверждение удаления -->
    <div v-if="clubToDelete" class="admin-modal-overlay" @click="cancelDelete">
      <div class="admin-confirm-modal" @click.stop>
        <div class="admin-confirm-icon">!</div>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить клуб</p>
        <p><strong>{{ clubToDelete.name }}</strong> ?</p>
        <p class="admin-warning-text">Действие нельзя отменить. Все связанные данные будут удалены.</p>
        <div class="admin-confirm-actions">
          <button class="admin-btn-cancel" @click="cancelDelete">Отмена</button>
          <button class="admin-btn-confirm-delete" @click="executeDelete">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminClubModal from '@/components/View/ClubAdmin/ClubModal.vue'
import { getClubs } from '@/components/View/Clubs/fetchClubs.js'
import {DeleteClub} from "@/components/View/ClubAdmin/fetchClubAdmin.js";
import './ClubsAdmin.css'

const clubs = ref([])
const adminSearchQuery = ref('')
const adminCityFilter = ref('')

const loading = ref(false)
const showModal = ref(false)
const editingClubData = ref(null)
const selectedClubId = ref(null)
const clubToDelete = ref(null)

// Фильтрация
const filteredClubs = computed(() => {
  const q = adminSearchQuery.value.toLowerCase().trim()
  return clubs.value.filter(club => {
    const searchMatch =
        club.name?.toLowerCase().includes(q) ||
        club.short_name?.toLowerCase().includes(q) ||
        club.coach_name?.toLowerCase().includes(q)

    const cityMatch = !adminCityFilter.value || club.city === adminCityFilter.value

    return searchMatch && cityMatch
  })
})

// Загрузка списка клубов
const loadClubs = async () => {
  loading.value = true
  try {
    const data = await getClubs()
    clubs.value = Array.isArray(data) ? data : (data?.clubs || data || [])
  } catch (error) {
    console.error('Ошибка загрузки клубов:', error)
    clubs.value = []
  } finally {
    loading.value = false
  }
}

// Открытие модалки создания
const openCreateModal = () => {
  editingClubData.value = null
  showModal.value = true
}

// Открытие модалки редактирования
const openEditModal = () => {
  if (!selectedClubId.value) return
  const club = clubs.value.find(c => c.id === selectedClubId.value)
  if (club) {
    editingClubData.value = { ...club }
    showModal.value = true
  }
}

// Закрытие модалки
const closeModal = () => {
  showModal.value = false
  editingClubData.value = null
}

// Обработка результата из модалки (успех/ошибка)
const handleModalSubmit = ({ success }) => {
  if (success) {
    loadClubs()
  }
}

// Выбор клуба в таблице
const selectClub = (id) => {
  selectedClubId.value = selectedClubId.value === id ? null : id
}

// Удаление
const confirmDelete = () => {
  if (!selectedClubId.value) return
  const club = clubs.value.find(c => c.id === selectedClubId.value)
  if (club) clubToDelete.value = club
}

const cancelDelete = () => {
  clubToDelete.value = null
}

const executeDelete = async () => {
  if (!clubToDelete.value?.id) return
  try {
    await DeleteClub(clubToDelete.value.id)
    clubToDelete.value = null
    selectedClubId.value = null
    await loadClubs()
  } catch (error) {
    alert(`Не удалось удалить клуб:\n${error.message || String(error)}`)
  }
}

onMounted(() => {
  loadClubs()
})
</script>