export const fetchGetScheduledFight = async (tournament_id, category_id) => {
    const url = `/api/brackets/${tournament_id}/fights?category=${category_id}`;
    try {
        const response = await fetch(url, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Ошибка загрузки сеток:', error);
        return { success: false, error: error.message };
    }
};

export const fetchGetDetailFight = async (id) => {
    try {
        const response = await fetch(`/api/fights/${id}`);

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

export const fetchChangeAthletes = async (tournament_id, data) => {
    const url = `/api/fights/change_athletes/`
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(data)
        })
        return await response.json()
    } catch (error) {
        console.error('Ошибка смены атлетов:', error)
        return { success: false, error: error.message }
    }
};

export const fetchChangeTatami = async (fightId, tatamiNumber) => {
    const url = `/api/fights/${fightId}/change_tatami?tamami_number=${tatamiNumber}`
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
        })
        return await response.json()
    } catch (error) {
        console.error('Ошибка смены атлетов:', error)
        return { success: false, error: error.message }
    }
};

export const fetchGetFirstFights = async (tournament_id, category_id) => {
    const url = `/api/brackets/${tournament_id}/first_fights?category=${category_id}`;
    try {
        const response = await fetch(url, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        return data;
    } catch (error) {
        console.error('Ошибка загрузки сеток:', error);
        return { success: false, error: error.message };
    }
};