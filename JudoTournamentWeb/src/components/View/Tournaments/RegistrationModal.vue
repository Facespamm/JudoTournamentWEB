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

        <!-- Выбор клуба -->

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

            <input v-model="searchLastName" type="text" placeholder="Фамилия" class="text-input" />

            <input v-model="searchFirstName" type="text" placeholder="Имя" class="text-input" />

            <input v-model="searchMiddleName" type="text" placeholder="Отчество" class="text-input" />

            <div class="search-actions">

              <button @click="handleSearch" :disabled="loadingAthletes" class="btn btn-primary">

                {{ loadingAthletes ? 'Поиск...' : 'Найти' }}

              </button>

              <button @click="handleClearSearch" class="btn btn-secondary">Сбросить</button>

            </div>

          </div>

        </div>

      </div>

    </section>

    <!-- Таблица атлетов -->

    <section class="section athletes-section">

      <div class="section-header">

        <h2 class="section-title">Зарегистрированные атлеты</h2>

        <div v-if="filteredAthletes.length" class="counter">

          Найдено: {{ filteredAthletes.length }}

        </div>

        <button

            v-if="filteredAthletes.length > 0"

            @click="registerAthletes"

            :disabled="loadingAthletes || selectedAthletes.length === 0 || registeringAthletes"

            class="btn btn-primary"

        >

          {{ registeringAthletes ? 'Регистрация...' : 'Зарегистрировать выбранных' }}

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

            <td><input type="checkbox" v-model="selectedAthletes" :value="athlete.id" /></td>

            <td>{{ index + 1 }}</td>

            <td class="athlete-name">

              {{ athlete.lastName }} {{ athlete.firstName }}

              <span v-if="athlete.middleName">{{ athlete.middleName }}</span>

            </td>

            <td>{{ athlete.gender === 'M' ? 'М' : 'Ж' }}</td>

            <td>{{ athlete.age }}</td>

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

import {

  getClubAthletes,

  searchAthletes,

  getAllAthletes,

  addClubToTournament,

  addAthletesToTournament

} from '@/components/View/Tournaments/fetchTournaments.js'

const route = useRoute()

// Получаем ID турнира из localStorage (который мы сохранили при переходе с кнопки "Зарегистрироваться")

const tournamentId = ref(

    localStorage.getItem('registrationTournamentId') || route.params.id || null

)

// Если ID не найден — можно показать ошибку или редирект

if (!tournamentId.value) {

  console.error('ID турнира не найден!')

}

// === Пропсы (если компонент используется как детальная страница) ===

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

const athletes = ref([])

const loadingAthletes = ref(false)

const athletesError = ref(null)

const selectedClubId = ref('')

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

const filteredAthletes = computed(() => athletes.value)

const clubRegistrationClass = computed(() =>

    clubRegistrationMessage.value?.includes('Ошибка') || clubRegistrationMessage.value?.includes('не') ? 'text-error' : 'text-success'

)

const athletesRegistrationClass = computed(() =>

    athletesRegistrationMessage.value?.includes('Ошибка') || athletesRegistrationMessage.value?.includes('не') ? 'text-error' : 'text-success'

)

// === Загрузка клубов ===

onMounted(async () => {

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

  await loadAthletes()

})

// === Загрузка всех атлетов (по умолчанию) ===

const loadAthletes = async () => {

  loadingAthletes.value = true

  athletesError.value = null

  selectedAthletes.value = []

  try {

    const result = await getAllAthletes()

    if (result && result.athletes) {

      athletes.value = result.athletes.map(a => ({

        id: a.id,

        lastName: a.last_name,

        firstName: a.first_name,

        middleName: a.middle_name || '',

        gender: a.gender,

        age: a.age,

        currentWeight: a.current_weight || 0,

        categoryName: a.rank || a.category || '',

        clubId: a.club_id,

        phoneNumber: a.license_number || a.phone || '—'

      }))

    } else {

      athletesError.value = result?.error || 'Ошибка загрузки атлетов'

    }

  } catch (err) {

    console.error(err)

    athletesError.value = 'Не удалось загрузить атлетов'

  } finally {

    loadingAthletes.value = false

  }

}

// === Фильтрация по клубу ===

watch(selectedClubId, async (newId) => {

  if (newId) {

    loadingAthletes.value = true

    selectedAthletes.value = []

    try {

      const result = await getClubAthletes(newId, true, false, tournamentId.value)

      if (result && result.athletes) {

        athletes.value = result.athletes.map(a => ({

          id: a.id,

          lastName: a.last_name,

          firstName: a.first_name,

          middleName: a.middle_name || '',

          gender: a.gender,

          age: a.age,

          currentWeight: a.current_weight || 0,

          categoryName: a.rank || '',

          clubId: a.club_id || Number(newId),

          phoneNumber: a.license_number || '—'

        }))

      } else {

        athletesError.value = result?.error || 'Ошибка загрузки атлетов клуба'

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

    athletesError.value = 'Введите хотя бы одно поле'

    return

  }

  loadingAthletes.value = true

  athletesError.value = null

  selectedAthletes.value = []

  try {

    const result = await searchAthletes(

        searchLastName.value,

        searchFirstName.value,

        searchMiddleName.value,

        selectedClubId.value || null,

        true

    )

    if (result && result.athletes) {

      athletes.value = result.athletes.map(a => ({

        id: a.id,

        lastName: a.last_name,

        firstName: a.first_name,

        middleName: a.middle_name || '',

        gender: a.gender,

        age: a.age,

        currentWeight: a.current_weight || 0,

        categoryName: a.rank || '',

        clubId: a.club_id || (selectedClubId.value ? Number(selectedClubId.value) : null),

        phoneNumber: a.license_number || '—'

      }))

    } else {

      athletesError.value = result?.error || 'Ничего не найдено'

    }

  } catch (err) {

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

    clubRegistrationMessage.value = result.success ? 'Клуб успешно зарегистрирован!' : result.error || 'Ошибка регистрации клуба'

  } catch (err) {

    clubRegistrationMessage.value = 'Ошибка при регистрации клуба'

    console.error(err)

  } finally {

    registeringClub.value = false

  }

}

// === Регистрация выбранных атлетов ===

const registerAthletes = async () => {

  if (selectedAthletes.value.length === 0 || !tournamentId.value) return

  registeringAthletes.value = true

  athletesRegistrationMessage.value = null

  try {

    const result = await addAthletesToTournament(tournamentId.value, selectedAthletes.value)

    athletesRegistrationMessage.value = result.success

        ? `Успешно зарегистрировано ${selectedAthletes.value.length} атлет(ов)!`

        : result.error || 'Ошибка при регистрации атлетов'

    if (result.success) {

      selectedAthletes.value = []

      // Обновляем список (чтобы убрать уже зарегистрированных, если нужно)

      if (selectedClubId.value) {

        // Перезагружаем атлетов клуба

        const resultAth = await getClubAthletes(selectedClubId.value, true, false, tournamentId.value)

        if (resultAth && resultAth.athletes) {

          athletes.value = resultAth.athletes.map(a => ({

            id: a.id,

            lastName: a.last_name,

            firstName: a.first_name,

            middleName: a.middle_name || '',

            gender: a.gender,

            age: a.age,

            currentWeight: a.current_weight || 0,

            categoryName: a.rank || '',

            clubId: a.club_id || Number(selectedClubId.value),

            phoneNumber: a.license_number || '—'

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

<!-- Стили без изменений -->

<style scoped>

.tournament-view {

  max-width: 1240px;

  margin: 0 auto;

  padding: 4rem 1rem 2rem 1rem;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  line-height: 1.6;

  color: #333;

}

.tournament-view {
  max-width: 1240px;
  margin: 0 auto;
  padding: 4rem 1rem 2rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.status-tag {
  padding: 0.5rem 1.25rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-registration { background: #d1e7dd; color: #0f5132; }
.status-live { background: #f8d7da; color: #58151c; animation: pulse 2s infinite; }
.status-completed { background: #e2e3e5; color: #41464b; }
.status-planned { background: #d1d5ea; color: #1e2a78; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.info-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #007bff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.info-card strong {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card span {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #eee;
}

.section-title {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #1a1a1a;
  font-weight: 600;
}

.description-text {
  font-size: 1.1rem;
  color: #444;
  margin: 0;
  white-space: pre-line;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

.search-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.select-input, .text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
}

.select-input:focus, .text-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.15);
}

.search-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-actions {
  display: flex;
  gap: 0.75rem;
  grid-column: 1 / -1;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mt-1 {
  margin-top: 0.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.counter {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.athletes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.athletes-table th {
  background: #1a1a1a;
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.athletes-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.athletes-table tbody tr:hover {
  background: #f5f8ff;
}

.athlete-name {
  font-weight: 600;
  white-space: nowrap;
}

.athlete-name span {
  color: #666;
  font-weight: normal;
}

.contact {
  font-family: 'Courier New', monospace;
  color: #444;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #777;
}

.empty-state p {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error { color: #d32f2f; }

.text-error { color: #d32f2f; }

.text-muted { color: #6c757d; font-style: italic; }

.text-success { color: #28a745; }

@media (max-width: 992px) {
  .filters-grid { grid-template-columns: 1fr; }
  .search-inputs { grid-template-columns: 1fr; }
  .search-actions { grid-column: auto; }
}

@media (max-width: 600px) {
  .title { font-size: 2rem; }
  .header { flex-direction: column; align-items: stretch; }
  .section { padding: 1.5rem; }
}
.tournament-view {
  max-width: 1240px;
  margin: 0 auto;
  padding: 4rem 1rem 2rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.status-tag {
  padding: 0.5rem 1.25rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-registration { background: #d1e7dd; color: #0f5132; }
.status-live { background: #f8d7da; color: #58151c; animation: pulse 2s infinite; }
.status-completed { background: #e2e3e5; color: #41464b; }
.status-planned { background: #d1d5ea; color: #1e2a78; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.info-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  border-left: 4px solid #007bff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.info-card strong {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card span {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid #eee;
}

.section-title {
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: #1a1a1a;
  font-weight: 600;
}

.description-text {
  font-size: 1.1rem;
  color: #444;
  margin: 0;
  white-space: pre-line;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}

.search-title {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.filter-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.select-input, .text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
}

.select-input:focus, .text-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.15);
}

.search-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-actions {
  display: flex;
  gap: 0.75rem;
  grid-column: 1 / -1;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mt-1 {
  margin-top: 0.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.counter {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
}

.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
}

.athletes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.athletes-table th {
  background: #1a1a1a;
  color: white;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.athletes-table td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.athletes-table tbody tr:hover {
  background: #f5f8ff;
}

.athlete-name {
  font-weight: 600;
  white-space: nowrap;
}

.athlete-name span {
  color: #666;
  font-weight: normal;
}

.contact {
  font-family: 'Courier New', monospace;
  color: #444;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #777;
}

.empty-state p {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error { color: #d32f2f; }

.text-error { color: #d32f2f; }

.text-muted { color: #6c757d; font-style: italic; }

.text-success { color: #28a745; }

@media (max-width: 992px) {
  .filters-grid { grid-template-columns: 1fr; }
  .search-inputs { grid-template-columns: 1fr; }
  .search-actions { grid-column: auto; }
}

@media (max-width: 600px) {
  .title { font-size: 2rem; }
  .header { flex-direction: column; align-items: stretch; }
  .section { padding: 1.5rem; }
}

.text-success { color: #28a745; font-weight: 600; }

.mt-1 { margin-top: 0.5rem; }

</style>