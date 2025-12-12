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
                v-model="form.login"
                type="text"
                placeholder="Введите логин"
                required
                autocomplete="username"
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
            />
          </div>

          <button type="submit" class="btn-primary">
            Войти
          </button>
        </form>

        <div class="auth-footer">
          <p>Нет аккаунта?</p>
          <button @click="RedirectToRegistration" class="btn-link">
            Зарегистрироваться
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import TrophyIcon from '@/components/icons/CupIconAdmin.png'
import BackgroundImage from '@/assets/Background.png'
import "./Login.css"

const router = useRouter()

const form = ref({
  login: '',
  password: ''
})

const handleLogin = () => {
  if (form.value.login && form.value.password) {
    console.log('Логин:', form.value)
    // router.push('/home')
  }
}

const RedirectToRegistration = () => {
  router.push({ name: 'registration' })
}
</script>

<style scoped>
</style>