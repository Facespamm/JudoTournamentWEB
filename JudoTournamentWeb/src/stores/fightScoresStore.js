
import { reactive } from 'vue'

// Структура: { [fightId]: { white: { ippon, wazaari, yuko, shido }, blue: { ... }, status } }
export const fightScores = reactive({})

// Инициализировать бой если ещё не существует
export function initFight(fightId) {
    if (!fightScores[fightId]) {
        fightScores[fightId] = {
            white: { ippon: 0, wazaari: 0, yuko: 0, shido: 0 },
            blue:  { ippon: 0, wazaari: 0, yuko: 0, shido: 0 },
            status: 'SCHEDULED'
        }
    }
}

// Обновить очко
export function updateScore(fightId, color, field, value) {
    initFight(fightId)
    fightScores[fightId][color.toLowerCase()][field] = value
}

// Обновить статус боя
export function updateFightStatus(fightId, status) {
    initFight(fightId)
    fightScores[fightId].status = status
}

// Получить очки боя
export function getFightScores(fightId) {
    initFight(fightId)
    return fightScores[fightId]
}