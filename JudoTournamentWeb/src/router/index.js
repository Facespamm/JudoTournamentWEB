import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../components/View/HomePage/HomePage.vue'
import Login from '../components/View/Authentication/Login/Login.vue'
import Registration from "@/components/View/Authentication/Registration/Registration.vue"
import Athletes from "../components/View/Athletes/Athletes.vue"
import Tournament from "@/components/View/Tournaments/Tournament.vue"
import RegistrationAthletes from "@/components/View/RegistrationAthletes/RegistrationAthletes.vue"
import Referees from "@/components/View/Referee/Referee.vue"
import Fight from "@/components/View/Fight/Fight.vue"
import Scoreboard from "@/components/View/Scoreboard/Scoreboard.vue"
import AdminDashboard from "@/components/View/AdminDashboard/AdminDashboard.vue"
import ClubsAdmin from "@/components/View/ClubAdmin/ClubsAdmin.vue"
import Users from "@/components/View/Users/Users.vue"
import AthleteDetail from "@/components/View/AthleteDetail/AthleteDetail.vue"
import TournamentSettings from "@/components/View/TournamentManagement/TournamentSettings.vue"
import FightDetail from "@/components/View/FightDetail/FightDetail.vue"
import Bracket from "@/components/View/Brackets/Bracket.vue"
import BracketViewDetail from "@/components/View/Brackets/BracketViewDetail.vue"
import RefereeDashboard from "@/components/View/RefereeDashboard/RefereeDashboard.vue"
import ManageRole from "@/components/View/Authentication/SelectRoleView/ManageRole.vue"
import Weighings from "@/components/View/Weighings/Weighings.vue"
import RegistrationModal from "@/components/View/RegistrationAthletesTournament/RegistrationModal.vue"
import Clubs from "@/components/View/Clubs/Clubs.vue"
import RefereeManagement from "@/components/View/RefereeManagement/RefereeManagement.vue"
import RefereeDetail from "@/components/View/RefereeDetail/RefereeDetail.vue"
import AdminRegistrationAthletes from "@/components/View/AdminRegistrationAthletes/AdminRegistrationAthletes.vue";
import {setupGuards} from "@/router/guard.js";
import {USER_ROLES} from "@/composables/useAuth.js";
const { ADMIN, REFEREE, SCOREBOARD, VIEWER, ATHLETE } = USER_ROLES
const routes = [
    { path: '/', redirect: '/login' },

    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { hideSidebar: true,public: true }
    },
    {
        path: '/registration',
        name: 'registration',
        component: Registration,
        meta: { hideSidebar: true,public: true }

    },

    /* ==================== ТУРНИР ДЕТАЛИ (один маршрут!) ==================== */
    {
        path: '/tournamentdetails/:id',
        name: 'tournamentdetails',
        component: () => import('@/components/View/TournamentDetails/TournamentDetails.vue'),
        meta: {
            hideSidebar: true,
            align: 'center'
        },
        children: [
            {
                path: '',
                name: 'tournament-overview',
                component: () => import('@/components/View/TournamentDetails/OverviewTab.vue')
            },
            {
                path: 'draw',
                component: () => import('@/components/View/TournamentDetails/DrawTab.vue')
            },
            {
                path: 'order',
                component: () => import('@/components/View/TournamentDetails/OrderTab.vue')
            },
            {
                path: 'athletes',
                component: () => import('@/components/View/TournamentDetails/AthletesTab.vue')
            },
            {
                path: 'results',
                component: () => import('@/components/View/TournamentDetails/WeightingTab.vue')
            },
            {
                path: 'live',
                component: () => import('@/components/View/TournamentDetails/LiveTab.vue')
            }
        ]
    },

    { path: '/home', name: 'home', component: HomePage },
    { path: '/adminregistration', name: 'adminregistration', component: AdminRegistrationAthletes, meta: { roles: [ADMIN] } },
    { path: '/refereeManagement', name: 'refereeManagement', component: RefereeManagement , meta: { roles: [ADMIN,REFEREE] } },
    { path: '/athletes', name: 'athletes', component: Athletes, meta: { roles: [ADMIN, REFEREE, ATHLETE,VIEWER] } },
    { path: '/registrationathlete', name: 'registrationathlete', component: RegistrationModal, meta: { hideSidebar: true, roles: [ATHLETE,ADMIN,REFEREE] } },
    { path: '/tournament', name: 'tournament', component: Tournament,meta: { roles: [ADMIN, REFEREE, VIEWER,ATHLETE] } },
    { path: '/referees', name: 'referees', component: RefereeDashboard, meta: { roles: [REFEREE,ADMIN] } },
    { path: '/roles', name: 'roles', component: ManageRole, meta: { roles: [VIEWER] } },
    { path: '/registrationathletes', name: 'registrationathletes', component: RegistrationAthletes,meta: { roles: [ADMIN,ATHLETE,REFEREE] } },
    { path: '/referee', name: 'referee', component: Referees , meta: { roles: [ADMIN,REFEREE] } },
    { path: '/weighing', name: 'weighing', component: Weighings, meta: { hideSidebar: true,roles: [ADMIN,REFEREE] } },
    { path: '/tatami', name: 'tatami', component: Fight ,meta : { roles: [REFEREE, ADMIN] } },
    { path: '/scoreboard', name: 'scoreboard', component: Scoreboard },
    { path: '/admin', name: 'admin', component: AdminDashboard,meta: { roles: [ADMIN] } },
    { path: '/brackets', name: 'bracket', component: Bracket,meta: { roles: [ADMIN,REFEREE] } },
    { path: '/clubs', name: 'clubs', component: Clubs,meta: { roles: [ADMIN,REFEREE,VIEWER,ATHLETE] } },
    { path: '/admin/clubsAdmin', name: 'clubsAdmin', component: ClubsAdmin, meta: { roles: [ADMIN] } },
    { path: '/admin/users', name: 'users', component: Users,meta: { roles: [ADMIN] } },
    { path: '/admin/tournament-settings', name: 'tournament-settings', component: TournamentSettings ,meta: { roles: [ADMIN,REFEREE,ATHLETE,VIEWER] } },
    { path: '/admin/tournament-settings', name: 'tournament-settings', component: TournamentSettings ,meta: { roles: [ADMIN,REFEREE,ATHLETE,VIEWER] } },
    { path: '/athlete/:id', name: 'athlete-detail', component: AthleteDetail },   // удалил дубликат
    { path: '/brackets/:id', name: 'bracket-detail', component: BracketViewDetail },
    { path: '/fights/:id', name: 'fight-detail', component: FightDetail },
    { path: '/referee/:id', name: 'referee-detail', component: RefereeDetail }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

setupGuards(router) // ← подключаем guard

export default router