import { demoAlerts, demoFaults, demoSoilSensors } from './demoData';
import axios from 'axios';

const iaqRooms = ['B05-11', 'B05-12', 'B05-13/14', 'B05-15/16', 'B05-18', 'B05-07', 'B05-08', 'B05-09'];
const positions = [
  ['8%', '11.6%'], ['8%', '32.3%'], ['8%', '53%'], ['8%', '73.7%'],
  ['55%', '11.6%'], ['55%', '32.3%'], ['55%', '53%'], ['55%', '73.7%'],
];

export const demoIaqSensors = iaqRooms.map((name, index) => ({
  id: index + 1,
  name,
  co2: 465 + index * 18,
  temperature: Number((23.1 + (index % 4) * 0.6).toFixed(1)),
  humidity: 56 + (index * 3) % 11,
  pm2_5: 7 + (index * 2) % 9,
  pm10: 15 + (index * 3) % 13,
  pressure: 1008 + (index % 4),
  top: positions[index][0],
  left: positions[index][1],
  isOnline: index !== 6,
}));

const sevenDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const powerValues = [86.4, 91.2, 88.7, 96.3, 102.1, 74.8, 69.5];

function demoPowerPayload() {
  const hourlyLabels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
  const hourlyValues = hourlyLabels.map((_, hour) => Number((0.7 + (hour >= 8 && hour <= 18 ? 1.15 : 0.25) + Math.sin(hour / 3) * 0.18).toFixed(3)));
  const today = new Date();
  const days = sevenDays.map((label, index) => ({
    day: new Date(today.getTime() - (6 - index) * 86400000).toISOString().slice(0, 10),
    label,
    labels_24: hourlyLabels,
    usage_24: hourlyValues.map(value => Number((value * (0.88 + index * 0.025)).toFixed(3))),
    total_usage: hourlyValues.map(value => Number((value * (0.88 + index * 0.025)).toFixed(3))),
  }));
  return { labels: hourlyLabels, labels_24: hourlyLabels, total_usage_series: hourlyValues, days };
}

function isUsageRequest(config = {}) {
  return String(config.url || '').includes('/api/powermeter/usage/');
}

const demoBmsReadings = [
  ['NCE-02/FCB.Local Application.CHW FLOW RATE', 128.4, 'OK'],
  ['NCE-02/Programming.AGILENT.CH-CHWR-TP', 13.8, 'OK'],
  ['NCE-02/Programming.AGILENT.CH-CHWS-TP', 7.2, 'OK'],
  ['NCE-02/Programming.AGILENT.CH-CWS-TP', 29.1, 'OK'],
  ['NCE-02/FCB.Local Application.OA-T', 31.4, 'OK'],
  ['NCE-02/FCB.Local Application.OA-H', 68.2, 'OK'],
  ['NCE-02/Energy.DATA.SYS-EFF', 0.71, 'OK'],
  ['NCE-02/Energy.DATA.TOT-CLG-KW', 316.8, 'OK'],
].map(([name, presentValue, status], index) => ({
  _id: `demo-bms-${index + 1}`,
  name,
  objectName: name,
  presentValue,
  value: presentValue,
  status,
  dateTime: new Date().toISOString(),
}));

function fillArray(vm, key, values) {
  if (Array.isArray(vm[key]) && vm[key].length === 0) vm[key] = values;
}

function applyCommonCharts(vm) {
  if ('last7Labels' in vm && !vm.last7Labels?.length) vm.last7Labels = sevenDays;
  if ('last7Values' in vm && !vm.last7Values?.length) vm.last7Values = powerValues;
  ['last7Series', 'sensor7Series', 'sensorSeries'].forEach(key => {
    if (vm[key] && !vm[key].labels?.length) {
      vm[key] = { labels: sevenDays, values: powerValues, label: 'Demo energy usage (kWh)' };
    }
  });
}

function applyRoomReadings(vm) {
  if (vm.sensorData && Object.prototype.hasOwnProperty.call(vm.sensorData, 'co2')) {
    vm.sensorData = { co2: 528, temperature: 24.1, humidity: 59, pm2_5: 9, pm10: 18 };
  }
  if (Array.isArray(vm.currentSensors)) {
    vm.currentSensors.forEach(sensor => {
      sensor.isOnline = false;
      if ('level1' in sensor) sensor.level1 = 0;
      if ('level2' in sensor) sensor.level2 = 0;
      sensor.lastUpdated = 'Just now (demo)';
    });
  }
  applyCommonCharts(vm);
}

function applyDemoData(vm) {
  const routeName = vm.$route?.name;
  applyCommonCharts(vm);

  // All linked room dashboards share these fields, including components whose
  // router names are component objects rather than strings.
  if (vm.sensorData && Object.prototype.hasOwnProperty.call(vm.sensorData, 'co2')) {
    applyRoomReadings(vm);
  }
  if (Array.isArray(vm.meterSNs) && vm.meterSNs.length === 0) {
    vm.meterSNs = ['DEMO-MAIN-3P', 'DEMO-FCU-01', 'DEMO-LIGHTING-01'];
  }
  if (Array.isArray(vm.zoneSensors)) {
    vm.zoneSensors.forEach(sensor => {
      sensor.isOnline = false;
      sensor.level1 = 0;
      sensor.level2 = 0;
    });
  }
  if (vm.sensors && !Array.isArray(vm.sensors) && typeof vm.sensors === 'object') {
    Object.values(vm.sensors).forEach(group => {
      if (!Array.isArray(group)) return;
      group.forEach(light => {
        if ('isOnline' in light) light.isOnline = false;
        if ('level1' in light) light.level1 = 0;
        if ('level2' in light) light.level2 = 0;
      });
    });
  }
  if (Array.isArray(vm.toggleDevices)) {
    vm.toggleDevices.forEach((device, index) => { device.isOnline = index !== 2; });
  }
  if (Array.isArray(vm.fans)) {
    vm.fans.forEach((fan, index) => { fan.isOn = index === 0; });
  }

  switch (routeName) {
    case 'OverviewPage':
      fillArray(vm, 'messages', [{ message: 'Demo building data is active', time: 'Now' }]);
      fillArray(vm, 'faults', demoFaults);
      fillArray(vm, 'feedData', demoAlerts);
      fillArray(vm, 'semsData', [{ meter: 'Main Incoming', voltage: 400.4, current: 38.7, power: 24.6, status: 'Online' }]);
      fillArray(vm, 'spcsData', [{ device: 'Magnetic Lock 1', activations: 3, status: 'Online' }, { device: 'Magnetic Lock 2', activations: 4, status: 'Online' }]);
      fillArray(vm, 'swsData', [{ area: 'Male Toilet', occupancy: 7, status: 'Online' }, { area: 'Female Toilet', occupancy: 6, status: 'Online' }]);
      fillArray(vm, 'atData', [{ mac: 'C8:47:80:12:AE:01', rssi: -62, status: 'In range' }]);
      fillArray(vm, 'bmsData', [{ name: 'Chiller Plant', value: 316.8, status: 'OK' }]);
      fillArray(vm, 'fasSensors', [{ zone: 'Zone 1', status: 'Normal' }, { zone: 'Zone 3', status: 'Alarm' }]);
      vm.allSEMSSensorsWorking = true;
      vm.allSPCSSensorsWorking = true;
      vm.allSWSSensorsWorking = true;
      vm.allATSensorsWorking = true;
      vm.allBMSSensorsWorking = true;
      vm.allSensorsWorking = false;
      break;
    case 'BMSReadingPage':
      fillArray(vm, 'latestData', demoBmsReadings);
      fillArray(vm, 'groups', [{
        _id: 'demo-chiller-group', name: 'Chiller Plant – Demo',
        group: demoBmsReadings.map(item => item._id),
        item_name: ['CHW Flow', 'CHW Return Temp', 'CHW Supply Temp', 'CW Supply Temp', 'Outdoor Temp', 'Outdoor Humidity', 'System Efficiency', 'Cooling Load'],
        units: ['L/s', '°C', '°C', '°C', '°C', '%', 'kW/RT', 'kW'],
      }]);
      vm.loading = false;
      break;
    case 'IndoorAirQuality':
      fillArray(vm, 'sensors', demoIaqSensors);
      break;
    case 'AssetTaggingSystem':
      fillArray(vm, 'allSensors', [
        { mac: 'C8:47:80:12:AE:01', rssi: -62, lastUpdated: new Date() },
        { mac: 'C8:47:80:12:AE:02', rssi: -76, lastUpdated: new Date() },
        { mac: 'C8:47:80:12:AE:03', rssi: -94, lastUpdated: new Date() },
      ]);
      fillArray(vm, 'outOfRangeTags', [{ mac: 'C8:47:80:12:AE:03', rssi: -94, lastUpdated: new Date() }]);
      fillArray(vm, 'logs', ['Demo tag AE:01 detected at -62 dBm', 'Demo tag AE:03 moved out of range', 'BLE gateway heartbeat received']);
      break;
    case 'SmartPestControlSystem':
      if (Array.isArray(vm.devices)) vm.devices.forEach((device, index) => {
        device.status = index === 0 ? 'Activated' : 'Not Activated';
        device.counterToday = 3 + index;
        device.counterLast7 = 18 + index * 4;
      });
      fillArray(vm, 'magneticHistory', sevenDays.map((day, index) => ({ day, count: [2, 4, 1, 5, 3, 2, 4][index] })));
      break;
    case 'SmartToiletSystem':
      // This page owns its nested washroom demo data directly.
      break;
    case 'SmartLandscapeSystem':
    case 'B05SmartLandscape':
      fillArray(vm, 'sensors', demoSoilSensors);
      fillArray(vm, 'sensorData', demoSoilSensors);
      if (vm.currentSensor && !vm.currentSensor.SoilMoisture) vm.currentSensor = demoSoilSensors[0];
      break;
    case 'B051314':
    case 'B051516':
    case 'B0507':
    case 'B0508':
    case 'B0509':
    case 'B0518':
    case 'integratedOperationCentre':
    case 'iceRoom':
      applyRoomReadings(vm);
      break;
    default:
      break;
  }
}

export default {
  install(app) {
    axios.interceptors.response.use(
      response => {
        if (isUsageRequest(response.config)) {
          const data = response.data;
          const hasData = Array.isArray(data?.days) && data.days.length > 0;
          if (!hasData) response.data = demoPowerPayload();
        }
        return response;
      },
      error => {
        if (isUsageRequest(error.config)) {
          return Promise.resolve({ data: demoPowerPayload(), status: 200, statusText: 'Demo data', headers: {}, config: error.config });
        }
        return Promise.reject(error);
      }
    );
    app.mixin({ mounted() { applyDemoData(this); } });
  },
};
