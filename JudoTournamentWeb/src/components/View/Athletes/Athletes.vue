<template>
  <div class="judo_athletes">
    <!-- ФИЛЬТРЫ -->
    <div class="judo_athletes-setting_search">
      <select class="judo-athletes-setting_search_select_category" name="athlete_filter_category">
        <option value="all">Категория спортсмена</option>
        <option value="60">до 60 кг</option>
        <option value="66">до 66 кг</option>
        <option value="73">до 73 кг</option>
        <option value="81">до 81 кг</option>
        <option value="90">до 90 кг</option>
        <option value="100">до 100 кг</option>
        <option value="+100">свыше 100 кг</option>
      </select>

      <select class="judo-athletes-setting_select_filter_city" name="athlete_filter_city">
        <option value="">Город</option>
        <option value="Астана">Астана</option>
        <option value="Алматы">Алматы</option>
        <option value="Шымкент">Шымкент</option>
        <option value="Актобе">Актобе</option>
        <option value="Караганда">Караганда</option>
        <option value="Павлодар">Павлодар</option>
        <option value="Усть-Каменогорск">Усть-Каменогорск</option>
        <option value="Тараз">Тараз</option>
        <option value="Костанай">Костанай</option>
        <option value="Атырау">Атырау</option>
      </select>

      <input type="search" placeholder="Поиск спортсменов" class="search-input" />
    </div>

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
            <div class="rank-badge">#{{ index + 1 }}</div>
            <div class="judo_card_info">
              <h3 class="judo_card_name">{{ getFullName(athlete) }}</h3>
              <div class="card-details">
                <div class="detail-row">
                  <span class="detail-label">Разряд:</span>
                  <span class="detail-value">{{ athlete.rank || 'Не указан' }}</span>
                </div>
              </div>
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
</style>