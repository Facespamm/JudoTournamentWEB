// @/components/View/Tournaments/fetchTournamentDetail.js
export const fetchTournamentDetail = async (id) => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/tournaments/${id}`);

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

export const fetchCategoriesById = async (categoryId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/tournaments/${categoryId}/categories`, {
            headers: {
                'X-API-Key': 'mobile_app_2024'
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка при загрузке категорий');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        return { success: false, error: error.message };
    }
};


