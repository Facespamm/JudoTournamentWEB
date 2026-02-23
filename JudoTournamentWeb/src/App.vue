<template>
  <div id="app">
    <!-- Сайдбар и хедер скрыты на страницах без сайдбара -->
    <Header v-if="route.meta.hideSidebar !== true" />
    <Sidebar v-if="route.meta.hideSidebar !== true" />

    <!-- Основной контент -->
    <div
        class="main-content"
        :class="{
        'with-sidebar': route.meta.hideSidebar !== true,
        'centered-layout': route.meta.align === 'center'
      }"
    >
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import Sidebar from "@/components/Sidebar/Sidebar.vue"
import Header from "@/components/Header/Header.vue"

const route = useRoute()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#app {
  display: flex;
  min-height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  max-width: 100%;
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 0;
  margin: 0;
  min-height: 100vh;
}

/* Когда есть сайдбар — сдвигаем вправо */
.main-content.with-sidebar {
  margin-left: 220px;
}

/* === ЦЕНТРИРОВАНИЕ КОНТЕНТА (когда align: 'center') === */
.main-content.centered-layout {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 16px;
  min-height: 100vh;
}

/* Ограничиваем ширину контента — выглядит красиво и не растягивается на весь экран */
.main-content.centered-layout :deep(*) {
  max-width: 1100px;   /* можешь поменять на 1000px / 1200px / 1280px */
  width: 100%;
}

/* Мобильная адаптация */
@media (max-width: 768px) {
  .main-content.with-sidebar {
    margin-left: 0;
  }
  .main-content.centered-layout {
    padding: 16px 12px;
  }
}
</style>