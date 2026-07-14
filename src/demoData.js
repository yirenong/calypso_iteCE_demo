const now = new Date();

export const demoAlerts = [
  { message: 'B05-08 CO₂ level returned to the normal range', time: '10 minutes ago' },
  { message: 'Landscape planter 12 soil moisture is below 35%', time: '28 minutes ago' },
  { message: 'Smart washroom water meter daily reading received', time: '1 hour ago' },
  { message: 'Fire alarm panel completed its scheduled health check', time: '2 hours ago' },
];

export const demoFaults = [
  { fault_number: 'FT-2026-0142', type_name: 'High CO₂ reading at B05-08', latest_status: 'site_reached', created_at: new Date(now - 35 * 60000).toISOString(), sites_name: ['ITE College East'] },
  { fault_number: 'FT-2026-0138', type_name: 'Lighting controller communication loss', latest_status: 'Pending', created_at: new Date(now - 4 * 3600000).toISOString(), sites_name: ['B05-15/16'] },
  { fault_number: 'FT-2026-0129', type_name: 'Landscape pump pressure inspection', latest_status: 'work_completed', created_at: new Date(now - 26 * 3600000).toISOString(), sites_name: ['Smart Landscape'] },
  { fault_number: 'FT-2026-0121', type_name: 'Washroom odor sensor battery low', latest_status: 'work_completed', created_at: new Date(now - 50 * 3600000).toISOString(), sites_name: ['B05 Washroom'] },
];

export const demoLightingDevices = [
  { id: 1, name: 'B05-07 Lighting Gateway', isOnline: true },
  { id: 2, name: 'B05-08 Lighting Gateway', isOnline: true },
  { id: 3, name: 'B05-09 Lighting Gateway', isOnline: true },
  { id: 4, name: 'B05-11/12 Lighting Gateway', isOnline: false },
  { id: 5, name: 'B05-15/16 Lighting Gateway', isOnline: true },
  { id: 6, name: 'B05-18 Lighting Gateway', isOnline: true },
];

export const demoSoilSensors = Array.from({ length: 17 }, (_, index) => ({
  devEUI: `DEMO-SOIL-${String(index + 1).padStart(2, '0')}`,
  deviceName: `Planter Pot ${index + 1}`,
  SoilMoisture: 38 + ((index * 7) % 31),
  pH: (6.1 + ((index * 3) % 8) / 10).toFixed(1),
  EC: 680 + ((index * 43) % 420),
  N: 31 + ((index * 5) % 24),
  P: 18 + ((index * 3) % 17),
  K: 42 + ((index * 7) % 29),
  BatteryVoltage: (3.62 + ((index * 2) % 10) / 100).toFixed(2),
  time: now.toISOString(),
}));

export const demoDailyWaterUsage = [620, 585, 640, 705, 680, 590, 655];
