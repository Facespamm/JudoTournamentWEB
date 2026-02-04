

export const fetchLogin = async (data) => {
    try {
        const response = await fetch(`/api/auth/login`, {
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

