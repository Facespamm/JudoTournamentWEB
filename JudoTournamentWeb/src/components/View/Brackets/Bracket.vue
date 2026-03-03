<template>
  <div class="bracket-management-page">
    <section class="management-navigation">
      <h2>Управление сетками турниров</h2>
      <nav class="nav-tabs">
        <button
            class="nav-tab"
            :class="{ active: activeTab === 'create' }"
            @click="activeTab = 'create'"
        >
          Создать основную сетку
        </button>
        <button
            class="nav-tab"
            :class="{ active: activeTab === 'consolation' }"
            @click="activeTab = 'consolation'"
        >
          Создать утешительную сетку
        </button>
        <button
            class="nav-tab"
            :class="{ active: activeTab === 'view' }"
            @click="activeTab = 'view'"
        >
          Просмотр сеток
        </button>
      </nav>
    </section>

    <section class="management-content">
      <!-- Создание основной сетки -->
      <BracketCreation
          v-if="activeTab === 'create'"
          :tournaments="tournaments"
          @bracket-created="handleBracketCreated"
      />

      <!-- Создание утешительной сетки -->
      <ConsolationBracketCreation
          v-if="activeTab === 'consolation'"
          :tournaments="tournaments"
          :existingBrackets="brackets"
          @bracket-created="handleBracketCreated"
      />

      <!-- Просмотр сеток -->
      <BracketsView
          v-if="activeTab === 'view'"
          :tournaments="tournaments"
          :brackets="brackets"
          @view-bracket="viewBracket"
          @edit-bracket="createFight"
          @delete-bracket="deleteBracket"
      />

      <BracketsCreateFight v-if="activeTab === 'edit'" />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'

import BracketCreation from './BracketsCreate.vue'
import ConsolationBracketCreation from './../Brackets/ConsolationBracketCreation.vue'
import BracketsView from './ViewBrackets.vue'
import BracketsCreateFight from './BracketsCreateFight.vue'

import "./Brackets.css"

const activeTab = ref('create')
const tournaments = ref([])
const brackets = ref([])

onMounted(async () => {
  await loadTournaments()
  await loadBrackets()
})

const loadTournaments = async () => {
  const res = await fetchTournaments()
  if (res.success) {
    tournaments.value = Array.isArray(res.data) ? res.data : res.data.tournaments || []
  }
}

const loadBrackets = async () => {
  // Заглушка для загрузки сеток
  brackets.value = [
    {
      id: 1,
      name: 'Мужчины -73 кг',
      tournament_id: 1,
      category_id: 1,
      bracket_type: 'single_elimination',
      has_consolation: true,
      status: 'active',
      participants_count: 16
    }
  ]
}

// Обработчик создания сетки — БЕЗ авто-переключения вкладки
const handleBracketCreated = (newBracket) => {
  brackets.value.push(newBracket)
  // activeTab.value = 'view'   ← УДАЛЕНО
}

const viewBracket = (id) => {
  console.log('Просмотр сетки', id)
}

const createFight = (id) => {
  console.log('Создание боя', id)
}

const deleteBracket = (id) => {
  brackets.value = brackets.value.filter(b => b.id !== id)
}
</script>

<style scoped>
/* Все стили полностью сохранены без изменений */
.bracket-management-page {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  box-sizing: border-box;
  max-width: calc(100vw - var(--sidebar-width, 120px) - 20px);
  margin-left: 0;
  padding-top: 80px;
  padding-bottom: 40px;
}

.management-navigation {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  text-align: center;
}

.management-navigation h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
}

.nav-tabs {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.nav-tab {
  background: #f5f5f5;
  border: 2px solid #e8e8e8;
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  flex: 1;
  min-width: 220px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.nav-tab:hover {
  border-color: #c89b3c;
  color: #1a1a1a;
  transform: translateY(-2px);
}

.nav-tab.active {
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  border-color: #c89b3c;
  box-shadow: 0 6px 16px rgba(200, 155, 60, 0.3);
}

.management-content {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 60vh;
}

@media (max-width: 1200px) {
  .bracket-management-page {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 768px) {
  .bracket-management-page {
    padding-top: 70px;
  }

  .management-navigation,
  .management-content {
    padding: 1.8rem;
  }

  .nav-tabs {
    flex-direction: column;
  }

  .nav-tab {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .bracket-management-page {
    padding-top: 65px;
  }

  .management-navigation,
  .management-content {
    padding: 1.2rem;
  }

  .management-navigation h2 {
    font-size: 1.6rem;
  }

  .nav-tab {
    padding: 0.9rem 1.5rem;
    font-size: 0.95rem;
  }
}
</style>