export const GetCountRolesUsers = async () => {
    try {
        const response = await fetch('http://localhost:5001/statistics/users-by-role')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return data // Возвращаем весь ответ как есть
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error)
        return { success: false, error: error.message || 'Неизвестная ошибка' }
    }
}


export const GetAllUsersInformation = async () => {
    try {
        const response = await fetch('http://localhost:5001/statistics/users')

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        return data // Возвращаем весь ответ как есть
    } catch (error) {
        console.error('Ошибка загрузки турниров:', error)
        return { success: false, error: error.message || 'Неизвестная ошибка' }
    }
}

export const DeleteUser = async (userId) => {
    try {
        const response = await fetch(`http://localhost:5001/statistics/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || `HTTP ошибка ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        return {
            success: false,
            error: error.message || 'Не удалось удалить пользователя'
        };
    }
};

export const UpdateUser = async (userId, userData) => {
    try {
        const response = await fetch(`http://localhost:5001/statistics/users/${userId}`, {
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