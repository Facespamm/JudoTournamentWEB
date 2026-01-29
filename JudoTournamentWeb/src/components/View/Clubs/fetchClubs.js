
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

