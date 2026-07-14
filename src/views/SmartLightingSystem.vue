<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Smart Lighting System</h2>

    <!-- Centered Tabs Navigation -->
    <ul class="nav nav-tabs justify-content-center">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'floorplan' }"
          @click="setActiveTab('floorplan')">Floorplan</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'schematics' }"
          @click="setActiveTab('schematics')">Schematics</a>
      </li>
    </ul>

    <!-- Floorplan Tab -->
    <div v-if="activeTab === 'floorplan'" class="tab-content mt-4">
      <div class="row d-flex justify-content-between">
        <!-- Sensor Controls (left) -->
        <div class="col-md-6 sensor-controls-container">
          <div class="relation-section">
            <div class="sensor-controls">
              <h4>Lighting Controls</h4>
              <div class="row sensor-control-container">

                <!-- ALL ON/OFF Control (left side) -->
                <div class="col-6 all-on-control">
                  <label class="switch">
                    <input type="checkbox" v-model="allOn">
                    <span class="slider round"></span>
                  </label>
                  <span>{{ allOn ? 'ALL OFF' : 'ALL ON' }}</span>
                </div>

                <!-- Individual Sensor Controls for B05-11/12 -->
                <div class="col-6 individual-sensor-controls" v-if="selectedImage === 'B05-11-12_full_empty.png'">
                  <div v-for="(sensor, index) in currentSensors" :key="index"
                    class="sensor-control mb-3 d-flex align-items-center justify-content-between">
                    <!-- Zone name and status -->
                    <span :style="{ color: sensor.isOnline ? 'lightgreen' : 'white' }">
                      {{ sensor.name }} ({{ sensor.isOnline ? 'Lights On' : 'Lights Off' }})
                    </span>

                    <!-- Control Button for B05-11/12 -->
                    <button :class="sensor.isOnline ? 'btn btn-danger' : 'btn btn-primary'"
                      @click="toggleModal(sensor)">
                      {{ sensor.isOnline ? 'Set' : 'Set' }}
                    </button>
                  </div>
                </div>

                <!-- For other B05-X floorplans, use the default controls -->
                <div class="col-6 individual-sensor-controls" v-else>
                  <div v-for="(sensor, index) in currentSensors" :key="index"
                    class="sensor-control mb-3 d-flex align-items-center justify-content-between">
                    <!-- Zone name and status -->
                    <span :style="{ color: sensor.isOnline ? 'lightgreen' : 'white' }">
                      {{ sensor.name }} ({{ sensor.isOnline ? 'Lights On' : 'Lights Off' }})
                    </span>

                    <!-- Default slider control -->
                    <label class="switch">
                      <input type="checkbox" v-model="sensor.isOnline" @change="setZoneState(sensor.isOnline, sensor)">
                      <span class="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal for B05-11/12 -->
        <div v-if="showModal" class="modal d-block">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ modalTitle }}</h5>
                <button type="button" class="btn-close" @click="closeModal"></button>
              </div>
              <div class="modal-body text-center">
                <div class="instructions">
                  <p><strong>Step 1:</strong> Use the slider controls below to adjust the brightness and color
                    temperature of the lights.</p>
                  <p><strong>Step 2:</strong> When you’re satisfied with your settings, toggle the switch to turn the
                    lights on or off.</p>
                </div>

                <!-- Zone Control: Slider Controls -->
                <div v-if="selectedImage === 'B05-11-12_full_empty.png'" class="zone-control">
                  <h5>{{ currentSensor.name }} Control</h5>
                  <label>Color Temperature (Level 1): {{ currentSensor.level1 }}</label>
                  <input type="range" v-model="currentSensor.level1" min="0" max="100" step="100" />

                  <label>Dimming (Level 2): {{ currentSensor.level2 }}</label>
                  <input type="range" v-model="currentSensor.level2" min="0" max="100" />

                </div>

                <!-- On/Off Switch -->
                <div class="switch-container mt-3" style="display: flex; justify-content: center; align-items: center;">
                  <label class="switch">
                    <input type="checkbox" v-model="currentSensor.isOnline"
                      @change="setZoneState(currentSensor.isOnline, currentSensor)">
                    <span class="slider round"></span>
                  </label>
                  <span style="margin-left: 10px;">{{ currentSensor.isOnline ? 'OFF' : 'ON' }}</span>
                </div>


              </div>
            </div>
          </div>
        </div>



        <!-- Floorplan (right) -->
        <div class="col-md-6 map-section-container">
          <div class="map-section">
            <!-- Conditionally hide title for B05-07, B05-08, and B05-09 -->
            <h4
              v-if="!['B05-07_empty.png', 'B05-08_empty_light.png', 'B05-09_full_lighting.png'].includes(selectedImage)">
              Floorplan
            </h4>
            <div class="mb-3">
              <select v-model="selectedImage" class="form-select">
                <option v-for="(image, index) in images" :key="index" :value="image.value">{{ image.label }}</option>
              </select>
            </div>
            <div class="map-container">
              <!-- Floorplan Image -->
              <img :src="getImagePath(selectedImage)" alt="Map View" class="map-image">

              <!-- Conditionally hide sliders for B05-07, B05-08, and B05-09 -->
              <!-- <div
                v-if="showSlider() && !['B05-07_empty.png', 'B05-08_empty_light.png', 'B05-09_full_lighting.png'].includes(selectedImage)"
                class="slider-container">
                <label class="switch">
                  <input type="checkbox" v-model="allOn">
                  <span class="slider round"></span>
                </label>
                <span class="slider-label">{{ allOn ? 'ALL OFF' : 'ALL ON' }}</span>
              </div> -->

              <!-- Individual sensor sliders for B05-07, B05-08, B05-09 at top right -->
              <!-- <div
                v-if="['B05-07_empty.png', 'B05-08_empty_light.png', 'B05-09_full_lighting.png'].includes(selectedImage)"
                class="sensor-list">
                <div v-for="(sensor, index) in currentSensors" :key="index" class="sensor-control">
                  <span :style="{ color: sensor.isOnline ? 'lightgreen' : 'white' }">{{ sensor.name }} ({{
                    sensor.isOnline ? 'Online' : 'Offline' }})</span>
                  <label class="switch">
                    <input type="checkbox" v-model="sensor.isOnline" @change="setZoneState(sensor.isOnline, sensor)" />
                    <span class="slider round"></span>
                  </label>
                </div>
              </div> -->

              <!-- Status indicators for B05-07, B05-08, B05-09 -->
              <div
                v-if="['B05-07_empty.png', 'B05-08_empty_light.png', 'B05-09_full_lighting.png'].includes(selectedImage)">
                <div v-for="(sensor, index) in currentSensors" :key="index" class="status-indicator"
                  :style="{ top: sensor.top, left: sensor.left }">
                  <span :class="['status-dot', sensor.isOnline ? 'online' : 'offline']"></span>
                </div>
              </div>

              <!-- Retain the icons for B05-11/12 -->
              <div v-else>
                <div v-for="(sensor, index) in currentSensors" :key="index" class="sensor-icon"
                  :style="{ top: sensor.top, left: sensor.left }" @click="toggleModal(sensor)">
                  <img :src="require('@/assets/lighting.png')" alt="Lighting Icon" class="lighting-icon" />
                  <span :class="['status-dot', sensor.isOnline ? 'online' : 'offline']"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="gateway-grid mt-4">
        <div v-for="device in devices" :key="device.id">
          <div class="device-status-card">
            <h5>{{ device.name }}</h5>
            <p class="status" :class="{ 'text-success': device.isOnline, 'text-danger': !device.isOnline }">
              {{ device.isOnline ? 'Online' : 'Offline' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Schematics Tab -->
    <div v-if="activeTab === 'schematics'" class="tab-content mt-4">
      <div class="schematics-section">
        <h4>Algorithm</h4>
        <img src="@/assets/Smart Lighting Algo.png" alt="Smart Lighting Schematics" class="schematics-image">
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import { demoLightingDevices } from '@/demoData';

export default {
  name: 'SmartLightingSystem',
  data() {
    return {
      activeTab: 'floorplan', // Add this to track the active tab
      devices: demoLightingDevices,
      selectedImage: 'B05-07_empty.png',
      images: [
        { value: 'B05-07_empty.png', label: 'B05-07' },
        { value: 'B05-08_empty_light.png', label: 'B05-08' },
        { value: 'B05-09_full_lighting.png', label: 'B05-09' },
        { value: 'B05-11-12_full_empty.png', label: 'B05-11 & 12' },
        // { value: 'B05 13-14_lighting.png', label: 'B05-13 & 14' },
        { value: 'B05 15-16_full_lighting.png', label: 'B05-15 & 16' },
        { value: '2B05-18_full1_lighting.png', label: 'B05-18' },
      ],
      sensors: {
        'B05-07_empty.png': [
          { top: '24%', left: '40%', name: 'Row 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131774' }, // Row 1
          { top: '15%', left: '43%', name: 'Row 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131940' }, // Row 2
          { top: '15%', left: '49%', name: 'Row 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131721' }, // Row 3
          { top: '15%', left: '54.5%', name: 'Row 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D099018' }, // Row 4
          { top: '15%', left: '60.5%', name: 'Row 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D130904' }, // Row 5
          { top: '15%', left: '66.5%', name: 'Row 6', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131065' }  // Row 6
        ],
        'B05-08_empty_light.png': [
          { top: '24%', left: '67%', name: 'Row 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131508' },
          { top: '15%', left: '65%', name: 'Row 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131142' },
          { top: '15%', left: '59%', name: 'Row 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131803' },
          { top: '15%', left: '53%', name: 'Row 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131818' },
          { top: '15%', left: '47%', name: 'Row 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131201' },
          { top: '15%', left: '41%', name: 'Row 6', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131779' }
        ],
        'B05-09_full_lighting.png': [
          { top: '24%', left: '39%', name: 'Row 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131156' }, // Row 1
          { top: '13%', left: '42%', name: 'Row 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D139009' }, // Row 2
          { top: '13%', left: '48%', name: 'Row 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131050' }, // Row 3
          { top: '13%', left: '54%', name: 'Row 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131870' }, // Row 4
          { top: '13%', left: '60%', name: 'Row 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131793' }, // Row 5
          { top: '13%', left: '66%', name: 'Row 6', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131824' }  // Row 6
        ],
        'B05-11-12_full_empty.png': [
          { top: '15%', left: '78%', name: 'Zone 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001720', level1: 0, level2: 50 },
          { top: '15%', left: '70%', name: 'Zone 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001713', level1: 0, level2: 50 },
          { top: '15%', left: '62%', name: 'Zone 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED010000166B', level1: 0, level2: 50 },
          { top: '36%', left: '62%', name: 'Zone 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001704', level1: 0, level2: 50 },
          { top: '15%', left: '45.5%', name: 'Zone 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001716', level1: 0, level2: 50 },
          { top: '15%', left: '38%', name: 'Zone 6', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001711', level1: 0, level2: 50 },
          { top: '15%', left: '30%', name: 'Zone 7', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED010000170F', level1: 0, level2: 50 },
          { top: '15%', left: '21.5%', name: 'Zone 8', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED010000173B', level1: 0, level2: 50 },
        ],
        // 'B05 13-14_lighting.png': [
        //   { top: '15%', left: '78%', name: 'Zone 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001720', level1: 0, level2: 0 },
        //   { top: '15%', left: '70%', name: 'Zone 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001713', level1: 0, level2: 0 },
        //   { top: '15%', left: '62%', name: 'Zone 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED010000166B', level1: 0, level2: 0 },
        //   { top: '36%', left: '62%', name: 'Zone 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001704', level1: 0, level2: 0 },
        //   { top: '15%', left: '45.5%', name: 'Zone 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001716', level1: 0, level2: 0 },
        //   { top: '15%', left: '38%', name: 'Zone 6', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED0100001711', level1: 0, level2: 0 },
        //   { top: '15%', left: '30%', name: 'Zone 7', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED010000170F', level1: 0, level2: 0 },
        //   { top: '15%', left: '21.5%', name: 'Zone 8', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '0004ED010000173B', level1: 0, level2: 0 },
        // ],
        'B05 15-16_full_lighting.png': [
          { top: '23%', left: '44%', name: 'Zone 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131818' },
          { top: '14%', left: '41%', name: 'Zone 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131818' },
          { top: '14%', left: '34%', name: 'Zone 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131818' },
          { top: '14%', left: '27%', name: 'Zone 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131803' },
          { top: '14%', left: '21%', name: 'Zone 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131803' },
          { top: '23%', left: '53%', name: 'Zone 6', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131779' },
          { top: '14%', left: '59%', name: 'Zone 7', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131779' },
          { top: '14%', left: '66%', name: 'Zone 8', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131779' },
          { top: '14%', left: '75%', name: 'Zone 9', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131201' },
          { top: '14%', left: '82%', name: 'Zone 10', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131201' },
        ],
        '2B05-18_full1_lighting.png': [
          { top: '23%', left: '40%', name: 'Row 1', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131156' }, // Row 1
          { top: '15%', left: '45%', name: 'Row 2', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D139009' }, // Row 2
          { top: '15%', left: '52%', name: 'Row 3', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131050' }, // Row 3
          { top: '15%', left: '62%', name: 'Row 4', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131870' }, // Row 4
          { top: '14%', left: '69%', name: 'Row 5', isOnline: false, lastUpdated: '2024-05-29 14:30:00', deviceEUI: '24E124782D131793' }, // Row 5
        ]
      },
      showModal: false,
      modalTitle: '',
      currentSensor: null,

      // ALL ON toggle
      allOn: false
    };
  },
  computed: {
    currentSensors() {
      return this.sensors[this.selectedImage] || [];
    }
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;  // Switch between 'floorplan' and 'schematics' tabs
    },
    toggleModal(sensor) {
      this.modalTitle = sensor.name;
      this.currentSensor = sensor;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    async sendSwitchCommand(deviceEUI, switchStates, zoneIndex) {
      const url = '/api/command/ws503/';

      // 1. Map true/false → 1/0
      const switch_states = switchStates.map(s => s ? 1 : 0);

      // 2. Build snake_case payload
      const payload = {
        device_eui: deviceEUI,
        switch_states
      };

      // 3. Log exactly what we’re sending
      console.log(
        `➡️ POST ${url} for zone ${zoneIndex} with payload:`,
        JSON.stringify(payload, null, 2)
      );

      try {
        const response = await axios.post(url, payload);

        if (response && response.data) {
          console.log('Switch command response:', response.data);

          // 4. Update only the specific sensor in the current zone
          const sensor = this.currentSensors[zoneIndex];
          if (sensor) {
            // online if any switch = 1
            sensor.isOnline = switch_states.some(state => state === 1);
            console.log(
              `Zone ${zoneIndex + 1} updated: ${sensor.isOnline ? 'ON' : 'OFF'}`
            );
          }
        } else {
          console.warn('Switch command sent but no data returned from server');
        }
      } catch (error) {
        console.error('Error sending switch command:', error);
      }
    },

    // Function to toggle all devices ON or OFF
    async toggleAllDevices() {
      console.log(`Toggling All Devices: ${this.allOn ? 'ON' : 'OFF'}`);
      const apiUrl = this.allOn
        ? `http://192.168.0.200:5000/device/on`
        : `http://192.168.0.200:5000/device/off`;

      if (this.selectedImage === 'B05-11-12_full_empty.png') {
        // Build { deviceId, deviceId2…deviceId8 } from your currentSensors array
        const payload = this.currentSensors.reduce((acc, sensor, idx) => {
          const key = idx === 0
            ? 'deviceId'
            : `deviceId${idx + 1}`;
          acc[key] = sensor.deviceEUI;
          return acc;
        }, {});

        try {
          const response = await axios.post(apiUrl, payload);
          console.log('All B05‑11/12 devices toggled:', response.data);
          // Mirror the new state locally
          this.currentSensors.forEach(sensor => sensor.isOnline = this.allOn);
        } catch (err) {
          console.error('Error toggling B05‑11/12 devices:', err);
        }
      }
      else if (['B05-07_empty.png', 'B05-08_empty_light.png', 'B05-09_full_lighting.png'].includes(this.selectedImage)) {
        // Handle B05-07, B05-08, and B05-09
        const switchStates = this.allOn ? [1, 1, 1] : [0, 0, 0];
        for (const sensor of this.currentSensors) {
          await this.sendSwitchCommand(sensor.deviceEUI, switchStates);
        }
      } else if (this.selectedImage === 'B05 15-16_full_lighting.png') {
        // Handle B05-15 & 16
        for (const [index, sensor] of this.currentSensors.entries()) {
          let zoneStates = [];
          switch (index) {
            case 0:
            case 3:
            case 5:
            case 8:
              zoneStates = this.allOn ? [1, 0, 0] : [0, 0, 0];
              break;
            case 1:
            case 4:
            case 6:
            case 9:
              zoneStates = this.allOn ? [0, 1, 0] : [0, 0, 0];
              break;
            case 2:
            case 7:
              zoneStates = this.allOn ? [0, 0, 1] : [0, 0, 0];
              break;
            default:
              zoneStates = [0, 0, 0];
          }
          await this.sendSwitchCommand(sensor.deviceEUI, zoneStates);
        }
      } else if (this.selectedImage === '2B05-18_full1_lighting.png') {
        // Handle B05-18
        const switchStates = this.allOn ? [1, 1, 1] : [0, 0, 0];
        for (const sensor of this.currentSensors) {
          await this.sendSwitchCommand(sensor.deviceEUI, switchStates);
        }
      } else {
        // Default case for other floorplans
        const payload = this.currentSensors.reduce((acc, sensor, index) => {
          acc[`deviceId${index + 1}`] = sensor.deviceEUI;
          return acc;
        }, {});

        try {
          const response = await axios.post(apiUrl, payload);
          console.log('All devices state response:', response.data);
          this.currentSensors.forEach(sensor => (sensor.isOnline = this.allOn));
        } catch (error) {
          console.error('Error setting all devices state:', error);
        }
      }
    },
    // Function to handle zone state changes (ON/OFF)
    async setZoneState(state, sensor) {
      console.log("Turning on/off here.")
      this.updateZone(sensor);
      if (this.selectedImage === 'B05-11-12_full_empty.png') {
        // For B05-11 & 12, send an individual API request
        const apiUrl = state
          ? `http://192.168.0.200:5000/device/on`
          : `http://192.168.0.200:5000/device/off`;

        try {
          const response = await axios.post(apiUrl, { deviceId: sensor.deviceEUI });
          console.log(`Device ${sensor.deviceEUI} state response:`, response.data);

          // Update the sensor status locally
          sensor.isOnline = state;
        } catch (error) {
          console.error(`Error toggling device ${sensor.deviceEUI} state:`, error);
        }
        console.log("ends here")
      } else if (['B05-07_empty.png', 'B05-08_empty_light.png', 'B05-09_full_lighting.png'].includes(this.selectedImage)) {
        // Handle B05-07, B05-08, and B05-09
        const switchStates = state ? [1, 1, 1] : [0, 0, 0];
        await this.sendSwitchCommand(sensor.deviceEUI, switchStates);
      } else if (this.selectedImage === 'B05 15-16_full_lighting.png' || this.selectedImage === '2B05-18_full1_lighting.png') {
        // Handle B05-15 & 16 or B05-18
        let switchStates = [];
        const zoneIndex = this.currentSensors.indexOf(sensor);

        switch (zoneIndex) {
          case 0:
          case 3:
          case 5:
          case 8:
            switchStates = state ? [1, 0, 0] : [0, 0, 0];
            break;
          case 1:
          case 4:
          case 6:
          case 9:
            switchStates = state ? [0, 1, 0] : [0, 0, 0];
            break;
          case 2:
          case 7:
            switchStates = state ? [0, 0, 1] : [0, 0, 0];
            break;
          default:
            switchStates = [0, 0, 0];
        }
        await this.sendSwitchCommand(sensor.deviceEUI, switchStates);
      } else {
        // Default handling
        const apiUrl = state
          ? `http://192.168.0.200:5000/device/on`
          : `http://192.168.0.200:5000/device/off`;

        try {
          const response = await axios.post(apiUrl, { deviceId: sensor.deviceEUI });
          console.log(`Device ${sensor.deviceEUI} state response:`, response.data);

          // Update the sensor status locally
          sensor.isOnline = state;
        } catch (error) {
          console.error(`Error toggling device ${sensor.deviceEUI} state:`, error);
        }
      }
    },
    // Function to update zone dimming for B05-11/12
    async updateZone(sensor) {
      const apiUrl = `http://192.168.0.200:5000/device/dim`;

      // Prepare the JSON payload with the deviceId and dimming levels
      const payload = {
        deviceId: sensor.deviceEUI,
        level1: sensor.level1,  // The current level1 (color temperature or brightness)
        level2: sensor.level2   // The current level2 (dimming level)
      };

      try {
        // Send the POST request to update the dimming levels
        const response = await axios.post(apiUrl, payload);
        console.log('Zone dimming response:', response.data);

        // Handle any additional actions after the update (e.g., UI updates)
      } catch (error) {
        console.error('Error updating zone dimming:', error);
      }

      // Close the modal after sending the update
      this.closeModal();
    },
    getImagePath(image) {
      return require(`@/assets/Sub System and Icons/V2/${image}`);
    },
    showSlider() {
      return this.selectedImage !== 'B05-11-12_empty.jpg';
    }
  },
  watch: {
    allOn() {
      this.toggleAllDevices();
    }
  }
};
</script>

<style scoped>
.col-md-3 {
  flex-basis: 23%;
  /* Adjust to 23% to fit four items per row */
}

.mb-3 {
  margin-bottom: 1rem;
}

.container-fluid {
  width: 100%;
  padding-bottom: 10%;
}

h2 {
  font-size: 2rem;
  font-weight: bold;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.relation-section,
.map-section {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  height: 100%;
}

.relation-image,
.map-image {
  width: 100%;
  height: auto;
  transition: transform 0.1s ease-out;
}

.map-container {
  overflow: hidden;
  height: 100%;
  position: relative;
}

.sensor-icon {
  position: absolute;
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 1;
}

.status-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  z-index: 2;
}

.online {
  background-color: green;
  border: solid white 0.5px;
}

.offline {
  background-color: red;
  border: solid white 0.5px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal.d-block {
  display: block;
}

.modal-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  color: black;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1050;
  width: 500px;
}

.device-status-card {
  background-color: #e9f7fd;
  padding: 15px;
  text-align: center;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  min-height: 116px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.device-status-card h5 {
  font-size: 1.25rem;
  margin-bottom: 10px;
  color: #17324d;
}

.device-status-card .status {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0;
}

.gateway-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  width: 100%;
}

@media (max-width: 992px) {
  .gateway-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 576px) {
  .gateway-grid {
    grid-template-columns: 1fr;
  }
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

/* Slider Container */
.slider-container {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.slider-label {
  font-weight: bold;
}

.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: green;
}

input:checked+.slider:before {
  transform: translateX(14px);
}

.zone-control input[type="range"] {
  width: 80%;
  margin: 10px 0;
}

.zone-control label {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.sensor-list {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 10px;
  border-radius: 5px;
}

.sensor-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sensor-control span {
  font-size: 1.1rem;
}

.sensor-control label {
  margin-left: 10px;
}

/* Container for status indicator */
.status-indicator {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
}

/* Status dot for online/offline */
.status-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.sensor-control-container {
  display: flex;
  justify-content: space-between;
  padding-top: 15%;
  /* Align left and right */
}

.all-on-control,
.individual-sensor-controls {
  display: flex;
  flex-direction: column;
  font-size: 1.2rem;
}

.all-on-control {
  flex-basis: 45%;
  /* Controls the space for ALL ON/OFF */
}

.individual-sensor-controls {
  flex-basis: 50%;
  /* Controls the space for individual sensors */
}

.sensor-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 4px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: green;
}

input:checked+.slider:before {
  transform: translateX(14px);
}

.row {
  display: flex;
  justify-content: space-between;
  /* Align items left and right */
}

.sensor-controls-container {
  max-width: 49%;
  /* Controls the width of the Sensor Controls on the left */
}

.map-section-container {
  max-width: 50%;
  /* Controls the width of the Floorplan on the right */
}

.relation-section,
.map-section {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
}

.all-on-control {
  display: flex;
  align-items: center;
  /* Aligns the text and slider vertically */
  gap: 10px;
  /* Adds space between the slider and the text */
  justify-content: start;
  /* Aligns the content to the left */
}

/* Tab styles */
.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  background-color: #007bff;
  color: white;
}

.schematics-section {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: white;
}

.schematics-image {
  width: 100%;
  max-width: 600px;
  height: auto;
  margin-top: 20px;
  border-radius: 5px;
}

.lighting-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  opacity: 0;
}

.form-select {
  font-size: 1.2rem;
}

.instructions {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  line-height: 1.4;
}

.switch-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
  /* if needed */
}
</style>
