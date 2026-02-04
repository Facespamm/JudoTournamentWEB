
export const fetchAthletes = async () => {
    try {
        const response = await fetch('/api/athletes/')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return { success: true, athletes: data.athletes || [], total: data.total || 0 }
    } catch (error) {
        console.error('Ошибка загрузки спортсменов:', error)
        return { success: false, error: error.message || 'Неизвестная ошибка' }
    }
}

