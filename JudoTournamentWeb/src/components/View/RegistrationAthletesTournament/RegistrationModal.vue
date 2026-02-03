<template>
  <div class="tournament-view">
    <!-- Заголовок и статус -->
    <div class="header">
      <h1 class="title">{{ tournament.name || 'Название турнира' }}</h1>
      <span class="status-tag" :class="statusClass">{{ statusText }}</span>
    </div>

    <!-- Краткая информация -->
    <div class="info-cards">
      <div class="info-card">
        <strong>Дата проведения</strong>
        <span>{{ formatDate(tournament.start_date, tournament.end_date) }}</span>
      </div>
      <div class="info-card">
        <strong>Место</strong>
        <span>{{ getLocation(tournament) }}</span>
      </div>
      <div class="info-card">
        <strong>Участников</strong>
        <span>{{ tournament.athletes_count || 0 }} чел.</span>
      </div>
      <div class="info-card">
        <strong>Татами</strong>
        <span>{{ tournament.tatami_count || 0 }}</span>
      </div>
    </div>

    <!-- Описание -->
    <section class="section description-section">
      <h2 class="section-title">О турнире</h2>
      <p class="description-text">
        {{ tournament.description || 'Описание турнира отсутствует.' }}
      </p>
    </section>

    <!-- Фильтры и поиск -->
    <section class="section filters-section">
      <div class="filters-grid">
        <!-- Выбор клуба и категории -->
        <div class="filter-group">
          <label for="club-select" class="filter-label">Клуб</label>
          <select
              id="club-select"
              v-model="selectedClubId"
              :disabled="loadingClubs"
              class="select-input"
          >
            <option value="">Все клубы</option>
            <option v-for="club in clubs" :key="club.id" :value="club.id">
              {{ club.name }} ({{ club.city }})
            </option>
          </select>
          <small v-if="loadingClubs" class="text-muted">Загрузка клубов...</small>
          <small v-if="clubsError" class="text-error">{{ clubsError }}</small>

          <!-- Дропдаун категории (обязателен для регистрации) -->
          <label for="category-select" class="filter-label mt-1">Категория *</label>
          <select
              id="category-select"
              v-model="selectedCategoryId"
              :disabled="categoriesLoading"
              class="select-input"
              required
          >
            <option value="">Выберите категорию</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
              {{ cat.gender ? ` (${cat.gender === 'MALE' ? 'М' : cat.gender === 'FEMALE' ? 'Ж' : cat.gender})` : '' }}
              {{ cat.min_age !== undefined && cat.max_age !== undefined ? `, ${cat.min_age}-${cat.max_age} лет` : '' }}
              {{ cat.min_weight !== undefined && cat.max_weight !== undefined ? `, ${cat.min_weight}-${cat.max_weight} кг` : '' }}
            </option>
          </select>
          <small v-if="categoriesLoading" class="text-muted">Загрузка категорий...</small>

          <button
              v-if="selectedClubId"
              @click="registerClub"
              :disabled="loadingClubs || registeringClub"
              class="btn btn-primary mt-1"
          >
            {{ registeringClub ? 'Регистрация...' : 'Зарегистрировать клуб' }}
          </button>
          <small v-if="clubRegistrationMessage" :class="clubRegistrationClass">
            {{ clubRegistrationMessage }}
          </small>
        </div>

        <!-- Поиск по ФИО -->
        <div class="search-group">
          <h3 class="search-title">Поиск по ФИО</h3>
          <div class="search-inputs">
            <input
                v-model="searchLastName"
                type="text"
                placeholder="Фамилия"
                class="text-input"
            />
            <input
                v-model="searchFirstName"
                type="text"
                placeholder="Имя"
                class="text-input"
            />
            <input
                v-model="searchMiddleName"
                type="text"
                placeholder="Отчество"
                class="text-input"
            />
            <div class="search-actions">
              <button
                  @click="handleSearch"
                  :disabled="loadingAthletes"
                  class="btn btn-primary"
              >
                {{ loadingAthletes ? 'Поиск...' : 'Найти' }}
              </button>
              <button @click="handleClearSearch" class="btn btn-secondary">
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Таблица атлетов -->
    <section class="section athletes-section">
      <div class="section-header">
        <h2 class="section-title">Атлеты для регистрации</h2>
        <div v-if="filteredAthletes.length" class="counter">
          Найдено: {{ filteredAthletes.length }}
        </div>
        <button
            v-if="filteredAthletes.length > 0"
            @click="registerAthletes"
            :disabled="loadingAthletes || selectedAthletes.length === 0 || !selectedCategoryId || registeringAthletes"
            class="btn btn-primary"
        >
          {{ registeringAthletes ? 'Регистрация...' : 'Зарегистрировать выбранных в категорию' }}
        </button>
      </div>

      <div v-if="loadingAthletes" class="loading">Загрузка атлетов...</div>
      <div v-if="athletesError" class="error">{{ athletesError }}</div>
      <small v-if="athletesRegistrationMessage" :class="athletesRegistrationClass">
        {{ athletesRegistrationMessage }}
      </small>

      <div class="table-container">
        <table v-if="filteredAthletes.length" class="athletes-table">
          <thead>
          <tr>
            <th>Выбрать</th>
            <th>#</th>
            <th>ФИО</th>
            <th>Пол</th>
            <th>Возраст</th>
            <th>Вес</th>
            <th>Категория</th>
            <th>Клуб</th>
            <th>Контакт</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(athlete, index) in filteredAthletes" :key="athlete.id">
            <td>
              <input
                  type="checkbox"
                  v-model="selectedAthletes"
                  :value="athlete.id"
              />
            </td>
            <td>{{ index + 1 }}</td>
            <td class="athlete-name">
              {{ fullAthleteName(athlete) }}
            </td>
            <td>{{ athlete.gender ? (athlete.gender.toLowerCase() === 'male' ? 'М' : 'Ж') : '—' }}</td>
            <td>{{ athlete.age ?? '—' }}</td>
            <td>{{ athlete.currentWeight ? athlete.currentWeight + ' кг' : '—' }}</td>
            <td>{{ athlete.categoryName || '—' }}</td>
            <td>{{ getClubName(athlete.clubId) }}</td>
            <td class="contact">{{ athlete.phoneNumber || '—' }}</td>
          </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <p>Атлеты не найдены</p>
          <small>Измените фильтры или выполните поиск</small>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getClubs } from '@/components/View/Clubs/fetchClubs.js'
import { fetchCategories } from "@/components/View/TournamentManagement/fetchTournamentManagement.js";
import {
  getClubAthletes,
  searchAthletes,
  getAllAthletes,
  addClubToTournament,
  addAthletesToTournament
} from '@/components/View/RegistrationAthletesTournament/fetchRegistrationAthletesTornament.js'

const route = useRoute()
const tournamentId = ref(
    localStorage.getItem('registrationTournamentId') || route.params.id || null
)
if (!tournamentId.value) {
  console.error('ID турнира не найден!')
}

const props = defineProps({
  tournament: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

// === Состояния ===
const clubs = ref([])
const loadingClubs = ref(false)
const clubsError = ref(null)

const categories = ref([])
const categoriesLoading = ref(false)

const athletes = ref([])
const loadingAthletes = ref(false)
const athletesError = ref(null)

const selectedClubId = ref('')
const selectedCategoryId = ref('')
const searchLastName = ref('')
const searchFirstName = ref('')
const searchMiddleName = ref('')

const selectedAthletes = ref([])

const clubRegistrationMessage = ref(null)
const athletesRegistrationMessage = ref(null)
const registeringClub = ref(false)
const registeringAthletes = ref(false)

// === Вспомогательные функции ===
const formatDate = (start, end) => {
  if (!start) return 'Дата не указана'
  const s = new Date(start).toLocaleDateString('ru-RU')
  if (!end || start === end) return s
  const e = new Date(end).toLocaleDateString('ru-RU')
  return `${s} – ${e}`
}

const getLocation = (t) => {
  return [t.city, t.country].filter(Boolean).join(', ') || 'Локация не указана'
}

const statusText = computed(() => {
  switch (props.tournament.status) {
    case 'registration': return 'Идёт регистрация'
    case 'live': return 'Идёт сейчас'
    case 'completed': return 'Завершён'
    default: return 'Запланирован'
  }
})

const statusClass = computed(() => `status-${props.tournament.status || 'planned'}`)

const getClubName = (clubId) => {
  const club = clubs.value.find(c => c.id === clubId)
  return club ? club.name : '—'
}

const fullAthleteName = (athlete) => {
  const parts = [
    athlete.lastName?.trim(),
    athlete.firstName?.trim(),
    athlete.middleName?.trim()
  ].filter(part => part && part.length > 0)

  return parts.length > 0 ? parts.join(' ') : '—'
}

// === Фильтрация атлетов (УБРАНА фильтрация по категории) ===
const filteredAthletes = computed(() => {
  let filtered = athletes.value.slice()

  // Только фильтр по незарегистрированным в турнир (если клуб выбран)
  if (selectedClubId.value && tournamentId.value) {
    const currentTournamentId = Number(tournamentId.value)
    filtered = filtered.filter(
        athlete => !athlete.tournaments?.some(t => t.tournament_id === currentTournamentId)
    )
  }

  return filtered
})

const clubRegistrationClass = computed(() =>
    clubRegistrationMessage.value?.includes('Ошибка') || clubRegistrationMessage.value?.includes('не')
        ? 'text-error'
        : 'text-success'
)

const athletesRegistrationClass = computed(() =>
    athletesRegistrationMessage.value?.includes('Ошибка') || athletesRegistrationMessage.value?.includes('не')
        ? 'text-error'
        : 'text-success'
)

// === Загрузка данных ===
onMounted(async () => {
  // Клубы
  loadingClubs.value = true
  try {
    const data = await getClubs()
    clubs.value = data
  } catch (err) {
    clubsError.value = 'Не удалось загрузить клубы'
    console.error(err)
  } finally {
    loadingClubs.value = false
  }

  // Категории
  categoriesLoading.value = true
  try {
    const result = await fetchCategories()
    if (result.success) {
      categories.value = result.data?.categories || result.categories || []
    }
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
  } finally {
    categoriesLoading.value = false
  }

  // Атлеты
  await loadAthletes()
})

// === Загрузка атлетов по умолчанию ===
const loadAthletes = async () => {
  loadingAthletes.value = true
  athletesError.value = null
  selectedAthletes.value = []
  try {
    const result = await getAllAthletes()
    if (result && result.athletes) {
      athletes.value = Object.values(result.athletes || {}).map(a => ({
        id: a.id,
        lastName: a.middle_name?.trim() || '',
        firstName: a.first_name?.trim() || '',
        middleName: a.last_name?.trim() || '',
        gender: a.gender,
        age: a.age,
        currentWeight: a.current_weight ?? null,
        categoryName: a.rank || '—',
        clubId: a.club_id || null,
        phoneNumber: a.license_number || '—',
        tournaments: a.tournaments || []
      }))
    } else {
      athletesError.value = result?.error || 'Ошибка загрузки атлетов'
    }
  } catch (err) {
    athletesError.value = 'Не удалось загрузить атлетов'
    console.error(err)
  } finally {
    loadingAthletes.value = false
  }
}

// === Выбор клуба ===
watch(selectedClubId, async (newId) => {
  if (newId) {
    loadingAthletes.value = true
    selectedAthletes.value = []
    athletesError.value = null
    try {
      const result = await getClubAthletes(newId)
      if (result.success) {
        athletes.value = Object.values(result.athletes || {}).map(a => ({
          id: a.id,
          lastName: a.middle_name?.trim() || '',
          firstName: a.first_name?.trim() || '',
          middleName: a.last_name?.trim() || '',
          gender: a.gender,
          age: a.age,
          currentWeight: a.current_weight ?? null,
          categoryName: a.rank || '—',
          clubId: Number(newId),
          phoneNumber: a.license_number || '—',
          tournaments: a.tournaments || []
        }))
      } else {
        athletesError.value = result.error || 'Ошибка загрузки атлетов клуба'
      }
    } catch (err) {
      athletesError.value = 'Ошибка загрузки атлетов клуба'
      console.error(err)
    } finally {
      loadingAthletes.value = false
    }
  } else {
    await loadAthletes()
  }
})

// === Поиск по ФИО ===
const handleSearch = async () => {
  if (!searchLastName.value && !searchFirstName.value && !searchMiddleName.value) {
    handleClearSearch()
    return
  }

  loadingAthletes.value = true
  athletesError.value = null
  selectedAthletes.value = []

  try {
    const result = await searchAthletes(
        searchLastName.value || null,
        searchFirstName.value || null,
        searchMiddleName.value || null,
        selectedClubId.value || null,
        true
    )

    if (result.success) {
      const athletesData = Array.isArray(result.athletes) ? result.athletes : []

      athletes.value = athletesData.map(a => ({
        id: a.id,
        lastName: a.middle_name?.trim() || '',
        firstName: a.first_name?.trim() || '',
        middleName: a.last_name?.trim() || '',
        gender: a.gender,
        age: a.age,
        currentWeight: a.current_weight ?? null,
        categoryName: a.rank || '—',
        clubId: a.club?.id || null,
        phoneNumber: a.license_number || '—',
        tournaments: a.tournaments || []
      }))
    } else {
      athletes.value = []
      athletesError.value = result.error || 'Ничего не найдено'
    }
  } catch (err) {
    athletes.value = []
    athletesError.value = 'Ошибка поиска'
    console.error(err)
  } finally {
    loadingAthletes.value = false
  }
}

const handleClearSearch = () => {
  searchLastName.value = ''
  searchFirstName.value = ''
  searchMiddleName.value = ''
  selectedClubId.value = ''
  selectedCategoryId.value = ''
  athletesError.value = null
  selectedAthletes.value = []
  loadAthletes()
}

// === Регистрация клуба ===
const registerClub = async () => {
  if (!selectedClubId.value || !tournamentId.value) return
  registeringClub.value = true
  clubRegistrationMessage.value = null
  try {
    const result = await addClubToTournament(tournamentId.value, selectedClubId.value)
    clubRegistrationMessage.value = result.success
        ? 'Клуб успешно зарегистрирован!'
        : result.error || 'Ошибка регистрации клуба'
  } catch (err) {
    clubRegistrationMessage.value = 'Ошибка при регистрации клуба'
    console.error(err)
  } finally {
    registeringClub.value = false
  }
}

// === Регистрация атлетов в конкретную категорию ===
const registerAthletes = async () => {
  if (selectedAthletes.value.length === 0 || !tournamentId.value) return

  if (!selectedCategoryId.value) {
    athletesRegistrationMessage.value = 'Ошибка: выберите категорию для регистрации!'
    return
  }

  registeringAthletes.value = true
  athletesRegistrationMessage.value = null

  try {
    const payload = {
      category_id: Number(selectedCategoryId.value),
      athlete_ids: selectedAthletes.value
    }

    const result = await addAthletesToTournament(tournamentId.value, payload)

    athletesRegistrationMessage.value = result.success
        ? `Успешно зарегистрировано ${selectedAthletes.value.length} атлет(ов) в категорию!`
        : result.error || 'Ошибка при регистрации атлетов'

    if (result.success) {
      selectedAthletes.value = []

      // Перезагружаем список атлетов
      if (selectedClubId.value) {
        const refreshed = await getClubAthletes(selectedClubId.value)
        if (refreshed.success) {
          athletes.value = Object.values(refreshed.athletes || {}).map(a => ({
            id: a.id,
            lastName: a.middle_name?.trim() || '',
            firstName: a.first_name?.trim() || '',
            middleName: a.last_name?.trim() || '',
            gender: a.gender,
            age: a.age,
            currentWeight: a.current_weight ?? null,
            categoryName: a.rank || '—',
            clubId: Number(selectedClubId.value),
            phoneNumber: a.license_number || '—',
            tournaments: a.tournaments || []
          }))
        }
      } else {
        await loadAthletes()
      }
    }
  } catch (err) {
    athletesRegistrationMessage.value = 'Ошибка при регистрации атлетов'
    console.error(err)
  } finally {
    registeringAthletes.value = false
  }
}
</script>

<style scoped>
.tournament-view {
  min-height: 100vh;
  background: #f9f9fb;
  padding: 90px 1.5rem 4rem;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.6rem;
  font-weight: 900;
  background: linear-gradient(90deg, #c89b3c, #f4d03f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
}

.status-tag {
  display: inline-block;
  margin-top: 0.8rem;
  padding: 0.5rem 1.2rem;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}

.status-registration { background: #d69e2e; color: white; }
.status-live         { background: #e53e3e; color: white; animation: pulse 1.8s infinite; }
.status-completed    { background: #38a169; color: white; }
.status-planned      { background: #3182ce; color: white; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin: 0 auto 3rem;
  max-width: 1400px;
}

.info-card {
  background: white;
  padding: 1.4rem;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  border-top: 5px solid #c89b3c;
  text-align: center;
}

.info-card strong {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
}

.info-card span {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1a1a1a;
}

.section {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  margin-bottom: 2.5rem;
  border-top: 5px solid #c89b3c;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #c89b3c;
  margin: 0;
  padding: 1.2rem 1.6rem;
  background: white;
  border-bottom: 1px solid #eee;
}

.description-text {
  padding: 1.6rem;
  font-size: 1.05rem;
  color: #444;
  white-space: pre-line;
}

.filters-section .filters-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  padding: 1.8rem 1.6rem;
}

.filter-group,
.search-group {
  background: #f9f9fb;
  padding: 1.4rem;
  border-radius: 16px;
}

.filter-label,
.search-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.8rem;
  display: block;
}

.select-input,
.text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  background: white;
}

.select-input:focus,
.text-input:focus {
  border-color: #c89b3c;
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.15);
}

.search-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.search-actions {
  display: flex;
  gap: 0.8rem;
}

.btn {
  padding: 0.75rem 1.6rem;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  color: white;
  box-shadow: 0 3px 10px rgba(200, 155, 60, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(200, 155, 60, 0.35);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mt-1 { margin-top: 1rem; }

.athletes-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 1.2rem 1.6rem;
  border-bottom: 1px solid #eee;
  background: white;
}

.counter {
  background: #fffbeb;
  color: #92400e;
  padding: 0.5rem 1.2rem;
  border-radius: 30px;
  font-weight: 700;
  font-size: 0.9rem;
}

.table-container {
  overflow-x: auto;
}

.athletes-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.95rem;
}

.athletes-table th {
  background: white;
  color: #333;
  font-weight: 700;
  padding: 1rem 0.8rem;
  text-align: left;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.4px;
}

.athletes-table td {
  padding: 1.2rem 0.8rem;
  position: relative;
}

.athletes-table tbody tr {
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.athletes-table tbody tr::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 10px;
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
}

.athletes-table tbody tr:hover {
  background: #fdfdfb;
}

.athlete-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: #000;
}

.contact {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #555;
}

.empty-state {
  text-align: center;
  padding: 4rem 1.6rem;
  color: #666;
}

.empty-state p {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.loading,
.error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.text-success { color: #28a745; font-weight: 700; }
.text-error { color: #e53e3e; font-weight: 700; }
.text-muted { color: #888; font-style: italic; }

@media (max-width: 1200px) {
  .filters-grid { grid-template-columns: 1fr; }
}

@media (max-width: 992px) {
  .search-inputs { grid-template-columns: 1fr; }
  .info-cards { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .title { font-size: 2.2rem; }
  .section-title { font-size: 1.5rem; }
  .info-cards { grid-template-columns: 1fr; }
  .filter-group .mt-1 { margin-top: 0.8rem; }
}

@media (max-width: 600px) {
  .header { padding: 0 0.8rem; }
  .section { margin: 0 0.8rem 2.5rem; }
}
</style>