export const UpdateReferee = async (refereeId, refereeData) => {
    try {
        const response = await fetch(`/api/referee/${refereeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',

            },
            body: JSON.stringify(refereeData),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || `HTTP ошибка ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при обновлении судьи:', error);
        return {
            success: false,
            error: error.message || 'Не удалось обновить данные судьи'
        };
    }
};

export const CreateReferee = async (refereeData) => {
    try {
        const response = await fetch(`/api/referee
`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(refereeData)
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


export const DeleteReferee = async (refereeId) => {
    try {
        const response = await fetch(`/api/referee/${refereeId}`, {
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

