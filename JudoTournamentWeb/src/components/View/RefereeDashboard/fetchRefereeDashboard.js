export const GetRefereeStatistics = async () => {
    try {
        const response = await fetch('http://localhost:5001/statistics/live-overview')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return data // Возвращаем весь ответ как есть
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error)
        return { success: false, error: error.message || 'Неизвестная ошибка' }
    }
}


export const GetLiveTournamentReferee = async () => {
    try {
        const response = await fetch('http://localhost:5001/statistics/active-tournaments')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return data // Возвращаем весь ответ как есть
    } catch (error) {
        console.error('Ошибка загрузки турниров:', error)
        return { success: false, error: error.message || 'Неизвестная ошибка' }
    }
}