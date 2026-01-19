<template>
  <div class="clubs-view">
    <!-- ЗАГОЛОВОК -->
    <div class="view-header">
      <h1>Клубы дзюдо</h1>
      <p>Все зарегистрированные клубы Казахстана</p>
    </div>

    <!-- ПОИСК И ФИЛЬТРЫ -->
    <div class="view-filters">
      <input
          v-model="searchQuery"
          type="search"
          placeholder="Поиск по названию, короткому названию или тренеру..."
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
    </div>

    <!-- СПИСОК КЛУБОВ — обычные карточки (не кликабельные) -->
    <div class="clubs-grid">
      <div
          v-for="club in filteredClubs"
          :key="club.id"
          class="club-card"
      >
        <div class="club-main">
          <h3 class="club-name">{{ club.name || 'Без названия' }}</h3>
          <p v-if="club.short_name" class="club-short">{{ club.short_name }}</p>
        </div>

        <div class="club-info">
          <div class="info-item">
            <span class="label">Город</span>
            <span class="value">{{ club.city || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Тренер</span>
            <span class="value">{{ club.coach_name || 'Не указан' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Участников</span>
            <span class="value athletes-count">{{ club.athletes_count ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div v-if="filteredClubs.length === 0" class="no-data">
        <div class="no-data-icon">Здание</div>
        <p>Клубы не найдены</p>
        <small v-if="searchQuery || cityFilter">
          Попробуйте изменить поисковый запрос или фильтр
        </small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import "./Clubs.css"
const clubs = ref([])
const searchQuery = ref('')
const cityFilter = ref('')

// Фильтрация
const filteredClubs = computed(() => {
  if (!Array.isArray(clubs.value)) return []

  const query = searchQuery.value.trim().toLowerCase()

  return clubs.value.filter(club => {
    const nameMatch = club.name?.toLowerCase().includes(query) ?? false
    const shortNameMatch = club.short_name?.toLowerCase().includes(query) ?? false
    const coachMatch = club.coach_name?.toLowerCase().includes(query) ?? false

    const searchMatch = nameMatch || shortNameMatch || coachMatch
    const cityMatch = !cityFilter.value || club.city === cityFilter.value

    return searchMatch && cityMatch
  })
})

// Загрузка клубов — полностью рабочая под ваш бэкенд
const loadClubs = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5001/clubs/', {
      headers: { 'X-API-Key': 'mobile_app_2024' }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()

    let fetchedClubs = []
    if (data && Array.isArray(data.clubs)) fetchedClubs = data.clubs
    else if (data && Array.isArray(data)) fetchedClubs = data

    clubs.value = fetchedClubs

  } catch (error) {
    console.error('Ошибка загрузки клубов:', error)
    // Мок-данные только при ошибке
    clubs.value = [
      { id: 1, name: 'Динамо Алматы', short_name: 'Динамо', city: 'Алматы', coach_name: 'Иван Петров', athletes_count: 25 },
      { id: 2, name: 'Президентский клуб', short_name: 'ПК', city: 'Астана', coach_name: 'Мария Сидорова', athletes_count: 18 }
    ]
  }
}

onMounted(loadClubs)
</script>

<style scoped>
</style>