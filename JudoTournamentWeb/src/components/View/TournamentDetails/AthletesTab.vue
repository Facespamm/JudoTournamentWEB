<template>
  <div class="tab-section">
    <h2>Дзюдоисты</h2>

    <!-- Лоадер категорий -->
    <div v-if="isLoadingCategories" class="categories-loading">
      <div class="spinner"></div>
      <p>Загрузка весовых категорий...</p>
    </div>

    <!-- Нет категорий -->
    <div v-else-if="!categories.length" class="no-categories">
      <p>В этом турнире пока нет весовых категорий</p>
    </div>

    <!-- Дропдаун категорий -->
    <div v-else class="weight-categories-dropdown">
      <select v-model="selectedCategory" class="category-dropdown">
        <option v-for="cat in categories" :key="cat.id" :value="cat">
          {{ cat.name }}
        </option>
      </select>
    </div>

    <!-- Заголовок выбранной категории (кроме «Все») -->
    <div v-if="selectedCategory && selectedCategory.id !== null" class="group-section">
      <span class="group-label">ВЕСОВАЯ КАТЕГОРИЯ</span>
      <span class="group-weight">{{ selectedCategory.name }}</span>
    </div>

    <!-- Лоадер дзюдоистов -->
    <div v-if="isLoadingJudoists" class="judoists-loading">
      <div class="spinner"></div>
      <p>Загрузка дзюдоистов...</p>
    </div>

    <!-- Нет дзюдоистов -->
    <div v-else-if="judoists.length === 0" class="no-judoists">
      <p>В этой категории пока нет участников</p>
    </div>

    <!-- Список дзюдоистов -->
    <div v-else class="judoists-grid">
      <div v-for="judoist in judoists" :key="judoist.id" class="judoist-card">
        <!-- Ранг/пояс (если есть) -->
        <span v-if="judoist.rank && judoist.rank !== '-'" class="rank">{{ judoist.rank }}</span>
        <span v-else class="rank-placeholder"></span>

        <div class="avatar">{{ judoist.initials }}</div>
        <div class="info">
          <div class="name">{{ judoist.name }}</div>
          <!-- Категория только при «Все категории» -->
          <div v-if="selectedCategory.id === null" class="category">
            {{ judoist.categoryName }}
          </div>
        </div>
      </div>
    </div>

    <div class="load-more-wrapper">
      <button class="load-more">Загрузить еще</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchGetCategoryByTournament } from "@/components/View/Brackets/fetchBrackets.js"

const route = useRoute()
const tournamentId = ref(Number(route.params.id))

const categories = ref([])
const selectedCategory = ref(null)
const isLoadingCategories = ref(true)

const judoists = ref([])
const isLoadingJudoists = ref(false)

const loadCategories = async () => {
  if (!tournamentId.value) return
  isLoadingCategories.value = true
  try {
    const data = await fetchGetCategoryByTournament(tournamentId.value)
    const fetchedCats = Array.isArray(data) ? data : []
    categories.value = [{ id: null, name: 'Все категории' }, ...fetchedCats]
    selectedCategory.value = categories.value[0]
  } catch (err) {
    console.error('Ошибка загрузки категорий:', err)
    categories.value = [{ id: null, name: 'Все категории' }]
    selectedCategory.value = categories.value[0]
  } finally {
    isLoadingCategories.value = false
  }
}

const loadJudoists = async (catId = null) => {
  if (!tournamentId.value) return
  isLoadingJudoists.value = true
  judoists.value = []

  try {
    // Формируем URL: если catId === null — без параметра (все атлеты)
    const params = new URLSearchParams()
    if (catId !== null) {
      params.append('category_id', catId)
    }

    const response = await fetch(`/api/tournaments/${tournamentId.value}/athletes?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mobile_app_2024'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    // result имеет athletes, athletes_count и т.д.
    const athletes = Array.isArray(result.athletes) ? result.athletes : []

    judoists.value = athletes.map(athlete => ({
      id: athlete.athlete_id,
      rank: athlete.rank || '-', // "6KYU" или другой пояс/ранг
      initials: `${athlete.first_name?.[0] || ''}${athlete.last_name?.[0] || ''}`.toUpperCase() || '??',
      name: `${(athlete.last_name || '').toUpperCase()} ${athlete.first_name || ''} (${athlete.gender === 'male' ? 'м' : 'ж'})`.trim(),
      categoryName: athlete.category_name || 'Неизвестно'
    }))

    // Сортировка (если нужно, например по рангу или ID)
    judoists.value.sort((a, b) => a.id - b.id) // или по другому полю
  } catch (err) {
    console.error('Ошибка при загрузке дзюдоистов:', err)
    judoists.value = []
  } finally {
    isLoadingJudoists.value = false
  }
}

watch(selectedCategory, (newCat) => {
  if (newCat) {
    loadJudoists(newCat.id)
  }
})

onMounted(() => {
  loadCategories()
  // После установки selectedCategory watch автоматически загрузит всех
})
</script>

<style scoped>
/* Стили без изменений */

.tab-section {
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tab-section h2 {
  font-size: 1.6rem;
  margin: 0 0 1.5rem;
  text-align: center;
  color: #c89b3c;
  font-weight: 600;
}

.weight-categories-dropdown {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0 2rem;
}

.category-dropdown {
  padding: 0.8rem 2rem;
  border-radius: 30px;
  border: 2px solid #c89b3c;
  background: white;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  min-width: 340px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.1);
  transition: all 0.2s;
}

.category-dropdown:hover {
  box-shadow: 0 6px 16px rgba(200, 155, 60, 0.15);
}

.category-dropdown:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(200, 155, 60, 0.2);
}

.group-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.group-label {
  color: #1a1a1a;
}

.group-weight {
  color: #c89b3c;
  font-size: 1.2rem;
}

.judoists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 1rem;
}

.judoist-card {
  background: white;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  box-shadow: 0 2px 8px rgba(200, 155, 60, 0.1);
  border: 1px solid #f5efe0;
  transition: all 0.2s ease;
  min-height: 68px;
}

.judoist-card:hover {
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.2);
  border-color: #c89b3c;
}

.rank {
  font-size: 1.1rem;
  font-weight: 600;
  color: #c89b3c;
  min-width: 44px;
  flex-shrink: 0;
  text-align: center;
}

.rank-placeholder {
  min-width: 44px;
  flex-shrink: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0d68a, #c89b3c);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(200, 155, 60, 0.3);
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name {
  font-weight: 600;
  font-size: 1rem;
  color: #1a1a1a;
  line-height: 1.3;
  word-break: break-word;
  overflow-wrap: break-word;
}

.category {
  font-size: 0.85rem;
  color: #777;
  line-height: 1.3;
}

.load-more-wrapper {
  text-align: center;
  margin-top: 2rem;
}

.load-more {
  padding: 0.7rem 2rem;
  border-radius: 30px;
  border: 2px solid #c89b3c;
  background: white;
  color: #c89b3c;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more:hover {
  background: #c89b3c;
  color: white;
}

.categories-loading,
.judoists-loading,
.no-categories,
.no-judoists {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
  font-size: 1.1rem;
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

@media (max-width: 768px) {
  .judoists-grid {
    grid-template-columns: 1fr;
  }

  .category-dropdown {
    min-width: 100%;
  }
}

@media (max-width: 480px) {
  .tab-section {
    padding: 1.5rem;
  }

  .tab-section h2 {
    font-size: 1.4rem;
  }
}
</style>