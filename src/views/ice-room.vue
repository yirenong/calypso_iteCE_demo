<template>
    <div class="container">
        <h2 class="text-center mb-4">ICE (VDE) ROOM [B05-12]</h2>

        <!-- First Row: Sensor Data and Chart -->
        <div class="row">
            <!-- Sensor Data Section -->
            <div class="col-lg-6 section-container">
                <h3 class="section-title">Sensor Data</h3>
                <div class="sensor-grid">
                    <div class="sensor-box">
                        <p><b>CO2:</b></p>
                        <p>{{ sensorData.co2 }} ppm</p>
                        <div class="face-indicator">
                            <div class="face-display" style="display: flex; align-items: center;">
                                <i :class="getFaceClass(sensorData.co2, 'co2')" class="face-icon"></i>
                                <span style="margin-left: 8px;">
                                    <span v-if="getFaceClass(sensorData.co2, 'co2').includes('fa-smile')">Ideal</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.co2, 'co2').includes('fa-meh')">Average</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.co2, 'co2').includes('fa-frown')">Unsatisfactory</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="sensor-box">
                        <p><b>Temperature:</b></p>
                        <p>{{ sensorData.temperature }}°C</p>
                        <div class="face-indicator">
                            <div class="face-display" style="display: flex; align-items: center;">
                                <i :class="getFaceClass(sensorData.temperature, 'temperature')" class="face-icon"></i>
                                <span style="margin-left: 8px;">
                                    <span
                                        v-if="getFaceClass(sensorData.temperature, 'temperature').includes('fa-smile')">Ideal</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.temperature, 'temperature').includes('fa-meh')">Average</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.temperature, 'temperature').includes('fa-frown')">Unsatisfactory</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="sensor-box">
                        <p><b>Humidity:</b></p>
                        <p>{{ sensorData.humidity }}%</p>
                        <div class="face-indicator">
                            <div class="face-display" style="display: flex; align-items: center;">
                                <i :class="getFaceClass(sensorData.humidity, 'humidity')" class="face-icon"></i>
                                <span style="margin-left: 8px;">
                                    <span
                                        v-if="getFaceClass(sensorData.humidity, 'humidity').includes('fa-smile')">Ideal</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.humidity, 'humidity').includes('fa-meh')">Average</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.humidity, 'humidity').includes('fa-frown')">Unsatisfactory</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="sensor-box">
                        <p><b>PM2.5:</b></p>
                        <p>{{ sensorData.pm2_5 }} µg/m³</p>
                        <div class="face-indicator">
                            <div class="face-display" style="display: flex; align-items: center;">
                                <i :class="getFaceClass(sensorData.pm2_5, 'pm2_5')" class="face-icon"></i>
                                <span style="margin-left: 8px;">
                                    <span
                                        v-if="getFaceClass(sensorData.pm2_5, 'pm2_5').includes('fa-smile')">Ideal</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.pm2_5, 'pm2_5').includes('fa-meh')">Average</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.pm2_5, 'pm2_5').includes('fa-frown')">Unsatisfactory</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="sensor-box">
                        <p><b>PM10:</b></p>
                        <p>{{ sensorData.pm10 }} µg/m³</p>
                        <div class="face-indicator">
                            <div class="face-display" style="display: flex; align-items: center;">
                                <i :class="getFaceClass(sensorData.pm10, 'pm10')" class="face-icon"></i>
                                <span style="margin-left: 8px;">
                                    <span v-if="getFaceClass(sensorData.pm10, 'pm10').includes('fa-smile')">Ideal</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.pm10, 'pm10').includes('fa-meh')">Average</span>
                                    <span
                                        v-else-if="getFaceClass(sensorData.pm10, 'pm10').includes('fa-frown')">Unsatisfactory</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <!-- Button to open new window -->
                    <div class="button-box">
                        <button class="btn btn-primary float-right" @click="openPopupWindow">Best
                            Guidelines</button>
                    </div>
                </div>
            </div>

            <!-- Chart Section -->
            <div class="col-lg-6 section-container chart-container" style="width: 48%;">
                <div class="chart-box">
                    <h3 class="section-title">KWH Daily Consumption</h3>

                    <div
                        style="display:flex;justify-content:center;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
                        <button class="btn btn-outline-light" :class="{ active: chartMode === 'today' }"
                            @click="setChartModeToday">
                            Today
                        </button>

                        <button class="btn btn-outline-light" :class="{ active: chartMode === 'last7' }"
                            @click="setChartModeLast7">
                            Last 7 Days
                        </button>

                        <template v-if="chartMode === 'today'">
                            <input type="date" v-model="selectedDay" class="form-control" style="max-width: 200px;" />
                            <button class="btn btn-primary" @click="generateChart()">Load</button>
                        </template>
                    </div>


                    <canvas id="kwhChart"></canvas>

                </div>
            </div>


        </div>

        <!-- Second Row: Floorplan and Console Control -->
        <div class="row mt-4">
            <!-- Floorplan Section - 80% width -->
            <div class="col-lg-8 section-container" style="width: 64%;">
                <h3 class="section-title">Room Layout</h3>
                <div class="floorplan-container position-relative">
                    <div class="floorplan-image-container">
                        <img :src="floorplanImage" alt="Floorplan for B05-11" class="floorplan-image" />
                    </div>

                    <!-- Status dots for zone sensors -->
                    <div v-for="(sensor, index) in zoneSensors" :key="index"
                        :style="{ top: sensor.top, left: sensor.left, position: 'absolute', transform: 'translate(-50%, -50%)' }">
                        <span class="status-dot" :class="sensor.isOnline ? 'online' : 'offline'"></span>
                    </div>

                    <!-- Status dots for toggle devices (MDU and FCU) -->
                    <div v-for="(device, index) in toggleDevices" :key="index"
                        :style="{ top: device.top, left: device.left, position: 'absolute', transform: 'translate(-50%, -50%)' }">
                        <span class="status-dot" :class="device.isOnline ? 'online' : 'offline'"></span>
                    </div>
                    <div v-for="fan in fans" :key="fan.id" class="status-dot-floorplan"
                        :style="{ top: fan.top, left: fan.left }">
                        <span class="status-dot" :class="fan.isOn ? 'online' : 'offline'"></span>
                    </div>

                </div>
            </div>

            <!-- Console Control Section - 20% width -->
            <div class="col-lg-4 section-container">
                <h3 class="section-title">Console Control</h3>
                <div class="console-box">
                    <!-- ALL ON/OFF Toggle for Zones -->
                    <div class="toggle-switch all-on-control mb-4">
                        <label class="switch">
                            <input type="checkbox" v-model="allOnZones" @change="toggleAllDevices" />
                            <span class="slider round"></span>
                        </label>
                        <span>{{ allOnZones ? 'ALL Lights ON' : 'ALL Lights OFF' }}</span>
                    </div>

                    <!-- Zone 5 to Zone 8 Controls -->
                    <div v-for="(sensor, index) in zoneSensors" :key="index"
                        class="sensor-control mb-3 d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center">
                            <span :style="{ color: sensor.isOnline ? 'lightgreen' : 'white' }">
                                {{ sensor.name }} ({{ sensor.isOnline ? 'Lights On' : 'Lights Off' }})
                            </span>
                        </div>
                        <button class="btn btn-primary" @click="toggleModal(sensor)">
                            Control
                        </button>
                    </div>

                    <!-- ALL ON/OFF Toggle for FCUs -->
                    <div class="toggle-switch all-on-control mb-4">
                        <label class="switch">
                            <input type="checkbox" v-model="allOnFCU" @change="toggleAllFCU" />
                            <span class="slider round"></span>
                        </label>
                        <span>{{ allOnFCU ? 'Turn All FCUs ON' : 'Turn All FCUs OFF' }}</span>
                    </div>

                    <!-- ALL ON/OFF Toggle for MDUs -->
                    <div class="toggle-switch all-on-control mb-4">
                        <label class="switch">
                            <input type="checkbox" v-model="allOnMDU" @change="toggleAllMDU"
                                :disabled="isTogglingMDU" />
                            <span class="slider round"></span>
                        </label>
                        <span>{{ allOnMDU ? 'Turn All MDUs OPEN' : 'Turn All MDUs CLOSED' }}</span>
                    </div>



                    <div v-for="device in toggleDevices" :key="device.name" class="toggle-switch mb-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <span>{{ device.name }}</span>
                            <!-- Disable switch while API request is pending -->
                            <label class="switch">
                                <input type="checkbox" :checked="device.isOnline" @change="toggleDeviceState(device)"
                                    :disabled="device.name.startsWith('FCU') ? isTogglingFCU : isTogglingMDU" />
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <!-- Display ON when device isOnline, else OFF -->
                        <span>{{ device.isOnline ? 'ON' : 'OFF' }}</span>
                    </div>


                    <!-- FAF1 Control -->
                    <div class="toggle-switch mb-4">
                        <span><b>Fresh Air Fan 3 (FAF3)</b></span>
                        <label class="switch">
                            <input type="checkbox" v-model="fans[0].isOn" @change="controlFAF1(fans[0].isOn)">
                            <span class="slider round"></span>
                        </label>
                        <span>{{ fans[0].isOn ? 'ON' : 'OFF' }}</span>
                    </div>
                </div>
            </div>
        </div>
        <!-- Modal for Zone Control -->
        <div v-if="showModal" class="modal-overlay">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ modalTitle }}</h5>
                        <button type="button" class="btn-close" @click="closeModal">×</button>
                    </div>

                    <div class="modal-body text-center">
                        <div class="instructions">
                            <p><strong>Step 1:</strong> Use the slider controls below to adjust the brightness and color
                                temperature of the lights.</p>
                            <p><strong>Step 2:</strong> When you're satisfied with your settings, toggle the switch to
                                turn the lights on or off.</p>
                        </div>

                        <!-- Zone Control: Slider Controls -->
                        <div class="zone-control" v-if="currentSensor">
                            <h5>{{ currentSensor.name }} Control</h5>

                            <label>Color Temperature (Level 1): {{ currentSensor.level1 }}</label>
                            <input type="range" v-model="currentSensor.level1" min="0" max="100" step="100" />

                            <label>Dimming (Level 2): {{ currentSensor.level2 }}</label>
                            <input type="range" v-model="currentSensor.level2" min="0" max="100" />
                        </div>

                        <!-- On/Off Switch -->
                        <div class="switch-container">
                            <label class="switch">
                                <input type="checkbox" v-model="currentSensor.isOnline"
                                    @change="toggleSensor(currentSensor, currentSensor.isOnline)" />
                                <span class="slider round"></span>
                            </label>
                            <span style="margin-left: 10px;">
                                {{ currentSensor.isOnline ? 'ON' : 'OFF' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import axios from 'axios';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler } from 'chart.js';
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

function pad2(n) { return String(n).padStart(2, "0"); }

function addDaysISO(iso, delta) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function lastNDaysRange(n, endISO) {
    return { start: addDaysISO(endISO, -(n - 1)), end: endISO };
}


const USAGE_API = '/api/powermeter/usage/range/day24/by_gateway'; // ✅ relative (proxy/IP friendly)



export default {
    data() {
        return {
            chartMode: "today", // 'today' | 'last7'

            gatewayID: '24011006420037',
            selectedDay: '',
            chartInstance: null,
            isTogglingMDU: false,  // Disable flag for MDU toggle switch during API call
            isTogglingFCU: false,  // Disable flag for MDU toggle switch during API call
            sensorData: {
                co2: null,
                temperature: null,
                humidity: null,
                pm2_5: null,
                pm10: null,
            },
            meterSNs: [],
            floorplanImage: require('@/assets/Sub System and Icons/V2/B05-12_full2.png'),
            allOnFCU: false,  // Controls all FCU units (initially set to true)
            allOnMDU: false,  // Controls all MDU units (initially set to true)
            allOnZones: false,
            fans: [
                { id: 1, name: 'Fresh Air Fan 2 (FAF2)', deviceEUI: '24E124756E049153', isOn: false, top: '50%', left: '62%' },
            ],
            zoneSensors: [
                { top: '23%', left: '61.5%', name: 'Zone 1', isOnline: false, deviceEUI: '0004ED0100001720', level1: 0, level2: 50 },
                { top: '23%', left: '53.5%', name: 'Zone 2', isOnline: false, deviceEUI: '0004ED0100001713', level1: 0, level2: 50 },
                { top: '23%', left: '45.5%', name: 'Zone 3', isOnline: false, deviceEUI: '0004ED010000166B', level1: 0, level2: 50 },
                { top: '51%', left: '45.5%', name: 'Zone 4', isOnline: false, deviceEUI: '0004ED0100001704', level1: 0, level2: 50 }
            ],
            toggleDevices: [
                { name: 'MCD 4', isOnline: false, deviceEUI: '24E124756E049153', top: '55%', left: '68%' },  // Initially ON
                { name: 'FCU 2-1', isOnline: false, airconIndex: 1, top: '69%', left: '42%' },               // Initially ON
                { name: 'FCU 2-2', isOnline: false, airconIndex: 2, top: '69%', left: '56%' }                // Initially ON
            ],
            showModal: false,
            modalTitle: '',
            currentSensor: null,
        };
    },
    methods: {
        sumDayUsage(dayObj) {
            const arr =
                (Array.isArray(dayObj?.usage_24) && dayObj.usage_24) ||           // meter_sn API
                (Array.isArray(dayObj?.total_usage) && dayObj.total_usage) ||     // gateway API
                (Array.isArray(dayObj?.total_usage_series) && dayObj.total_usage_series) ||
                [];

            return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
        },
        async generateLast7DaysChart() {
            try {
                const endISO = this.getLocalYYYYMMDD();
                const { start, end } = lastNDaysRange(7, endISO);

                const url =
                    `${USAGE_API}` +
                    `?gateway_sn=${encodeURIComponent(this.gatewayID)}` +
                    `&start=${encodeURIComponent(start)}` +
                    `&end=${encodeURIComponent(end)}`;

                console.log("[Chart] GET", url);

                const { data } = await axios.get(url, { timeout: 15000 });

                const days = Array.isArray(data?.days) ? data.days : [];
                const labels = days.map(d => d.day || d.date || "");
                const values = days.map(d => this.sumDayUsage(d));

                console.log("[last7] labels:", labels);
                console.log("[last7] values:", values);

                if (!labels.length || !values.length) {
                    console.warn("[Chart] Empty last7 series returned:", data);
                    if (this.chartInstance) this.chartInstance.destroy();
                    return;
                }

                const canvas = document.getElementById("kwhChart");
                if (!canvas) return;
                const ctx = canvas.getContext("2d");

                if (this.chartInstance) this.chartInstance.destroy();

                this.chartInstance = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels,
                        datasets: [
                            {
                                label: "kWh (Daily Total)",
                                data: values,
                                backgroundColor: "rgba(75, 192, 192, 0.35)",
                                borderColor: "rgba(75, 192, 192, 1)",
                                borderWidth: 1,
                                borderRadius: 6,
                                maxBarThickness: 48,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: { color: "#fff" },
                                grid: { color: "rgba(255,255,255,0.2)" },
                            },
                            y: {
                                beginAtZero: true,
                                ticks: { color: "#fff" },
                                grid: { color: "rgba(255,255,255,0.2)" },
                            },
                        },
                        plugins: {
                            legend: { labels: { color: "#fff" } },
                            tooltip: {
                                backgroundColor: "rgba(0,0,0,0.7)",
                                titleColor: "#fff",
                                bodyColor: "#fff",
                            },
                            title: {
                                display: true,
                            },
                        },
                    },
                });

            } catch (error) {
                console.error("[Chart] Error generating last7 chart:", error);
            }
        },
        setChartModeToday() {
            this.chartMode = "today";
            if (!this.selectedDay) this.selectedDay = this.getLocalYYYYMMDD();
            this.generateChart();
        },

        setChartModeLast7() {
            this.chartMode = "last7";
            this.generateLast7DaysChart();
        },

        getLocalYYYYMMDD() {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        },

        openPopupWindow() {
            // Open a new window with specific dimensions
            const newWindow = window.open('', '_blank', 'width=800,height=500');
            newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Best Guidelines</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h3, h4 {
            color: #333;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .note {
            font-size: 0.9rem;
            font-style: italic;
            color: #555;
            margin-top: -10px;
          }
        </style>
      </head>
      <body>
        <h3>Best Guidelines</h3>
        <div>
          <h4>Table 1: Guideline Maximum Concentration for Specific Indoor Air Contaminants</h4>
          <table>
            <thead>
              <tr>
                <th>Parameters</th>
                <th>Average Time</th>
                <th>Limit for Acceptance</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Carbon dioxide</td>
                <td>8 hours</td>
                <td>1800 / 1000</td>
                <td>mg/m3 / ppm</td>
              </tr>
              <tr>
                <td>Carbon monoxide</td>
                <td>8 hours</td>
                <td>10 / 9</td>
                <td>mg/m3 / ppm</td>
              </tr>
              <tr>
                <td>Formaldehyde</td>
                <td>8 hours</td>
                <td>120 / 0.1</td>
                <td>mg/m3 / ppm</td>
              </tr>
              <tr>
                <td>Ozone</td>
                <td>8 hours</td>
                <td>100 / 0.05</td>
                <td>mg/m3 / ppm</td>
              </tr>
              <!-- Additional row to show the ppm information -->
              <tr>
                <td colspan="4" class="note">ppm – part per million (measurement of concentration) 1 ppm = 1 mg/l</td>
              </tr>
            </tbody>
          </table>

          <h4>Table 2: Recommended Maximum Concentrations for Specific Classes of Contaminants</h4>
          <table>
            <thead>
              <tr>
                <th>Parameters</th>
                <th>Limit for Acceptable Indoor Air Quality</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Suspended particulate matter*</td>
                <td>150</td>
                <td>mg/m3 / ppm</td>
              </tr>
              <tr>
                <td>Volatile organic compounds</td>
                <td>3</td>
                <td>ppm</td>
              </tr>
              <tr>
                <td>Total bacteria counts</td>
                <td>500</td>
                <td>CFU**/m3</td>
              </tr>
              <tr>
                <td>Total fungal counts</td>
                <td>500</td>
                <td>CFU/m3</td>
              </tr>
              <!-- Footnote for Table 2 -->
              <tr>
                <td colspan="3" class="note">* Respirable particles with aerodynamic diameters less than 10 μm.<br>** Colony-forming units</td>
              </tr>
            </tbody>
          </table>

          <h4>Table 3: Guideline Values for Specific Physical Parameters</h4>
          <table>
            <thead>
              <tr>
                <th>Parameters</th>
                <th>Range for Acceptable Indoor Air Quality</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Air temperature</td>
                <td>22.5 - 25.5</td>
                <td>°C</td>
              </tr>
              <tr>
                <td>Relative humidity</td>
                <td>&lt; 70</td>
                <td>%</td>
              </tr>
              <tr>
                <td>Air movement*</td>
                <td>&lt; 0.25</td>
                <td>m/s</td>
              </tr>
              <!-- Footnote for Table 3 -->
              <tr>
                <td colspan="3" class="note">* At workstation within occupied zone.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);
        },
        // Function to control Fresh Air Fan 2 (FAF2)
        async controlFAF1(turnOn) {
            const url = '/api/command/ws558/';

            // 1. Build the switch_states array (1 = on, 0 = off)
            const switch_states = turnOn
                ? [1, 0, 0, 0, 0, 0, 0, 0]
                : [0, 0, 0, 0, 0, 0, 0, 0];

            // 2. Snake_case payload to match Postman
            const payload = {
                device_eui: '24E124756E049153', // EUI for FAF1
                switch_states
            };

            // 3. Log the exact POST URL + body (pretty-printed)
            console.log(`➡️ POST ${url}\n`, JSON.stringify(payload, null, 2));

            try {
                const response = await axios.post(url, payload);
                console.log(`✅ FAF1 turned ${turnOn ? 'ON' : 'OFF'}`, response.data);

                // 4. Update the local state
                this.fans[0].isOn = turnOn;
            } catch (error) {
                console.error(`❌ Error turning FAF1 ${turnOn ? 'ON' : 'OFF'}:`, error);
            }
        },
        getToggleState(device) {
            return device.name.startsWith('FCU') ? this.allOnFCU : this.allOnMDU;
        },
        setToggleState(device, value) {
            if (device.name.startsWith('FCU')) {
                this.allOnFCU = value;
            } else {
                this.allOnMDU = value;
            }
        },
        getFaceClass(value, type) {
            let goodLimit, badLimit;

            switch (type) {
                case 'co2':
                    goodLimit = 1000;
                    badLimit = 1500;
                    break;
                case 'temperature':
                    goodLimit = 25.5; // Acceptable range is 22.5°C to 25.5°C
                    badLimit = 27.5;
                    break;
                case 'humidity':
                    goodLimit = 70; // Acceptable range is < 70%
                    badLimit = 71;
                    break;
                case 'pm2_5':
                    goodLimit = 35; // Acceptable range < 35 µg/m³
                    badLimit = 75;
                    break;
                case 'pm10':
                    goodLimit = 100; // Acceptable range < 100 µg/m³
                    badLimit = 150;
                    break;
                default:
                    goodLimit = 0;
                    badLimit = 0;
            }

            if (value < goodLimit) {
                return 'fas fa-smile modal-face-icon'; // Green smiley face for good values
            } else if (value >= goodLimit && value < badLimit) {
                return 'fas fa-meh text-warning modal-face-icon'; // Orange neutral face for moderate values
            } else {
                return 'fas fa-frown text-danger modal-face-icon'; // Red frown face for bad values
            }
        },
        async fetchSensorData() {
            try {
                const response = await axios.get('/api/lorawan/data/latest/IAQ');
                const sensorData = response.data.find(sensor => sensor.devEUI === "24e124710d480413");
                if (sensorData && sensorData.data) {
                    this.sensorData.co2 = sensorData.data.co2;
                    this.sensorData.temperature = sensorData.data.temperature;
                    this.sensorData.humidity = sensorData.data.humidity;
                    this.sensorData.pm2_5 = sensorData.data.pm2_5;
                    this.sensorData.pm10 = sensorData.data.pm10;
                }
            } catch (error) {
                console.error('Error fetching sensor data:', error);
            }
        },
        async generateChart() {
            try {
                const day = this.selectedDay || this.getLocalYYYYMMDD();

                const url =
                    `${USAGE_API}` +
                    `?gateway_sn=${encodeURIComponent(this.gatewayID)}` +
                    `&start=${encodeURIComponent(day)}` +
                    `&end=${encodeURIComponent(day)}`;

                console.log('[Chart] GET', url);

                const { data } = await axios.get(url, { timeout: 15000 });

                // Prefer top-level series; fallback to first day item
                const labelsRaw = data.labels || data.days?.[0]?.total_labels || [];
                const usageRaw = data.total_usage_series || data.days?.[0]?.total_usage || [];

                const labels = labelsRaw.map(ts => ts.slice(11, 16)); // "HH:MM"
                const usage = usageRaw.map(v => Number(v) || 0);

                console.log('[Chart] labels:', labels.length, 'usage:', usage.length);

                if (!labels.length || !usage.length) {
                    console.warn('[Chart] Empty series returned:', data);
                    if (this.chartInstance) this.chartInstance.destroy();
                    return;
                }

                const canvas = document.getElementById('kwhChart');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');

                if (this.chartInstance) this.chartInstance.destroy();

                this.chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'kWh (Hourly Usage)',
                                data: usage,
                                borderColor: 'rgba(75, 192, 192, 1)',
                                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                                fill: true,
                                tension: 0.25,
                                pointRadius: 2,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: { color: '#fff' },
                                grid: { color: 'rgba(255,255,255,0.2)' }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#fff' },
                                grid: { color: 'rgba(255,255,255,0.2)' }
                            },
                        },
                        plugins: {
                            legend: { labels: { color: '#fff' } },
                            tooltip: { backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#fff', bodyColor: '#fff' },
                        },
                    },
                });
            } catch (error) {
                console.error('[Chart] Error generating chart:', error);
            }
        },

        async toggleAllDevices() {
            // v-model already updated allOnZones to the new state
            const turnOn = this.allOnZones;

            const apiUrl = turnOn
                ? 'https://lumani-control.rshare.io/device/on'
                : 'https://lumani-control.rshare.io/device/off';

            // Build { deviceId, deviceId2, deviceId3, deviceId4 } for Zone 1–4
            const deviceIds = this.zoneSensors
                .slice(0, 4)
                .reduce((acc, sensor, idx) => {
                    const key = idx === 0 ? 'deviceId' : `deviceId${idx + 1}`;
                    acc[key] = sensor.deviceEUI;
                    return acc;
                }, {});

            try {
                await axios.post(apiUrl, deviceIds);

                // Mirror the state locally
                this.zoneSensors.slice(0, 4).forEach(sensor => {
                    sensor.isOnline = turnOn;
                });
            } catch (error) {
                console.error('Error setting all devices state:', error);

                // Revert checkbox if backend failed
                this.allOnZones = !turnOn;
            }
        },

        // Turn a single zone ON/OFF using the /device endpoint
        async toggleZone(sensor, state) {
            const apiUrl = state
                ? 'https://lumani-control.rshare.io/device/on'
                : 'https://lumani-control.rshare.io/device/off';

            const payload = { deviceId: sensor.deviceEUI };

            console.log(`➡️ POST ${apiUrl}`, JSON.stringify(payload, null, 2));

            try {
                await axios.post(apiUrl, payload);
                console.log(`✅ ${sensor.name} turned ${state ? 'ON' : 'OFF'}`);
                sensor.isOnline = state;
            } catch (error) {
                console.error(`❌ Error toggling ${sensor.name}:`, error);
                // revert UI if it failed
                sensor.isOnline = !state;
            }
        },
        async toggleAllFCU() {
            console.log('Toggling all FCUs');
            this.isTogglingFCU = true;  // Disable the UI toggle switch for FCUs

            const apiUrl = `/api/aircon/aircon/control/master`;
            const state = this.allOnFCU ? 'on' : 'off';

            try {
                console.log(`Sending request to ${apiUrl} with state: ${state}`);
                const response = await axios.post(apiUrl, { state });
                console.log('Response from FCU API:', response.data);

                // Update only FCU states
                this.toggleDevices.forEach(device => {
                    if (device.name.startsWith('FCU')) {
                        device.isOnline = this.allOnFCU;  // Update FCU's online status
                        console.log(`FCU ${device.name} is now ${this.allOnFCU ? 'ON' : 'OFF'}`);
                    }
                });
            } catch (error) {
                console.error('Error toggling all FCUs:', error);
            } finally {
                this.isTogglingFCU = false;  // Re-enable the UI toggle switch
            }
        },
        async sendZoneCommand(sensor) {
            const url = '/api/command/ws558/';

            const switch_states = sensor.isOnline
                ? Array(8).fill(1)
                : Array(8).fill(0);

            const payload = {
                device_eui: sensor.deviceEUI,
                level1: sensor.level1,
                level2: sensor.level2,
                switch_states
            };

            console.log(`➡️ Sending WS558 command`, payload);

            try {
                const res = await axios.post(url, payload);
                console.log(`✅ ${sensor.name} updated`, res.data);
            } catch (err) {
                console.error(`❌ Failed to send command for ${sensor.name}`, err);
                sensor.isOnline = !sensor.isOnline; // revert if fail
            }
        },
        async toggleAllMDU() {
            console.log('Toggling all MDUs');
            this.isTogglingMDU = true;  // Disable the toggle switch for MDUs

            const devices = this.toggleDevices.filter(device => device.name.startsWith('MCD'));
            const newState = this.allOnMDU;  // Determine new state (should only affect MDUs)

            try {
                // Loop through each MDU and make the API call to toggle its state
                for (const device of devices) {
                    console.log(`Toggling MDU ${device.name} to ${newState ? 'ON' : 'OFF'}`);

                    // Toggle each MDU individually and wait for the result
                    await this.toggleSensor(device, newState);

                    // After the API call is successful, update the MDU's online status
                    device.isOnline = newState;
                    console.log(`MDU ${device.name} is now ${newState ? 'ON' : 'OFF'}`);
                }

                // If all toggles are successful, update the allOnMDU state
                this.allOnMDU = newState;

            } catch (error) {
                // Log the error and potentially show a message to the user
                console.error('Error toggling all MDUs:', error);
            } finally {
                // Re-enable the toggle switch after the API call completes
                this.isTogglingMDU = false;
            }
        },
        async toggleDeviceState(device) {
            // Log the name and state of the device
            console.log(`${device.name} is being turned ${device.isOnline ? 'OFF' : 'ON'}`);

            if (device.name.startsWith('FCU')) {
                // Toggle aircon state for FCU
                await this.sendAirconState(!device.isOnline, device.airconIndex);
            } else if (device.name.startsWith('MCD')) {
                // Toggle MDU sensor state
                await this.toggleSensor(device, !device.isOnline);
            }

            // Update the device's online state after the toggle action
            device.isOnline = !device.isOnline;

            // Log the new status
            console.log(`${device.name} is now ${device.isOnline ? 'ON' : 'OFF'}`);
        },
        // Function to control the aircon (FCU)
        async sendAirconState(state, airconIndex) {
            const apiUrl = `/api/aircon/aircon/${airconIndex + 2}`;
            const payload = { state: state ? 'on' : 'off' };

            try {
                // Send request to toggle the aircon state
                await axios.post(apiUrl, payload);
                console.log(`FCU ${airconIndex + 2} turned ${state ? 'ON' : 'OFF'}`);

                // If FCU is being turned ON, turn OFF all MDUs
                if (state) {
                    console.log('Aircon is ON, turning off all MDUs...');
                    await this.toggleAllMDU(false);  // Pass false to turn off all MDUs
                }
            } catch (error) {
                console.error(`Error turning aircon ${airconIndex + 2} ${state ? 'on' : 'off'}:`, error);
            }
        },
        // Function to control MDU
        async toggleSensor(sensor, state) {
            const url = '/api/command/ws558/';

            // Build the switch_states array (1 = on, 0 = off)
            const switch_states = state
                ? [1, 1, 1, 1, 1, 1, 1, 1]
                : [0, 0, 0, 0, 0, 0, 0, 0];

            // Snake_case payload
            const payload = {
                device_eui: sensor.deviceEUI,
                switch_states
            };

            // Log exactly what we're sending
            console.log(`➡️ POST ${url}\n`, JSON.stringify(payload, null, 2));

            try {
                await axios.post(url, payload);
                console.log(`✅ MDU ${sensor.name} turned ${state ? 'ON' : 'OFF'}`);
            } catch (error) {
                console.error(`❌ Error toggling sensor ${sensor.name}:`, error);
            }
        },
        toggleModal(sensor) {
            this.modalTitle = sensor.name;
            this.currentSensor = sensor;
            this.showModal = true;
        },
        closeModal() {
            this.showModal = false;
        }
    },
    mounted() {
        this.fetchSensorData();
        this.selectedDay = this.getLocalYYYYMMDD();
        this.chartMode = "today";
        this.generateChart();
    },

};
</script>

<style scoped>
/* Common styles */
.container {
    width: 100%;
    padding: 20px;
}

.text-center {
    text-align: center;
}

.section-container {
    margin-bottom: 30px;
    margin-right: 1%;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

.section-title {
    text-align: center;
    margin-bottom: 20px;
    color: white;
    font-weight: bold;
}

.sensor-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding-bottom: 10%;
}

.sensor-box {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 15px;
    text-align: center;
}

.face-indicator {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.face-icon {
    font-size: 1.5rem;
}

.floorplan-container {
    text-align: center;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    position: relative;
}

.floorplan-image-container {
    width: 100%;
    height: auto;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 10px;
    display: flex;
    justify-content: center;
}

.floorplan-image {
    width: 100%;
    border-radius: 5px;
}

.chart-box {
    height: 350px;
    /* Adjust height if needed */
    width: 100%;
    margin-left: auto;
    margin-right: auto;
}


/* Console Control Styles */
.console-box {
    border-radius: 5px;
    padding: 15px;
    text-align: center;
}

.toggle-switch {
    display: flex;
    align-items: center;
    gap: 10px;
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

/* Status dot styles for the floorplan */
.status-dot {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    position: absolute;
    z-index: 10;
}

.online {
    background-color: green;
}

.offline {
    background-color: red;
}

.console-box .sensor-control {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.all-on-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.modal-content {
    color: black;
}

/* Status dot styles */
.status-dot-floorplan {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    z-index: 10;
}

.online {
    background-color: green;
}

.offline {
    background-color: red;
}

/* Slider styles */
.switch {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 20px;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: '';
    height: 14px;
    width: 14px;
    left: 4px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: green;
}

input:checked+.slider:before {
    transform: translateX(14px);
}

@media (min-width: 1400px) {

    .container,
    .container-lg,
    .container-md,
    .container-sm,
    .container-xl,
    .container-xxl {
        max-width: 99%;
    }
}

.button-box {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.fas.fa-smile {
    color: #90ee90;
    /* Light green */
}

/* === MODAL OVERLAY & DIALOG === */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

/* make the box wider & less “tall-narrow” */
.modal-dialog {
    background-color: #ffffff;
    color: #000;
    border-radius: 10px;
    max-width: 750px;
    /* <- wider */
    width: 90%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

/* add nice padding inside */
.modal-content {
    background-color: #ffffff;
    color: #000;
    border: none;
    padding: 24px 32px 24px;
    /* <- main padding */
}

/* Center title, move X to top-right */
.modal-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    /* centers the title */
    padding: 8px 16px 0;
    border-bottom: none;
}

.modal-title {
    flex: 1;
    text-align: center;
    /* text in the middle */
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

/* X button pinned to top-right of the dialog */
.modal-header .btn-close {
    position: absolute;
    right: 16px;
    top: 8px;
    border: none;
    background: transparent;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
}

.modal-body {
    padding: 0;
    /* we already padded .modal-content */
}

/* keep your existing ones, but you can loosen a bit */
.instructions {
    margin-bottom: 1.5rem;
    font-size: 1.05rem;
    line-height: 1.5;
    text-align: center;
}

.zone-control h5 {
    margin-bottom: 0.75rem;
}

.zone-control label {
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
}

.switch-container {
    margin-top: 1.5rem;
}

/* === MODAL OVERLAY & DIALOG === */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-dialog {
    background-color: #ffffff;
    color: #000;
    border-radius: 10px;
    max-width: 750px;
    width: 90%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.modal-content {
    background-color: #ffffff;
    color: #000;
    border: none;
    padding: 24px 32px 24px;
}

.modal-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px 0;
    border-bottom: none;
}

.modal-title {
    flex: 1;
    text-align: center;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.modal-header .btn-close {
    position: absolute;
    right: 16px;
    top: 8px;
    border: none;
    background: transparent;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
}

.modal-body {
    padding: 0;
}

/* Text + sliders layout like your Zone 5 screenshot */
.instructions {
    margin-bottom: 1.5rem;
    font-size: 1.05rem;
    line-height: 1.5;
    text-align: center;
}

.zone-control {
    margin-top: 0.5rem;
    text-align: center;
}

.zone-control h5 {
    margin-bottom: 0.75rem;
    font-weight: 600;
}

.zone-control label {
    display: block;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
    font-weight: 600;
}

.zone-control input[type="range"] {
    width: 80%;
    max-width: 500px;
}

.switch-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
}
</style>
