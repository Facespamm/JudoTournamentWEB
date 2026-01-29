export const UpdateClubs = async (clubsId, userData) => {
    try {
        const response = await fetch(`http://localhost:5001/clubs/${clubsId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',

            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || `HTTP ошибка ${response.status}`);
        }

        const data = await response.json();
        return data; // Ожидается { success: true, data: { ...обновлённый пользователь... } }
    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        return {
            success: false,
            error: error.message || 'Не удалось обновить данные пользователя'
        };
    }
};

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


export const DeleteClub = async (clubId) => {
    try {
        const response = await fetch(`http://localhost:5001/clubs/${clubId}`, {
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
