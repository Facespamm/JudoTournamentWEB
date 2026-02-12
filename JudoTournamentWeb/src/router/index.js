// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

import HomePage from '../components/View/HomePage/HomePage.vue'
import Login from '../components/View/Authentication/Login/Login.vue'
import Registration from "@/components/View/Authentication/Registration/Registration.vue"
import Athletes from "../components/View/Athletes/Athletes.vue"
import Tournament from "@/components/View/Tournaments/Tournament.vue"
import RegistrationAthletes from "@/components/View/RegistrationAthletes/RegistrationAthletes.vue";
import TournamentDetails from "@/components/View/TournamentDetails/TournamentDetails.vue";
import Referees from"@/components/View/Referee/Referee.vue"
import Fight from "@/components/View/Fight/Fight.vue";
import Scoreboard from "@/components/View/Scoreboard/Scoreboard.vue";
import AdminDashboard from "@/components/View/AdminDashboard/AdminDashboard.vue";
import ClubsAdmin from "@/components/View/ClubAdmin/ClubsAdmin.vue";
import Users from "@/components/View/Users/Users.vue";
import AthleteDetail from "@/components/View/AthleteDetail/AthleteDetail.vue";
import TournamentSettings from "@/components/View/TournamentManagement/TournamentSettings.vue";
import FightDetail from "@/components/View/FightDetail/FightDetail.vue";
import Bracket from "@/components/View/Brackets/Bracket.vue";
import BracketViewDetail from "@/components/View/Brackets/BracketViewDetail.vue";
import RefereeDashboard from "@/components/View/RefereeDashboard/RefereeDashboard.vue";
import ManageRole from "@/components/View/Authentication/SelectRoleView/ManageRole.vue";
import Weighings from "@/components/View/Weighings/Weighings.vue";
import RegistrationModal from "@/components/View/RegistrationAthletesTournament/RegistrationModal.vue";
import Clubs from "@/components/View/Clubs/Clubs.vue";
const routes = [
    { path: '/', redirect: '/login' },

    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { hideSidebar: true }
    },
    {
        path: '/registration',
        name: 'registration',
        component: Registration,
        meta: { hideSidebar: true }
    },
    {
        path: '/tournamentdetails/:id',
        name: 'tournamentdetails',
        component: () => import('@/components/View/TournamentDetails/TournamentDetails.vue'),
        children: [
            {
                path: '',                  // ← Обзор (чистый URL /tournamentdetails/1)
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
                component: () => import('@/components/View/TournamentDetails/ResultsTab.vue')
            },
            {
                path: 'live',
                component: () => import('@/components/View/TournamentDetails/LiveTab.vue')
            }
        ]
    },
    {
        path: '/home',
        name: 'home',
        component: HomePage
    },
    {
        path: '/athletes',
        name: 'athletes',
        component: Athletes
    },{
        path: '/registrationathlete',
        name: 'registrationathlete',
        component: RegistrationModal
    },
    {
        path: '/tournament',
        name: 'tournament',
        component: Tournament
    },
    {
        path: '/referees',
        name: 'referees',
        component: RefereeDashboard
    },
    {
        path: '/roles',
        name: 'roles',
        component: ManageRole
    },
    {
        path: '/registrationathletes',
        name: 'registrationathletes',
        component: RegistrationAthletes
    },
    {
        path: '/tournamentdetails/:id',
        name: 'tournamentdetails',
        component: TournamentDetails,
    },
    {
        path: '/referee',
        name: 'referee',
        component: Referees,
    }, {
        path: '/weighing',
        name: 'weighing',
        component: Weighings,
    },
    {
        path: '/tatami',
        name: 'tatami',
        component: Fight,
    },
    {
        path: '/scoreboard',
        name: 'scoreboard',
        component: Scoreboard,
    },
    {
        path: '/admin',
        name: 'admin',
        component: AdminDashboard,
    },
    {
        path: '/brackets',
        name: 'bracket',
        component: Bracket,
    },{
        path: '/clubs',
        name: 'clubs',
        component: Clubs,
    },
    {
        path: '/admin/clubsAdmin',
        name: 'clubsAdmin',
        component: ClubsAdmin,
    },
    {
        path: '/admin/users',
        name: 'users',
        component: Users,
    },{
        path: '/admin/tournament-settings',
        name: 'tournament-settings',
        component: TournamentSettings,
    },
    {
        path: '/athlete/:id',
        name: 'athlete-detail',
        component: AthleteDetail,
    },{
        path: '/brackets/:id',
        name: 'bracket-detail',
        component: BracketViewDetail,
    },
    {
        path: '/athlete/:id',
        name: 'athlete-detail',
        component: AthleteDetail,
    },{
        path: '/fights/:id',
        name: 'fight-detail',
        component: FightDetail,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router