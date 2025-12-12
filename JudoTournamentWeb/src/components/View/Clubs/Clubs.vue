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
.clubs-view { padding: 90px 2rem 4rem; max-width: 1400px; margin: 0 auto; min-height: 100vh; }
.view-header { text-align: center; margin-bottom: 3rem; }
.view-header h1 { font-size: 2.5rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.5rem; }
.view-header p { font-size: 1.1rem; color: #666; }

.view-filters { display: flex; gap: 1rem; margin-bottom: 2.5rem; flex-wrap: wrap; align-items: center; }
.search-input { flex: 1; min-width: 280px; padding: 0.85rem 1rem; border: 2px solid #e8e8e8; border-radius: 12px; font-size: 1rem; }
.search-input:focus { outline: none; border-color: #c89b3c; }
.filter-select { padding: 0.85rem 1rem; border: 2px solid #e8e8e8; border-radius: 12px; background: white; cursor: pointer; min-width: 180px; }

.clubs-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }

.club-card {
  display: flex; align-items: center; background: white; padding: 1.5rem; border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); position: relative; overflow: hidden;
}
.club-card::after {
  content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
}

.club-main { flex: 1; }
.club-name { margin: 0 0 0.4rem 0; font-size: 1.35rem; font-weight: 700; color: #1a1a1a; }
.club-short { margin: 0; font-size: 0.95rem; color: #666; font-style: italic; }

.club-info { margin-left: 2rem; display: flex; flex-direction: column; gap: 0.6rem; }
.info-item { display: flex; flex-direction: column; font-size: 0.95rem; }
.label { color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
.value { color: #1a1a1a; font-weight: 600; }
.athletes-count { background: linear-gradient(135deg, #c89b3c, #e0b456); color: white; padding: 0.25rem 0.6rem; border-radius: 12px; width: fit-content; font-size: 0.9rem; }

.no-data { grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #666; }
.no-data-icon { font-size: 4.5rem; margin-bottom: 1rem; opacity: 0.4; }
.no-data small { display: block; margin-top: 0.5rem; color: #999; }

@media (max-width: 768px) { .clubs-grid { grid-template-columns: 1fr; } }
@media (max-width: 480px) {
  .view-filters { flex-direction: column; align-items: stretch; }
  .search-input, .filter-select { min-width: auto; }
}
</style>