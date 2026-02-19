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

