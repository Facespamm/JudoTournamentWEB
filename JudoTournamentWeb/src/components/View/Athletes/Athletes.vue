<template>
  <!-- СПИСОК -->
  <div class="judo_form-athletes_info">
    <section class="judo-list">
      <h2>Лучшие дзюдоисты</h2>

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
          <h3 class="athlete-name">{{ getFullName(athlete) }}</h3>
          <p class="category">{{ athlete.rank || 'Разряд не указан' }}</p>
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

// Функция для получения полного имени
const getFullName = (athlete) => {
  if (athlete.full_name) return athlete.full_name
  return `${athlete.last_name || ''} ${athlete.first_name || ''} ${athlete.middle_name || ''}`.trim()
}

// Функция перехода на детальную страницу атлета
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
  margin: 0 0 3rem;
  color: #1a1a1a;
  text-align: center;
}

/* === КОНТЕЙНЕР КАРТОЧЕК === */
.judo_form-athletes_info {
  padding-top: 40px;
  padding-left: 0;          /* Максимально левее */
  padding-right: 6rem;      /* Больше отступ справа */
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(320px, 1fr));
  gap: 1.5rem;
  justify-content: start;
  margin-left: 0;
  max-width: none;
}

/* === КАРТОЧКИ (компактнее по высоте) === */
.judo-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #c89b3c;
  border-radius: 24px;
  padding: 1.5rem 1.2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  text-align: center;
  gap: 0.8rem;
  min-height: 160px;
}

.judo-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

/* Ранг */
.rank {
  align-self: flex-start;
  font-size: 1.8rem;
  font-weight: 700;
  color: #c89b3c;
  margin: 0;
}

/* Имя */
.athlete-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

/* Разряд */
.category {
  font-size: 1rem;
  color: #333;
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
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c89b3c;
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
  margin: 4rem 0 2rem 0;
}

.judo-tournament_button_pagination_next {
  background: white;
  border: 2px solid #c89b3c;
  color: #c89b3c;
  padding: 1rem 3rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
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
    grid-template-columns: repeat(2, minmax(320px, 1fr));
  }

  .judo_form-athletes_info {
    padding-right: 4rem;
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .judo-card {
    padding: 1.3rem 1rem;
    min-height: 140px;
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
    font-size: 1.25rem;
  }

  .rank {
    font-size: 1.6rem;
  }
}
</style>