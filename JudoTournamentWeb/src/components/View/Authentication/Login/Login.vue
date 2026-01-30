<template>
  <div class="auth-background" :style="{ backgroundImage: `url(${BackgroundImage})` }">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="title-login">
            <img :src="TrophyIcon" alt="Trophy" class="header-icon" />
            Вход
          </h1>
          <p class="subtitle-login">
            <span class="judo">Judo</span><span class="stream">-Stream</span>
          </p>
          <p class="welcome-text">Добро пожаловать!</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="input-group">
            <label for="login" class="form-title">Логин</label>
            <input
                id="login"
                v-model="form.username"
                type="text"
                placeholder="ivanov_2010"
                required
                autocomplete="username"
                :disabled="isLoading"
            />
          </div>

          <div class="input-group">
            <label for="password" class="form-title">Пароль</label>
            <input
                id="password"
                v-model="form.password"
                type="password"
                placeholder="Введите пароль"
                required
                autocomplete="current-password"
                :disabled="isLoading"
            />
          </div>

          <button type="submit" class="btn-primary" :disabled="isLoading">
            <span v-if="isLoading">Вход...</span>
            <span v-else>Войти</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Нет аккаунта?</p>
          <button @click="RedirectToRegistration" class="btn-link" :disabled="isLoading">
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>

    <!-- Уведомление об ошибке (опционально) -->
    <div v-if="errorMessage" class="error-notification">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TrophyIcon from '@/components/icons/CupIconAdmin.png'
import BackgroundImage from '@/assets/Background.png'
import { fetchLogin } from "@/components/View/Authentication/Login/Login.js"
import { useAuthStore } from '@/components/stores/authStore.js'  // предполагаем, что у вас есть Pinia store
import "./Login.css"

const router = useRouter()
const authStore = useAuthStore()  // если используете Pinia

const form = ref({
  username: '',
  password: ''
})

const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!form.value.username.trim() || !form.value.password) {
    errorMessage.value = 'Заполните логин и пароль'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload = {
      username: form.value.username.trim(),
      password: form.value.password
    }

    console.log('Отправка на логин:', payload)

    const response = await fetchLogin(payload)

    console.log('Ответ сервера:', response)

    if (response?.success === true && response?.token) {
      const token = response.token
      const user = response.user || {}

      // Сохраняем токен и данные пользователя
      authStore.setToken(token)
      authStore.setUser({
        id: user.id,
        name: user.name?.trim() || '',
        username: user.username,
        role: user.role || 'Зритель'
      })

      // Можно сохранить в localStorage / cookies как fallback
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))

      // Успешный вход — перенаправление на главную страницу
      router.push('/Home')
    } else {
      errorMessage.value = response?.message || 'Неверный логин или пароль'
    }
  } catch (err) {
    console.error('Ошибка авторизации:', err)
    errorMessage.value = err.response?.data?.message || 'Ошибка сервера. Попробуйте позже.'
  } finally {
    isLoading.value = false
  }
}

const RedirectToRegistration = () => {
  if (!isLoading.value) {
    router.push({ name: 'registration' })
  }
}
</script>

<style scoped>
/* Стили для уведомления об ошибке */
.error-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #f44336;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1000;
  max-width: 90%;
  text-align: center;
  font-size: 0.95rem;
}
</style>