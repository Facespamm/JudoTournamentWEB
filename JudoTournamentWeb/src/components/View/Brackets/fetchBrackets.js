
export const createBracket = async (bracketData, tournament_id, categoryId, tatami_number = null) => {
    try {
        // Формируем URL динамически — добавляем tatami_number только если он указан и валиден
        let url = `/api/brackets/${tournament_id}?category=${categoryId}`

        if (tatami_number !== null && tatami_number !== undefined && Number.isInteger(tatami_number) && tatami_number >= 1) {
            url += `&tatami_number=${tatami_number}`
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(bracketData)
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            throw new Error(err.message || 'Ошибка при создании сетки')
        }

        return { success: true, data: await response.json() }
    } catch (error) {
        console.error('Ошибка при создании сетки:', error)
        return { success: false, error: error.message }
    }
};

export const fetchBrackets = async (tournament_id, category_id) => {
    const url = `/api/brackets/${tournament_id}/fights?category=${category_id}`;
    try {
        const response = await fetch(url, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        // Возвращаем данные как есть от API
        // API возвращает структуру: { fights: [...], success: true, tournament_name: "..." }
        return data;
    } catch (error) {
        console.error('Ошибка загрузки сеток:', error);
        return { success: false, error: error.message };
    }
};
export const fetchBracketDetail = async (id) => {
    try {
        const response = await fetch(`/api/brackets/${id}/fights
`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // ДЛЯ ОТЛАДКИ - выведем что приходит с сервера
        console.log('Tournament detail response:', data);

        return data;
    } catch (error) {
        console.error('Error fetching tournament details:', error);
        throw error;
    }
};

export const createFight = async (bracketFightData, id) => {
    try {
        const response = await fetch(`/api/brackets/${id}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(bracketFightData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при создании боя');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при создании боев:', error);
        return { success: false, error: error.message };
    }
};


export const fetchGetCategoryByTournament = async (id) => {
    try {
        const response = await fetch(`/api/tournaments/${id}/categories
`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // ДЛЯ ОТЛАДКИ - выведем что приходит с сервера
        console.log('Tournament detail response:', data);

        return data;
    } catch (error) {
        console.error('Error fetching tournament details:', error);
        throw error;
    }
};
