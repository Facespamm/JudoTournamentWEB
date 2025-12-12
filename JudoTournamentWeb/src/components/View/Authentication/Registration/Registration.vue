<template>
  <div class="auth-background" :style="{ backgroundImage: `url(${BackgroundImage})` }">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="title-registration">
            <img :src="TrophyIcon" alt="Trophy" class="header-icon" />
            Регистрация
          </h1>
          <p class="subtitle-registration">
            <span class="judo">Judo</span><span class="stream">-Stream</span>
          </p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="input-group">
            <label class="form-title">Логин</label>
            <input
                type="text"
                v-model="form.login"
                name="auth_login"
                required
                maxlength="50"
                placeholder="judoCoolName"
                :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label class="form-title">Имя пользователя</label>
            <input
                type="text"
                v-model="form.name"
                name="auth_name"
                required
                minlength="3"
                maxlength="50"
                placeholder="Саша"
                :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label class="form-title">Электронная почта</label>
            <input
                type="email"
                v-model="form.email"
                name="auth_email"
                placeholder="example@example.com"
                :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label class="form-title">Телефон</label>
            <input
                type="tel"
                v-model="form.phone"
                maxlength="18"
                placeholder="+7 (999) 999-9999"
                :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label class="form-title">Пароль</label>
            <input
                type="password"
                v-model="form.password"
                name="auth_password"
                required
                maxlength="50"
                :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label class="form-title">Повторить пароль</label>
            <input
                type="password"
                v-model="form.passwordConfirm"
                required
                maxlength="50"
                :disabled="isLoading"
            />
          </div>

          <button
              type="submit"
              class="btn-primary"
              :disabled="isLoading"
          >
            <span v-if="isLoading">Регистрация...</span>
            <span v-else>Зарегистрироваться</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Уже есть аккаунт?</p>
          <button @click="RedirectToLogin" class="btn-link" :disabled="isLoading">
            Войти
          </button>
        </div>
      </div>
    </div>

    <!-- Уведомления -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCookies } from "vue3-cookies"
import TrophyIcon from '@/components/icons/CupIconAdmin.png'
import BackgroundImage from '@/assets/Background.png'
import { createUser } from "@/components/View/Authentication/Registration/fetchRegistration.js"
import { useAuthStore } from '@/components/stores/authStore.js'
import "./Registration.css"

const router = useRouter()
const { cookies } = useCookies()

let authStore
onMounted(() => {
  authStore = useAuthStore()
})

const form = ref({
  login: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: ''
})

const isLoading = ref(false)

const notification = reactive({
  show: false,
  message: '',
  type: 'success'
})

const showNotification = (message, type = 'success') => {
  notification.message = message
  notification.type = type
  notification.show = true

  setTimeout(() => {
    notification.show = false
  }, 5000)
}

const validateForm = () => {
  if (!form.value.login || !form.value.name || !form.value.password) {
    showNotification('Заполните все обязательные поля!', 'error')
    return false
  }

  if (form.value.password !== form.value.passwordConfirm) {
    showNotification('Пароли не совпадают!', 'error')
    return false
  }

  if (form.value.password.length < 6) {
    showNotification('Пароль должен содержать минимум 6 символов!', 'error')
    return false
  }

  return true
}

const handleRegister = async () => {
  console.log('=== НАЧАЛО РЕГИСТРАЦИИ ===')

  if (!validateForm()) {
    console.log('Валидация не пройдена')
    return
  }

  isLoading.value = true

  try {
    const userData = {
      login: form.value.login,
      fullname: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      password: form.value.password,
      role: 'test' // временная роль
    }

    console.log('Отправка данных:', userData)

    const response = await createUser(userData)

    console.log('Ответ от createUser:', response)
    console.log('response.success:', response.success)
    console.log('response.token:', response.token)
    console.log('response.data:', response.data)

    // Проверяем разные возможные структуры ответа
    const token = response.token || (response.data && response.data.token)
    const role = response.role || (response.data && response.data.role)
    const message = response.message || (response.data && response.data.message)

    console.log('Извлеченные данные - token:', token, 'role:', role, 'message:', message)

    if (response.success && token) {
      console.log('УСПЕШНАЯ РЕГИСТРАЦИЯ - сохраняем токен')

      // Сохраняем токен через store
      if (authStore) {
        authStore.setToken(token)
        authStore.setUser({
          login: form.value.login,
          name: form.value.name,
          email: form.value.email,
          role: role || 'test'
        })
      } else {
        // Fallback
        cookies.set('jwt_token', token, '7d')
        localStorage.setItem('user_data', JSON.stringify({
          login: form.value.login,
          name: form.value.name,
          email: form.value.email,
          role: role || 'test'
        }))
      }

      showNotification(message || 'Регистрация успешна! Перенаправляем на выбор роли.')

      console.log('РЕДИРЕКТ НА /roles через 1 секунду')
      setTimeout(() => {
        console.log('ВЫПОЛНЯЕМ РЕДИРЕКТ НА /roles')
        router.push('/roles')
      }, 1000)

    } else {
      console.log('ОШИБКА РЕГИСТРАЦИИ')
      const errorMessage = response.error || message || 'Ошибка регистрации'
      console.log('Текст ошибки:', errorMessage)
      showNotification(errorMessage, 'error')
    }
  } catch (error) {
    console.error('Registration error:', error)
    showNotification('Ошибка при регистрации. Попробуйте еще раз.', 'error')
  } finally {
    isLoading.value = false
    console.log('=== ЗАВЕРШЕНИЕ РЕГИСТРАЦИИ ===')
  }
}

const RedirectToLogin = () => {
  if (!isLoading.value) {
    console.log('Редирект на страницу логина')
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
/* Стили для уведомлений */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1100;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.notification.success {
  background-color: #4caf50;
}

.notification.error {
  background-color: #f44336;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Адаптивность */
@media (max-width: 768px) {
  .notification {
    left: 20px;
    right: 20px;
    max-width: none;
  }
}
</style>