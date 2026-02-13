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
        <h2>Судьи</h2>

        <!-- Лоадер -->
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
          <p>Загрузка судей...</p>
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="error">{{ error }}</div>

        <!-- Карточки -->
        <div v-else class="cards-container">
          <article
              v-for="referee in referees"
              :key="referee.id"
              class="judo-card"
              @click="goToRefereeDetail(referee.id)"
          >
            <div class="judo_card_info">
              <h3 class="judo_card_name">{{ getFullName(referee) }}</h3>
              <div class="card-details">
                <div class="detail-row">
                  <span class="detail-label">Разряд:</span>
                  <span class="detail-value">{{ referee.certification_level || 'Не указан' }}</span>
                </div>
              </div>
            </div>
          </article>

          <div v-if="referees.length === 0" class="no-data">
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
import {getReferees} from "@/components/View/Referee/fetchReferee.js";
import "@/components/View/Referee/Referee.css"

const router = useRouter()
const referees = ref([])
const isLoading = ref(true)
const error = ref('')

// Функция для получения полного имени
const getFullName = (referee) => {
  if (referee.full_name) return referee.full_name
  return `${referee.last_name || ''} ${referee.first_name || ''} ${referee.middle_name || ''}`.trim()
}

// Функция перехода на детальную страницу атлета
const goToRefereeDetail = (refereeId) => {
  router.push(`/referee/${refereeId}`)
}

const loadReferees = async () => {
  isLoading.value = true
  error.value = null // сбросьте предыдущую ошибку

  const result = await getReferees()

  if (result.success) {
    referees.value = result.referees
    // можно также сохранить total, если нужно
    // totalReferees.value = result.total
  } else {
    error.value = result.error || 'Ошибка загрузки'
    referees.value = [] // очистите список при ошибке
  }

  isLoading.value = false
}

const loadMore = () => {
  console.log('loadMore – пока без пагинации')
}

onMounted(() => {
  loadReferees()
})
</script>

<style scoped>
</style>