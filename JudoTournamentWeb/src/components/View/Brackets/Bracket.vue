<template>
  <div class="bracket-management-page">
    <div class="management-container">
      <section class="management-navigation">
        <h2>Управление сетками турниров</h2>
        <nav class="nav-tabs">
          <button
              class="nav-tab"
              :class="{ active: activeTab === 'create' }"
              @click="activeTab = 'create'"
          >
            Создать сетку
          </button>
        </nav>
      </section>

      <section class="management-content">
        <!-- Создание сетки -->
        <BracketCreation
            v-if="activeTab === 'create'"
            :tournaments="tournaments"
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

        <BracketsCreateFight
            v-if="activeTab === 'edit'"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchTournaments } from '@/components/View/Tournaments/fetchTournaments.js'
import BracketCreation from './BracketsCreate.vue'
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
  if (res.success) tournaments.value = Array.isArray(res.data) ? res.data : res.data.tournaments || []
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

const handleBracketCreated = (newBracket) => {
  brackets.value.push(newBracket)
  activeTab.value = 'view'
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