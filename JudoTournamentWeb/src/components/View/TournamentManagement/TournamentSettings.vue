<template>
  <div class="tournament-settings-page">
    <div class="settings-container">
      <section class="settings-navigation">
        <h2>Настройки турниров</h2>
        <nav class="nav-tabs">
          <button
              class="nav-tab"
              :class="{ active: activeTab === 'create' }"
              @click="activeTab = 'create'"
          >
            Создать турнир
          </button>
          <button
              class="nav-tab"
              :class="{ active: activeTab === 'categories' }"
              @click="activeTab = 'categories'"
          >
            Управление категориями
          </button>
          <button
              class="nav-tab"
              :class="{ active: activeTab === 'registration' }"
              @click="activeTab = 'registration'"
          >
            Регистрация на турнир
          </button>
        </nav>
      </section>

      <section class="settings-content">
        <CreateTournament
            v-if="activeTab === 'create'"
            @tournament-created="handleTournamentCreated"
        />
        <ManageCategories
            v-if="activeTab === 'categories'"
            :new-tournament-id="newTournamentId"
        />
        <TournamentRegistration
            v-if="activeTab === 'registration'"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CreateTournament from '@/components/View/TournamentManagement/CreateTournament.vue'
import ManageCategories from '@/components/View/TournamentManagement/ManageCategories.vue'

const activeTab = ref('create')
const newTournamentId = ref(null)

const handleTournamentCreated = (tournamentId) => {
  newTournamentId.value = tournamentId
  activeTab.value = 'categories'
}
</script>

<style scoped>
.tournament-settings-page {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(to bottom, #fefefe, #f8f9fa);
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  padding: 90px 0 2rem 0;
  margin: 0;
  box-sizing: border-box;
}

.settings-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.settings-navigation {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.settings-navigation h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1a1a1a;
  text-align: center;
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
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  flex: 1;
  min-width: 200px;
  text-align: center;
}

.nav-tab:hover {
  border-color: #c89b3c;
  color: #1a1a1a;
}

.nav-tab.active {
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  color: white;
  border-color: #c89b3c;
}

.settings-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

@media (max-width: 768px) {
  .tournament-settings-page {
    padding-top: 80px;
  }

  .settings-container {
    padding: 0 1rem;
  }

  .settings-navigation,
  .settings-content {
    padding: 1.5rem;
  }

  .nav-tabs {
    flex-direction: column;
  }

  .nav-tab {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .tournament-settings-page {
    padding-top: 75px;
  }

  .settings-navigation,
  .settings-content {
    padding: 1rem;
  }

  .settings-navigation h2 {
    font-size: 1.5rem;
  }
}
</style>