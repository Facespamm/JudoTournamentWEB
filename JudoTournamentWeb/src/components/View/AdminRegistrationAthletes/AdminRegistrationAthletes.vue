<template>
  <div class="register-page">
    <div class="register-container">
      <div class="form-header">
        <button class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-text">
          <span class="header-label">РЕГИСТРАЦИЯ</span>
          <h1>Новый участник</h1>
        </div>
        <div class="header-badge">
          <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
            <path d="M15 12C17.21 12 19 10.21 19 8C19 5.79 17.21 4 15 4C12.79 4 11 5.79 11 8C11 10.21 12.79 12 15 12ZM6 10V7H4V10H1V12H4V15H6V12H9V10H6ZM15 14C12.33 14 7 15.34 7 18V20H23V18C23 15.34 17.67 14 15 14Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <form @submit.prevent="submitForm" class="register-form">

        <!-- БЛОК 1: Аккаунт -->
        <div class="form-block">
          <div class="block-title">
            <span class="block-num">01</span>
            <span>Данные аккаунта</span>
          </div>
          <div class="fields-grid">
            <div class="field-wrap full">
              <label>Логин <span class="req">*</span></label>
              <input v-model="form.login" type="text" placeholder="gugiguga" required />
            </div>
            <div class="field-wrap">
              <label>Email</label>
              <input v-model="form.email" type="email" placeholder="email@example.com" />
            </div>
            <div class="field-wrap">
              <label>Телефон</label>
              <input v-model="form.phone" type="tel" placeholder="+79031234567" />
            </div>
<!--            убран на время-->
<!--            <div class="field-wrap full">-->
<!--              <label>Пароль <span class="req">*</span></label>-->
<!--              <div class="input-eye">-->
<!--                <input-->
<!--                    v-model="form.password"-->
<!--                    :type="showPassword ? 'text' : 'password'"-->
<!--                    placeholder="Минимум 8 символов"-->
<!--                    required-->
<!--                />-->
<!--                <button type="button" class="eye-btn" @click="showPassword = !showPassword">-->
<!--                  <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none">-->
<!--                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="2"/>-->
<!--                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>-->
<!--                  </svg>-->
<!--                  <svg v-else viewBox="0 0 24 24" fill="none">-->
<!--                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>-->
<!--                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>-->
<!--                  </svg>-->
<!--                </button>-->
<!--              </div>-->
<!--            </div>-->
          </div>
        </div>

        <!-- БЛОК 2: Личные данные -->
        <div class="form-block">
          <div class="block-title">
            <span class="block-num">02</span>
            <span>Личные данные</span>
          </div>
          <div class="fields-grid">
            <div class="field-wrap full">
              <label>ФИО <span class="req">*</span></label>
              <input v-model="form.fullname" type="text" placeholder="Фамилия Имя Отчество" required />
            </div>
            <div class="field-wrap">
              <label>Дата рождения <span class="req">*</span></label>
              <input v-model="form.birth_date" type="date" required />
            </div>
            <div class="field-wrap">
              <label>Пол <span class="req">*</span></label>
              <div class="gender-toggle">
                <button
                    type="button"
                    :class="{ active: form.gender === 'male' }"
                    @click="form.gender = 'male'"
                >Мужской</button>
                <button
                    type="button"
                    :class="{ active: form.gender === 'female' }"
                    @click="form.gender = 'female'"
                >Женский</button>
              </div>
            </div>
          </div>
        </div>

        <!-- БЛОК 3: Спортивные данные -->
        <div class="form-block">
          <div class="block-title">
            <span class="block-num">03</span>
            <span>Спортивные данные</span>
          </div>
          <div class="fields-grid">
            <div class="field-wrap">
              <label>Разряд <span class="req">*</span></label>
              <select v-model="form.rank_id" required :disabled="loadingRanks">
                <option :value="null" disabled>Выберите разряд</option>
                <option v-for="rank in ranks" :key="rank.id" :value="rank.id">
                  {{ rank.description }} — {{ rank.level }}
                </option>
              </select>
            </div>
            <div class="field-wrap">
              <label>Клуб</label>
              <select v-model="form.club_id" :disabled="loadingClubs">
                <option :value="null">Без клуба</option>
                <option v-for="club in clubs" :key="club.id" :value="club.id">
                  {{ club.name }} ({{ club.short_name }}, {{ club.city }})
                </option>
              </select>
            </div>
            <div class="field-wrap">
              <label>Номер лицензии <!--<span class="req">*</span>--></label>
              <input v-model="form.license_number" type="text" placeholder="77 25 456789"/> <!--required-->
            </div>
            <div class="field-wrap">
              <label>Страховой номер <!--<span class="req">*</span>--></label>
              <input v-model="form.insurance_number" type="text" placeholder="1234-567-890 1234"/> <!--required-->
            </div>
          </div>
        </div>

        <!-- БЛОК 4: Медицина -->
        <div class="form-block">
          <div class="block-title">
            <span class="block-num">04</span>
            <span>Медицинский допуск</span>
          </div>
          <div class="checkbox-row" @click="form.medical_check = !form.medical_check">
            <div class="custom-checkbox" :class="{ checked: form.medical_check }">
              <svg v-if="form.medical_check" viewBox="0 0 24 24" fill="none" width="14" height="14">
                <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span>Медицинский допуск получен</span>
          </div>
        </div>

        <!-- Сообщения -->
        <transition name="slide-up">
          <div v-if="errorMsg" class="form-error">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
            {{ errorMsg }}
          </div>
        </transition>

        <transition name="slide-up">
          <div v-if="successMsg" class="form-success">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ successMsg }}
          </div>
        </transition>

        <button
            type="submit"
            class="submit-btn"
            :disabled="isLoading || loadingRanks || loadingClubs"
        >
          <span v-if="!isLoading">Зарегистрировать участника</span>
          <span v-else class="btn-loading">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" class="spin">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="31.4" stroke-dashoffset="10"/>
            </svg>
            Регистрация...
          </span>
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminRegistration, getRanks } from '@/components/View/AdminRegistrationAthletes/fetchAdminRegistration.js'
import { getClubs } from '@/components/View/Clubs/fetchClubs.js'

const router = useRouter()

const showPassword = ref(false)
const isLoading = ref(false)
const loadingRanks = ref(false)
const loadingClubs = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const ranks = ref([])
const clubs = ref([])

const form = ref({
  login: '',
  fullname: '',
  email: '',
  phone: '',
  // password: '',
  birth_date: '',
  gender: 'male',
  rank_id: null,
  license_number: '',
  medical_check: false,
  insurance_number: '',
  club_id: null
})

const loadRanks = async () => {
  loadingRanks.value = true
  try {
    const res = await getRanks()
    if (res.success) {
      ranks.value = res.athletes || []
    } else {
      errorMsg.value = res.error || 'Не удалось загрузить список разрядов'
    }
  } catch (err) {
    errorMsg.value = 'Ошибка при загрузке разрядов'
    console.error(err)
  } finally {
    loadingRanks.value = false
  }
}

const loadClubs = async () => {
  loadingClubs.value = true
  try {
    const data = await getClubs()
    clubs.value = Array.isArray(data) ? data : (data.clubs || [])
  } catch (err) {
    errorMsg.value = 'Ошибка при загрузке списка клубов'
    console.error(err)
  } finally {
    loadingClubs.value = false
  }
}

const loadAllData = async () => {
  await Promise.all([loadRanks(), loadClubs()])
}

const submitForm = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  const payload = {
    login:           (form.value.login || '').trim(),
    fullname:        (form.value.fullname || '').trim(),
    email:           (form.value.email || '').trim(),
    phone:           (form.value.phone || '').trim(),
    // password:        form.value.password || '',
    birth_date:      form.value.birth_date || '',
    gender:          form.value.gender || 'male',
    rank_id:         form.value.rank_id ? Number(form.value.rank_id) : null,
    license_number:  (form.value.license_number || '').trim(),
    medical_check:   !!form.value.medical_check,
    insurance_number:(form.value.insurance_number || '').trim(),
    club_id:         form.value.club_id ? Number(form.value.club_id) : null
  }

  try {
    const result = await adminRegistration(payload)
    if (!result.success) {
      throw new Error(result.error || 'Ошибка создания участника')
    }

    successMsg.value = `Участник ${form.value.fullname} успешно зарегистрирован`
    //setTimeout(() => router.back(), 1800)

  } catch (err) {
    errorMsg.value = err.message || 'Произошла ошибка при регистрации'
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.register-page {
  width: 100%;
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1a1a1a;
  box-sizing: border-box;
  padding-top: 80px;
  padding-bottom: 60px;
  max-width: calc(100vw - var(--sidebar-width, 120px) - 40px);
  padding-left: 20px;
  padding-right: 20px;
}

.register-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* ===== HEADER ===== */
.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1.5px solid #e8e8e8;
  background: white;
  color: #c89b3c;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.back-btn:hover { background: #fdfaf0; border-color: #c89b3c; }
.back-btn svg { width: 20px; height: 20px; }

.header-text { flex: 1; }

.header-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: #c89b3c;
  display: block;
  margin-bottom: 2px;
}

.form-header h1 {
  font-size: 1.8rem;
  font-weight: 900;
  color: #1a1a1a;
  margin: 0;
}

.header-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

/* ===== ФОРМА — 2 колонки ===== */
.register-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  align-items: start;
}

/* Сообщения и кнопка — на всю ширину */
.form-error,
.form-success,
.submit-btn {
  grid-column: 1 / -1;
}

/* ===== БЛОК ===== */
.form-block {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  padding: 1.6rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-block:hover {
  border-color: #c89b3c;
  box-shadow: 0 4px 16px rgba(200,155,60,0.08);
}

.block-title {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.4rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
}

.block-num {
  font-size: 0.7rem;
  font-weight: 900;
  color: #c89b3c;
  background: rgba(200,155,60,0.1);
  padding: 3px 8px;
  border-radius: 6px;
  letter-spacing: 1px;
}

/* ===== СЕТКА ПОЛЕЙ ===== */
.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-wrap { display: flex; flex-direction: column; gap: 0.5rem; }
.field-wrap.full { grid-column: 1 / -1; }

label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  letter-spacing: 0.3px;
}

.req { color: #c89b3c; }

input, select {
  background: #f9f9f9;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  color: #1a1a1a;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

input::placeholder { color: #bbb; }

input:focus, select:focus {
  border-color: #c89b3c;
  background: #fffdf5;
  box-shadow: 0 0 0 3px rgba(200,155,60,0.1);
}

select { cursor: pointer; }
select option { background: white; color: #1a1a1a; }

/* ===== ГЛАЗ В ПАРОЛЕ ===== */
.input-eye { position: relative; }
.input-eye input { padding-right: 3rem; }

.eye-btn {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #bbb;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  padding: 0;
}

.eye-btn:hover { color: #c89b3c; }
.eye-btn svg { width: 18px; height: 18px; }

/* ===== ГЕНДЕР ТОГГЛ ===== */
.gender-toggle { display: flex; gap: 0.5rem; }

.gender-toggle button {
  flex: 1;
  padding: 0.7rem;
  border-radius: 10px;
  border: 1.5px solid #e8e8e8;
  background: #f9f9f9;
  color: #888;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.gender-toggle button.active {
  border-color: #c89b3c;
  background: #fdfaf0;
  color: #a67c00;
}

/* ===== ЧЕКБОКС ===== */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  cursor: pointer;
  user-select: none;
  color: #444;
  font-size: 0.95rem;
  font-weight: 500;
}

.custom-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 2px solid #e8e8e8;
  background: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.custom-checkbox.checked {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  border-color: #c89b3c;
}

/* ===== СООБЩЕНИЯ ===== */
.form-error {
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 0.9rem 1.2rem;
  color: #dc2626;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.form-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 0.9rem 1.2rem;
  color: #16a34a;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

/* ===== КНОПКА ОТПРАВКИ ===== */
.submit-btn {
  background: linear-gradient(135deg, #c89b3c, #f4d03f);
  color: #1a1a1a;
  border: none;
  border-radius: 14px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  font-family: inherit;
  letter-spacing: 0.3px;
  box-shadow: 0 6px 20px rgba(200,155,60,0.25);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(200,155,60,0.35);
}

.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(8px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 900px) {
  .register-form { grid-template-columns: 1fr; }
  .register-container { max-width: 820px; }
}

@media (max-width: 600px) {
  .fields-grid { grid-template-columns: 1fr; }
  .field-wrap.full { grid-column: 1; }
  .form-header h1 { font-size: 1.4rem; }
}
</style>