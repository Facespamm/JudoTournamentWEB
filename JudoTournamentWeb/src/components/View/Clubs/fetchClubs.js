// clubsApi.js

// Создание клуба
export const createClub = async (clubData) => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/clubs/
`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clubData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при создании клуба:', error);
        throw error;
    }
};

// Обновление клуба
export const updateClub = async (clubId, clubData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clubData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при обновлении клуба:', error);
        throw error;
    }
};

// Получение списка клубов
export const getClubs = async () => {
    try {
        const response = await fetch(`http://127.0.0.1:5001/clubs/
`, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.clubs || data || [];
    } catch (error) {
        console.error('Ошибка при загрузке клубов:', error);
        throw error;
    }
};

// Удаление клуба
export const deleteClub = async (clubId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Ошибка при удалении клуба:', error);
        throw error;
    }
};

// Получение клуба по ID
export const getClubById = async (clubId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/clubs/${clubId}`, {
            headers: { 'X-API-Key': 'mobile_app_2024' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке клуба:', error);
        throw error;
    }
};