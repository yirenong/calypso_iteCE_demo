<template>
  <div class="container">
    <h2 class="text-center mb-4">SMART VERTICAL TRANSPORT ROOM [B05-13 & 14]</h2>

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
                  <span v-else-if="getFaceClass(sensorData.co2, 'co2').includes('fa-meh')">Average</span>
                  <span v-else-if="getFaceClass(sensorData.co2, 'co2').includes('fa-frown')">Unsatisfactory</span>
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
                  <span v-if="getFaceClass(sensorData.temperature, 'temperature').includes('fa-smile')">Ideal</span>
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
                <i :class="getFaceClass(sensorData.humidity, 'temperature')" class="face-icon"></i>
                <span style="margin-left: 8px;">
                  <span v-if="getFaceClass(sensorData.humidity, 'humidity').includes('fa-smile')">Ideal</span>
                  <span v-else-if="getFaceClass(sensorData.humidity, 'humidity').includes('fa-meh')">Average</span>
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
                  <span v-if="getFaceClass(sensorData.pm2_5, 'pm2_5').includes('fa-smile')">Ideal</span>
                  <span v-else-if="getFaceClass(sensorData.pm2_5, 'pm2_5').includes('fa-meh')">Average</span>
                  <span v-else-if="getFaceClass(sensorData.pm2_5, 'pm2_5').includes('fa-frown')">Unsatisfactory</span>
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
                  <span v-else-if="getFaceClass(sensorData.pm10, 'pm10').includes('fa-meh')">Average</span>
                  <span v-else-if="getFaceClass(sensorData.pm10, 'pm10').includes('fa-frown')">Unsatisfactory</span>
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
            <button class="btn btn-outline-light" :class="{ active: chartMode === 'today' }" @click="setChartModeToday">
              Today
            </button>

            <button class="btn btn-outline-light" :class="{ active: chartMode === 'last7' }" @click="setChartModeLast7">
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

    <!-- Second Row: Floorplan Section -->
    <div class="row mt-4">
      <!-- Floorplan Section -->
      <div class="col-lg-12 section-container">
        <h3 class="section-title">Room Layout</h3>
        <div class="floorplan-container">
          <div class="floorplan-image-container">
            <img :src="floorplanImage" alt="Floorplan for B05-13/14" class="floorplan-image" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import axios from 'axios';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend } from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

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

      gatewayID: '24060410030006', // Hardcode the gateway for B05-11/12
      selectedDay: '',
      chartInstance: null,
      sensorData: {
        co2: null,
        temperature: null,
        humidity: null,
        pm2_5: null,
        pm10: null
      },
      floorplanImage: require('@/assets/Sub System and Icons/V2/B05 13-14_IAQ.png') // Replace with your correct image path
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
    async fetchSensorData() {
      try {
        const response = await axios.get('/api/lorawan/data/latest/IAQ', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const sensorData = response.data.find(sensor => sensor.devEUI === "24e124710d480081");
        if (sensorData && sensorData.data) {
          this.sensorData.co2 = sensorData.data.co2;
          this.sensorData.temperature = sensorData.data.temperature;
          this.sensorData.humidity = sensorData.data.humidity;
          this.sensorData.pm2_5 = sensorData.data.pm2_5;
          this.sensorData.pm10 = sensorData.data.pm10;
        } else {
          console.error("Sensor with devEUI '24e124710d480081' not found or missing data.");
        }
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    },
    getFaceClass(value, type) {
      let goodLimit, badLimit;
      switch (type) {
        case 'co2':
          goodLimit = 1000; badLimit = 1500; break;
        case 'temperature':
          goodLimit = 25.5; badLimit = 27.5; break;
        case 'humidity':
          goodLimit = 70; badLimit = 71; break;
        case 'pm2_5':
          goodLimit = 35; badLimit = 75; break;
        case 'pm10':
          goodLimit = 100; badLimit = 150; break;
        default:
          goodLimit = 0; badLimit = 0;
      }
      if (value < goodLimit) {
        return 'fas fa-smile modal-face-icon';
      } else if (value >= goodLimit && value < badLimit) {
        return 'fas fa-meh text-warning modal-face-icon';
      } else {
        return 'fas fa-frown text-danger modal-face-icon';
      }
    },
    async fetchMeterSNs() {
      try {
        // Fixed the URL typo from "hhttps" to "https"
        const response = await axios.get(`/api/powermeter/gateways/${this.gatewayID}/meters`);
        this.meterSNs = response.data[this.gatewayID] || [];
      } catch (error) {
        console.error('Error fetching meter serial numbers:', error);
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
.container {
  width: 100%;
  padding: 20px;
}

.text-center {
  text-align: center;
}

.section-container {
  margin-bottom: 30px;
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
  /* Adjust to two columns */
  gap: 10px;
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
}

.floorplan-image-container {
  width: 100%;
  height: auto;
  background-color: rgba(0, 0, 0, 0.1);
  /* Optional background for container */
  padding: 10px;
  display: flex;
  justify-content: center;
}

.floorplan-image {
  width: 100%;
  /* Keep the image responsive */
  border-radius: 5px;
}

.chart-box,
.console-box {
  border-radius: 5px;
  padding: 15px;
  text-align: center;
}

.chart-box {
  height: 300px;
  width: 100%;
  /* Ensure it spans the entire width */
  margin-left: auto;
  margin-right: auto;
}

.text-success {
  color: green;
}

.text-danger {
  color: red;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  /* Add this to introduce a gap between the divs */
}

.section-container {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 30px;
  flex: 1;
  /* Allows each section to take up equal space */
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
</style>
