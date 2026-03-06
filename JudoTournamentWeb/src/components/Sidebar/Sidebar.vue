<template>
  <div class="top-bar"></div>

  <div class="sidebar">
    <div class="sidebar-header">
      <h1>
        <img :src="TrophyIcon" class="logo-icon" alt="Trophy" />
        <span class="header-text">Judo-Stream</span>
      </h1>
    </div>

    <nav class="nav-buttons">
      <button type="button" name="main_page" @click="RedirectToHome" title="Главная">
        <img :src="HomeIcon" class="nav-icon" alt="Главная" />
        <span class="nav-text">Главная</span>
      </button>
      <button type="button" name="athletes_page" @click="RedirectToAthletes" title="Дзюдоисты">
        <img :src="UserIcon" class="nav-icon" alt="Дзюдоисты" />
        <span class="nav-text">Дзюдоисты</span>
      </button>
      <button type="button" name="tournament_page" @click="RedirectToTournament" title="Турниры">
        <img :src="TrophyIcon" class="nav-icon" alt="Турниры" />
        <span class="nav-text">Турниры</span>
      </button>
      <button type="button" name="clubs_page" @click="RedirectToClubs" title="Клубы">
        <img :src="ClubIcon" class="nav-icon" alt="Клубы" />
        <span class="nav-text">Клубы</span>
      </button>
      <button v-if="canSee([ADMIN, REFEREE])" name="referee_page" @click="RedirectToReferee" title="Рефери">
        <img :src="RefereeIcon" class="nav-icon" alt="Рефери" />
        <span class="nav-text">Рефери</span>
      </button>
      <button v-if="canSee([ADMIN])" type="button" name="admin_page" @click="RedirectToAdmin" title="Админ">
        <img :src="AdminIcon" class="nav-icon" alt="Админ" />
        <span class="nav-text">Админ</span>
      </button>
    </nav>

    <div class="footer-nav">
      <button
          type="button"
          name="language_submit"
          @click="toggleLanguageMenu"
          class="language-button"
          :title="currentLanguage"
      >
        <img :src="GlobeIcon" class="nav-icon" alt="Language" />
        <span class="lang-text">{{ currentLanguage }}</span>
      </button>

      <transition name="slide-right">
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
import { useAuth, USER_ROLES } from '@/composables/useAuth'
import HomeIcon from '@/components/icons/Home.png'
import UserIcon from '@/components/icons/Athletes.png'
import TrophyIcon from '@/components/icons/CupIconAdmin.png'
import GlobeIcon from '@/components/icons/LanguageSwitch.png'
import RefereeIcon from '@/components/icons/Referee.png'
import AdminIcon from '@/components/icons/Admin.png'
import ClubIcon from '@/components/icons/ClubIcon.png'

import {
  RedirectToHome,
  RedirectToAthletes,
  RedirectToTournament,
  RedirectToReferee,
  RedirectToAdmin,
  RedirectToClubs,
} from "@/router/redirect.js"

const { canSee } = useAuth()
const { ADMIN, REFEREE, ATHLETE, VIEWER } = USER_ROLES

const languages = [
  { code: 'ru', name: 'Русский', flag: 'RU' },
  { code: 'kk', name: 'Қазақша', flag: 'KZ' },
  { code: 'en', name: 'English', flag: 'GB' }
]

const currentLanguage = ref('Русский')
const isLanguageMenuOpen = ref(false)

const toggleLanguageMenu = () => { isLanguageMenuOpen.value = !isLanguageMenuOpen.value }
const selectLanguage = (lang) => { currentLanguage.value = lang.name; isLanguageMenuOpen.value = false }
</script>

<style scoped>
.top-bar {
  position: fixed;
  top: 0; left: 0;
  height: 4px;
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  z-index: 1002;
}

.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  z-index: 1001;
  box-shadow: var(--shadow);
  overflow: hidden;

  /* Ключевое: flex колонка, пространство распределяется равномерно */
  display: flex;
  flex-direction: column;
  align-items: center;

  /* Отступы сверху и снизу — небольшие */
  padding: 1.2rem 0.8rem 1rem;
  box-sizing: border-box;
}

/* === ХЕДЕР === */
.sidebar-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* Небольшой фиксированный отступ снизу от лого */
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--sidebar-border);
  width: 100%;
  margin-bottom: 0;
}

.sidebar-header h1 {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.logo-icon {
  width: clamp(28px, 3.5vh, 42px);
  height: clamp(28px, 3.5vh, 42px);
  object-fit: contain;
}

.header-text {
  font-size: clamp(0.6rem, 1vh, 0.82rem);
  font-weight: 700;
  color: var(--text-color);
  white-space: nowrap;
}

/* === НАВИГАЦИЯ — занимает всё свободное пространство между хедером и футером === */
.nav-buttons {
  flex: 1;                      /* растягивается на всё доступное место */
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* space-evenly равномерно раскидывает кнопки по всей высоте */
  justify-content: space-evenly;
  padding: 0.4rem 0;
}

.nav-buttons button,
.language-button {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  border-radius: 12px;
  padding: clamp(0.4rem, 0.9vh, 0.8rem) 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.2rem, 0.5vh, 0.45rem);
  transition: all 0.25s ease;
  width: 100%;
}

.nav-buttons button:hover,
.language-button:hover {
  background-color: var(--hover-bg);
  color: var(--active-color);
  transform: scale(1.06);
}

.nav-buttons button:active,
.language-button:active {
  background-color: #fff8e1;
  color: var(--active-color);
}

.nav-icon {
  width: clamp(22px, 3vh, 36px);
  height: clamp(22px, 3vh, 36px);
  object-fit: contain;
}

.nav-text,
.lang-text {
  font-size: clamp(0.58rem, 0.95vh, 0.76rem);
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}

/* === ФУТЕР: ЯЗЫК === */
.footer-nav {
  flex-shrink: 0;
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 0.6rem;
  border-top: 1px solid var(--sidebar-border);
}

/* Меню языков */
.language-menu {
  position: absolute;
  left: 100%;
  margin-left: 12px;
  bottom: 0;
  width: 210px;
  background: white;
  border-radius: 12px;
  box-shadow: 4px 4px 20px rgba(0,0,0,0.15);
  overflow: hidden;
  border: 1px solid var(--sidebar-border);
  z-index: 1003;
}

.language-option {
  width: 100%;
  padding: 0.85rem 1.2rem;
  background: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-color);
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.language-option:last-child { border-bottom: none; }
.language-option:hover { background-color: var(--hover-bg); color: var(--active-color); }
.language-option.active { background-color: #fff8e1; color: var(--active-color); font-weight: 600; }

.lang-flag { font-size: 1.4rem; }
.lang-name { flex: 1; font-size: 0.95rem; }

/* Анимация меню */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from { opacity: 0; transform: translateX(-20px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(-20px); }

/* =============================================
   АДАПТИВНОСТЬ ПО ВЫСОТЕ
   На маленькой высоте текст скрывается
============================================= */
@media (max-height: 700px) {
  .header-text { display: none; }
  .nav-text, .lang-text { display: none; }
  .sidebar { padding: 0.8rem 0.6rem 0.8rem; }
  .sidebar-header { padding-bottom: 0.5rem; }
  .footer-nav { padding-top: 0.4rem; }
}
</style>