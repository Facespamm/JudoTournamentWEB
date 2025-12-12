<template>
  <div class="fights-overview">
    <div class="fights-header">
      <h1>Схватки и поединки</h1>
      <p class="subtitle">Управление всеми боями турнира</p>
    </div>

    <div class="filters-section">
      <div class="filter-group">
        <label>Татами:</label>
        <select v-model="selectedTatami" @change="filterFights">
          <option value="all">Все татами</option>
          <option v-for="t in availableTatamis" :key="t" :value="t">Татами {{ t }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Статус:</label>
        <select v-model="selectedStatus" @change="filterFights">
          <option value="all">Все статусы</option>
          <option value="SCHEDULED">Запланированы</option>
          <option value="IN_PROGRESS">LIVE</option>
          <option value="COMPLETED">Завершены</option>
        </select>
      </div>
    </div>

    <div class="fights-list">
      <div class="tatami-grid">
        <div
            v-for="fight in filteredFights"
            :key="fight.id"
            class="fight-card"
            :class="statusClass(fight.status)"
            @click="viewFightDetail(fight.id)"
        >
          <!-- Цветная полоса слева -->
          <div class="status-bar"></div>

          <!-- Статус в правом верхнем углу -->
          <div class="status-corner">
            <span class="dot"></span>
            {{ statusText(fight.status) }}
          </div>

          <div class="card-content">
            <div class="header">
              <div class="tatami-main">
                <h2 class="tatami-name">Татами {{ fight.tatami }}</h2>
                <span class="fight-number">Схватка #{{ fight.fight_number }}</span>
              </div>
              <div class="timer-big">
                {{ displayTime(fight) }}
              </div>
            </div>

            <div class="actions">
              <button v-if="fight.status === 'SCHEDULED'" @click.stop="startFight(fight.id)" class="btn-start">
                Начать
              </button>
              <button v-if="fight.status === 'IN_PROGRESS'" @click.stop="controlFight(fight.id)" class="btn-control">
                Управление
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredFights.length === 0" class="empty-state">
        <div class="empty-icon">Gi</div>
        <h3>Схватки не найдены</h3>
        <button class="reset-filters-btn" @click="resetFilters">Сбросить фильтры</button>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchGetFights } from '@/components/View/Fight/fetchFights.js'
import "./Fight.css"
export default {
  name: 'FightsOverview',
  data() {
    return {
      fights: [],
      selectedTatami: 'all',
      selectedStatus: 'all',
      refreshInterval: null // Добавляем переменную для хранения интервала
    }
  },
  computed: {
    availableTatamis() {
      return [...new Set(this.fights.map(f => f.tatami))].sort((a, b) => a - b)
    },
    filteredFights() {
      let list = this.fights
      if (this.selectedTatami !== 'all') list = list.filter(f => f.tatami === +this.selectedTatami)
      if (this.selectedStatus !== 'all') list = list.filter(f => f.status === this.selectedStatus)
      return list
    }
  },
  async mounted() {
    await this.loadFights()
    // УБИРАЕМ автоматическое обновление или настраиваем по необходимости
    // this.refreshInterval = setInterval(this.loadFights, 10000)
  },
  beforeUnmount() {
    // Очищаем интервал при уничтожении компонента
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  },
  methods: {
    async loadFights() {
      try {
        console.log('Загрузка списка боев...') // Для отладки
        const res = await fetchGetFights()
        if (res.success) {
          this.fights = res.data.fights || []
          console.log('Бои загружены:', this.fights.length) // Для отладки
        }
      } catch (err) {
        console.error('Ошибка загрузки боев:', err)
      }
    },
    filterFights() {},
    resetFilters() {
      this.selectedTatami = 'all'
      this.selectedStatus = 'all'
    },
    statusText(s) {
      return s === 'IN_PROGRESS' ? 'LIVE' : s === 'SCHEDULED' ? 'Запланировано' : 'Завершено'
    },
    statusClass(s) {
      return `status-${s.toLowerCase()}`
    },
    displayTime(f) {
      if (f.status === 'IN_PROGRESS') return this.formatTimer(f.timer_seconds || 0)
      if (f.status === 'SCHEDULED' && f.scheduled_time) return this.formatScheduledTime(f.scheduled_time)
      if (f.status === 'COMPLETED') return 'Завершено'
      return '—'
    },
    formatTimer(sec) {
      const m = String(Math.floor(sec / 60)).padStart(2, '0')
      const s = String(sec % 60).padStart(2, '0')
      return `${m}:${s}`
    },
    formatScheduledTime(date) {
      return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    },
    viewFightDetail(id) { this.$router.push(`/fights/${id}`) },
    controlFight(id) { this.$router.push(`/referee?fight=${id}`) },
    startFight(id) { console.log('Start:', id) },

    // Дополнительные методы для ручного обновления если нужно
    manualRefresh() {
      this.loadFights()
    },

    // Метод для включения/выключения автообновления
    toggleAutoRefresh(enable) {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }

      if (enable) {
        this.refreshInterval = setInterval(this.loadFights, 10000)
        console.log('Автообновление включено')
      } else {
        console.log('Автообновление выключено')
      }
    }
  }
}
</script>

<style scoped>
</style>