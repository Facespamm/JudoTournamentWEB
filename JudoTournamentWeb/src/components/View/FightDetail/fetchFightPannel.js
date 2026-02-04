export const startFight = async (data,id) => {
    try {
        const response = await fetch(`/api/fights/${id}/start
`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при создании категории');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при создании категории:', error);
        return { success: false, error: error.message };
    }
};

export const endFight = async (data, fight_id) => {
    try {
        const response = await fetch(`/api/fights/${fight_id}/end-fight`, {
            method: 'PUT',  // Изменено на PUT
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при завершении схватки');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при завершении схватки:', error);
        return { success: false, error: error.message };
    }
};
// ==================== 10 ФУНКЦИЙ ДЛЯ ВАШИХ ЭНДПОИНТОВ ====================

// 1. Получить текущие оценки
export const getScores = async (fightId) => {
    const response = await fetch(`/api/scores/fight/${fightId}/current`, {
        headers: { 'X-API-Key': 'mobile_app_2024' }
    });
    return response.json();
};

// 2. Перейти в золотой скор
export const enterGoldenScore = async (fightId) => {
    const response = await fetch(`/api/scores/fight/${fightId}/golden-score`, {
        method: 'POST',
        headers: { 'X-API-Key': 'mobile_app_2024' }
    });
    return response.json();
};

// 3. Добавить ИППОН
export const addIppon = async (fightId, athleteColor, technique = null) => {
    const body = { athlete_color: athleteColor.toUpperCase() };
    if (technique) body.technique = technique;

    const response = await fetch(`/api/scores/fight/${fightId}/ippon`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'mobile_app_2024'
        },
        body: JSON.stringify(body)
    });
    return response.json();
};

// 4. Начать ОСАЕКОМИ
export const startOsaekomi = async (fightId, athleteColor) => {
    const response = await fetch(`/api/scores/fight/${fightId}/osaekomi/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'mobile_app_2024'
        },
        body: JSON.stringify({
            athlete_color: athleteColor.toUpperCase()
        })
    });
    return response.json();
};

// 5. Остановить ОСАЕКОМИ
export const stopOsaekomi = async (fightId) => {
    const response = await fetch(`/api/scores/fight/${fightId}/osaekomi/stop`, {
        method: 'POST',
        headers: { 'X-API-Key': 'mobile_app_2024' }
    });
    return response.json();
};

// 6. Добавить штраф
export const addPenalty = async (fightId, athleteColor, penaltyType) => {
    const response = await fetch(`/api/scores/fight/${fightId}/penalty`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'mobile_app_2024'
        },
        body: JSON.stringify({
            athlete_color: athleteColor.toUpperCase(),
            penalty_type: penaltyType.toUpperCase()
        })
    });
    return response.json();
};

// 7. Сбросить все оценки
export const resetScores = async (fightId) => {
    const response = await fetch(`/api/scores/fight/${fightId}/reset`, {
        method: 'POST',
        headers: { 'X-API-Key': 'mobile_app_2024' }
    });
    return response.json();
};

// 8. Отменить последнее действие
export const undoAction = async (fightId) => {
    const response = await fetch(`/api/scores/fight/${fightId}/undo`, {
        method: 'POST',
        headers: { 'X-API-Key': 'mobile_app_2024' }
    });
    return response.json();
};

// 9. Добавить ВАЗА-АРИ
export const addWazaari = async (fightId, athleteColor, technique = null) => {
    const body = { athlete_color: athleteColor.toUpperCase() };
    if (technique) body.technique = technique;

    const response = await fetch(`/api/scores/fight/${fightId}/wazaari`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'mobile_app_2024'
        },
        body: JSON.stringify(body)
    });
    return response.json();
};

// 10. Добавить ЮКО
export const addYuko = async (fightId, athleteColor) => {
    const response = await fetch(`/api/scores/fight/${fightId}/yuko`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'mobile_app_2024'
        },
        body: JSON.stringify({
            athlete_color: athleteColor.toUpperCase()
        })
    });
    return response.json();
};

// 11. Сохранить все события боя пачкой (одним запросом)
export const saveEventsBatch = async (fightId, events) => {
    try {
        const response = await fetch(`/api/scores/fight/${fightId}/events/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify({ events })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при сохранении событий');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при сохранении событий:', error);
        return { success: false, error: error.message };
    }
};

// 12. Получить хронологию боя (все события по порядку)
export const getFightTimeline = async (fightId) => {
    try {
        const response = await fetch(`/api/scores/fight/${fightId}/timeline`, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при получении хронологии');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при получении хронологии:', error);
        return { success: false, error: error.message };
    }
};

// 13. Получить сводку матча (сгруппированные данные)
export const getFightSummary = async (fightId) => {
    try {
        const response = await fetch(`/api/scores/fight/${fightId}/summary`, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при получении сводки');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при получении сводки:', error);
        return { success: false, error: error.message };
    }
};