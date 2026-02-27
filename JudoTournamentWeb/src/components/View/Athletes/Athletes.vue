<template>
  <!-- СПИСОК -->
  <div class="judo_form-athletes_info">
    <section class="judo-list">
      <h2>Дзюдоисты</h2>

      <!-- Лоадер -->
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Загрузка спортсменов...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="error">{{ error }}</div>

      <!-- Карточки -->
      <div v-else class="cards-container">
        <article
            v-for="(athlete, index) in athletes"
            :key="athlete.id"
            class="judo-card"
            @click="goToAthleteDetail(athlete.id)"
        >
          <div class="rank">#{{ index + 1 }}</div>
          <div class="card-info">
            <h3 class="athlete-name">{{ getFullName(athlete) }}</h3>
            <p class="category">{{ athlete.rank || 'Разряд не указан' }}</p>
          </div>
        </article>

        <div v-if="athletes.length === 0" class="no-data">
          <p>Спортсмены не найдены</p>
        </div>
      </div>
    </section>
  </div>

  <!-- КНОПКА «Показать ещё» -->
  <div class="judo-tournament_button_pagination">
    <button type="button" class="judo-tournament_button_pagination_next" @click="loadMore">
      Показать ещё
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAthletes } from '@/components/View/Athletes/fetchAthletes'
import "@/components/View/Athletes/Athletes.css"

const router = useRouter()
const athletes = ref([])
const isLoading = ref(true)
const error = ref('')

const getFullName = (athlete) => {
  if (athlete.full_name) return athlete.full_name
  return `${athlete.last_name || ''} ${athlete.first_name || ''} ${athlete.middle_name || ''}`.trim()
}

const goToAthleteDetail = (athleteId) => {
  router.push(`/athlete/${athleteId}`)
}

const loadAthletes = async () => {
  isLoading.value = true
  const result = await fetchAthletes()
  if (result.success) {
    athletes.value = result.athletes
  } else {
    error.value = result.error || 'Ошибка загрузки'
  }
  isLoading.value = false
}

const loadMore = () => {
  console.log('loadMore – пока без пагинации')
}

onMounted(() => {
  loadAthletes()
})
</script>

<style scoped>
/* === ЗАГОЛОВОК === */
.judo-list h2 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 2rem;
  color: #1a1a1a;
  text-align: center;
}

/* === КОНТЕЙНЕР === */
.judo_form-athletes_info {
  padding-top: 100px;
  padding-left: 0;
  padding-right: 0;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 380px));
  gap: 1.25rem;
  justify-content: center;
  margin: 0 auto;
}/* === КАРТОЧКА — горизонтальная, компактная === */
.judo-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  background: white;
  border: 2px solid #c89b3c;
  border-radius: 14px;
  padding: 0.65rem 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease;
  cursor: pointer;
  min-height: 0;
}

.judo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.11);
  border-color: #b8873a;
}

/* Ранг */
.rank {
  font-size: 1.3rem;
  font-weight: 700;
  color: #c89b3c;
  min-width: 40px;
  text-align: center;
  flex-shrink: 0;
}

/* Инфо */
.card-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* Имя */
.athlete-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Разряд */
.category {
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

/* === СОСТОЯНИЯ === */
.loading, .error, .no-data {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #c89b3c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* === КНОПКА === */
.judo-tournament_button_pagination {
  text-align: center;
  margin: 2.5rem 0 2rem 0;
}

.judo-tournament_button_pagination_next {
  background: white;
  border: 2px solid #c89b3c;
  color: #c89b3c;
  padding: 0.75rem 2.5rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.judo-tournament_button_pagination_next:hover {
  background: #c89b3c;
  color: white;
  transform: translateY(-1px);
}

/* === АДАПТИВ === */
@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }
  .judo_form-athletes_info {
    padding-right: 4rem;
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
  .judo_form-athletes_info {
    padding-right: 2rem;
  }
}

@media (max-width: 480px) {
  .judo-list h2 {
    font-size: 1.6rem;
  }
  .athlete-name {
    font-size: 0.9rem;
  }
  .rank {
    font-size: 1.1rem;
  }
}
</style>