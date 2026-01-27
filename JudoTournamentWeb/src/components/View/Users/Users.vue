<template>
  <div class="admin-users-management">
    <!-- ХЕДЕР СТРАНИЦЫ -->
    <div class="page-header">
      <h1 class="page-title">Управление пользователями</h1>
    </div>

    <!-- ФИЛЬТРЫ -->
    <div class="filters-card">
      <div class="filters-header">
        <h3>Фильтры и поиск</h3>
      </div>
      <div class="filters-body">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Поиск</label>
            <input
                v-model="filters.search"
                type="text"
                class="filter-input"
                placeholder="Имя, логин или email..."
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Роль</label>
            <select v-model="filters.role" class="filter-select">
              <option value="">Все роли</option>
              <option value="ADMIN">Администратор</option>
              <option value="REFEREE">Судья</option>
              <option value="SCOREBOARD">Табло</option>
              <option value="PARTICIPANT">Участник</option>
              <option value="VIEWER">Зритель</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Статус</label>
            <select v-model="filters.status" class="filter-select">
              <option value="">Все статусы</option>
              <option value="true">Активные</option>
              <option value="false">Неактивные</option>
            </select>
          </div>
          <div class="filter-actions">
            <button class="apply-filters-btn" @click="loadUsers">Применить</button>
            <button class="reset-filters-btn" @click="resetFilters">Сбросить</button>
          </div>
        </div>
      </div>
    </div>

    <!-- СТАТИСТИКА -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon admin">A</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.adminCount }}</div>
          <div class="stat-label">Администраторов</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon referee">S</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.refereeCount }}</div>
          <div class="stat-label">Судей</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon scoreboard">T</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.scoreboardCount }}</div>
          <div class="stat-label">Операторов табло</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon participant">P</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.participantCount }}</div>
          <div class="stat-label">Участников</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">U</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalCount }}</div>
          <div class="stat-label">Всего активных</div>
        </div>
      </div>
    </div>

    <!-- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ -->
    <div class="users-table-card">
      <div class="table-header">
        <h3>Список пользователей</h3>
      </div>

      <div class="table-container">
        <div v-if="loading" class="loading-state">
          <p>Загрузка данных...</p>
        </div>

        <table v-else-if="users.length > 0" class="users-table">
          <thead>
          <tr>
            <th class="col-user">Пользователь</th>
            <th class="col-contact">Контакт</th>
            <th class="col-role">Роль</th>
            <th class="col-status">Статус</th>
            <th class="col-actions">Действия</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in users" :key="user.id" class="user-row">
            <td class="user-info">
              <div class="user-avatar">{{ getUserInitials(user) }}</div>
              <div class="user-details">
                <div class="user-name">{{ getFullName(user) }}</div>
                <div class="user-login">@{{ user.username || '—' }}</div>
              </div>
            </td>
            <td class="contact-info">
              <div class="contact-email" v-if="user.email">{{ user.email }}</div>
              <div class="contact-phone" v-if="user.phone">{{ user.phone }}</div>
              <div class="contact-empty" v-else>Контакты не указаны</div>
            </td>
            <td class="role-info">
                <span class="role-badge" :class="getRoleClass(getUserRole(user))">
                  {{ getRoleDisplay(getUserRole(user)) }}
                </span>
              <div class="referee-level" v-if="user.referee_level">
                {{ user.referee_level === 'NATIONAL' ? 'Национальный' : 'Международный' }}
              </div>
            </td>
            <td class="status-info">
                <span class="status-badge" :class="user.is_active ? 'active' : 'inactive'">
                  {{ user.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              <div class="last-login" v-if="user.last_login">
                {{ formatDate(user.last_login) }}
              </div>
            </td>
            <td class="actions-info">
              <div class="action-buttons">
                <button class="btn-edit" @click="editUser(user)" title="Редактировать">
                  Ред.
                </button>
                <button
                    v-if="currentUser.id !== user.id"
                    class="btn-delete"
                    @click="confirmDelete(user)"
                    title="Удалить"
                >
                  Удалить
                </button>
                <button class="btn-reset" @click="resetPassword(user)" title="Сбросить пароль">
                  Сброс
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">
          <div class="empty-icon">Пользователи не найдены</div>
          <h3>Пользователи не найдены</h3>
          <p>Попробуйте изменить параметры фильтрации</p>
          <button class="empty-action-btn" @click="resetFilters">Сбросить фильтры</button>
        </div>
      </div>

      <div v-if="users.length > 0 && !loading" class="pagination">
        <button
            class="pagination-btn"
            :disabled="pagination.page === 1"
            @click="prevPage"
        >
          ←
        </button>
        <span class="pagination-info">
          Страница {{ pagination.page }} из {{ pagination.totalPages }}
        </span>
        <button
            class="pagination-btn"
            :disabled="pagination.page === pagination.totalPages"
            @click="nextPage"
        >
          →
        </button>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ -->
    <UserEditModal
        v-if="editingUser"
        :user="userForm"
        @close="closeModal"
        @save="handleSaveUser"
    />

    <!-- МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ -->
    <div v-if="deletingUser" class="modal-overlay" @click="cancelDelete">
      <div class="confirm-modal" @click.stop>
        <div class="confirm-icon">!</div>
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить пользователя <strong>{{ getFullName(deletingUser) }}</strong>?</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="cancelDelete">Отмена</button>
          <button class="btn-confirm-delete" @click="deleteUser">Удалить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { GetCountRolesUsers, GetAllUsersInformation } from "@/components/View/Users/fetchUsers.js"
import UserEditModal from '@/components/View/Users/UserEditModal.vue'
import './Users.css'

export default {
  name: 'AdminUsersManagement',

  components: {
    UserEditModal
  },

  data() {
    return {
      users: [],
      currentUser: { id: 1 }, // ← заменить на реальный текущий пользователь
      filters: { search: '', role: '', status: '' },
      stats: {
        adminCount: 0,
        refereeCount: 0,
        scoreboardCount: 0,
        participantCount: 0,
        totalCount: 0
      },
      pagination: { page: 1, perPage: 10, totalPages: 1 },
      loading: false,
      editingUser: null,
      deletingUser: null,
      userForm: {
        username: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        phone: '',
        role: 'VIEWER',
        password: '',
        referee_level: ''
      }
    }
  },

  mounted() {
    this.loadStats()
    this.loadUsers()
  },

  methods: {
    // Получение роли пользователя (из массива roles)
    getUserRole(user) {
      if (!user || !Array.isArray(user.roles) || user.roles.length === 0) {
        return null
      }
      return user.roles[0] // берём первую роль
    },

    // Полное ФИО
    getFullName(user) {
      if (!user) return '—'
      const parts = []
      if (user.last_name) parts.push(user.last_name)
      if (user.first_name) parts.push(user.first_name)
      if (user.middle_name) parts.push(user.middle_name)
      return parts.join(' ') || '—'
    },

    // Инициалы
    getUserInitials(user) {
      if (!user) return '??'
      const fullName = this.getFullName(user)
      if (!fullName || fullName === '—') return '??'
      return fullName
          .trim()
          .split(/\s+/)
          .map(word => word[0].toUpperCase())
          .join('')
          .slice(0, 2)
    },

    async loadStats() {
      try {
        const res = await GetCountRolesUsers()
        if (!res?.success || !res?.data) return

        const { total_active_users, users_by_role } = res.data

        this.stats.totalCount = total_active_users || 0

        this.stats.adminCount = 0
        this.stats.refereeCount = 0
        this.stats.scoreboardCount = 0
        this.stats.participantCount = 0

        users_by_role.forEach(item => {
          const name = (item.role_name || item.normalized_name || '').toLowerCase()
          const count = Number(item.count) || 0

          if (name.includes('админ') || name.includes('admin')) {
            this.stats.adminCount = count
          } else if (name.includes('судья') || name.includes('referee')) {
            this.stats.refereeCount = count
          } else if (name.includes('табло') || name.includes('scoreboard')) {
            this.stats.scoreboardCount = count
          } else if (name.includes('участник') || name.includes('participant')) {
            this.stats.participantCount = count
          }
        })
      } catch (err) {
        console.error('Ошибка загрузки статистики:', err)
      }
    },

    async loadUsers() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          per_page: this.pagination.perPage
        }

        if (this.filters.search) params.search = this.filters.search
        if (this.filters.role) params.role = this.filters.role
        if (this.filters.status !== '') {
          params.is_active = this.filters.status === 'true'
        }

        const res = await GetAllUsersInformation(params)

        if (res?.success && Array.isArray(res.data)) {
          this.users = res.data
          this.pagination.totalPages =
              res.total_pages ||
              Math.ceil((res.total || res.total_count || 0) / this.pagination.perPage) ||
              1
        } else {
          this.users = []
          this.pagination.totalPages = 1
        }
      } catch (err) {
        console.error('Ошибка загрузки пользователей:', err)
        this.users = []
      } finally {
        this.loading = false
      }
    },

    editUser(user) {
      this.editingUser = user
      this.userForm = {
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        middle_name: user.middle_name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: this.getUserRole(user) || 'VIEWER',
        password: '',
        referee_level: user.referee_level || ''
      }
    },

    async handleSaveUser(updatedForm) {
      // Здесь можно отправить PATCH-запрос на сервер
      console.log('Обновляем пользователя:', updatedForm)
      this.closeModal()
      await this.loadUsers()
      await this.loadStats()
    },

    async deleteUser() {
      // TODO: реальный DELETE-запрос
      console.log('Удаляем пользователя:', this.deletingUser)
      this.deletingUser = null
      await this.loadUsers()
      await this.loadStats()
    },

    resetPassword(user) {
      // TODO: реальный запрос на сброс пароля
      console.log('Сброс пароля для:', user)
      alert(`Пароль для ${this.getFullName(user)} сброшен`)
    },

    confirmDelete(user) {
      this.deletingUser = user
    },

    cancelDelete() {
      this.deletingUser = null
    },

    closeModal() {
      this.editingUser = null
      this.userForm = {
        username: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        phone: '',
        role: 'VIEWER',
        password: '',
        referee_level: ''
      }
    },

    resetFilters() {
      this.filters = { search: '', role: '', status: '' }
      this.pagination.page = 1
      this.loadUsers()
    },

    prevPage() {
      if (this.pagination.page > 1) {
        this.pagination.page--
        this.loadUsers()
      }
    },

    nextPage() {
      if (this.pagination.page < this.pagination.totalPages) {
        this.pagination.page++
        this.loadUsers()
      }
    },

    getRoleClass(role) {
      const map = {
        'Администратор': 'role-admin',
        'Судья': 'role-referee',
        'Оператор табло': 'role-scoreboard',
        'Участник': 'role-participant',
        'Зритель': 'role-viewer',
        ADMIN: 'role-admin',
        REFEREE: 'role-referee',
        SCOREBOARD: 'role-scoreboard',
        PARTICIPANT: 'role-participant',
        VIEWER: 'role-viewer'
      }
      return map[role] || 'role-viewer'
    },

    getRoleDisplay(role) {
      const map = {
        'Администратор': 'Администратор',
        'Судья': 'Судья',
        'Оператор табло': 'Оператор табло',
        'Участник': 'Участник',
        'Зритель': 'Зритель',
        ADMIN: 'Администратор',
        REFEREE: 'Судья',
        SCOREBOARD: 'Оператор табло',
        PARTICIPANT: 'Участник',
        VIEWER: 'Зритель'
      }
      return map[role] || role || '—'
    },

    formatDate(date) {
      if (!date) return '—'
      try {
        return new Date(date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return '—'
      }
    }
  }
}
</script>

<style scoped>
</style>