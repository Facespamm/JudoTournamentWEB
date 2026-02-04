export const createAthlete = async (athleteData) => {
    try {
        // Подготавливаем данные в нужном формате
        const payload = {
            first_name: athleteData.first_name,
            last_name: athleteData.last_name,
            middle_name: athleteData.middle_name || "",
            birth_date: athleteData.date_of_birth,
            gender: athleteData.gender === 'MALE' ? 'М' : 'Ж',
            club_id: 5, // Заглушка - нужно получить реальный ID клуба
            email: athleteData.email || "",
            phone: athleteData.phone || "",
            license_number: athleteData.license_number || "",
            rank: athleteData.rank || "",
            medical_check: athleteData.medical_check !== undefined ? athleteData.medical_check : true,
            region: athleteData.region || "",
            coach: athleteData.coach || ""
        };

        const response = await fetch('/api/athletes/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return { success: true, data: result };

    } catch (error) {
        console.error('Ошибка при создании спортсмена:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
}

export const fetchAthletes = async () => {
    try {
        const response = await fetch('/api/athletes/', {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'mobile_app_2024'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return { success: true, data: result };

    } catch (error) {
        console.error('Ошибка при загрузке спортсменов:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
}

export const createRecordWeight = async (categoryData) => {
    try {
        const response = await fetch(`/api/weighing/
`, {
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
