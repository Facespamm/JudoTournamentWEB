
export const fetchDan = async () => {
    try {
        const response = await fetch('/api/dans/')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        return {
            success: true,
            dans: data.dans || [],       // <-- исправлено: dans вместо athletes
            total: data.total || 0
        }
    } catch (error) {
        console.error('Ошибка загрузки данов:', error)  // <-- исправлен текст
        return {
            success: false,
            error: error.message || 'Неизвестная ошибка'
        }
    }
}

export const fetchClubs = async () => {
    try {
        const response = await fetch('/api/clubs/')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        // API возвращает объект вида { "clubs": [...], "success": true, "total": 1 }
        return {
            success: true,
            clubs: data.clubs || [],       // <-- исправлено: clubs вместо athletes
            total: data.total || 0
        }
    } catch (error) {
        console.error('Ошибка загрузки клубов:', error)  // <-- исправлен текст ошибки
        return {
            success: false,
            error: error.message || 'Неизвестная ошибка'
        }
    }
}
export const fetchUserInformation = async (id) => {
    try {
        const response = await fetch(`/api/users/${id}`)

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

export const fetchCreateAthlete = async (data,userId) => {
    try {
        const response = await fetch(`/api/athletes/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при регистрации');
        }

        const result = await response.json();
        return {
            success: true,
            message: result.message,
            token: result.token,
            role: result.role
        };
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

