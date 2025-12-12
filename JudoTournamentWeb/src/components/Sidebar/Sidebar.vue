<template>
  <!-- Верхняя полоса -->
  <div class="top-bar"></div>

  <!-- Сайдбар — всегда раскрыт -->
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>
        <img :src="TrophyIcon" class="logo-icon" alt="Trophy" /> Judo-Stream
      </h1>
    </div>

    <nav class="nav-buttons">
      <button type="button" name="main_page" @click="RedirectToHome">
        <img :src="HomeIcon" class="nav-icon" alt="Home" /> Главная
      </button>
      <button type="button" name="athletes_page" @click="RedirectToAthletes">
        <img :src="UserIcon" class="nav-icon" alt="Athletes" /> Дзюдоисты
      </button>
      <button type="button" name="tournament_page" @click="RedirectToTournament">
        <img :src="TrophyIcon" class="nav-icon" alt="Trophy" /> Турниры
      </button>

      <!-- НОВАЯ КНОПКА: Клубы -->
      <button type="button" name="clubs_page" @click="RedirectToClubs">
        <img :src="ClubIcon" class="nav-icon" alt="Clubs" /> Клубы
      </button>

      <!-- Остальные кнопки -->
      <button type="button" name="referee_page" @click="RedirectToReferee">
        <img :src="RefereeIcon" class="nav-icon" alt="Referee" /> Рефери
      </button>
      <button type="button" name="admin_page" @click="RedirectToAdmin">
        <img :src="AdminIcon" class="nav-icon" alt="Admin" /> Админ
      </button>
    </nav>

    <!-- Язык внизу с выпадающим меню -->
    <div class="footer-nav">
      <button type="button" name="language_submit" @click="toggleLanguageMenu" class="language-button">
        <img :src="GlobeIcon" class="nav-icon" alt="Language" />
        {{ currentLanguage }}
      </button>

      <!-- Выпадающее меню языков -->
      <transition name="slide-up">
        <div v-if="isLanguageMenuOpen" class="language-menu">
          <button
              v-for="lang in languages"
              :key="lang.code"
              @click="selectLanguage(lang)"
              :class="{ active: currentLanguage === lang.name }"
              class="language-option"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.name }}</span>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HomeIcon from '@/components/icons/Home.png'
import UserIcon from '@/components/icons/Athletes.png'
import TrophyIcon from '@/components/icons/CupIconAdmin.png'
import GlobeIcon from '@/components/icons/LanguageSwitch.png'
import RefereeIcon from '@/components/icons/Referee.png'
import AdminIcon from '@/components/icons/Admin.png'
import ClubIcon from '@/components/icons/ClubIcon.png'  // Убедитесь, что иконка существует!

import {
  RedirectToHome,
  RedirectToAthletes,
  RedirectToTournament,
  RedirectToReferee,
  RedirectToAdmin,
  RedirectToClubs,  // ← Добавьте эту функцию в redirect.js
} from "@/router/redirect.js"

// Языки
const languages = [
  { code: 'ru', name: 'Русский', flag: 'RU' },
  { code: 'kk', name: 'Қазақша', flag: 'KZ' },
  { code: 'en', name: 'English', flag: 'GB' }
]

const currentLanguage = ref('Русский')
const isLanguageMenuOpen = ref(false)

const toggleLanguageMenu = () => {
  isLanguageMenuOpen.value = !isLanguageMenuOpen.value
}

const selectLanguage = (lang) => {
  currentLanguage.value = lang.name
  isLanguageMenuOpen.value = false
  console.log('Выбран язык:', lang.code)
}
</script>

<!-- Стили остаются без изменений (полностью совместимы) -->
<style scoped>
/* === ПЕРЕМЕННЫЕ === */
:root {
  --sidebar-bg: #fff9c4;
  --sidebar-border: #e0e0e0;
  --text-color: #2c3e50;
  --hover-bg: #fff59d;
  --active-color: #f57c00;
  --shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  --sidebar-width: 260px;
}

/* === ВЕРХНЯЯ ПОЛОСА === */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  z-index: 1002;
}

/* === САЙДБАР === */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  padding: 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  z-index: 1001;
  box-shadow: var(--shadow);
}

.sidebar-header {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  padding-top: 0.5rem;
}

.sidebar-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.nav-buttons button,
.language-button {
  background: none;
  border: none;
  color: var(--text-color);
  text-align: left;
  padding: 1rem 1.2rem;
  cursor: pointer;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.25s ease;
  width: 100%;
}

.nav-buttons button:hover,
.language-button:hover {
  background-color: var(--hover-bg);
  color: var(--active-color);
  transform: translateX(4px);
}

.nav-buttons button:active,
.nav-buttons button.active,
.language-button:active {
  background-color: #fff8e1;
  color: var(--active-color);
  font-weight: 600;
}

.nav-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
  flex-shrink: 0;
}

.footer-nav {
  margin-top: auto;
  margin-bottom: 0.5rem;
  position: relative;
}

.language-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid var(--sidebar-border);
}

.language-option {
  width: 100%;
  padding: 0.9rem 1.2rem;
  background: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.language-option:last-child { border-bottom: none; }
.language-option:hover { background-color: var(--hover-bg); color: var(--active-color); }
.language-option.active { background-color: #fff8e1; color: var(--active-color); font-weight: 600; }

.lang-flag { font-size: 1.3rem; line-height: 1; }
.lang-name { flex: 1; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
.slide-up-leave-to { opacity: 0; transform: translateY(10px); }
</style>