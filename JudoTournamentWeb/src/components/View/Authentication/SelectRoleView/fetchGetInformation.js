
export const fetchDan = async () => {
    try {
        const response = await fetch('http://127.0.0.1:5001/dans/')

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


export const fetchClubs = async () => {
    try {
        const response = await fetch('http://127.0.0.1:5001/clubs/')

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

export const fetchUserInformation = async (id) => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/users/${id}`)

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

