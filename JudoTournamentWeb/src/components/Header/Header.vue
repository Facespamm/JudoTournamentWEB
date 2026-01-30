<template>
  <header class="simple-header">
    <!-- Кнопка выхода с иконкой -->
    <button class="header-btn" @click="handleLogout">
      <img :src="UserIcon" alt="Выход" class="btn-icon" />
    </button>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import UserIcon from '@/components/icons/Open.png' // ← ПОПРАВЬ ПУТЬ НА СВОЙ

const router = useRouter()

const handleLogout = () => {
  // Подтверждение выхода
  const confirmLogout = window.confirm('Вы действительно хотите выйти?')

  if (confirmLogout) {
    // Удаляем JWT-токен из кук
    document.cookie = 'jwt_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
    // Дополнительно можно очистить другие куки, если нужно (например, другие токены)

    // Переход на страницу логина
    router.push({ name: 'login' })
  }
}
</script>

<style scoped>
/* === ХЕДЕР — ПОЛОСКА === */
.simple-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: #F5F5F5; /* --sidebar-bg */
  border-bottom: 1px solid #bdbdbd; /* --sidebar-border */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); /* --shadow */
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 1.5rem;
  box-sizing: border-box;
}

/* === КНОПКА С ИКОНКОЙ === */
.header-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.header-btn:hover {
  background: #d5d5d5; /* --hover-bg */
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-btn:active {
  transform: translateY(0);
}

/* === ИКОНКА === */
.btn-icon {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  transition: filter 0.3s ease;
}

.header-btn:hover .btn-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* === ОТСТУП ПОД ХЕДЕР === */
:global(.page-content) {
  margin-top: 70px;
}
</style>