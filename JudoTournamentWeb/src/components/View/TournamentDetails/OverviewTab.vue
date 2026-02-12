<template>
  <div class="overview-wrapper">
    <section class="tournament-main-info">
      <div class="tournament-info">
        <h1>{{ tournament?.name || 'Название турнира' }}</h1>
        <p class="tournament-description">{{ tournament?.description || 'Описание отсутствует' }}</p>

        <div class="tournament-meta">
          <div class="meta-item">
            <span class="meta-label">Дата проведения:</span>
            <span class="meta-value">{{ formatDate(tournament?.start_date, tournament?.end_date) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Место проведения:</span>
            <span class="meta-value">{{ getLocation(tournament) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Статус:</span>
            <span class="meta-value status-badge" :class="getStatusClass(tournament?.status)">
              {{ getStatusText(tournament?.status) }}
            </span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Количество участников:</span>
            <span class="meta-value">{{ tournament?.athletes_count || 0 }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Количество татами:</span>
            <span class="meta-value">{{ tournament?.tatami_count || 0 }}</span>
          </div>
          <div v-if="tournament?.progress_percentage > 0" class="meta-item">
            <span class="meta-label">Прогресс:</span>
            <span class="meta-value">{{ tournament?.progress_percentage }}% завершено</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Дополнительный контент (если захотите) -->
    <!-- <p class="welcome-text">Добро пожаловать в обзор турнира!</p> -->
  </div>
</template>

<script setup>
import { inject } from 'vue'

const tournament = inject('tournament')

const formatDate = (startDate, endDate) => {
  if (!startDate) return 'Дата не указана'
  const start = new Date(startDate)
  const end = new Date(endDate || startDate)
  if (startDate === endDate) return start.toLocaleDateString('ru-RU')
  return `${start.toLocaleDateString('ru-RU')} – ${end.toLocaleDateString('ru-RU')}`
}

const getLocation = (t) => {
  if (!t) return 'Место не указано'
  const parts = []
  if (t.venue && t.venue !== 'string') parts.push(t.venue)
  if (t.city && t.city !== 'string') parts.push(t.city)
  if (t.country && t.country !== 'string') parts.push(t.country)
  return parts.join(', ') || 'Место не указано'
}

const getStatusClass = (status) => {
  const map = {
    'LIVE': 'status-live',
    'PLANNED': 'status-planned',
    'COMPLETED': 'status-completed',
    'REGISTRATION': 'status-registration',
    'WEIGHING': 'status-weighing',
    'BRACKETS': 'status-brackets'
  }
  return map[status] || 'status-planned'
}

const getStatusText = (status) => {
  const map = {
    'LIVE': 'LIVE',
    'PLANNED': 'Запланирован',
    'COMPLETED': 'Завершен',
    'REGISTRATION': 'Регистрация',
    'WEIGHING': 'Взвешивание',
    'BRACKETS': 'Сетки'
  }
  return map[status] || status
}
</script>

<style scoped>
.overview-wrapper {
  padding: 0 1rem;
}

.tournament-main-info {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.tournament-info {
  text-align: center;
}

.tournament-info h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: #1a1a1a;
}

.tournament-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
  max-width: 85%;
  margin-left: auto;
  margin-right: auto;
}

.tournament-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-label {
  font-weight: 500;
  color: #666;
}

.meta-value {
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-planned { background: #e3f2fd; color: #1976d2; }
.status-live { background: #fbe9e7; color: #d32f2f; }
.status-completed { background: #e8f5e8; color: #2e7d32; }
.status-registration { background: #fff3e0; color: #f57c00; }
.status-weighing { background: #f3e5f5; color: #7b1fa2; }
.status-brackets { background: #e8eaf6; color: #303f9f; }

/* Убрал старый .overview-section и min-height, теперь всё в карточке */
@media (max-width: 768px) {
  .tournament-meta {
    grid-template-columns: 1fr;
  }
}
</style>