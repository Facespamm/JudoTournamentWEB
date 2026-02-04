// src/services/tournamentService.js

export const createTournament = async (data) => {
    try {
        const response = await fetch(`/api/tournaments/`, {
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


export const createCategory = async (categoryData) => {
    try {
        const response = await fetch(`/api/categories/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(categoryData)
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

export const fetchCategories = async () => {
    try {
        const response = await fetch(`/api/categories/?tournament_id`, {
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

