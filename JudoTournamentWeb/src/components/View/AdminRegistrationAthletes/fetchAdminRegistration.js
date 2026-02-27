export const adminRegistration = async (data) => {
    try {
        const response = await fetch(`/api/athletes//private/create-athlete-admin
`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при создании');
        }

        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('Ошибка при создании:', error);
        return { success: false, error: error.message };
    }
};

// fetchAdminRegistration.js

export const getRanks = async () => {
    try {
        const response = await fetch(`/api/dans/`, {
            headers: {
                'X-API-Key': 'mobile_app_2024',     // ← заменили API_KEY на строковый литерал
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            athletes: data.athletes || data.dans || data || []   // добавлена защита на случай разных структур
        };
    } catch (error) {
        console.error('Ошибка при загрузке всех данов:', error);
        return {
            success: false,
            error: error.message,
            athletes: []
        };
    }
};