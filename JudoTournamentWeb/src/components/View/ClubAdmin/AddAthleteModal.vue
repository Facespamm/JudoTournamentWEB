<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">

      <!-- Шапка клуба -->
      <div class="admin-table-header">
        <h3>{{ clubInitials }} — {{ clubData.name }}</h3>
        <div style="font-size:0.95rem; color:#666; margin-top:0.3rem; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap">
          <span>{{ clubData.city }}, {{ clubData.country }}</span>
          <span v-if="clubData.coach_name"> · Тренер: {{ clubData.coach_name }}</span>
          <span class="admin-athletes-count" style="margin-left:0.4rem">{{ clubData.athletes_count }} атлетов</span>
        </div>
      </div>

      <!-- Поиск и счётчик -->
      <div class="admin-management-filters" style="margin-top:1rem">
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
        <span style="color:#666; font-size:0.95rem">
          Найдено: <strong>{{ filteredAthletes.length }}</strong>
          <span v-if="searchQuery"> из {{ athletes.length }}</span>
          атлетов
        </span>
      </div>

      <!-- Панель действий -->
      <div class="admin-table-actions" style="margin-bottom:0.8rem">
        <span style="color:#666; font-size:0.95rem">
          Выбрано: <strong>{{ selectedIds.length }}</strong>
        </span>
        <button v-if="selectedIds.length" class="admin-btn-delete" @click="clearAll">
          Снять всё
        </button>
        <button v-if="selectedIds.length" class="admin-add-button" @click="saveSelected">
          Сохранить выбранных
        </button>
        <button v-if="selectedIds.length" class="admin-add-button" @click="unassignSelected">
          Отменить выбранных
        </button>
      </div>

      <!-- Таблица -->
      <div class="admin-clubs-table-card">
        <div class="admin-table-container">
          <table class="admin-clubs-table">
            <thead>
            <tr>
              <th class="admin-col-select">
                <input type="checkbox" :checked="isAllSelected" @change="toggleAll" />
              </th>
              <th>ФИО</th>
              <th>Дата рождения</th>
              <th>Возраст</th>
              <th>Клуб</th>
              <th>Пол</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="ath in filteredAthletes"
                :key="ath.id"
                class="admin-table-row"
                :class="{ 'admin-selected-row': selectedIds.includes(ath.id) }"
                @click="toggleSelect(ath.id)"
            >
              <td class="admin-col-select">
                <input
                    type="checkbox"
                    :checked="selectedIds.includes(ath.id)"
                    @click.stop="toggleSelect(ath.id)"
                />
              </td>
              <td data-label="ФИО">
                <div class="admin-club-name">{{ getFullName(ath) }}</div>
              </td>
              <td data-label="Дата рождения">{{ formatBirthDate(ath.birth_date) }}</td>
              <td data-label="Возраст">
                <span class="admin-athletes-count">{{ ath.age ?? '—' }}</span>
              </td>
              <td data-label="Клуб" class="admin-short-name">{{ ath.club_name || '—' }}</td>
              <td data-label="Пол">
                  <span
                      class="admin-athletes-count"
                      :style="ath.gender === 'male'
                      ? 'background: linear-gradient(135deg,#1e88e5,#42a5f5)'
                      : 'background: linear-gradient(135deg,#d81b60,#f06292)'"
                  >
                    {{ ath.gender === 'male' ? 'Муж' : 'Жен' }}
                  </span>
              </td>
            </tr>
            </tbody>
          </table>

          <div v-if="filteredAthletes.length === 0" class="admin-empty-state">
            <div class="admin-empty-icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p v-if="searchQuery">По запросу «{{ searchQuery }}» атлетов не найдено</p>
            <p v-else>В этом клубе пока нет атлетов</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch} from 'vue'
import './ClubsAdmin.css'
import {searchAthletes} from "@/components/View/RegistrationAthletesTournament/fetchRegistrationAthletesTornament.js";
import {
  getAthleteForRegistratedClub,
  registraitAthleteToClub,
  unassignAthleteToClub
} from "@/components/View/ClubAdmin/fetchClubAdmin.js";

const props = defineProps({
  club: { type: Object, default: null },
  isOpen: { type: Boolean, default: false }
})

watch(
    () => props.isOpen,
    (newVal) => {
      if (newVal) {
        if (props.club?.id) {
          console.log('[MODAL] Открыто добавление в клуба ')
          Object.assign(clubData.value, props.club)
          getAthleteData()
        } else {
          console.log('[MODAL] Открыто создание нового клуба')
        }
      }
    }
)

const clubData = ref({
  id: '',
  name: '',
  short_name: '',
  city: '',
  country: '',
  coach_name: '',
  athletes_count: '',
  phone: '',
  email: '',
  website: '',
})
const emit = defineEmits(['save', 'close'])

const searchQuery = ref('')
const selectedIds = ref([]) // хранит только ID
const athletes = ref([])
const isLoading = ref(false)

const clubInitials = computed(() => {
  const words = props.club?.name?.split(' ') ?? []
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase()
})

const filteredAthletes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return athletes.value
  return athletes.value.filter(a => getFullName(a).toLowerCase().includes(q))
})

function getFullName(a) {
  return [a.last_name, a.first_name, a.patronymic].join(' ')
  // return
}

function formatBirthDate(date) {
  if (!date) return '—';

  const parsedDate = new Date(date);

  // Проверяем, что дата валидная
  if (isNaN(parsedDate.getTime())) {
    return '—';
  }

  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const year = parsedDate.getFullYear();

  return `${day}.${month}.${year}`;
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(idx, 1)
}

function toggleAll() {
  if (isAllSelected.value) {
    const filteredIds = filteredAthletes.value.map(a => a.id)
    selectedIds.value = selectedIds.value.filter(id => !filteredIds.includes(id))
  } else {
    filteredAthletes.value.forEach(a => {
      if (!selectedIds.value.includes(a.id)) selectedIds.value.push(a.id)
    })
  }
}

const getAthleteData = async () => {
  try {
    const data = await getAthleteForRegistratedClub()
    athletes.value = Array.isArray(data) ? data : (data?.athletes || data || [])
  }catch (error) {
    console.error('Ошибка загрузки клубов:', error)
    athletes.value = []
  }
}

const close = () => {
  if (!isLoading.value) {
    emit('close')
  }
}

function clearAll() {
  selectedIds.value = []
}

const searchLastName = ref('')
const searchFirstName = ref('')
const searchMiddleName = ref('')
const loadingAthletes = ref(false)
const athletesError = ref(null)

const mapAthlete = (a, clubId = null) => ({
  id: a.id,
  last_name: a.last_name?.trim() || '',
  first_name: a.first_name?.trim() || '',
  middle_name: a.middle_name?.trim() || '',
  gender: a.gender,
  age: a.age,
  currentWeight: a.current_weight ?? null,
  categoryName: a.rank || '—',
  clubId: clubId ?? a.club_id ?? null,
  phoneNumber: a.license_number || '—',
  tournaments: a.tournaments || []
})

const handleSearch = async () => {
  if (!searchLastName.value && !searchFirstName.value && !searchMiddleName.value) {
    handleClearSearch(); return
  }
  loadingAthletes.value = true
  athletesError.value = null
  selectedIds.value = []
  try {
    const result = await searchAthletes(
        searchLastName.value || null,
        searchFirstName.value || null,
        searchMiddleName.value || null,
        null,
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
  athletesError.value = null
  selectedIds.value = []
  getAthleteData()
}

const unassignSelected = async () => {
  try {
    if (selectedIds.value !== null && selectedIds.value.length > 0) {
      const response = await unassignAthleteToClub(clubData.value.id, selectedIds.value)
      alert(response)
      await getAthleteData()
      clubData.value.athletes_count -= selectedIds.value.length
    }
  }catch (error) {
    console.error(error)
    throw error
  }
}

const saveSelected = async () => {
  try {
    if (selectedIds.value !== null && selectedIds.value.length > 0) {
      const response = await registraitAthleteToClub(clubData.value.id, selectedIds.value)
      alert(response)
      await getAthleteData()
      clubData.value.athletes_count += selectedIds.value.length
    }
  } catch (error){
    console.error(error)
    throw error
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