<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Smart Pest Control System</h2>

    <!-- Top row: Livecam (left) + Cards (right) -->
    <div class="row">
      <!-- Livecam -->
      <div class="col-md-6">
        <div class="relation-section">
          <h4 class="livecam-title">
            Livecam
            <button v-if="!sessionActive" @click="startOrResumeSession"
              class="btn btn-primary floating-livecam-button-icon">
              <i class="fas fa-plus"></i>
            </button>
          </h4>

          <div class="sensor-detection-diagram position-relative" style="height:88%">
            <div v-if="!hyperbeamSessionStarted" class="no-session-text">
              Session has not started yet.
            </div>

            <div v-if="hyperbeamSessionStarted"
              style="display:flex; justify-content:center; align-items:center; height:100%;">
              <video ref="liveVideo" controls autoplay muted playsinline
                style="width:80%; height:auto; border-radius:8px; background:black;"></video>
            </div>
          </div>
        </div>
      </div>

      <!-- Cards -->
      <div class="col-md-6">
        <div class="relation-section">
          <div class="row mt-2">
            <div class="col-12" v-for="device in devices" :key="device.id">
              <!-- Main card -->
              <div class="device-status-card">
                <h5>{{ device.name }}</h5>
                <p class="status" :class="{
                  'text-success': device.status === 'Activated',
                  'text-danger': device.status !== 'Activated'
                }">
                  {{ device.status }}
                </p>
              </div>

              <!-- Below: 2 mini boxes -->
              <div class="activation-row">
                <div class="activation-box">
                  <div class="activation-label">
                    No. of Activation<br />(per day)
                  </div>
                  <div class="activation-value">{{ device.counterToday }}</div>
                </div>

                <div class="activation-box">
                  <div class="activation-label">
                    No. of Activation<br />(7 days)
                  </div>
                  <div class="activation-value">{{ device.counterLast7 }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Modal -->
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
              <label>PIR Sensor</label>
              <select v-model="pirSensorStatus" class="form-control">
                <option value="Detected">Detected</option>
                <option value="Not Detected">Not Detected</option>
              </select>
            </div>
            <div class="condition-input">
              <label>Magnetic Lock</label>
              <select v-model="magneticLockStatus" class="form-control">
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>
            <div class="condition-input">
              <label>Camera</label>
              <select v-model="cameraStatus" class="form-control">
                <option value="On">On</option>
                <option value="Off">Off</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Close
            </button>
            <button type="button" class="btn btn-primary" @click="saveConditions">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from "axios";
import mqtt from "mqtt";
import Hls from "hls.js";

export default {
  name: "SmartPestControlSystem",
  data() {
    return {
      magneticHistory: [],
      poller: null,
      // if you want to refresh history every 3s too, use a second poller or reuse this one
      // historyPoller: null,

      liveStreamUrl: "http://192.168.0.222:8888/smart-pest/index.m3u8",
      hlsInstance: null,
      sessionActive: false,
      hyperbeamSessionStarted: true,

      devices: [
        {
          id: 1,
          name: "Magnetic Lock 1",
          devEUI: "24e124141e151801",
          status: "Not Activated",
          counterToday: 0,
          counterLast7: 0,
        },
        {
          id: 2,
          name: "Magnetic Lock 2",
          devEUI: "24e124141e151546",
          status: "Not Activated",
          counterToday: 0,
          counterLast7: 0,
        },
      ],

      showModal: false,
      pirSensorStatus: "Detected",
      magneticLockStatus: "On",
      cameraStatus: "On",

      magneticSensors: [],

      conditions: [
        "Conditions",
        "If PIR sensor motion detected, then magnetic lock turn on, camera turn on",
        "If PIR sensor motion detected, then camera turn on",
      ],

      selectedCondition: "",
      displayedCondition: "",
    };
  },

  methods: {
    // ----------------------------
    // Live stream
    // ----------------------------
    initLiveStream() {
      const video = this.$refs.liveVideo;
      if (!video) {
        console.error("No video ref found");
        return;
      }

      const src = this.liveStreamUrl;
      console.log("Initializing HLS with src:", src);

      if (Hls.isSupported()) {
        if (this.hlsInstance) {
          this.hlsInstance.destroy();
          this.hlsInstance = null;
        }

        const hls = new Hls({ debug: true });
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((err) => console.error("video.play() error:", err));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error:", data);
        });

        this.hlsInstance = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((err) =>
            console.error("video.play() error (Safari):", err)
          );
        });
      } else {
        console.error("HLS is not supported in this browser");
      }
    },

    async startOrResumeSession() {
      try {
        this.sessionActive = true;
        this.hyperbeamSessionStarted = true;

        this.$nextTick(() => {
          this.initLiveStream();
        });
      } catch (error) {
        console.error("Error starting session:", error);
      }
    },

    // ----------------------------
    // Latest status (every 3s)
    // ----------------------------
    async fetchMagneticSensorData() {
      try {
        const response = await axios.get("/api/lorawan/data/latest/Magnetic", {
          headers: { "ngrok-skip-browser-warning": "true" },
        });

        const dataArray = response.data || [];

        const sensor1Raw = dataArray.find((item) => item.devEUI === "24e124141e151801");
        const sensor2Raw = dataArray.find((item) => item.devEUI === "24e124141e151546");

        const sensor1 = sensor1Raw?.data
          ? { ...sensor1Raw.data }
          : { devEUI: "24e124141e151801", magnet_status: 0 };

        const sensor2 = sensor2Raw?.data
          ? { ...sensor2Raw.data }
          : { devEUI: "24e124141e151546", magnet_status: 0 };

        this.magneticSensors = [sensor1, sensor2];

        this.updateDeviceStatuses();
      } catch (error) {
        console.error("Error fetching magnetic sensor data:", error);
      }
    },

    updateDeviceStatuses() {
      const s1 = this.magneticSensors.find((s) => s.devEUI === "24e124141e151801");
      const s2 = this.magneticSensors.find((s) => s.devEUI === "24e124141e151546");

      // 🔥 Lock 1 inverted
      const lock1Activated = Number(s1?.magnet_status) === 0;

      // Lock 2 normal (keep as is)
      const lock2Activated = Number(s2?.magnet_status) === 0;

      this.devices = this.devices.map((d) => {
        if (d.devEUI === "24e124141e151801") {
          return { ...d, status: lock1Activated ? "Activated" : "Not Activated" };
        }
        if (d.devEUI === "24e124141e151546") {
          return { ...d, status: lock2Activated ? "Activated" : "Not Activated" };
        }
        return d;
      });
    },

    // ----------------------------
    // History counters (7 days API -> compute today + last7)
    // ----------------------------
    async fetchMagneticHistory() {
      try {
        const res = await axios.get("/api/lorawan/data/history/last7days/Magnetic", {
          headers: { "ngrok-skip-browser-warning": "true" },
        });

        this.magneticHistory = res.data || [];
        this.updateCountersFromHistory();
      } catch (err) {
        console.error("Error fetching magnetic history:", err);
      }
    },

    updateCountersFromHistory() {
      const rows = this.magneticHistory || [];

      const isToday = (isoString) => {
        if (!isoString) return false;
        const d = new Date(isoString);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      };

      const last7 = {};
      const today = {};

      for (const row of rows) {
        const devEUI = row?.devEUI || row?.data?.devEUI;
        const status = Number(row?.data?.magnet_status);

        // Ignore rows without magnet_status, for example tamper_status-only rows
        if (!devEUI || Number.isNaN(status)) continue;

        let isActivated = false;

        // Magnetic Lock 1
        // magnet_status 0 = Activated
        if (devEUI === "24e124141e151801") {
          isActivated = status === 0;
        }

        // Magnetic Lock 2
        // magnet_status 1 = Activated
        if (devEUI === "24e124141e151546") {
          isActivated = status === 0;
        }

        if (!isActivated) continue;

        last7[devEUI] = (last7[devEUI] || 0) + 1;

        if (isToday(row?.time)) {
          today[devEUI] = (today[devEUI] || 0) + 1;
        }
      }

      this.devices = this.devices.map((d) => ({
        ...d,
        counterToday: today[d.devEUI] || 0,
        counterLast7: last7[d.devEUI] || 0,
      }));
    },

    // ----------------------------
    // MQTT (optional)
    // ----------------------------
    setupMqtt() {
      this.mqttClient = mqtt.connect("ws://152.42.161.80:9001");

      this.mqttClient.on("connect", () => {
        console.log("Connected to MQTT broker");
        this.mqttClient.subscribe("classroom/magnetic/data", (err) => {
          if (err) console.error("Error subscribing:", err);
        });
      });

      this.mqttClient.on("message", (topic, message) => {
        if (topic === "classroom/magnetic/data") {
          try {
            const sensorData = JSON.parse(message.toString());
            this.magneticSensors = sensorData;
            this.updateDeviceStatuses();
          } catch (error) {
            console.error("Error parsing MQTT message:", error);
          }
        }
      });
    },

    // ----------------------------
    // Modal
    // ----------------------------
    openModal() {
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
    },
    saveConditions() {
      alert(
        `PIR Sensor: ${this.pirSensorStatus}, Magnetic Lock: ${this.magneticLockStatus}, Camera: ${this.cameraStatus}`
      );
      this.closeModal();
    },
  },

  mounted() {
    // initial loads
    this.fetchMagneticSensorData();
    this.fetchMagneticHistory();

    // poll latest status every 3 seconds
    this.poller = setInterval(() => {
      this.fetchMagneticSensorData();

      // If you want counters to refresh frequently, uncomment:
      // this.fetchMagneticHistory();
    }, 3000);

    // MQTT optional
    this.setupMqtt();

    // auto start live stream
    this.sessionActive = true;
    this.hyperbeamSessionStarted = true;

    this.$nextTick(() => {
      this.initLiveStream();
    });
  },

  beforeUnmount() {
    if (this.mqttClient) this.mqttClient.end();
    if (this.hlsInstance) this.hlsInstance.destroy();

    if (this.poller) {
      clearInterval(this.poller);
      this.poller = null;
    }
  },
};
</script>

<style scoped>
.container-fluid {
  width: 100%;
  height: 100vh;
}

h2 {
  font-size: 2rem;
  font-weight: bold;
}

.row {
  display: flex;
  justify-content: space-between;
}

.relation-section {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  height: 100%;
}

/* Livecam title button positioning */
.livecam-title {
  position: relative;
  justify-content: space-between;
  align-items: center;
}

.floating-livecam-button-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: none;
  cursor: pointer;
}

.no-session-text {
  font-size: 1.5rem;
  color: red;
  text-align: center;
  margin-top: 20px;
}

/* Cards */
.device-status-card {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 15px;
  text-align: center;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
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

/* Mini activation boxes */
.activation-row {
  margin-top: -6px;
  margin-bottom: 18px;
  display: flex;
  gap: 12px;
}

.activation-box {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.activation-label {
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.2;
  text-align: left;
}

.activation-value {
  color: #fff;
  font-weight: 800;
  font-size: 2rem;
}

/* Modal */
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
  padding: 20px 20px;
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
</style>
