import { createRouter, createWebHistory } from 'vue-router';
import OverviewPage from '@/views/OverviewPage.vue';
import WaterMeterReadingPage from '@/views/WaterMeterReadingPage.vue';
import BMSReadingPage from '@/views/BMSReadingPage.vue';
import FireAlarmSystem from '@/views/FireAlarmSystem.vue';
import PowerMeterReadingPage from '@/views/PowerMeterReadingPage.vue';
import PowerDeviceDetailPage from '@/views/PowerDeviceDetailPage.vue';
import SmartLandscapeSystem from '@/views/SmartLandscapeSystem.vue';
import SmartToiletSystem from '@/views/SmartToiletSystem.vue';
import SmartPestControlSystem from '@/views/SmartPestControlSystem.vue';
import SmartSecuritySystem from '@/views/SmartSecuritySystem.vue';
import SmartAirQualitySystem from '@/views/SmartAirQualitySystem.vue';
import AssetTaggingSystem from '@/views/AssetTaggingSystem.vue';
import SmartLightingSystem from '@/views/SmartLightingSystem.vue';
import AlarmsNotificationsPage from '@/views/AlarmsNotificationsPage.vue';
import FaultCallTicket from '@/views/FaultCallTicket.vue';
import IndoorAirQuality from '@/views/IndoorAirQuality.vue';
import HybridAircon from '@/views/HybridAircon.vue';
import B051314 from '@/views/B05-13-14.vue';
import B051516 from '@/views/B05-15-16.vue';
import B0507 from '@/views/B05-07.vue';
import B0508 from '@/views/B05-08.vue';
import B0509 from '@/views/B05-09.vue';
import B05Washroom from '@/views/B05-Washroom.vue';
import ppvcTrainingRoom from '@/views/ppvc-training-room.vue';
import liftEscalatorTrainingRoom from '@/views/lift-escalator-training-room.vue';
import B05SmartLandscape from '@/views/B05-smart-landscape.vue';
import integratedOperationCentre from '@/views/integrated-operation-centre.vue';
import iceRoom from '@/views/ice-room.vue';
import B0518 from '@/views/B05-18.vue';
import Login from "@/views/Login.vue";

const routes = [
  {
    path: '/',
    name: 'OverviewPage',
    component: OverviewPage,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: "/login",
    name: "Login",
    component: Login
  },
  {
    path: '/power-meter-reading',
    name: 'PowerMeterReading',
    component: PowerMeterReadingPage,
    meta: { 
      requiresAuth: true, 
      // allowedRoles: ['teacher', 'student']  // Only teachers can access this route.
    }
  },
  
  {
    path: '/power-meter-reading/:id',
    name: 'PowerDeviceDetail',
    component: PowerDeviceDetailPage,
    props: true,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/water-meter-reading',
    name: 'WaterMeterReadingPage',
    component: WaterMeterReadingPage,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/bms-reading',
    name: 'BMSReadingPage',
    component: BMSReadingPage,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/fire-alarm-system',
    name: 'FireAlarmReadingPage',
    component: FireAlarmSystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-landscape-system',
    name: 'SmartLandscapeSystem',
    component: SmartLandscapeSystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-toilet-system',
    name: 'SmartToiletSystem',
    component: SmartToiletSystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-pest-control-system',
    name: 'SmartPestControlSystem',
    component: SmartPestControlSystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-security-system',
    name: 'SmartSecuritySystem',
    component: SmartSecuritySystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-air-quality-system',
    name: 'SmartAirQualitySystem',
    component: SmartAirQualitySystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/asset-tagging-system',
    name: 'AssetTaggingSystem',
    component: AssetTaggingSystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/Smart-lighting-system',
    name: 'SmartLightingSystem',
    component: SmartLightingSystem,
    meta: { requiresAuth: true } // This route requires authentication
  },
  // {
  //   path: '/hybrid-aircon-system',
  //   name: 'HybridAirconSystem',
  //   component: HybridAirconSystem
  // },
  {
    path: '/indoor-air-quality',
    name: 'IndoorAirQuality',
    component: IndoorAirQuality,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/hybrid-aircon',
    name: 'HybridAircon',
    component: HybridAircon,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/alarms-notifications',
    name: 'AlarmsNotifications',
    component: AlarmsNotificationsPage,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/quick-links',
    name: 'QuickLinks',
    component: FaultCallTicket,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-vertical-transport-room',
    name: 'B051314',
    component: B051314,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/vertical-transport-room',
    name: 'B051516',
    component: B051516,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/collaborative-design-centre-07',
    name: 'B0507',
    component: B0507,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/collaborative-design-centre-08',
    name: 'B0508',
    component: B0508,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/collaborative-design-centre-09',
    name: 'B0509',
    component: B0509,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-washroom-room',
    name: 'B05Washroom',
    component: B05Washroom,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/ppvc-training-zone',
    name: ppvcTrainingRoom,
    component: ppvcTrainingRoom,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/lift-escalator-training-zone',
    name: liftEscalatorTrainingRoom,
    component: liftEscalatorTrainingRoom,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/smart-landscape-room',
    name: B05SmartLandscape,
    component: B05SmartLandscape,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/integrated-operation-centre',
    name: integratedOperationCentre,
    component: integratedOperationCentre,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/ice-room',
    name: iceRoom,
    component: iceRoom,
    meta: { requiresAuth: true } // This route requires authentication
  },
  {
    path: '/wsh-room',
    name: B0518,
    component: B0518,
    meta: { requiresAuth: true } // This route requires authentication
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  const userRole = sessionStorage.getItem("userRole");

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated || !userRole) {
      next({ name: "Login" });
      return;
    }
    if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(userRole)) {
      next({ name: "OverviewPage" });
      return;
    }
  }
  next();
});

export default router;
