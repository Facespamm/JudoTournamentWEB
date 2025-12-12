const API_BASE_URL = 'http://127.0.0.1:5001';
const API_KEY = 'mobile_app_2024';

/**
 * 1. Получить всех атлетов клуба для турнира
 * Использует эндпоинт: GET /tournaments/club-athletes
 */
export const getClubAthletes = async (clubId, onlyActive = true, includeTournamentInfo = false, tournamentId = null) => {
    try {
        const params = new URLSearchParams({
            club_id: clubId,
            only_active: onlyActive,
            include_tournament_info: includeTournamentInfo
        });

        if (tournamentId) {
            params.append('tournament_id', tournamentId);
        }

        const response = await fetch(`${API_BASE_URL}/tournaments/club-athletes?${params}`, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            clubId: data.club_id,
            clubName: data.club_name,
            athletesCount: data.athletes_count,
            athletes: data.athletes || []
        };
    } catch (error) {
        console.error('Ошибка при загрузке атлетов клуба:', error);
        return {
            success: false,
            error: error.message,
            athletes: []
        };
    }
};

/**
 * 2. Поиск атлетов по ФИО
 * Использует эндпоинт: GET /tournaments/search-athlete
 * ВАЖНО: если не передать ни одного параметра поиска, вернет ошибку 400
 */
export const searchAthletes = async (lastName = '', firstName = '', middleName = '', clubId = null, isActive = true) => {
    try {
        // Проверяем, что хотя бы один параметр поиска передан
        if (!lastName && !firstName && !middleName && !clubId) {
            return {
                success: false,
                error: 'Укажите хотя бы один параметр поиска',
                athletes: []
            };
        }

        const params = new URLSearchParams({
            is_active: isActive
        });

        if (lastName) params.append('last_name', lastName);
        if (firstName) params.append('first_name', firstName);
        if (middleName) params.append('middle_name', middleName);
        if (clubId) params.append('club_id', clubId);

        const response = await fetch(`${API_BASE_URL}/tournaments/search-athlete?${params}`, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            athletes: data || []
        };
    } catch (error) {
        console.error('Ошибка при поиске атлетов по ФИО:', error);
        return {
            success: false,
            error: error.message,
            athletes: []
        };
    }
};

/**
 * 3. Получить всех атлетов
 * Использует эндпоинт: GET /athletes/
 */
export const getAllAthletes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/athletes/`, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            athletes: data.athletes || data || []
        };
    } catch (error) {
        console.error('Ошибка при загрузке всех атлетов:', error);
        return {
            success: false,
            error: error.message,
            athletes: []
        };
    }
};

/**
 * 4. Получить все турниры
 * Использует эндпоинт: GET /tournaments/
 */
export const fetchTournaments = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            data: result
        };

    } catch (error) {
        console.error('Ошибка при загрузке турниров:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
};

/**
 * 5. Получить детали турнира
 * Использует эндпоинт: GET /tournaments/{id}
 */
export const getTournamentDetails = async (tournamentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: true,
            tournament: data
        };
    } catch (error) {
        console.error('Ошибка при загрузке деталей турнира:', error);
        return {
            success: false,
            error: error.message,
            tournament: null
        };
    }
};

/**
 * 6. Добавить клуб на турнир
 * Использует эндпоинт: POST /tournaments/{id}/add-club?club_id={club_id}
 */
export const addClubToTournament = async (tournamentId, clubId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/add-club?club_id=${clubId}`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: data.success === true,
            message: data.message || 'Клуб добавлен'
        };
    } catch (error) {
        console.error('Ошибка при регистрации клуба:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * 7. Добавить атлетов на турнир
 * Использует эндпоинт: POST /tournaments/{id}/add-athletes
 */
export const addAthletesToTournament = async (tournamentId, athleteIds) => {
    try {
        const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/add-athletes`, {
            method: 'POST',
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                athlete_ids: athleteIds
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            success: data.success === true,
            message: data.message || 'Атлеты добавлены'
        };
    } catch (error) {
        console.error('Ошибка при регистрации атлетов:', error);
        return {
            success: false,
            error: error.message
        };
    }
};