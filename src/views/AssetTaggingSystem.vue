<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Asset Tagging System</h2>
    <div class="row">
      <div class="col-md-6">
        <div class="relation-section">
          <h4 class="text-center mb-4">Sensor Detection</h4>
          <div class="sensor-detection-diagram position-relative">
            <img src="@/assets/Asset Tagging Algo.png" alt="Relation View" class="relation-image">
            <button class="btn btn-primary position-absolute bottom-0 end-0 m-3" @click="openModal">
              Adjust Condition
            </button>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="out-of-range-section">
          <h4 class="text-center mb-4">Out of Range</h4>
          <ul class="out-of-range-list">
            <li v-for="tag in outOfRangeTags" :key="tag.mac" class="out-of-range-item">
              <span class="tag-name">{{ tag.mac }}</span> -
              <span class="tag-updated">{{ formatDate(tag.lastUpdated) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Log + RSSI Threshold -->
    <div class="row mt-4">
      <div class="col-md-8">
        <div class="log-dialog">
          <h4>Logs</h4>
          <ul class="log-list">
            <li v-for="(log, index) in logs" :key="index">{{ log }}</li>
          </ul>
        </div>
      </div>

      <div class="col-md-4">
        <div class="log-dialog">
          <h4>RSSI Range</h4>

          <label class="form-label mt-2">Out-of-range if RSSI is below:</label>
          <input type="number" class="form-control" v-model.number="rssiThreshold" step="1" />

          <small class="text-light d-block mt-2">
            Current threshold: {{ rssiThreshold }} dBm
          </small>
        </div>
      </div>
    </div>


    <!-- Conditions in Text Form -->
    <div class="row mt-4 condition-text">
      <div class="col-12">
        <h4>{{ conditions[0] }}</h4>
        <ul>
          <li v-for="(condition, index) in conditions.slice(1)" :key="index">
            {{ condition }}
          </li>
        </ul>
      </div>
    </div>


    <!-- Modal for adjusting BLE Beacon settings -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal"></div>
    <div v-if="showModal" class="modal d-block">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Adjust Conditions</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div class="condition-input">
              <label>BLE Beacon 1</label>
              <select v-model="bleBeacon1Status" class="form-control">
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>
            <div class="condition-input">
              <label>BLE Beacon 2</label>
              <select v-model="bleBeacon2Status" class="form-control">
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
            <button type="button" class="btn btn-primary" @click="saveConditions">Save changes</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mqtt from 'mqtt';

export default {
  name: 'AssetTaggingSystem',
  data() {
    return {
      rssiThreshold: Number(localStorage.getItem('rssiThreshold')) || -90,
      devices: [
        { mac: 'fce8c0426458', type: 'BLE Beacon', isOnline: true, lastUpdated: new Date() }
      ],
      outOfRangeTags: [],
      logs: [], // Array to store logs
      showModal: false,
      bleBeacon1Status: 'On',
      bleBeacon2Status: 'On',
      conditions: [
        "If BLE Beacon 1 and Beacon 2 are on, BLE Tags are able to detect within range.",
        "If BLE Beacon 1 is off, BLE Tags cannot be detected.",
        "If BLE Beacon 2 is off, BLE Tags cannot be detected.",
        "If both BLE Beacons are off, BLE Tags cannot be detected."
      ],
      selectedCondition: "Conditions",
      allSensors: [],
      client: null, // MQTT client
      interval: null,
    };
  },
  methods: {
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    saveConditions() {
      alert(`BLE Beacon 1: ${this.bleBeacon1Status}, BLE Beacon 2: ${this.bleBeacon2Status}`);
      this.closeModal();
    },
    // Connect via MQTT using the proxy (running on ws://localhost:9001)
    connectMQTT() {
      this.client = mqtt.connect('ws://152.42.161.80:9001');

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker via proxy');
        this.addLog('Connected to MQTT broker via proxy');

        // Subscribe to your topic
        this.client.subscribe('/MKGW3/fce8c0426458/send', (err) => {
          if (!err) {
            console.log('Subscribed to /MKGW3/fce8c0426458/send');
            this.addLog('Subscribed to /MKGW3/fce8c0426458/send');

            // Optionally publish a test message
            // this.client.publish('/MKGW3/fce8c0426458/send', 'Hello from Vue via proxy!');
          } else {
            console.error('Subscription error:', err);
            this.addLog(`Subscription error: ${err}`);
          }
        });
      });

      // Handle incoming MQTT messages
      this.client.on('message', (topic, message) => {
        try {
          const parsed = JSON.parse(message.toString());
          // Check if the incoming data is an array (i.e., multiple sensor readings)
          if (Array.isArray(parsed.data)) {
            parsed.data.forEach(sensor => {
              const rssi = sensor.rssi;
              const sensorTimestamp = sensor.timestamp ? new Date(sensor.timestamp) : new Date();
              const mac = sensor.mac;

              // Update the sensor list (allSensors)
              const existingSensor = this.allSensors.find(s => s.mac === mac);
              if (!existingSensor) {
                if (this.allSensors.length < 28) {
                  this.allSensors.push({ mac, rssi, lastUpdated: sensorTimestamp });
                }
              } else {
                existingSensor.rssi = rssi;
                existingSensor.lastUpdated = sensorTimestamp;
              }

              // Only log and update out-of-range sensors if the rssi is below the threshold
              if (rssi < this.rssiThreshold) {
                this.addToOutOfRange(mac);
              } else {
                this.removeFromOutOfRange(mac);
              }
            });
          } else {
            // If parsed.data is not an array, you can choose to ignore it or handle it differently.
            // For now, we ignore non-array data so that logs are only generated from array sensor readings.
          }
        } catch (e) {
          // For debugging purposes you might want to log errors,
          // but if you want no logs except out-of-range, you can comment out the following line.
          console.error('Error parsing MQTT message:', e);
        }
      });


      // Error handling
      this.client.on('error', (error) => {
        console.error('MQTT Error:', error);
        this.addLog(`MQTT Error: ${error}`);
      });
    },

    // Existing methods for handling sensors, out-of-range, logs, etc.
    addToOutOfRange(mac) {
      const tag = this.allSensors.find(d => d.mac === mac);
      if (tag && !this.outOfRangeTags.find(t => t.mac === mac)) {
        this.outOfRangeTags.push({
          mac: tag.mac,
          lastUpdated: new Date(),
        });
        this.addLog(`MAC ${mac} out-of-range at ${this.formatDate(new Date())}`);
      }
    },
    removeFromOutOfRange(mac) {
      this.outOfRangeTags = this.outOfRangeTags.filter(tag => tag.mac !== mac);
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    },
    addLog(message) {
      this.logs.unshift(message);
    }
  },
  mounted() {
    // Connect to the MQTT broker when the component mounts
    this.connectMQTT();
  },
  beforeUnmount() {
    clearInterval(this.interval);
    if (this.client) {
      this.client.end();
    }
  },
  watch: {
    rssiThreshold(newValue) {
      localStorage.setItem('rssiThreshold', newValue);
      this.addLog(`RSSI threshold updated to ${newValue} dBm`);
    }
  },

};
</script>

<style scoped>
/* Your existing styles */
.container-fluid {
  width: 100%;
  padding: 2rem;
}

h2 {
  font-size: 2rem;
  font-weight: bold;
}

.relation-section,
.out-of-range-section {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  height: 100%;
}

.sensor-detection-diagram {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  overflow: hidden;
}

.relation-image {
  max-width: 100%;
  max-height: 100%;
}

.out-of-range-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
  text-align: left;
  background-color: red;
  color: black;
}

.out-of-range-item {
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
  background-color: red;
  color: black;
}

.tag-name {
  font-weight: bold;
}

.log-dialog {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.log-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.log-list li {
  padding: 5px 0;
  border-bottom: 1px solid #ccc;
}

.condition p {
  font-size: 1.2rem;
  font-weight: bold;
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
  width: 500px;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding-top: 10px;
}

.btn-close {
  border: none;
  background: none;
}

.condition-input {
  margin-bottom: 10px;
}

.modal-content {
  color: black;
}
</style>
