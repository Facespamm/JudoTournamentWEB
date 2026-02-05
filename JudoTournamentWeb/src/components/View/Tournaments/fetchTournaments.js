const API_KEY = 'mobile_app_2024';


export const fetchTournaments = async () => {
    try {
        const response = await fetch(`/api/tournaments/`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('Ошибка при загрузке турниров:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
};


export const fetchTournamentsByCategory = async (categoryId) => {
    try {
        const response = await fetch(`/api/tournaments/by-category/${categoryId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('Ошибка при загрузке турниров:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
};
