import { useAuth } from '@/composables/useAuth'

export const setupGuards = (router) => {
    router.beforeEach((to, from, next) => {
        const { isAuthenticated, userRole } = useAuth()

        // Публичные маршруты — пропускаем
        if (to.meta.public) return next()

        // Не авторизован — на логин (но не если уже идём на логин)
        if (!isAuthenticated.value) {
            if (to.path === '/login') return next()
            return next('/login')
        }

        // Проверка ролей
        if (to.meta.roles) {
            const hasRole = to.meta.roles.includes(userRole.value)
            if (!hasRole) {
                // Не редиректим если уже идём на /home
                if (to.path === '/home') return next()
                return next('/home')
            }
        }

        next()
    })
}