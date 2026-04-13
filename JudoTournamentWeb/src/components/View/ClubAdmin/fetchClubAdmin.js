export const UpdateClubs = async (clubsId, userData) => {
    try {
        const response = await fetch(`/api/clubs/${clubsId}`, {
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
        const response = await fetch(`/api/clubs/
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
        const response = await fetch(`/api/clubs/${clubId}`, {
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

export const getAthleteForRegistratedClub = async () => {
    try {
        const response = await fetch(`/api/athletes/for_registration_on_club`, {
            headers: { 'X-API-Key': 'mobile_app_2024' },
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.athletes || data || [];
    }  catch (error) {
        console.error('Ошибка при удалении клуба:', error);
        throw error;
    }
}

export const registraitAthleteToClub = async (clubId,athlete_ids) => {
    try {
        const response = await fetch(`/api/clubs/${clubId}/assign-athletes`, {
            method: 'POST',
            body: JSON.stringify({ athlete_ids: athlete_ids }),
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (response.status === 400) {
            let error_data = await response.json();
            return error_data;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        return data.message;
    } catch (error){
        console.error('Ошибка при регистрации :', error);
        throw error;
    }
}

export const unassignAthleteToClub = async (clubId,athlete_ids) => {
    try {
        const response = await fetch(`/api/clubs/${clubId}/unassign-athletes`, {
            method: 'POST',
            body: JSON.stringify({ athlete_ids: athlete_ids }),
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (response.status === 400) {
            let error_data = await response.json();
            return error_data;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
        return data.message;
    } catch (error){
        console.error('Ошибка при регистрации :', error);
        throw error;
    }
}