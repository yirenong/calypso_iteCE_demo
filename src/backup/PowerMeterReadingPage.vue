<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Smart Energy Management System</h2>

    <!-- First Page: Overview -->
    <div v-if="showFirstPage" class="view-container">
      <h4 class="text-center mb-4">Overview</h4>
      <div class="grid-container">
        <!-- For each room, display its name and totals.
             For Landscape, display totals under the new field names -->
        <div v-for="(box, index) in roomData" :key="index" class="room-box" @click="handleBoxClick(box)">
          <h5 class="room-title">{{ box.label }}</h5>
          <div class="room-metrics">
            <!-- For non-Landscape rooms -->
            <template v-if="box.label !== 'Landscape'">
              <div class="metric">
                <span class="label">Total Power:</span>
                <span class="value">{{ box.totalValues.p }} kWh</span>
              </div>
              <div class="metric">
                <span class="label">Total Current:</span>
                <span class="value">{{ box.totalValues.ia }} A</span>
              </div>
              <div class="metric">
                <span class="label">Total Power Factor:</span>
                <span class="value">{{ box.totalValues.pf }}</span>
              </div>
              <div class="metric">
                <span class="label">Total Voltage:</span>
                <span class="value">{{ box.totalValues.ua }} V</span>
              </div>
            </template>

            <!-- For Landscape room -->
            <template v-else>
              <div class="metric">
                <span class="label">Total Power Consumption:</span>
                <span class="value">{{ box.totalValues.powerConsumption }} kWh</span>
              </div>
              <div class="metric">
                <span class="label">Total Power Factor:</span>
                <span class="value">{{ box.totalValues.powerFactor }}</span>
              </div>
              <div class="metric">
                <span class="label">Total Voltage:</span>
                <span class="value">{{ box.totalValues.voltage }} V</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Second Page: Room Details -->
    <div v-else class="sensor-detail-container">
      <button @click="goBack" class="back-button">Back to Main</button>
      <h3 class="text-center mb-4">{{ selectedRoom.label }} Sensors</h3>

      <!-- If the selected room is NOT Landscape, show the sensor grids and the aggregated chart -->
      <div v-if="selectedRoom.label !== 'Landscape'">
        <div v-if="threePhaseSensors.length > 0" class="three-phase-row">
          <div v-for="sensor in threePhaseSensors" :key="sensor.id" class="sensor-box"
            @mouseover="showTooltip(sensor, $event)" @mouseleave="hideTooltip">
            <p class="sensor-type">
              {{ sensor.type }}
              <br />
              <span class="sensor-sn">MeterSN: {{ sensor.id }}</span>
            </p>

          </div>
        </div>
        <div v-if="singlePhaseSensors.length > 0" class="single-phase-grid">
          <div v-for="sensor in singlePhaseSensors" :key="sensor.id" class="sensor-box"
            @mouseover="showTooltip(sensor, $event)" @mouseleave="hideTooltip">
            <p class="sensor-type">
              {{ sensor.type }}
              <br />
              <span class="sensor-sn">MeterSN: {{ sensor.id }}</span>
            </p>

          </div>
        </div>
        <div v-if="selectedRoom.sensors && selectedRoom.sensors.length === 0">
          <p>No sensor data available for this room.</p>
        </div>
        <div class="chart-section">
          <h4 class="text-center mb-4">Daily kWh Trend</h4>
          <div class="chart-canvas-wrap">
            <canvas id="kwhChart"></canvas>
            <div v-show="chartLoading" class="chart-loading-overlay">
              <div class="spinner"></div>
              <div class="spinner-text">Loading chart…</div>
            </div>
          </div>
        </div>

      </div>

      <!-- For Landscape room, show a single-phase grid (device list) and an optional bar chart -->
      <div v-else>
        <div class="single-phase-grid">
          <div v-for="(sensor, index) in selectedRoom.sensors" :key="index" class="sensor-box"
            @mouseover="showTooltip(sensor, $event)" @mouseleave="hideTooltip">
            <p class="sensor-type">
              {{ sensor.data.deviceName }}
              <br />
              <span class="sensor-sn">MeterSN: {{ sensor.meterSN || sensor.deviceSN || sensor.devEUI || '-' }}</span>
            </p>

          </div>
        </div>
        <div class="chart-section">
          <h4 class="text-center mb-4">Smart Light Controllers Comparison</h4>
          <div class="chart-canvas-wrap">
            <canvas id="landscapeChart"></canvas>
            <div v-show="chartLoading" class="chart-loading-overlay">
              <div class="spinner"></div>
              <div class="spinner-text">Loading chart…</div>
            </div>
          </div>
        </div>


      </div>
    </div>

    <!-- Tooltip for Sensor Data -->
    <div v-if="tooltipVisible" :style="{ top: tooltipY + 'px', left: tooltipX + 'px' }" class="tooltip">
      <h5>{{ tooltipData.meterName || 'Meter Data' }}</h5>

      <div v-if="selectedRoom.label === 'Landscape'">
        <p v-if="tooltipData.meterSN"><strong>Meter SN:</strong> {{ tooltipData.meterSN }}</p>
        <p><strong>Power Consumption:</strong> {{ tooltipData.powerConsumption }} kWh</p>
        <p><strong>Power Factor:</strong> {{ tooltipData.powerFactor }} </p>
        <p><strong>Voltage:</strong> {{ tooltipData.voltage }} V</p>
      </div>

      <div v-else>
        <p v-if="tooltipData.meterSN"><strong>Meter SN:</strong> {{ tooltipData.meterSN }}</p>
        <p><strong>Cumulative Energy:</strong> {{ tooltipData.importEnergy + tooltipData.exportEnergy }} kWh</p>
        <p><strong>Current:</strong> {{ tooltipData.current }} A</p>
        <p><strong>Power Factor:</strong> {{ tooltipData.powerFactor }}</p>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';
import {
  Chart,
  LineController, LineElement, PointElement,
  BarController, BarElement,
  LinearScale, CategoryScale, Title, Tooltip as ChartTooltip, Legend,
} from 'chart.js';
import { Filler } from 'chart.js';
Chart.register(Filler);


const POWERMETER = '/api/powermeter/';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getWithRetry(url, tries = 3, delay = 400) {
  for (let i = 0; i < tries; i++) {
    try { return await axios.get(url, { timeout: 15000 }); }
    catch (e) { if (i === tries - 1) throw e; await sleep(delay * (i + 1)); }
  }
}
function toHourKey(dt) {
  if (!dt) return null;
  // Accept "2025-10-14 13:05:00", "20251014130500", Date, etc.
  const digits = String(dt).replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(0, 10); // YYYYMMDDHH
  const d = new Date(dt);
  if (isNaN(d)) return null;
  const y = d.getFullYear().toString();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const h = d.getHours().toString().padStart(2, '0');
  return y + m + day + h;
}


Chart.register(
  LineController, LineElement, PointElement,
  BarController, BarElement,
  LinearScale, CategoryScale, Title, ChartTooltip, Legend
);

// put near the top with other helpers
async function mapLimit(items, limit, task) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await task(items[idx], idx); }
      catch (e) { out[idx] = { _error: true, error: e }; }
    }
  });
  await Promise.all(workers);
  return out;
}


export default {
  name: 'PowerMeterReadingPage',
  data() {
    return {
      showFirstPage: true,
      selectedRoom: {},
      tooltipVisible: false,
      tooltipData: {},
      tooltipX: 0,
      charts: {
        kwh: null,
        landscape: null
      },
      dataLoaded: false,
      tooltipY: 0,
      chartLoading: true, // true when fetching chart data
      roomData: [
        { label: 'B05-11/12', totalValues: { p: 0, ia: 0, pf: 0, ua: 0 }, sensors: [] },
        { label: 'B05-13/14', totalValues: { p: 0, ia: 0, pf: 0, ua: 0 }, sensors: [] },
        { label: 'B05-15/16/18', totalValues: { p: 0, ia: 0, pf: 0, ua: 0 }, sensors: [] },
        { label: 'B05-07', totalValues: { p: 0, ia: 0, pf: 0, ua: 0 }, sensors: [] },
        { label: 'B05-08', totalValues: { p: 0, ia: 0, pf: 0, ua: 0 }, sensors: [] },
        { label: 'B05-09', totalValues: { p: 0, ia: 0, pf: 0, ua: 0 }, sensors: [] },
        { label: 'Landscape', totalValues: { powerConsumption: 0, powerFactor: 0, voltage: 0 }, sensors: [] },
      ],
      chartInstance: null, // Store the Chart instance here
      landscapeData: []
    };
  },
  computed: {
    threePhaseSensors() {
      return this.selectedRoom.sensors
        ? this.selectedRoom.sensors.filter(
          (sensor) => sensor.type === 'Three-Phase'
        )
        : [];
    },
    singlePhaseSensors() {
      return this.selectedRoom.sensors
        ? this.selectedRoom.sensors.filter(
          (sensor) => sensor.type === 'Single-Phase'
        )
        : [];
    },
  },
  methods: {
    // NEW: Fetch the landscape (smart light) data from the API
    async fetchLandscapeData() {
      try {
        const response = await axios.get("h/api/powermeter/data/latest/Smartlight");
        // Save the returned data
        this.landscapeData = response.data;
      } catch (error) {
        console.error("Error fetching landscape data:", error);
      }
    },

    // NEW: Generate a bar chart that compares power_consumption, power_factor, and voltage for each device
    async generateLandscapeChart() {
      if (!this.landscapeData.length) {
        this.chartLoading = false; // nothing to draw
        return;
      }

      const labels = this.landscapeData.map(i => i.deviceName || i.data.deviceName);
      const powerConsumption = this.landscapeData.map(i => i.data.power_consumption);
      const powerFactor = this.landscapeData.map(i => i.data.power_factor);
      const voltage = this.landscapeData.map(i => i.data.voltage);

      const canvas = document.getElementById("landscapeChart");
      if (!canvas) { this.chartLoading = false; return; }
      const ctx = canvas.getContext("2d");

      if (this.charts.landscape) this.charts.landscape.destroy();

      this.charts.landscape = new Chart(ctx, {
        type: "bar",
        data: {
          labels, datasets: [
            { label: "Power Consumption", data: powerConsumption, backgroundColor: "rgba(75, 192, 192, 0.5)", borderColor: "rgba(75, 192, 192, 1)", borderWidth: 1 },
            { label: "Power Factor", data: powerFactor, backgroundColor: "rgba(192, 75, 192, 0.5)", borderColor: "rgba(192, 75, 192, 1)", borderWidth: 1 },
            { label: "Voltage", data: voltage, backgroundColor: "rgba(192, 192, 75, 0.5)", borderColor: "rgba(192, 192, 75, 1)", borderWidth: 1 },
          ]
        },
        options: { responsive: true, maintainAspectRatio: false /* ...rest unchanged... */ }
      });

      this.chartLoading = false; // <-- stop spinner after chart created
    },
    // New: Aggregates data over the past 24 hours (your existing method modified)
    async fetchAndAggregateHistory24h() {
      // No sensors → empty chart
      if (!this.selectedRoom.sensors?.length) {
        return { labels: [], powerData: [], currentData: [], voltageData: [] };
      }

      // Throttle history calls and retry on transient failures
      const results = await mapLimit(this.selectedRoom.sensors, 4, s =>
        getWithRetry(`${POWERMETER}/meters/${s.id}/history`)
      );

      const aggregatedData = {}; // key: YYYYMMDDHH → { p, ia, ua }

      for (const r of results) {
        if (!r || r._error) continue;
        const hist = Array.isArray(r.data) ? r.data : [r.data];
        for (const entry of hist) {
          // Some payloads use "datatime", others "datetime"
          const hourKey = toHourKey(entry?.datatime || entry?.datetime);
          if (!hourKey) continue;

          if (!aggregatedData[hourKey]) aggregatedData[hourKey] = { p: 0, ia: 0, ua: 0 };

          // Keep everything numeric and summed
          aggregatedData[hourKey].p += Math.abs(parseFloat(entry.P ?? entry.p ?? 0)) || 0;
          aggregatedData[hourKey].ia += parseFloat(entry.Ia ?? entry.ia ?? 0) || 0;
          aggregatedData[hourKey].ua += parseFloat(entry.Ua ?? entry.ua ?? 0) || 0;
        }
      }

      // Build last 24 hours keys + human labels
      const last24Hours = [];
      const labels = [];
      const now = new Date(); now.setMinutes(0, 0, 0);
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now); d.setHours(d.getHours() - i);
        const k = d.getFullYear().toString()
          + (d.getMonth() + 1).toString().padStart(2, '0')
          + d.getDate().toString().padStart(2, '0')
          + d.getHours().toString().padStart(2, '0');
        last24Hours.push(k);
        labels.push(`${d.getHours().toString().padStart(2, '0')}:00`);
      }

      // Important: return NUMBERS, not strings
      const powerData = last24Hours.map(k => +((aggregatedData[k]?.p ?? 0).toFixed(2)));
      const currentData = last24Hours.map(k => +((aggregatedData[k]?.ia ?? 0).toFixed(2)));
      const voltageData = last24Hours.map(k => +((aggregatedData[k]?.ua ?? 0).toFixed(2)));

      return { labels, powerData, currentData, voltageData };
    },

    // New: Draws the chart with given data.
    drawChart(labels, powerData, currentData, voltageData) {
      const canvas = document.getElementById("kwhChart");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      if (this.charts.kwh) this.charts.kwh.destroy();

      this.charts.kwh = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Total Power (kW)",
              data: powerData,
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.1)",
              fill: true,
            },
            {
              label: "Total Current (A)",
              data: currentData,
              borderColor: "rgba(192, 75, 192, 1)",
              backgroundColor: "rgba(192, 75, 192, 0.1)",
              fill: true,
            },
            {
              label: "Total Voltage (V)",
              data: voltageData,
              borderColor: "rgba(192, 192, 75, 1)",
              backgroundColor: "rgba(192, 192, 75, 0.1)",
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: { color: "#fff" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
            y: {
              beginAtZero: true,
              ticks: { color: "#fff" },
              grid: { color: "rgba(255, 255, 255, 0.2)" },
            },
          },
          plugins: {
            legend: { labels: { color: "#fff" } },
            tooltip: {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              titleColor: "white",
              bodyColor: "white",
            },
            title: {
              display: true,
              text: "Smart Energy Data - Past 24 Hours",
            },
          },
        },
      });
    },
    async fetchAndAggregateHistory() {
      let aggregatedData = {}; // key: date (YYYYMMDD), value: { p, ia, ua }

      // For each sensor in the selected room, get its history data.
      const meterHistoryPromises = this.selectedRoom.sensors.map((sensor) => {
        // sensor.id holds the meterSN
        return axios.get(
          `/api/powermeter/meters/${sensor.id}/history`
        );
      });

      // Wait for all the history requests to complete.
      const historyResponses = await Promise.all(meterHistoryPromises);

      historyResponses.forEach((response) => {
        // Ensure meterHistory is an array. If not, wrap it in one.
        let meterHistory = response.data;
        if (!Array.isArray(meterHistory)) {
          meterHistory = [meterHistory];
        }

        // Group by date and pick the latest entry for each date.
        let latestEntriesByDate = {};
        meterHistory.forEach((entry) => {
          // Extract date (first 8 characters from "datatime", e.g., "20250219")
          const date = entry.datatime.substring(0, 8);
          // Update if this entry is later than the currently stored one for that date.
          if (
            !latestEntriesByDate[date] ||
            entry.datatime > latestEntriesByDate[date].datatime
          ) {
            latestEntriesByDate[date] = entry;
          }
        });

        // Add this meter's latest data for each date to the aggregated totals.
        for (const date in latestEntriesByDate) {
          if (!aggregatedData[date]) {
            aggregatedData[date] = { p: 0, ia: 0, ua: 0 };
          }
          const entry = latestEntriesByDate[date];
          aggregatedData[date].p += Math.abs(parseFloat(entry.P || 0));
          aggregatedData[date].ia += parseFloat(entry.Ia || 0);
          aggregatedData[date].ua += parseFloat(entry.Ua || 0);
        }
      });

      // Generate an array for the past 7 days (inclusive of today).
      const last7Days = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize time to midnight
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        last7Days.push(`${year}${month}${day}`); // Format: YYYYMMDD
      }

      // Prepare chart data arrays, defaulting to 0 if a date is missing.
      const labels = last7Days.map(
        (dateStr) =>
          `${dateStr.substring(0, 4)}-${dateStr.substring(
            4,
            6
          )}-${dateStr.substring(6, 8)}`
      );
      const powerData = last7Days.map((date) =>
        aggregatedData[date] ? aggregatedData[date].p.toFixed(2) : 0
      );
      const currentData = last7Days.map((date) =>
        aggregatedData[date] ? aggregatedData[date].ia.toFixed(2) : 0
      );
      const voltageData = last7Days.map((date) =>
        aggregatedData[date] ? aggregatedData[date].ua.toFixed(2) : 0
      );

      return { labels, powerData, currentData, voltageData };
    },
    // New: Combined method for generating the chart with storage.
    async generateAggregatedChart() {
      this.chartLoading = true;
      try {
        const { labels, powerData, currentData, voltageData } =
          await this.fetchAndAggregateHistory24h();
        this.drawChart(labels, powerData, currentData, voltageData);
      } catch (e) {
        console.error('Chart generation failed:', e);
      } finally {
        this.chartLoading = false;
      }
    },
    // Modify your handleBoxClick method to load the landscape chart if room label is "Landscape"
    handleBoxClick(box) {
      this.selectedRoom = box;
      this.showFirstPage = false;
      this.chartLoading = true;

      this.$nextTick(async () => {
        // Ensure data exists even if dataLoaded was set earlier
        if (this.selectedRoom.label === "Landscape") {
          await this.fetchLandscapeData();
          await this.$nextTick(); // ensure canvas exists
          this.generateLandscapeChart();
        } else {
          if (!this.selectedRoom.sensors?.length) {
            await this.fetchData();
          }
          await this.$nextTick(); // ensure canvas exists
          await this.generateAggregatedChart();
        }
      });
    }
    ,
    goBack() {
      if (this.charts.kwh) { this.charts.kwh.destroy(); this.charts.kwh = null; }
      if (this.charts.landscape) { this.charts.landscape.destroy(); this.charts.landscape = null; }
      this.chartLoading = false;
      this.showFirstPage = true;
    },
    showTooltip(sensorData, event) {
      if (this.selectedRoom.label === 'Landscape') {
        this.tooltipData = {
          meterName: sensorData.data.deviceName,
          meterSN: sensorData.meterSN || sensorData.deviceSN || sensorData.devEUI || sensorData.devAddr || '',
          // Dividing by 1000 converts Wh to kWh (if that's the unit used)
          powerConsumption: sensorData.data.power_consumption / 1000,
          powerFactor: sensorData.data.power_factor,
          voltage: sensorData.data.voltage,
        };
      } else {
        this.tooltipData = {
          meterName: sensorData.meterName || 'Sensor',
          meterSN: sensorData.id || '',          // <-- show the meterSN
          importEnergy: sensorData.epi || 0,
          exportEnergy: sensorData.epe || 0,
          current: sensorData.ia || 0,
          powerFactor: sensorData.pf || 0,
        };
      }

      this.tooltipVisible = true;
      this.tooltipX = event.pageX + 15;
      this.tooltipY = event.pageY + 15;
    },
    hideTooltip() {
      this.tooltipVisible = false;
    },
    async fetchData() {
      this.dataLoaded = false; // add dataLoaded: false in data()
      try {
        // Map room labels to gateway IDs (non-Landscape)
        const gatewayMapping = {
          'B05-11/12': '24011006420037',
          'B05-08': '24052003410036',
          'B05-07': '24052003410035',
          'B05-09': '24052003410034',
          'B05-15/16/18': '24011006420037',
          'B05-13/14': '24060410030006',
        };

        // Ensure every room has a sensors array
        this.roomData.forEach(r => { if (!Array.isArray(r.sensors)) r.sensors = []; });

        for (const room of this.roomData) {
          // --- Landscape (Smartlight) ---
          if (room.label === 'Landscape') {
            try {
              const { data } = await axios.get('/api/lorawan/data/latest/Smartlight');
              const arr = Array.isArray(data) ? data : [];
              room.sensors = arr;

              // Aggregate: total power (kWh), max PF, max Voltage
              let totalWh = 0;
              let maxPF = 0;
              let maxV = 0;

              for (const item of arr) {
                const d = item?.data ?? {};
                const wh = Number(d.power_consumption) || 0; // Wh
                const pf = Number(d.power_factor) || 0;
                const v = Number(d.voltage) || 0;
                totalWh += wh;
                if (pf > maxPF) maxPF = pf;
                if (v > maxV) maxV = v;
              }

              room.totalValues.powerConsumption = (totalWh / 1000).toFixed(2); // kWh
              room.totalValues.powerFactor = maxPF.toFixed(2);
              room.totalValues.voltage = maxV.toFixed(2);
            } catch (err) {
              console.error('Landscape fetch error:', err);
              room.sensors = [];
              room.totalValues.powerConsumption = '0.00';
              room.totalValues.powerFactor = '0.00';
              room.totalValues.voltage = '0.00';
            }
            continue; // skip powermeter flow for Landscape
          }

          // --- Non-Landscape (Powermeter) ---
          const gatewayID = gatewayMapping[room.label];
          if (!gatewayID) {
            // No gateway mapped; ensure clean defaults
            room.sensors = [];
            room.totalValues = { p: '0.00', ia: '0.00', pf: '0.00', ua: '0.00' };
            continue;
          }

          try {
            // Get list of meter SNs for the gateway
            const metersResp = await axios.get(`/api/powermeter/gateways/${gatewayID}/meters`);
            const metersData = metersResp.data || {};
            const meterSNs = Array.isArray(metersData[gatewayID]) ? metersData[gatewayID] : [];

            room.sensors = [];
            let sumP = 0;   // kW (assuming P is kW)
            let sumIa = 0;  // A
            let maxPF = 0;
            let maxUa = 0;  // V

            // Fetch all latest readings; don't let one failure kill all
            const latestResults = await Promise.allSettled(
              meterSNs.map(sn => axios.get(`/api/powermeter/meters/${sn}/latest`))
            );

            for (const r of latestResults) {
              if (r.status !== 'fulfilled') continue;
              const item = r.value?.data || {};

              const meterSN = item.meterSN;
              const meterName = item.meterName || '';
              const type = meterName === 'ADL400N' ? 'Three-Phase' : 'Single-Phase';

              const P = Math.abs(Number(item.P)) || 0;   // kW
              const Ia = Number(item.Ia) || 0;   // A
              const PF = Math.abs(Number(item.PF)) || 0;   // unitless
              const Ua = Number(item.Ua) || 0;   // V
              const EPI = Math.abs(Number(item.EPI)) || 0; // kWh (if provided)
              const EPE = Math.abs(Number(item.EPE)) || 0; // kWh (if provided)

              sumP += P;
              sumIa += Ia;
              if (PF > maxPF) maxPF = PF;
              if (Ua > maxUa) maxUa = Ua;

              room.sensors.push({
                id: meterSN,
                meterName,
                type,
                epi: EPI,
                epe: EPE,
                ia: Ia,
                pf: PF,
                p: P,
                ua: Ua,
              });
            }

            // Totals (format to 2dp)
            room.totalValues.p = sumP.toFixed(2);
            room.totalValues.ia = sumIa.toFixed(2);
            // If you want to force PF to 0.91, replace next line with: (0.91).toFixed(2)
            room.totalValues.pf = (0.8).toFixed(2);
            room.totalValues.ua = maxUa.toFixed(2);
          } catch (err) {
            console.error(`Fetch error for ${room.label} (Gateway ${gatewayID}):`, err);
            room.sensors = [];
            room.totalValues = { p: '0.00', ia: '0.00', pf: '0.00', ua: '0.00' };
          }
        }
      } finally {
        this.dataLoaded = true;
      }
    }

  },
  mounted() {
    this.fetchData();
    // Also, if the room details view should be loaded immediately,
    // call generateAggregatedChart() after a short delay (if necessary)
    if (!this.showFirstPage) {
      this.generateAggregatedChart();
    }
  }
};
</script>

<style scoped>
.container-fluid {
  max-width: 1200px;
}

.view-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  width: 100%;
  border-radius: 5px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
}

.room-box {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  color: #ffffff;
  text-align: left;
  cursor: pointer;
}

.room-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.room-metrics {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 5px 0;
}

.label {
  font-weight: bold;
}

.value {
  text-align: right;
}

.sensor-detail-container {
  text-align: center;
  padding: 20px;
  position: relative;
}

.three-phase-row {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

/* Grid container for the sensor boxes */
.single-phase-grid {
  display: grid;
  /* Create as many columns as possible, with each column being at least 150px wide.
     You can adjust the minimum width (150px) to suit your design. */
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  /* Space between boxes */
  margin-top: 20px;
}

/* Sensor box styling */
.sensor-box {
  border: 2px solid red;
  border-radius: 5px;
  padding: 20px;
  /* Use Flexbox so that content is centered both horizontally and vertically */
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: bold;
  /* Force a consistent min-height so boxes don't stretch unpredictably */
  min-height: 80px;
}

/* Optional: Prevent long device names from wrapping over multiple lines */
.sensor-box p {
  margin: 0;
  white-space: nowrap;
  /* Keep text on a single line */
  overflow: hidden;
  text-overflow: ellipsis;
  /* Add an ellipsis (…) when text is too long */
}


.back-button {
  position: absolute;
  bottom: -85px;
  right: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 999;
}

.tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 0.9rem;
  max-width: 200px;
  z-index: 1000;
  pointer-events: none;
  text-align: center;
  opacity: 0.9;
}

.chart-section {
  width: 100%;
  height: 500px;
  position: relative;
}

/* Optional styling for landscape chart container */
.chart-section h4 {
  text-align: center;
  margin-bottom: 20px;
  color: #fff;
}

/* Ensuring the canvas fills the container */
canvas {
  width: 100% !important;
  height: 100% !important;
}

.chart-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  /* same as your chart container height */
}

.chart-loading {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-text {
  color: #fff;
  font-size: 0.95rem;
  opacity: 0.9;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chart-canvas-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-text {
  color: #fff;
  opacity: 0.9;
}

.sensor-sn {
  font-size: 0.8rem;
  font-weight: normal;
  opacity: 0.8;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
