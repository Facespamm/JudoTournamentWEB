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
    console.log('Валидация, валидация не пройдена')
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

    const token = response.token || (response.data && response.data.token)
    const role = response.role || (response.data && response.data.role)
    const message = response.message || (response.data && response.data.message)

    if (response.success && token) {
      console.log('УСПЕШНАЯ РЕГИСТРАЦИЯ - сохраняем токен')

      if (authStore) {
        authStore.setToken(token)
        authStore.setUser({
          login: form.value.login,
          name: form.value.name,
          email: form.value.email,
          role: role || 'test'
        })
      } else {
        cookies.set('jwt_token', token, '7d')
        localStorage.setItem('user_data', JSON.stringify({
          login: form.value.login,
          name: form.value.name,
          email: form.value.email,
          role: role || 'test'
        }))
      }

      showNotification(message || 'Регистрация успешна! Перенаправляем...', 'success')

      // Полная перезагрузка страницы — чтобы модалка точно появилась на /roles
      setTimeout(() => {
        console.log('ПЕРЕЗАГРУЗКА НА /roles')
        window.location.href = '/roles'
      }, 1200)

    } else {
      const errorMessage = response.error || message || 'Ошибка регистрации'
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
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
}

/* === ФОН === */
.auth-background {
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;     /* ← центрируем вместо justify-content: flex-start */
  padding: 2rem 1rem;
  overflow: hidden;
}

/* === КОНТЕЙНЕР === */
.auth-container {
  width: 100%;
  max-width: 760px;             /* расширенная ширина */
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
}

/* === КАРТОЧКА === */
.auth-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(200, 155, 60, 0.2);
  padding: 2.2rem 2.4rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.5s ease-out;
  width: 100%;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c89b3c transparent;
}

.auth-card::-webkit-scrollbar {
  width: 6px;
}

.auth-card::-webkit-scrollbar-track {
  background: transparent;
}

.auth-card::-webkit-scrollbar-thumb {
  background: #c89b3c;
  border-radius: 10px;
}

.auth-card::-webkit-scrollbar-thumb:hover {
  background: #b8872c;
}

/* Модификатор для широкой карточки (если понадобится в будущем) */
.wide-card {
  /* сейчас совпадает с .auth-card, оставлено для совместимости */
}

/* === ЗАГОЛОВОК === */
.header {
  margin-bottom: 1.6rem;
  text-align: center;
}

.title {
  font-size: 2.2rem;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin: 0 0 0.6rem 0;
}

.subtitle {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}

.judo {
  color: #1a1a1a;
}

.stream {
  color: #c89b3c;
}

.header-icon {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* === ФОРМА (теперь grid) === */
.auth-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem 1.8rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.full-width {
  grid-column: 1 / -1;
}

.form-title {
  color: #333;
  font-weight: 600;
  font-size: 0.9rem;
}

.input-group input {
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 0.98rem;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  background: #fafafa;
  color: #333;
  transition: all 0.3s ease;
}

.input-group input::placeholder {
  color: #999;
}

.input-group input:focus {
  outline: none;
  border-color: #c89b3c;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(200, 155, 60, 0.12);
  transform: translateY(-1px);
}

/* === КНОПКА === */
.btn-primary {
  grid-column: 1 / -1;          /* кнопка на всю ширину */
  margin-top: 0.8rem;
  padding: 1rem;
  font-size: 1.08rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #c89b3c, #e0b456);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(200, 155, 60, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(200, 155, 60, 0.42);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* === ФУТЕР === */
.auth-footer {
  grid-column: 1 / -1;
  text-align: center;
  margin-top: 1.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid #e8e8e8;
  color: #555;
  font-size: 0.92rem;
}

.auth-footer p {
  margin: 0 0 0.5rem;
}

.btn-link {
  background: none;
  border: none;
  color: #c89b3c;
  font-weight: 700;
  font-size: 0.97rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
}

.btn-link:hover {
  color: #b8872c;
  background: rgba(200, 155, 60, 0.08);
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* === АНИМАЦИЯ === */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* === АДАПТИВ === */
@media (max-width: 820px) {
  .auth-form {
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }

  .auth-container {
    max-width: 100%;
    padding: 0 1.2rem;
  }

  .auth-card {
    padding: 1.9rem 1.7rem;
  }
}

@media (max-width: 480px) {
  .auth-background {
    padding: 1rem;
  }

  .auth-card {
    padding: 1.6rem 1.4rem;
  }

  .title {
    font-size: 1.9rem;
  }

  .subtitle {
    font-size: 1.25rem;
  }

  .header-icon {
    width: 32px;
    height: 32px;
  }

  .btn-primary {
    padding: 0.95rem;
    font-size: 1.02rem;
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