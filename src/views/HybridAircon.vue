<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Hybrid Aircon System</h2>

    <!-- Tabs Navigation -->
    <ul class="nav nav-tabs justify-content-center">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'schematics' }"
          @click="setActiveTab('schematics')">Schematics</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'floorplan' }"
          @click="setActiveTab('floorplan')">Floorplan</a>
      </li>
    </ul>

    <!-- Schematics Tab -->
    <div v-if="activeTab === 'schematics'" class="tab-content mt-4">
      <div class="row">
        <div class="col-md-12">
          <div class="relation-section">
            <h4>Schematics</h4>
            <div class="sensor-detection-diagram">
              <img src="@/assets/Hybrid Aircon Algo.png" alt="Relation View" class="relation-image">
            </div>

            <!-- Condition Dropdown -->
            <div class="row mt-4 condition-dropdown">
              <div class="col-12 text-center">
                <select id="conditionSelect" v-model="selectedCondition" class="form-select" @change="updateCondition">
                  <option v-for="(condition, index) in conditions" :key="index" :value="condition">
                    Conditions
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floorplan Tab -->
    <div v-if="activeTab === 'floorplan'" class="tab-content mt-4">
      <div class="row">
        <div class="col-md-12">
          <div class="map-section">
            <h4>Floorplan</h4>
            <div class="map-container">
              <img src="@/assets/Sub System and Icons/V2/B05-11-12_full_FCU_DAMpers.png" alt="Map View"
                class="map-image">

              <!-- Sensors on the floorplan -->
              <div v-for="sensor in sensors" :key="sensor.id" class="sensor-icon"
                :style="{ top: sensor.top, left: sensor.left }" @click="toggleButtons(sensor)">
                <!-- Online/Offline Status Dot -->
                <span class="status-dot" :class="sensor.isOnline ? 'online' : 'offline'"></span>
              </div>


              <!-- Aircon Box on the floorplan -->
              <div v-for="aircon in airconBoxes" :key="aircon.name" class="aircon-box"
                :style="{ top: aircon.top, left: aircon.left }" @click="openAirconDialog(aircon)">
                <!-- Online/Offline Status Dot -->
                <span class="status-dot" :class="aircon.isOnline ? 'online' : 'offline'"></span>
              </div>

              <!-- Global and Individual Slider Controls -->
              <div class="floorplan-controls">
                <!-- Global Controls on the top-left -->
                <div class="global-controls">
                  <div class="slider-control">
                    <label class="switch">
                      <input type="checkbox" :checked="allAirconOn" @change="toggleAllAircons" ref="airconCheckbox">
                      <span class="slider round"></span>
                    </label>
                    <span>{{ allAirconOn ? 'All Aircons ON' : 'All Aircons OFF' }}</span>
                  </div>

                  <div class="slider-control">
                    <label class="switch">
                      <input type="checkbox" v-model="allDampenerOn" @change="toggleAllDampeners">
                      <span class="slider round"></span>
                    </label>
                    <span>{{ allDampenerOn ? 'All Dampeners OPEN' : 'All Dampeners CLOSED' }}</span>
                  </div>
                </div>

                <div class="individual-controls">
                  <!-- FCU 1-1 and FCU 1-2 -->
                  <div v-for="aircon in airconBoxes.slice(0, 2)" :key="aircon.name" class="slider-control">
                    <label class="switch">
                      <input type="checkbox" :checked="aircon.isOnline"
                        @change="sendAirconState($event.target.checked, aircon.name)">
                      <span class="slider round"></span>
                    </label>
                    <span>{{ aircon.name }} {{ aircon.isOnline ? 'ON' : 'OFF' }}</span>
                  </div>

                  <!-- MDU 3 -->
                  <div v-for="sensor in sensors.slice(0, 1)" :key="sensor.id" class="slider-control">
                    <label class="switch">
                      <input type="checkbox"
                        :checked="sensor.isOnline"
                        @change="toggleSensor(sensor, $event.target.checked)">
                      <span class="slider round"></span>
                    </label>
                    <span>{{ sensor.name }} {{ sensor.isOnline ? 'OPEN' : 'CLOSED' }}</span>
                  </div>

                  <!-- FCU 2-1 and FCU 2-2 -->
                  <div v-for="aircon in airconBoxes.slice(2, 4)" :key="aircon.name" class="slider-control">
                    <label class="switch">
                      <input type="checkbox" :checked="aircon.isOnline"
                        @change="sendAirconState($event.target.checked, aircon.name)">
                      <span class="slider round"></span>
                    </label>
                    <span>{{ aircon.name }} {{ aircon.isOnline ? 'ON' : 'OFF' }}</span>
                  </div>

                  <!-- MDU 4 -->
                  <div v-for="sensor in sensors.slice(1, 2)" :key="sensor.id" class="slider-control">
                    <label class="switch">
                      <input type="checkbox"
                        :checked="sensor.isOnline"
                        @change="toggleSensor(sensor, $event.target.checked)">
                      <span class="slider round"></span>
                    </label>
                    <span>{{ sensor.name }} {{ sensor.isOnline ? 'OPEN' : 'CLOSED' }}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>


</template>


<script>
import axios from 'axios';

export default {
  name: 'HybridAircon',
  data() {
    return {
      activeTab: 'floorplan',
      showModal: false,
      modalTitle: '',
      currentType: '',
      allDampenerOn: false,
      allAirconOn: false,
      devices: [
        { id: 1, name: 'Indoor Air Quality Sensor', type: 'Indoor Air Quality Sensor', isOnline: true, lastUpdated: '2024-05-29 14:30:00' },
        { id: 3, name: 'Air-Con System', type: 'Air-Con System', isOnline: true, lastUpdated: '2024-05-29 14:30:00' },
        { id: 6, name: 'Motorized Dampener', type: 'Motorized Dampener', isOnline: true, lastUpdated: '2024-05-29 14:30:00' },
      ],
      sensors: [
        { id: 1, top: '42%', left: '45%', type: 'dampener', deviceEUI: '24E124756E049153', name: 'MCD 3', relayIndexes: [0, 2], isOnline: false },
        { id: 2, top: '55%', left: '81.2%', type: 'dampener', deviceEUI: '24E124756E049153', name: 'MCD 4', relayIndexes: [1, 3], isOnline: false },
      ],
      airconBoxes: [
        { top: '66%', left: '39%', name: 'FCU 1-1', isOnline: false, apiUrl: '/api/aircon/read/1' },
        { top: '66%', left: '47%', name: 'FCU 1-2', isOnline: false, apiUrl: '/api/aircon/read/2' },
        { top: '66%', left: '59%', name: 'FCU 2-1', isOnline: false, apiUrl: '/api/aircon/read/3' },
        { top: '66%', left: '73%', name: 'FCU 2-2', isOnline: false, apiUrl: '/api/aircon/read/4' }
      ],
      conditions: [
        'If Indoor Air Quality Sensor on acceptable CO2 Level, Motorized Dampener turned off and Fresh Air Fan turn off, else both turned on.',
        'If CO2 Level too high, turn on all Fresh Air Fans.',
        'If Motorized Dampener malfunctions, notify the maintenance team immediately.',
      ],
      selectedCondition: '',
      relayStatesByEui: {}
    };
  },
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab;  // Set the active tab
    },
    async setSwitch(state, deviceType) {
      let switchStates = Array(8).fill(0);

      if (deviceType === 'dampener') {
        const sensor = this.sensors.find(sensor => sensor.name === this.modalTitle);
        if (sensor) {
          sensor.isOnline = state;
          switchStates[2] = state ? 1 : 0;
          this.sendSwitchCommand(sensor.deviceEUI, switchStates);
        }
      }
    },
    async fetchAirconStatus(aircon) {
      try {
        const response = await axios.get(aircon.apiUrl);
        const mode = response.data.registers.find(register => register.name === 'Mode').value;

        // Update the isOnline status based on the Mode value
        if (mode === 2) {  // Mode 2 indicates 'Cool' (ON)
          aircon.isOnline = true;
        } else if (mode === 1) {  // Mode 1 indicates 'ON'
          aircon.isOnline = true;
        }
        else if (mode === 0) {  // Mode 0 indicates 'Off'
          aircon.isOnline = false;
        }
      } catch (error) {
        console.error(`Error fetching status for ${aircon.name}:`, error);
      }
    },
    // Fetch status for all aircons when component is mounted
    fetchAllAirconStatus() {
      this.airconBoxes.forEach(aircon => {
        this.fetchAirconStatus(aircon);
      });
    },
    // Call this method to manually refresh the aircon statuses
    refreshAirconStatuses() {
      this.fetchAllAirconStatus();
    },
    // Method to handle Aircon toggling logic
    sendAirconState(state, airconId) {
      let airconIndex;
      if (airconId === 'FCU 1-1') airconIndex = 1;
      else if (airconId === 'FCU 1-2') airconIndex = 2;
      else if (airconId === 'FCU 2-1') airconIndex = 3;
      else if (airconId === 'FCU 2-2') airconIndex = 4;

      const apiUrl = `/api/aircon/${airconIndex}`;
      const payload = { state: state ? 'on' : 'off' };

      axios.post(apiUrl, payload)
        .then(response => {
          console.log(`Aircon ${airconId} turned ${state ? 'on' : 'off'} successfully`, response.data);

          // Update the UI state for the aircon
          this.airconBoxes.forEach(aircon => {
            if (aircon.name === airconId) {
              aircon.isOnline = state;
            }
          });

          // If any FCU is turned on, turn off all MDUs
          if (state) {
            this.setAllDevicesState('dampener', false);  // Turn off all MDUs
          }
        })
        .catch(error => {
          console.error(`Error turning aircon ${airconId} ${state ? 'on' : 'off'}:`, error);
        });
    },

    turnOffAllMDUs() {
      // Iterate over all dampeners (MDUs) and turn them off
      this.sensors.forEach(sensor => {
        if (sensor.type === 'dampener' && sensor.isOnline) {
          // Only turn off if the MDU is currently online
          this.toggleSensor(sensor, false);
          console.log(`MDU ${sensor.name} turned off because an FCU is turned on.`);
        }
      });
    },

    // Method to handle turning off the MDU when aircon is turned on
    turnOffDampenerForAircon(airconId) {
      let mduId;

      // Map the aircon to the corresponding MDU that needs to be turned off
      if (airconId === 'FCU 1-1' || airconId === 'FCU 1-2') {
        mduId = 'MCD 1';  // Example MDU for FCU 1
      } else if (airconId === 'FCU 2-1' || airconId === 'FCU 2-2') {
        mduId = 'MCD 2';  // Example MDU for FCU 2
      }

      const mdu = this.sensors.find(sensor => sensor.name === mduId);

      if (mdu && mdu.isOnline) {
        // Only turn off the MDU (dampener) if it is already online
        this.toggleSensor(mdu, false);
        console.log(`MDU ${mduId} turned off because ${airconId} is turned on.`);
      }
    },
    // Method to handle turning on the MDU when aircon is turned off
    turnOnDampenerForAircon(airconId) {
      let mduId;

      // Map the aircon to the corresponding MDU that needs to be turned on
      if (airconId === 'FCU 1-1' || airconId === 'FCU 1-2') {
        mduId = 'MCD 1';  // Example MDU for FCU 1
      } else if (airconId === 'FCU 2-1' || airconId === 'FCU 2-2') {
        mduId = 'MCD 2';  // Example MDU for FCU 2
      }

      const mdu = this.sensors.find(sensor => sensor.name === mduId);

      if (mdu) {
        // Turn on the MDU (dampener) associated with the aircon
        this.toggleSensor(mdu, true);
        console.log(`MDU ${mduId} turned on because ${airconId} is turned off.`);
      }
    },
    // Method to toggle the MDU state
    async toggleSensor(sensor, state) {
      if (typeof state !== 'boolean') state = !!sensor.isOnline;

      // ❌ Block MDU ON if any FCU is ON
      if (sensor.type === 'dampener' && state) {
        const anyFCUOn = this.airconBoxes.some(a => a.isOnline);
        if (anyFCUOn) {
          sensor.isOnline = false;
          return;
        }
      }

      // Get current relay state (8 relays)
      const current = this.relayStatesByEui[sensor.deviceEUI] || Array(8).fill(0);
      const next = current.slice();

      // ✅ Apply state to ALL mapped relay indexes
      sensor.relayIndexes.forEach(idx => {
        next[idx] = state ? 1 : 0;
      });

      try {
        await this.sendSwitchCommand(sensor.deviceEUI, next);

        // Save state
        this.relayStatesByEui[sensor.deviceEUI] = next;

        // Update UI state for this sensor
        sensor.isOnline = state;

      } catch (e) {
        // Rollback UI
        sensor.isOnline = sensor.relayIndexes.some(
          idx => current[idx] === 1
        );
      }
    },
    // Method to send the switch command to the backend
    async sendSwitchCommand(deviceEUI, switchStates) {
      const url = '/api/command/ws558/';

      // 1. Map true/false → 1/0
      const switch_states = switchStates.map(s => s ? 1 : 0);

      // 2. Build the snake_case payload
      const payload = {
        device_eui: deviceEUI,
        switch_states
      };

      // 3. Log the full POST so you can verify it in DevTools
      console.log(`➡️ POST ${url}\n`, JSON.stringify(payload, null, 2));

      try {
        const response = await axios.post(url, payload);
        console.log('✅ Switch command sent successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error sending switch command:', error);
        throw error;  // propagate so your caller can handle it
      }
    },

    toggleAllDampeners() {
      this.setAllDevicesState('dampener', this.allDampenerOn);
    },

    // Additional logic for global toggling
    toggleAllAircons() {
      const newState = !this.allAirconOn;
      console.log("Toggling all aircons. New state:", newState);

      this.$refs.airconCheckbox.disabled = true;

      this.sendAirconCommand(newState)
        .then(() => {
          this.allAirconOn = newState;
          this.updateAirconStates(newState);

          console.log("Aircon state updated:", this.allAirconOn);

          if (newState) {
            console.log("Turning off all MDUs...");
            this.setAllDevicesState('dampener', false);
          }
        })
        .catch(error => {
          console.error('Error toggling all aircons:', error);
        })
        .finally(() => {
          this.$refs.airconCheckbox.disabled = false;
        });
    }
    ,

    async sendAirconCommand(state) {
      const payload = { state: state ? 'on' : 'off' };
      const targetUrl = '/api/aircon/control/master';

      try {
        const response = await axios.post(targetUrl, payload);
        console.log('Aircons toggled successfully', response.data);
        return response.data;
      } catch (error) {
        console.error('Error toggling aircons:', error);
        throw error;
      }
    },

    // Update the states of all aircons
    updateAirconStates(state) {
      this.airconBoxes.forEach(aircon => {
        aircon.isOnline = state;
        if (state) {
          this.turnOffDampenerForAircon(aircon.name); // Turn off the MDU if aircon is turned on
        } else {
          this.turnOnDampenerForAircon(aircon.name); // Turn on the MDU if aircon is turned off
        }
      });
    },

    setAllDevicesState(deviceType, state) {
      if (deviceType !== 'dampener') return;

      const deviceEUI = this.sensors[0].deviceEUI;
      const next = Array(8).fill(0);

      if (state) {
        // Only turn on relays that belong to dampeners
        this.sensors.forEach(sensor => {
          if (sensor.type === 'dampener') {
            sensor.relayIndexes.forEach(idx => {
              next[idx] = 1;
            });
          }
        });
      }

      this.sendSwitchCommand(deviceEUI, next);

      this.relayStatesByEui[deviceEUI] = next;

      // Sync UI
      this.sensors.forEach(sensor => {
        if (sensor.type === 'dampener') {
          sensor.isOnline = state;
        }
      });
    }

  },
  mounted() {
    // Fetch all aircon statuses when the component is mounted
    this.fetchAllAirconStatus();

    // Set up a polling interval to fetch the aircon statuses every 1 minute (60000 ms)
    this.intervalId = setInterval(() => {
      this.fetchAllAirconStatus();
    }, 60000);

    // init relay states for each deviceEUI we know about
    this.sensors.forEach(s => {
      if (!this.relayStatesByEui[s.deviceEUI]) {
        this.relayStatesByEui[s.deviceEUI] = Array(8).fill(0);
      }
    });

    // (optional) reflect current UI into relay state
    this.sensors.forEach(s => {
      if (!this.relayStatesByEui[s.deviceEUI]) {
        this.relayStatesByEui[s.deviceEUI] = Array(8).fill(0);
      }

      // Reflect UI → relay state
      if (Array.isArray(s.relayIndexes)) {
        s.relayIndexes.forEach(idx => {
          this.relayStatesByEui[s.deviceEUI][idx] = s.isOnline ? 1 : 0;
        });
      }
    });
  },
  
  beforeUnmount() {
    // Clear the interval when the component is destroyed to prevent memory leaks
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
};
</script>

<style scoped>
/* Basic styling */
.container-fluid {
  width: 100%;
  margin-bottom: 5rem;
}

h2 {
  font-size: 2rem;
  font-weight: bold;
}

.row {
  display: flex;
  justify-content: space-between;
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

.map-image {
  display: block;
  width: 100%;
  height: auto;
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
  /* Makes sure the controls are relative to the map */
}

.sensor-icon {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 1;
}

.sensor-title,
.aircon-title {
  position: absolute;
  top: -20px;
  /* Position the title above the icon */
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #000;
  white-space: nowrap;
}

.sensor-icon img,
.aircon-box img {
  width: 24px;
  height: 24px;
}

.status-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
}

.online {
  background-color: green;
}

.offline {
  background-color: red;
}

.device-status-card {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 15px;
  text-align: center;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.device-status-card h5 {
  font-size: 1.25rem;
  margin-bottom: 10px;
}

.device-status-card .status {
  font-size: 1.5rem;
  font-weight: bold;
}

.text-success {
  color: #28a745 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.all-buttons {
  position: absolute;
  bottom: 50px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.aircon-box {
  position: absolute;
  transform: translate(-50%, -50%);
}

.icon-image {
  width: 24px;
  height: 24px;
}

.bordered-text {
  border: 2px solid #000;
  padding: 10px;
  display: inline-block;
}

/* Condition Dropdown Styling */
.condition-dropdown {
  width: 100%;
  margin-top: 20px;
}

.condition-dropdown .form-select {
  width: 100%;
  max-width: 100%;
  padding: 10px;
  font-size: 1rem;
  border-radius: 5px;
}

/* Slider Controls Styling */
.slider-controls {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Slider control styling */
.slider-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-control span {
  font-size: 14px;
}

/* Toggle Switch Styling */
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
  left: 3px;
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

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  display: none;
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
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1050;
  width: 300px;
  color: black;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: bold;
  margin: 0;
  flex-grow: 1;
  text-align: center;
}

.btn-close {
  border: none;
  background: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #000;
}

.modal-body {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.btn-primary,
.btn-danger {
  width: 80px;
  margin: 0 10px;
}

/* Floorplan Control Layout */
.floorplan-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  gap: 20px;
  width: 100%;
  margin-top: -50px;
  /* This will pull the controls up */
}

/* Global Controls on the top-left */
.global-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: absolute;
  top: 0px;
  /* Move it to the top */
  left: 10px;
  /* Align to the left */
  z-index: 10;
}

/* Individual Controls on the top-right */
.individual-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: absolute;
  top: 0px;
  /* Move it to the top */
  right: 10px;
  /* Align to the right */
  z-index: 10;
}

.individual-slider-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Slider Switch Styling */
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
  left: 3px;
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

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.nav-tabs .nav-link {
  cursor: pointer;
}

.nav-tabs .nav-link.active {
  background-color: #007bff;
  color: white;
}

.sensor-icon {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.online {
  background-color: green;
}

.offline {
  background-color: red;
}

.floorplan-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.global-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.individual-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
