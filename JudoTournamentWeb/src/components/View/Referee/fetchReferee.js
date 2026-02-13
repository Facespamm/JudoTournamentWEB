export async function getReferees() {
    try {
        const response = await fetch('/api/referee', {
            method: 'GET'
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        return {
            success: true,
            referees: data.referees || [],
            total: data.count_referees || 0
        }
    } catch (err) {
        console.error('Ошибка загрузки судей:', err)
        return {
            success: false,
            referees: [], // добавьте пустой массив
            total: 0,     // и общее количество
            error: err.message || 'Неизвестная ошибка'
        }
    }
}