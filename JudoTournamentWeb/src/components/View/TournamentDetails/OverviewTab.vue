<template>
  <div class="overview-wrapper">
    <section class="tournament-main-info">
      <div class="tournament-info">
        <!-- Заголовок + кнопка Документ -->
        <div class="tournament-header">
          <h1>{{ tournament?.name || 'Название турнира' }}</h1>
          <button
              class="document-btn"
              @click="downloadDocument"
              title="Скачать протокол турнира в PDF"
          >
            📄 Документ
          </button>
        </div>

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
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'          // ← ИСПРАВЛЕНИЕ: добавлен computed
import { useRoute } from 'vue-router'
import { fetchGetDocument } from "@/components/View/Brackets/fetchBrackets.js"

const tournament = inject('tournament')
const route = useRoute()

// Надёжное получение ID турнира
const tournamentId = computed(() => {
  if (tournament?.id) return Number(tournament.id)
  if (tournament?.tournament_id) return Number(tournament.tournament_id)
  return Number(route.params.id)
})

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

// Функция скачивания PDF турнира
const downloadDocument = async () => {
  const id = tournamentId.value

  if (!id || isNaN(id)) {
    console.error('❌ Не удалось определить ID турнира', { tournament, routeParams: route.params })
    alert('Не удалось определить ID турнира. Обновите страницу и попробуйте снова.')
    return
  }

  try {
    const blob = await fetchGetDocument(id)

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Протокол_турнира_${(tournament?.name || 'Турнир').replace(/\s+/g, '_')}_${id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log(`✅ PDF турнира ${id} успешно скачан`)
  } catch (error) {
    console.error('❌ Ошибка при скачивании PDF турнира:', error)
    alert('Не удалось скачать документ. Попробуйте позже.')
  }
}
</script>

<style scoped>
.overview-wrapper { padding: 0 1rem; }

.tournament-main-info {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.tournament-info { text-align: center; }

.tournament-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.tournament-info h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
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

.meta-label { font-weight: 500; color: #666; }
.meta-value { font-weight: 600; color: #333; }

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

.document-btn {
  padding: 0.55rem 1.6rem;
  border-radius: 50px;
  background: #c89b3c;
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.3);
}

.document-btn:hover:not(:disabled) {
  background: #d4aa5a;
  transform: translateY(-1px);
}

.document-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .tournament-header { justify-content: center; }
  .tournament-meta { grid-template-columns: 1fr; }
}
</style>