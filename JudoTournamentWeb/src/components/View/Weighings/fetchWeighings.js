export const fetchWeighings = async (tournamentId,categoryId) => {
    try {
        const response = await fetch(`/api/weighing/?tournament_id=${tournamentId}&athlete_id=1&category_id=${categoryId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return { success: true, data: result };

    } catch (error) {
        console.error('Ошибка при загрузке взвешиваний:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
}

export const updateWeighing = async (weighingId, data) => {
    try {
        const response = await fetch(`/api/weighing/${weighingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(data), // например: { weight: 73.5, is_valid: true, notes: "ок" }
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Ошибка сервера:', response.status, errorText)
            return { success: false, error: errorText || 'Неизвестная ошибка' }
        }

        const result = await response.json()
        return { success: true, data: result }
    } catch (err) {
        console.error('Ошибка сети при обновлении взвешивания:', err)
        return { success: false, error: err.message || 'Сеть недоступна' }
    }
}

export const toggleWeighingValidation = async (weighingId) => {
    try {
        const response = await fetch(`/api/weighing/${weighingId}/toggle-validation`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            }
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.message || 'Ошибка при изменении статуса валидации',
                status: response.status
            };
        }

        return {
            success: true,
            data: result,
            message: result.message || 'Статус валидации успешно изменен'
        };
    } catch (error) {
        console.error('Ошибка при изменении статуса валидации:', error);
        return {
            success: false,
            error: error.message || 'Ошибка сети при изменении статуса валидации'
        };
    }
};