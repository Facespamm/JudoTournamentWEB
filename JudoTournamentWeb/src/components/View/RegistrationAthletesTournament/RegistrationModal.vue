<template>
  <div class="tournament-view">
    <!-- Загрузка -->
    <div v-if="tournamentLoading" class="loading" style="text-align:center; padding: 4rem;">
      Загрузка турнира...
    </div>

    <!-- Ошибка -->
    <div v-else-if="tournamentError" class="error" style="text-align:center; padding: 4rem; color: #e53e3e;">
      {{ tournamentError }}
    </div>

    <template v-else>
      <!-- Заголовок и статус -->
      <div class="header">
        <button class="btn-back" @click="router.back()">← Назад</button>
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
          <div class="filter-group">
            <label for="club-select" class="filter-label">Клуб</label>
            <select id="club-select" v-model="selectedClubId" :disabled="loadingClubs" class="select-input">
              <option value="">Все клубы</option>
              <option v-for="club in clubs" :key="club.id" :value="club.id">
                {{ club.name }} ({{ club.city }})
              </option>
            </select>
            <small v-if="loadingClubs" class="text-muted">Загрузка клубов...</small>
            <small v-if="clubsError" class="text-error">{{ clubsError }}</small>

            <!--<label for="category-select" class="filter-label mt-1">Категория *</label>
            <select id="category-select" v-model="selectedCategoryId" :disabled="categoriesLoading" class="select-input" required>
              <option value="">Выберите категорию</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
                {{ cat.gender ? ` (${cat.gender === 'MALE' ? 'М' : cat.gender === 'FEMALE' ? 'Ж' : cat.gender})` : '' }}
                {{ cat.min_age !== undefined && cat.max_age !== undefined ? `, ${cat.min_age}-${cat.max_age} лет` : '' }}
                {{ cat.min_weight !== undefined && cat.max_weight !== undefined ? `, ${cat.min_weight}-${cat.max_weight} кг` : '' }}
              </option>
            </select>
            <small v-if="categoriesLoading" class="text-muted">Загрузка категорий...</small>-->

            <button v-if="selectedClubId" @click="registerClub" :disabled="loadingClubs || registeringClub" class="btn btn-primary mt-1">
              {{ registeringClub ? 'Регистрация...' : 'Зарегистрировать клуб' }}
            </button>
            <small v-if="clubRegistrationMessage" :class="clubRegistrationClass">
              {{ clubRegistrationMessage }}
            </small>
          </div>

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
          <h2 class="section-title">Атлеты для регистрации</h2>
          <div v-if="filteredAthletes.length" class="counter">
            Найдено: {{ filteredAthletes.length }}
          </div>
          <button
              v-if="filteredAthletes.length > 0"
              @click="registerAthletes"
              :disabled="loadingAthletes || selectedAthletes.length === 0 || registeringAthletes"
              class="btn btn-primary"
          > <!--|| !selectedCategoryId -->
            {{ registeringAthletes ? 'Регистрация...' : 'Зарегистрировать выбранных в категорию' }}
          </button>
        </div>

        <div v-if="loadingAthletes" class="loading">Загрузка атлетов...</div>
        <div v-if="athletesError" class="error">{{ athletesError }}</div>
        <small v-if="athletesRegistrationMessage" :class="athletesRegistrationClass">
          {{ athletesRegistrationMessage }}
        </small>

        <div class="table-container">
          <table class="admin-clubs-table" v-if="filteredAthletes.length">
            <thead>
            <tr>
              <th class="admin-col-select">
                <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
              </th>
              <th>#</th>
              <th>ФИО</th>
              <th>Пол</th>
              <th>Возраст</th>
              <th>Клуб</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="(athlete, index) in filteredAthletes"
                :key="athlete.id"
                class="admin-table-row"
                :class="{ 'admin-selected-row': selectedAthletes.includes(athlete.id) }"
                @click.stop="toggleSelect(athlete.id)"
            >
              <td class="admin-col-select">
                <input
                    type="checkbox"
                    :checked="selectedAthletes.includes(athlete.id)"
                />
              </td>
              <td>{{ index + 1 }}</td>
              <td data-label="ФИО">
                <div class="admin-club-name">{{ fullAthleteName(athlete) }}</div>
              </td>
              <td data-label="Пол">
        <span
            class="admin-athletes-count"
            :style="athlete.gender?.toLowerCase() === 'male'
            ? 'background: linear-gradient(135deg,#1e88e5,#42a5f5)'
            : 'background: linear-gradient(135deg,#d81b60,#f06292)'"
        >
          {{ athlete.gender?.toLowerCase() === 'male' ? 'Муж' : 'Жен' }}
        </span>
              </td>
              <td data-label="Возраст">
                <span class="admin-athletes-count">{{ athlete.age ?? '—' }}</span>
              </td>
              <td data-label="Клуб" class="admin-short-name">{{ getClubName(athlete.clubId) || '—' }}</td>
            </tr>
            </tbody>
          </table>

          <div v-else class="empty-state">
            <p>Атлеты не найдены</p>
            <small>Измените фильтры или выполните поиск</small>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getClubs } from '@/components/View/Clubs/fetchClubs.js'
import { fetchTournamentDetail} from "@/components/View/TournamentDetails/fetchTournamentDetail.js";
import { fetchCategories } from '@/components/View/TournamentManagement/fetchTournamentManagement.js'
import {
  getClubAthletes,
  searchAthletes,
  addClubToTournament,
  addAthletesToTournament, getAllAthletesForRegister
} from '@/components/View/RegistrationAthletesTournament/fetchRegistrationAthletesTornament.js'

const route = useRoute()
const router = useRouter()
const tournamentId = ref(
    localStorage.getItem('registrationTournamentId') || route.params.id || null
)

// === Данные турнира ===
const tournament = ref({})
const tournamentLoading = ref(false)
const tournamentError = ref(null)

const loadTournament = async () => {
  if (!tournamentId.value) {
    tournamentError.value = 'ID турнира не найден'
    return
  }
  tournamentLoading.value = true
  tournamentError.value = null
  try {
    const data = await fetchTournamentDetail(tournamentId.value)
    tournament.value = data
  } catch (err) {
    tournamentError.value = 'Не удалось загрузить данные турнира'
    console.error(err)
  } finally {
    tournamentLoading.value = false
  }
}

// === Остальные состояния ===
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

// === Вспомогательные ===
const formatDate = (start, end) => {
  if (!start) return 'Дата не указана'
  const s = new Date(start).toLocaleDateString('ru-RU')
  if (!end || start === end) return s
  return `${s} – ${new Date(end).toLocaleDateString('ru-RU')}`
}

const getLocation = (t) => [t.city, t.country].filter(Boolean).join(', ') || 'Локация не указана'

const statusText = computed(() => {
  switch (tournament.value.status) {
    case 'REGISTRATION': return 'Идёт регистрация'
    case 'LIVE':         return 'Идёт сейчас'
    case 'COMPLETED':    return 'Завершён'
    default:             return 'Запланирован'
  }
})

const statusClass = computed(() => `status-${(tournament.value.status || 'planned').toLowerCase()}`)

const getClubName = (clubId) => clubs.value.find(c => c.id === clubId)?.name || '—'

const fullAthleteName = (athlete) =>
    [athlete.lastName, athlete.firstName, athlete.middleName]
        .map(p => p?.trim())
        .filter(Boolean)
        .join(' ') || '—'

const filteredAthletes = computed(() => {
  let list = athletes.value.slice()
  if (selectedClubId.value && tournamentId.value) {
    const tid = Number(tournamentId.value)
    list = list.filter(a => !a.tournaments?.some(t => t.tournament_id === tid))
  }
  return list
})

const clubRegistrationClass = computed(() =>
    clubRegistrationMessage.value?.includes('Ошибка') || clubRegistrationMessage.value?.includes('не')
        ? 'text-error' : 'text-success'
)

const athletesRegistrationClass = computed(() =>
    athletesRegistrationMessage.value?.includes('Ошибка') || athletesRegistrationMessage.value?.includes('не')
        ? 'text-error' : 'text-success'
)

// === Загрузка атлетов ===
const loadAthletes = async () => {
  loadingAthletes.value = true
  athletesError.value = null
  selectedAthletes.value = []
  try {
    const result = await getAllAthletesForRegister(tournamentId.value)
    if (result?.athletes) {
      athletes.value = Object.values(result.athletes).map(mapAthlete)
    } else {
      athletesError.value = result?.error || 'Ошибка загрузки атлетов'
    }
  } catch (err) {
    athletesError.value = 'Не удалось загрузить атлетов'
  } finally {
    loadingAthletes.value = false
  }
}

const mapAthlete = (a, clubId = null) => ({
  id: a.id,
  lastName: a.last_name?.trim() || '',
  firstName: a.first_name?.trim() || '',
  middleName: a.middle_name?.trim() || '',
  gender: a.gender,
  age: a.age,
  currentWeight: a.current_weight ?? null,
  categoryName: a.rank || '—',
  clubId: clubId ?? a.club_id ?? null,
  phoneNumber: a.license_number || '—',
  tournaments: a.tournaments || []
})

// === Инициализация ===
onMounted(async () => {
  await loadTournament()

  loadingClubs.value = true
  try {
    clubs.value = await getClubs()
  } catch {
    clubsError.value = 'Не удалось загрузить клубы'
  } finally {
    loadingClubs.value = false
  }

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

  await loadAthletes()
})

// === Выбор клуба ===
watch(selectedClubId, async (newId) => {
  if (!newId) { await loadAthletes(); return }
  loadingAthletes.value = true
  selectedAthletes.value = []
  athletesError.value = null
  try {
    const result = await getClubAthletes(newId)
    if (result.success) {
      athletes.value = Object.values(result.athletes || {}).map(a => mapAthlete(a, Number(newId)))
    } else {
      athletesError.value = result.error || 'Ошибка загрузки атлетов клуба'
    }
  } catch {
    athletesError.value = 'Ошибка загрузки атлетов клуба'
  } finally {
    loadingAthletes.value = false
  }
})

// === Поиск ===
const handleSearch = async () => {
  if (!searchLastName.value && !searchFirstName.value && !searchMiddleName.value) {
    handleClearSearch(); return
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
      athletes.value = (Array.isArray(result.athletes) ? result.athletes : []).map(a => mapAthlete(a))
    } else {
      athletes.value = []
      athletesError.value = result.error || 'Ничего не найдено'
    }
  } catch {
    athletes.value = []
    athletesError.value = 'Ошибка поиска'
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
  } catch {
    clubRegistrationMessage.value = 'Ошибка при регистрации клуба'
  } finally {
    registeringClub.value = false
  }
}

function toggleSelect(id) {
  const idx = selectedAthletes.value.indexOf(id)
  console.log(selectedAthletes.value[idx])
  if (idx === -1) selectedAthletes.value.push(id)
  else selectedAthletes.value.splice(idx, 1)
}

// === Регистрация атлетов ===
const registerAthletes = async () => {
  if (!selectedAthletes.value.length || !tournamentId.value) return
  // if (!selectedCategoryId.value) {
  //   athletesRegistrationMessage.value = 'Ошибка: выберите категорию!'
  //   return
  // }
  registeringAthletes.value = true
  athletesRegistrationMessage.value = null
  try {
    const result = await addAthletesToTournament(tournamentId.value, {
      category_id: Number(selectedCategoryId.value),
      athlete_ids: selectedAthletes.value
    })
    athletesRegistrationMessage.value = result.success
        ? `Успешно зарегистрировано ${selectedAthletes.value.length} атлет(ов)!`
        : result.error || 'Ошибка при регистрации атлетов'

    if (result.success) {
      selectedAthletes.value = []
      if (selectedClubId.value) {
        const refreshed = await getClubAthletes(selectedClubId.value)
        if (refreshed.success) {
          athletes.value = Object.values(refreshed.athletes || {}).map(a => mapAthlete(a, Number(selectedClubId.value)))
        }
      } else {
        await loadAthletes()
      }
      // Обновляем счётчик участников турнира
      await loadTournament()
    }
  } catch {
    athletesRegistrationMessage.value = 'Ошибка при регистрации атлетов'
  } finally {
    registeringAthletes.value = false
  }
}

const isAllSelected = computed(() =>
    filteredAthletes.value.length > 0 &&
    filteredAthletes.value.every(a => selectedAthletes.value.includes(a.id))
)

function toggleAll() {
  if (isAllSelected.value) {
    const filteredIds = filteredAthletes.value.map(a => a.id)
    selectedAthletes.value = selectedAthletes.value.filter(id => !filteredIds.includes(id))
  } else {
    filteredAthletes.value.forEach(a => {
      if (!selectedAthletes.value.includes(a.id)) selectedAthletes.value.push(a.id)
    })
  }
}
</script>

<style scoped>
.tournament-view {
  min-height: 100vh;
  background: #ffffff;
  padding: 90px 2rem 4rem;
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
}
.header { text-align: center; margin-bottom: 2rem; }
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
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin: 0 auto 3rem;
  max-width: 100%;
}
.info-card {
  background: white;
  padding: 1.4rem;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  border-top: 5px solid #c89b3c;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.info-card strong { font-size: 0.9rem; font-weight: 600; color: #666; text-transform: uppercase; }
.info-card span { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; }
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
.description-text { padding: 1.6rem; font-size: 1.05rem; color: #444; white-space: pre-line; }
.filters-section .filters-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  padding: 1.8rem 1.6rem;
}
.filter-group, .search-group { background: #f9f9fb; padding: 1.4rem; border-radius: 16px; }
.filter-label, .search-title { font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 0.8rem; display: block; }
.select-input, .text-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  background: white;
  box-sizing: border-box;
}
.select-input:focus, .text-input:focus { border-color: #c89b3c; box-shadow: 0 0 0 3px rgba(200,155,60,0.15); }
.search-inputs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.2rem; }
.search-actions { display: flex; gap: 0.8rem; }
.btn { padding: 0.75rem 1.6rem; border: none; border-radius: 14px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.3s; }
.btn-primary { background: linear-gradient(135deg, #c89b3c, #f4d03f); color: white; box-shadow: 0 3px 10px rgba(200,155,60,0.25); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(200,155,60,0.35); }
.btn-secondary { background: #6c757d; color: white; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.mt-1 { margin-top: 1rem; }
.athletes-section .section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 1.2rem 1.6rem;
  border-bottom: 1px solid #eee;
}
.counter { background: #fffbeb; color: #92400e; padding: 0.5rem 1.2rem; border-radius: 30px; font-weight: 700; font-size: 0.9rem; }
.table-container { overflow-x: auto; }
.athletes-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.95rem; }
.athletes-table th { background: white; color: #333; font-weight: 700; padding: 1rem 0.8rem; text-align: left; text-transform: uppercase; font-size: 0.85rem; }
.athletes-table td { padding: 1.2rem 0.8rem; position: relative; }
.athletes-table tbody tr { position: relative; cursor: pointer; transition: background 0.3s; }
.athletes-table tbody tr::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 10px; background: linear-gradient(135deg, #c89b3c, #f4d03f); }
.athletes-table tbody tr:hover { background: #fdfdfb; }
.athlete-name { font-size: 1.15rem; font-weight: 700; color: #000; }
.contact { font-family: 'Courier New', monospace; font-weight: 600; color: #555; }
.empty-state { text-align: center; padding: 4rem 1.6rem; color: #666; }
.empty-state p { font-size: 1.4rem; font-weight: 600; margin-bottom: 0.8rem; }
.loading, .error { text-align: center; padding: 2rem; font-size: 1.1rem; }
.text-success { color: #28a745; font-weight: 700; }
.text-error { color: #e53e3e; font-weight: 700; }
.text-muted { color: #888; font-style: italic; }
@media (max-width: 1200px) { .filters-grid { grid-template-columns: 1fr; } }
@media (max-width: 992px) { .search-inputs { grid-template-columns: 1fr; } .info-cards { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .title { font-size: 2.2rem; } .section-title { font-size: 1.5rem; } .info-cards { grid-template-columns: 1fr; } }

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  color: #334155;
  border: none;
  border-radius: 10px;
  padding: 0.5rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}
.btn-back:hover {
  background: #e2e8f0;
  transform: translateX(-2px);
}
</style>