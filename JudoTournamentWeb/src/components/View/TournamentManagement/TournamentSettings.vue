<template>
  <div class="tournament-settings-page">
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
          Создать категорию
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
  background: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  box-sizing: border-box;
  max-width: calc(100vw - var(--sidebar-width, 120px) - 20px);
  margin-left: 0;
  padding-left: 20px;
  padding-right: 100px;
  padding-top: 80px;
  padding-bottom: 40px;
}

.settings-navigation {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
  text-align: center;
}

.settings-navigation h2 {
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

.settings-content {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-height: 60vh;
}

/* Адаптивность — унифицирована с другими страницами */
@media (max-width: 1200px) {
  .tournament-settings-page {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

@media (max-width: 768px) {
  .tournament-settings-page {
    padding-top: 70px;
  }

  .settings-navigation,
  .settings-content {
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
  .tournament-settings-page {
    padding-top: 65px;
  }

  .settings-navigation,
  .settings-content {
    padding: 1.2rem;
  }

  .settings-navigation h2 {
    font-size: 1.6rem;
  }

  .nav-tab {
    padding: 0.9rem 1.5rem;
    font-size: 0.95rem;
  }
}
</style>