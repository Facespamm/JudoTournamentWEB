export const fetchAthleteDetail = async (id) => {
    try {
        const response = await fetch(`/api/athletes/${id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching athlete details:', error);
        throw error;
    }
};