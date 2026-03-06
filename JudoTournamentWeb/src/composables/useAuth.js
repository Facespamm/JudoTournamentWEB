import { computed } from 'vue'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

export const USER_ROLES = {
    ADMIN: 'Администратор',
    REFEREE: 'Судья',
    SCOREBOARD: 'Табло',
    VIEWER: 'Зритель',
    ATHLETE: 'Участник'
}

export const useAuth = () => {
    const userRole = computed(() => {
        try {
            const token = Cookies.get('jwt_token')
            if (!token) return null
            const decoded = jwtDecode(token)
            return decoded.role || null
        } catch {
            return null
        }
    })

    const isAuthenticated = computed(() => {
        try {
            const token = Cookies.get('jwt_token')
            if (!token) return false
            const decoded = jwtDecode(token)
            // проверяем exp из самого токена
            return decoded.exp * 1000 > Date.now()
        } catch {
            return false
        }
    })

    const username = computed(() => {
        try {
            const token = Cookies.get('jwt_token')
            if (!token) return null
            const decoded = jwtDecode(token)
            return decoded.name || decoded.sub || null
        } catch {
            return null
        }
    })

    // canSee(['Администратор', 'Судья'])
    const canSee = (roles) => roles.includes(userRole.value)

    return { userRole, isAuthenticated, username, canSee, USER_ROLES }
}