<template>
  <!-- КНОПКА СОЗДАНИЯ СЕТКИ -->
  <section class="bracket-setup" v-if="!bracketGenerated">
    <button class="create-bracket-btn" @click="showModal = true">Создать турнирную сетку</button>
  </section>

  <!-- МОДАЛЬНОЕ ОКНО -->
  <div class="modal-overlay" v-if="showModal" @click="showModal = false">
    <div class="modal-content" @click.stop>
      <button class="modal-close" @click="showModal = false">×</button>
      <h2>Настройка турнирной сетки</h2>
      <div class="setup-group">
        <label>Количество участников:</label>
        <select v-model.number="participantsCount">
          <option :value="4">4 участника</option>
          <option :value="8">8 участников</option>
          <option :value="16">16 участников</option>
        </select>
      </div>
      <div class="setup-group">
        <label>Участники (введите имена через Enter):</label>
        <textarea
            v-model="participantsInput"
            placeholder="Введите имена участников (по одному на строку)"
            rows="8"
        ></textarea>
      </div>
      <button class="action-button" @click="generateBracket">Создать сетку</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'

const emit = defineEmits(['bracket-created'])

const bracketGenerated = ref(false)
const participantsCount = ref(8)
const participantsInput = ref('')
const showModal = ref(false)

const generateBracket = () => {
  const names = participantsInput.value
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0)

  if (names.length < 2) {
    alert('Введите минимум 2 участника')
    return
  }

  while (names.length < participantsCount.value) {
    names.push(`Участник ${names.length + 1}`)
  }

  const teamsList = names.slice(0, participantsCount.value)

  const rounds = []
  let currentTeams = [...teamsList]

  while (currentTeams.length > 1) {
    const matches = []
    const roundName = currentTeams.length === 2 ? 'Финал' :
        currentTeams.length === 4 ? 'Полуфинал' :
            `1/${currentTeams.length / 2} финала`

    for (let i = 0; i < currentTeams.length; i += 2) {
      matches.push({
        team1: currentTeams[i],
        team2: currentTeams[i + 1] || 'TBD',
        score1: 0,
        score2: 0,
        winner: null,
        status: 'SCHEDULED'
      })
    }

    rounds.push({ name: roundName, matches })
    currentTeams = new Array(Math.ceil(currentTeams.length / 2)).fill('TBD')
  }

  emit('bracket-created', rounds)
  bracketGenerated.value = true
  showModal.value = false
}

// Метод для сброса сетки (если нужен извне)
const resetBracket = () => {
  bracketGenerated.value = false
  participantsInput.value = ''
  showModal.value = true
}

// Экспортируем методы для использования в родительском компоненте
defineExpose({
  resetBracket
})
</script>

<style scoped>
</style>