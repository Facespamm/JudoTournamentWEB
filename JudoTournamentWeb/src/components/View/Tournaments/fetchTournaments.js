import Cookies from "js-cookie";

const API_KEY = 'mobile_app_2024';


export const fetchTournaments = async () => {
    try {
        const response = await fetch(`/api/tournaments/`, {
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


export const fetchTournamentsByCategory = async (categoryId) => {
    try {
        const response = await fetch(`/api/tournaments/by-category/${categoryId}`, {
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

export const fetchAssignToTournament = async (tournamentId) => {
    try {
        const token = Cookies.get('jwt_token')

        const response = await fetch(`/api/user/assign_to_tournament/${tournamentId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
                'Authorization': `Bearer ${token}`
            },
            method: 'POST',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            data: result.message
        };

    } catch (error) {
        console.error('Ошибка при загрузке турниров:', error);
        return {
            success: false,
            error: error.message || 'Произошла неизвестная ошибка'
        };
    }
}

export async function checkRegistration(tournamentId) {
    const token = Cookies.get('jwt_token')
    const response = await fetch(`/api/user/is_registered/${tournamentId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        method: 'GET',
    });
    const data = await response.json();
    return data.is_registered;
}

export async function fetchunassignTournament(tournamentId) {
    const token = Cookies.get('jwt_token')
    const response = await fetch(`/api/user/unassign_to_tournament/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return {
        success: data.success,
        data: data.message
    };
}