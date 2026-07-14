<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Smart Energy Management System (New)</h2>

    <!-- ================= OVERVIEW ================= -->
    <div v-if="showFirstPage" class="view-container">
      <h4 class="text-center mb-4">Rooms</h4>

      <div class="grid-container">
        <div v-for="(room, idx) in rooms" :key="idx" class="room-box" @click="openRoom(room)">
          <h5 class="room-title">{{ room.label }}</h5>

          <div class="room-metrics">
            <div class="metric">
              <span class="label">Source:</span>
              <span class="value">
                {{ room.label === "Landscape" ? "LoRaWAN Smartlight" : "Powermeter" }}
              </span>
            </div>

            <div v-if="room.label !== 'Landscape'" class="metric">
              <span class="label">Gateway SN:</span>
              <span class="value">{{ room.gateway_sn }}</span>
            </div>

            <div class="metric">
              <span class="label">Sensors:</span>
              <span class="value">{{ room.sensors.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="hint">
        <span v-if="loading">Loading sensors…</span>
        <span v-else>Click any room to view its sensors.</span>
      </div>
    </div>

    <!-- ================= ROOM DETAILS ================= -->
    <div v-else class="room-detail">
      <button @click="goBack" class="back-button">Back</button>

      <div class="room-head">
        <h3 class="room-name">{{ selectedRoom.label }}</h3>
        <div class="room-sub">
          <span v-if="selectedRoom.label !== 'Landscape'">
            Gateway: <b>{{ selectedRoom.gateway_sn }}</b>
          </span>
          <span v-else>Smartlight</span>
        </div>
      </div>

      <!-- ================= LANDSCAPE ================= -->
      <div v-if="selectedRoom.label === 'Landscape'" class="two-col">
        <div class="left-panel">
          <div class="section-label">Devices</div>
          <div class="sensor-row">
            <div
              v-for="(s, i) in selectedRoom.sensors"
              :key="selectedSensorLandscapeKey(s, i)"
              class="sensor-card"
              :class="{ selected: selectedSensorLandscapeKey(s, i) === selectedLandscapeKey }"
              @click="selectLandscapeSensor(s, i)"
            >
              <div class="card-title">{{ s?.data?.deviceName || "Smartlight Device" }}</div>
              <div class="card-sub">Smartlight</div>
              <div class="card-meta">SN: {{ landscapeIdentifier(s) }}</div>
            </div>

            <div v-if="!selectedRoom.sensors.length" class="empty small">
              No Smartlight devices returned.
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="panel-title">Data</div>

          <div v-if="selectedLandscapeSensor" class="data-block">
            <div class="data-row"><b>Device:</b> {{ selectedLandscapeSensor?.data?.deviceName || "-" }}</div>
            <div class="data-row"><b>Identifier:</b> {{ landscapeIdentifier(selectedLandscapeSensor) }}</div>
          </div>
          <div v-else class="panel-sub">Select a device on the left.</div>

          <div class="chart-wrap">
            <div class="chart-title">Chart</div>
            <div class="chart-placeholder">Chart will be rendered here</div>
          </div>
        </div>
      </div>

      <!-- ================= POWERMETER ================= -->
      <div v-else class="two-col">
        <!-- LEFT -->
        <div class="left-panel">
          <!-- Tabs only for shared gateway -->
          <div v-if="canCategorizeSelectedRoom" class="tabs">
            <button
              v-for="lvl in ['Overall', 'L1', 'L2', 'L3']"
              :key="lvl"
              class="tab"
              :class="{ active: activeLevel === lvl }"
              @click="switchLevel(lvl)"
            >
              {{ lvl }}
            </button>
          </div>

          <!-- Categorized view -->
          <div v-if="canCategorizeSelectedRoom">
            <template v-if="activeLevel === 'Overall'">
              <div class="level-block" v-for="lvl in ['L1', 'L2', 'L3']" :key="lvl">
                <div class="level-name">{{ lvl }}</div>

                <!-- meter -->
                <div class="sensor-row">
                  <div
                    v-if="categorized[lvl].meter"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === categorized[lvl].meter.meter_sn }"
                    @click="selectSensor(categorized[lvl].meter)"
                  >
                    <div class="card-title">{{ displayName(categorized[lvl].meter) }}</div>
                    <div class="card-meta">SN: {{ categorized[lvl].meter.meter_sn }}</div>
                  </div>
                </div>

                <!-- S -->
                <div class="sensor-row">
                  <div
                    v-for="s in categorized[lvl].S"
                    :key="s.meter_sn"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }"
                    @click="selectSensor(s)"
                  >
                    <div class="card-title">{{ displayName(s) }}</div>
                    <div class="card-meta">SN: {{ s.meter_sn }}</div>
                  </div>
                </div>

                <!-- P -->
                <div class="sensor-row">
                  <div
                    v-for="p in categorized[lvl].P"
                    :key="p.meter_sn"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === p.meter_sn }"
                    @click="selectSensor(p)"
                  >
                    <div class="card-title">{{ displayName(p) }}</div>
                    <div class="card-meta">SN: {{ p.meter_sn }}</div>
                  </div>
                </div>
              </div>

              <!-- Uncategorised only in overall -->
              <div class="level-block">
                <div class="level-name">Uncategorised</div>
                <div class="sensor-row">
                  <div
                    v-for="u in uncategorised"
                    :key="u.meter_sn"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === u.meter_sn }"
                    @click="selectSensor(u)"
                  >
                    <div class="card-title">{{ displayName(u) }}</div>
                    <div class="card-meta">SN: {{ u.meter_sn }}</div>
                  </div>
                  <div v-if="!uncategorised.length" class="empty small">None</div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="level-block">
                <div class="level-name">{{ activeLevel }}</div>

                <div class="sensor-row">
                  <div
                    v-if="categorized[activeLevel].meter"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === categorized[activeLevel].meter.meter_sn }"
                    @click="selectSensor(categorized[activeLevel].meter)"
                  >
                    <div class="card-title">{{ displayName(categorized[activeLevel].meter) }}</div>
                    <div class="card-meta">SN: {{ categorized[activeLevel].meter.meter_sn }}</div>
                  </div>
                </div>

                <div class="sensor-row">
                  <div
                    v-for="s in categorized[activeLevel].S"
                    :key="s.meter_sn"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }"
                    @click="selectSensor(s)"
                  >
                    <div class="card-title">{{ displayName(s) }}</div>
                    <div class="card-meta">SN: {{ s.meter_sn }}</div>
                  </div>
                </div>

                <div class="sensor-row">
                  <div
                    v-for="p in categorized[activeLevel].P"
                    :key="p.meter_sn"
                    class="sensor-card"
                    :class="{ selected: selectedSensor?.meter_sn === p.meter_sn }"
                    @click="selectSensor(p)"
                  >
                    <div class="card-title">{{ displayName(p) }}</div>
                    <div class="card-meta">SN: {{ p.meter_sn }}</div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Fallback view -->
          <div v-else>
            <div class="section-label">Sensors</div>
            <div class="sensor-row">
              <div
                v-for="s in selectedRoom.sensors"
                :key="s.meter_sn"
                class="sensor-card"
                :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }"
                @click="selectSensor(s)"
              >
                <div class="card-title">{{ displayName(s) }}</div>
                <div class="card-sub">{{ s.meter_name || "-" }}</div>
                <div class="card-meta">Last: {{ s.last_ts ? formatTs(s.last_ts) : "-" }}</div>
              </div>

              <div v-if="!selectedRoom.sensors.length" class="empty small">
                No sensors found for this gateway.
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="right-panel">
          <div class="panel-title">Data</div>

          <div v-if="selectedSensor" class="data-block">
            <div class="data-row"><b>Name:</b> {{ displayName(selectedSensor) }}</div>
            <div class="data-row"><b>Meter SN:</b> {{ selectedSensor.meter_sn }}</div>
            <div class="data-row"><b>Type:</b> {{ selectedSensor.meter_name }}</div>
            <div class="data-row"><b>Gateway:</b> {{ selectedRoom.gateway_sn }}</div>
            <div class="data-row" v-if="selectedSensor.last_ts"><b>Last TS:</b> {{ formatTs(selectedSensor.last_ts) }}</div>
          </div>
          <div v-else class="panel-sub">Select a sensor on the left to view details.</div>

          <!-- ================= SENSOR USAGE ================= -->
          <div class="chart-section">
            <div class="chart-header">
              <div class="chart-header-left">
                <div class="chart-title">Sensor Usage</div>
                <div class="chart-sub">Selected meter (day24)</div>
              </div>

              <div class="chart-header-right">
                <input class="date-input" type="date" v-model="sensorDate" @change="onSensorDateChange" />
                <button class="icon-btn" @click="openFullscreen('sensor')" :disabled="!sensorSeries.labels.length">⛶</button>
              </div>
            </div>

            <div class="chart-canvas-wrap">
              <canvas ref="sensorChartCanvas"></canvas>

              <div v-show="chartLoadingSensor" class="chart-loading-overlay">
                <div class="spinner"></div>
                <div class="spinner-text">Loading…</div>
              </div>

              <div v-if="!selectedSensor && !chartLoadingSensor" class="chart-empty-overlay">
                Select a sensor to load chart.
              </div>

              <div v-if="chartErrorSensor" class="chart-error-overlay">
                <div class="err-title">Failed to load</div>
                <div class="err-msg">{{ chartErrorSensor }}</div>
                <div class="err-url">{{ lastSensorUrl }}</div>
              </div>
            </div>
          </div>

          <!-- ================= OVERALL USAGE ================= -->
          <div class="chart-section">
            <div class="chart-header">
              <div class="chart-header-left">
                <div class="chart-title">Overall Usage</div>
                <div class="chart-sub">Gateway total (by_gateway)</div>
              </div>

              <div class="chart-header-right">
                <input class="date-input" type="date" v-model="overallDate" @change="onOverallDateChange" />
                <button class="icon-btn" @click="openFullscreen('overall')" :disabled="!overallSeries.labels.length">⛶</button>
              </div>
            </div>

            <div class="chart-canvas-wrap">
              <canvas ref="overallChartCanvas"></canvas>

              <div v-show="chartLoadingOverall" class="chart-loading-overlay">
                <div class="spinner"></div>
                <div class="spinner-text">Loading…</div>
              </div>

              <div v-if="!selectedRoom?.gateway_sn && !chartLoadingOverall" class="chart-empty-overlay">
                No gateway selected.
              </div>

              <div v-if="chartErrorOverall" class="chart-error-overlay">
                <div class="err-title">Failed to load</div>
                <div class="err-msg">{{ chartErrorOverall }}</div>
                <div class="err-url">{{ lastOverallUrl }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= FULLSCREEN MODAL ================= -->
      <div v-if="fullscreen.open" class="fs-modal" @click.self="closeFullscreen">
        <div class="fs-modal-inner">
          <div class="fs-modal-header">
            <div class="fs-title">{{ fullscreen.type === "sensor" ? "Sensor Usage" : "Overall Usage" }}</div>

            <div class="fs-actions">
              <input
                v-if="fullscreen.type === 'sensor'"
                class="date-input"
                type="date"
                v-model="sensorDate"
                @change="onSensorDateChange"
              />
              <input v-else class="date-input" type="date" v-model="overallDate" @change="onOverallDateChange" />

              <button class="close-btn" @click="closeFullscreen" type="button">✕</button>
            </div>
          </div>

          <div class="fs-canvas-wrap">
            <canvas ref="fullscreenCanvas"></canvas>

            <div v-if="fullscreenError" class="fs-error">
              <div class="err-title">Failed to draw fullscreen chart</div>
              <div class="err-msg">{{ fullscreenError }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Chart from "chart.js/auto";

/* helpers */
function isThreePhase(name = "") {
  return String(name).toUpperCase().startsWith("ADL400");
}
function isSinglePhase(name = "") {
  return String(name).toUpperCase().startsWith("ADL200");
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/* mapping */
const METER_SUFFIX_NAME_MAP = {
  "0008": "L1S1",
  "0010": "L1S2",
  "0021": "L1S3",
  "0013": "L1P1",
  "0032": "L1P2",
  "0028": "L1P3",
  "0027": "L1P4",
  "0020": "L1P5",
  "0001": "L2S1",
  "0012": "L2S2",
  "0009": "L2S3",
  "0022": "L2P1",
  "0029": "L2P2",
  "0011": "L2P3",
  "0018": "L2P4",
  "0019": "L2P5",
  "0007": "L2P6",
  "0024": "L3S1",
  "0026": "L3S2",
  "0025": "L3S3",
  "0016": "L3P1",
  "0031": "L3P2",
  "0003": "L3P3",
  "0030": "L3P4",
  "0023": "L3P5",
};

const THREE_PHASE_LEVEL_ANCHORS = {
  "24052003410003": "L1",
  "24052003410004": "L2",
  "24052003410006": "L3",
};

export default {
  name: "PowerMeterReadingPage",

  data() {
    return {
      showFirstPage: true,
      loading: false,

      rooms: [
        { label: "B05-11/12", gateway_sn: "24011006420037", sensors: [] },
        { label: "B05-13/14", gateway_sn: "24060410030006", sensors: [] },
        { label: "B05-15/16/18", gateway_sn: "24011006420037", sensors: [] },
        { label: "B05-07", gateway_sn: "24052003410035", sensors: [] },
        { label: "B05-08", gateway_sn: "24052003410036", sensors: [] },
        { label: "B05-09", gateway_sn: "24052003410034", sensors: [] },
        { label: "Landscape", gateway_sn: null, sensors: [] },
      ],

      selectedRoom: {},
      activeLevel: "Overall",
      selectedSensor: null,

      // Landscape
      selectedLandscapeSensor: null,
      selectedLandscapeKey: null,

      // Date filters
      sensorDate: todayISO(),
      overallDate: todayISO(),

      // Series state (for normal + fullscreen)
      sensorSeries: { labels: [], values: [], label: "" },
      overallSeries: { labels: [], values: [], label: "" },

      // Charts
      sensorChart: null,
      overallChart: null,
      fullscreenChart: null,

      chartLoadingSensor: false,
      chartLoadingOverall: false,

      chartErrorSensor: "",
      chartErrorOverall: "",
      lastSensorUrl: "",
      lastOverallUrl: "",

      fullscreenError: "",

      fullscreen: {
        open: false,
        type: "sensor", // 'sensor' | 'overall'
      },
    };
  },

  computed: {
    canCategorizeSelectedRoom() {
      return this.selectedRoom?.gateway_sn === "24011006420037";
    },

    categorized() {
      const base = {
        L1: { meter: null, S: [], P: [] },
        L2: { meter: null, S: [], P: [] },
        L3: { meter: null, S: [], P: [] },
      };
      if (!this.canCategorizeSelectedRoom) return base;

      const sensors = Array.isArray(this.selectedRoom.sensors) ? this.selectedRoom.sensors : [];

      for (const s of sensors) {
        if (isThreePhase(s.meter_name)) {
          const lvl = THREE_PHASE_LEVEL_ANCHORS[String(s.meter_sn)] || null;
          if (lvl) base[lvl].meter = s;
          continue;
        }

        if (!isSinglePhase(s.meter_name)) continue;

        const name = this.displayName(s);
        const lvl = name.startsWith("L1")
          ? "L1"
          : name.startsWith("L2")
            ? "L2"
            : name.startsWith("L3")
              ? "L3"
              : null;
        if (!lvl) continue;

        if (name.includes("S")) base[lvl].S.push(s);
        else base[lvl].P.push(s);
      }

      for (const lvl of ["L1", "L2", "L3"]) {
        base[lvl].S.sort((a, b) => this.displayName(a).localeCompare(this.displayName(b)));
        base[lvl].P.sort((a, b) => this.displayName(a).localeCompare(this.displayName(b)));
      }

      return base;
    },

    uncategorised() {
      if (!this.canCategorizeSelectedRoom) return [];
      const sensors = Array.isArray(this.selectedRoom.sensors) ? this.selectedRoom.sensors : [];

      return sensors.filter((s) => {
        if (isThreePhase(s.meter_name) && THREE_PHASE_LEVEL_ANCHORS[String(s.meter_sn)]) return false;
        const n = this.displayName(s);
        return !String(n).startsWith("L1") && !String(n).startsWith("L2") && !String(n).startsWith("L3");
      });
    },
  },

  methods: {
    /* -------- label formatting: "YYYY-MM-DD HH:00" => "h:00 AM/PM" -------- */
    to12HourLabel(label) {
      const str = String(label || "");
      const m = str.match(/(\d{2}):(\d{2})/);
      if (!m) return str;
      let hh = Number(m[1]);
      const mm = m[2];
      const ampm = hh >= 12 ? "PM" : "AM";
      hh = hh % 12;
      if (hh === 0) hh = 12;
      return `${hh}:${mm} ${ampm}`;
    },

    /* -------- trim: show only up to latest full hour of selected day -------- */
    trimToHour(labels, values, dayISO) {
      const isToday = dayISO === todayISO();
      if (!isToday) return { labels, values };

      const now = new Date();
      const cutHour = now.getHours(); // show up to HH:00

      const idx = labels.findIndex((lab) => {
        const mm = String(lab).match(/(\d{2}):00/);
        if (!mm) return false;
        return Number(mm[1]) === cutHour;
      });

      const end = idx >= 0 ? idx + 1 : labels.length;
      return {
        labels: labels.slice(0, end),
        values: values.slice(0, end),
      };
    },

    /* -------- naming -------- */
    displayName(s) {
      if (!s) return "-";

      if (isThreePhase(s.meter_name)) {
        return THREE_PHASE_LEVEL_ANCHORS[String(s.meter_sn)] || s.meter_name || "ADL400N";
      }

      if (isSinglePhase(s.meter_name)) {
        const suffix = String(s.meter_sn).slice(-4);
        return METER_SUFFIX_NAME_MAP[suffix] || s.meter_sn;
      }

      return s.meter_sn;
    },

    formatTs(ts) {
      if (!ts || typeof ts !== "string" || ts.length < 14) return ts || "";
      const y = ts.slice(0, 4);
      const m = ts.slice(4, 6);
      const d = ts.slice(6, 8);
      const hh = ts.slice(8, 10);
      const mm = ts.slice(10, 12);
      const ss = ts.slice(12, 14);
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    },

    /* -------- navigation -------- */
    openRoom(room) {
      this.selectedRoom = room;
      this.showFirstPage = false;

      this.activeLevel = "Overall";
      this.selectedSensor = null;

      this.selectedLandscapeSensor = null;
      this.selectedLandscapeKey = null;

      // Reset charts + data
      this.sensorSeries = { labels: [], values: [], label: "" };
      this.overallSeries = { labels: [], values: [], label: "" };

      this.chartErrorSensor = "";
      this.chartErrorOverall = "";
      this.lastSensorUrl = "";
      this.lastOverallUrl = "";
      this.fullscreenError = "";

      this.destroyCharts();

      // Load overall chart for the room immediately
      if (room.label !== "Landscape") {
        this.$nextTick(() => {
          this.loadOverallSeriesAndDraw();
        });
      }
    },

    goBack() {
      this.closeFullscreen();
      this.destroyCharts();
      this.showFirstPage = true;

      this.selectedSensor = null;
      this.selectedLandscapeSensor = null;
      this.selectedLandscapeKey = null;

      this.sensorSeries = { labels: [], values: [], label: "" };
      this.overallSeries = { labels: [], values: [], label: "" };

      this.chartErrorSensor = "";
      this.chartErrorOverall = "";
      this.lastSensorUrl = "";
      this.lastOverallUrl = "";
      this.fullscreenError = "";
    },

    switchLevel(lvl) {
      this.activeLevel = lvl;
      this.selectedSensor = null;

      this.sensorSeries = { labels: [], values: [], label: "" };
      this.chartErrorSensor = "";
      this.lastSensorUrl = "";
      this.destroySensorChartOnly();
    },

    selectSensor(s) {
      this.selectedSensor = s;

      this.selectedLandscapeSensor = null;
      this.selectedLandscapeKey = null;

      this.$nextTick(() => {
        this.loadSensorSeriesAndDraw();
      });
    },

    /* -------- date change handlers -------- */
    onSensorDateChange() {
      if (!this.selectedSensor) return;
      this.loadSensorSeriesAndDraw();
    },

    onOverallDateChange() {
      if (!this.selectedRoom?.gateway_sn) return;
      this.loadOverallSeriesAndDraw();
    },

    /* -------- landscape -------- */
    landscapeIdentifier(s) {
      return s?.meterSN || s?.deviceSN || s?.devEUI || s?.devAddr || "-";
    },
    selectedSensorLandscapeKey(s, i) {
      return `${this.landscapeIdentifier(s)}_${i}`;
    },
    selectLandscapeSensor(s, i) {
      this.selectedLandscapeSensor = s;
      this.selectedLandscapeKey = this.selectedSensorLandscapeKey(s, i);
      this.selectedSensor = null;
    },

    /* -------- charts lifecycle -------- */
    destroyCharts() {
      this.destroySensorChartOnly();
      this.destroyOverallChartOnly();
      this.destroyFullscreenChartOnly();
    },

    destroySensorChartOnly() {
      if (this.sensorChart) {
        try {
          this.sensorChart.destroy();
        } catch (e) {
          console.warn("sensorChart destroy failed:", e);
        }
        this.sensorChart = null;
      }
    },

    destroyOverallChartOnly() {
      if (this.overallChart) {
        try {
          this.overallChart.destroy();
        } catch (e) {
          console.warn("overallChart destroy failed:", e);
        }
        this.overallChart = null;
      }
    },

    destroyFullscreenChartOnly() {
      if (this.fullscreenChart) {
        try {
          this.fullscreenChart.destroy();
        } catch (e) {
          console.warn("fullscreenChart destroy failed:", e);
        }
        this.fullscreenChart = null;
      }
    },

    /* -------- chart builder -------- */
    buildLineChart(canvas, series) {
      if (!canvas) return null;

      return new Chart(canvas, {
        type: "line",
        data: {
          labels: series.labels,
          datasets: [
            {
              label: series.label,
              data: series.values,
              borderWidth: 2,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false, // helps prevent weird resizing loops
          plugins: {
            legend: { labels: { color: "#fff" } },
            tooltip: {
              callbacks: {
                title: (items) => {
                  if (!items?.length) return "";
                  return String(items[0].label || "");
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#fff", maxRotation: 0, autoSkip: true },
              grid: { color: "rgba(255,255,255,0.15)" },
            },
            y: {
              ticks: { color: "#fff" },
              grid: { color: "rgba(255,255,255,0.15)" },
              beginAtZero: true,
            },
          },
        },
      });
    },

    /* -------- sensor series + draw -------- */
    async loadSensorSeriesAndDraw() {
      if (!this.selectedSensor) return;

      this.chartLoadingSensor = true;
      this.chartErrorSensor = "";
      this.lastSensorUrl = "";
      this.destroySensorChartOnly();

      try {
        const day = this.sensorDate || todayISO();
        const meterSN = this.selectedSensor.meter_sn;

        const url = `http://localhost:5002/usage/day24?meter_sn=${encodeURIComponent(meterSN)}&day=${encodeURIComponent(
          day
        )}`;
        this.lastSensorUrl = url;

        const { data } = await axios.get(url);

        const labelsRaw = Array.isArray(data.labels_24) ? data.labels_24 : [];
        const usageRaw = Array.isArray(data.usage_24) ? data.usage_24 : [];

        const trimmed = this.trimToHour(labelsRaw, usageRaw, day);
        const labels = trimmed.labels.map((x) => this.to12HourLabel(x));
        const values = trimmed.values;

        this.sensorSeries = {
          labels,
          values,
          label: `${this.displayName(this.selectedSensor)} usage (kWh)`,
        };

        await this.$nextTick();
        const canvas = this.$refs.sensorChartCanvas;
        if (!canvas) return;

        this.sensorChart = this.buildLineChart(canvas, this.sensorSeries);

        if (this.fullscreen.open && this.fullscreen.type === "sensor") {
          this.$nextTick(() => this.drawFullscreen());
        }
      } catch (e) {
        console.error("Sensor chart fetch/draw failed:", e);
        this.chartErrorSensor = e?.message || "Sensor chart failed";
        this.sensorSeries = { labels: [], values: [], label: "" };
      } finally {
        this.chartLoadingSensor = false;
      }
    },

    /* -------- overall series + draw -------- */
    async loadOverallSeriesAndDraw() {
      if (!this.selectedRoom?.gateway_sn) return;

      this.chartLoadingOverall = true;
      this.chartErrorOverall = "";
      this.lastOverallUrl = "";
      this.destroyOverallChartOnly();

      try {
        const day = this.overallDate || todayISO();
        const gateway = this.selectedRoom.gateway_sn;

        const url = `http://localhost:5002/usage/range/day24/by_gateway?gateway_sn=${encodeURIComponent(
          gateway
        )}&start=${encodeURIComponent(day)}&end=${encodeURIComponent(day)}`;
        this.lastOverallUrl = url;

        const { data } = await axios.get(url);

        const labelsRaw = Array.isArray(data.labels) ? data.labels : [];
        const usageRaw = Array.isArray(data.total_usage_series) ? data.total_usage_series : [];

        const trimmed = this.trimToHour(labelsRaw, usageRaw, day);
        const labels = trimmed.labels.map((x) => this.to12HourLabel(x));
        const values = trimmed.values;

        this.overallSeries = {
          labels,
          values,
          label: `Gateway ${gateway} total usage (kWh)`,
        };

        await this.$nextTick();
        const canvas = this.$refs.overallChartCanvas;
        if (!canvas) return;

        this.overallChart = this.buildLineChart(canvas, this.overallSeries);

        if (this.fullscreen.open && this.fullscreen.type === "overall") {
          this.$nextTick(() => this.drawFullscreen());
        }
      } catch (e) {
        console.error("Overall chart fetch/draw failed:", e);
        this.chartErrorOverall = e?.message || "Overall chart failed";
        this.overallSeries = { labels: [], values: [], label: "" };
      } finally {
        this.chartLoadingOverall = false;
      }
    },

    /* -------- fullscreen modal -------- */
    openFullscreen(type) {
      this.fullscreenError = "";
      this.fullscreen.open = true;
      this.fullscreen.type = type;

      this.$nextTick(() => {
        this.drawFullscreen();
      });
    },

    closeFullscreen() {
      this.fullscreen.open = false;
      this.fullscreenError = "";
      this.destroyFullscreenChartOnly();
    },

    drawFullscreen() {
      this.destroyFullscreenChartOnly();

      const canvas = this.$refs.fullscreenCanvas;
      if (!canvas) return;

      // Force canvas to stay within container
      canvas.style.width = "100%";
      canvas.style.maxWidth = "100%";
      canvas.style.display = "block";

      const series = this.fullscreen.type === "sensor" ? this.sensorSeries : this.overallSeries;
      if (!series || !series.labels || !series.labels.length) return;

      try {
        this.fullscreenChart = this.buildLineChart(canvas, series);
        // Kick one resize after mount to stabilize size and prevent “creep”
        requestAnimationFrame(() => {
          if (this.fullscreenChart) this.fullscreenChart.resize();
        });
      } catch (e) {
        console.error("Fullscreen draw failed:", e);
        this.fullscreenError = e?.message || "Fullscreen draw failed";
      }
    },

    /* -------- fetch meters list -------- */
    async fetchPowermeterMeters() {
      const { data } = await axios.get("/api/powermeter/meters");
      const list = Array.isArray(data) ? data : [];

      const byGateway = {};
      for (const item of list) {
        const g = item.gateway_sn;
        if (!g) continue;
        if (!byGateway[g]) byGateway[g] = [];
        byGateway[g].push(item);
      }

      Object.keys(byGateway).forEach((g) => {
        byGateway[g].sort((a, b) => String(a.meter_sn).localeCompare(String(b.meter_sn)));
      });

      for (const room of this.rooms) {
        if (room.label === "Landscape") continue;
        room.sensors = byGateway[room.gateway_sn] || [];
      }
    },

    async fetchLandscape() {
      try {
        const { data } = await axios.get("/api/lorawan/data/latest/Smartlight");
        const arr = Array.isArray(data) ? data : [];
        const room = this.rooms.find((r) => r.label === "Landscape");
        if (room) room.sensors = arr;
      } catch (e) {
        console.error("Landscape fetch failed:", e);
      }
    },

    async init() {
      this.loading = true;
      try {
        await Promise.allSettled([this.fetchPowermeterMeters(), this.fetchLandscape()]);
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        this.loading = false;
      }
    },
  },

  mounted() {
    this.init();
  },
};
</script>

<style scoped>
.container-fluid {
  max-width: 1280px;
  color: #fff;
}

/* ===== Overview ===== */
.view-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}

.room-box {
  background: rgba(255, 255, 255, 0.08);
  padding: 18px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.room-title {
  font-weight: 800;
  text-align: center;
}

.room-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}

.metric {
  display: flex;
  justify-content: space-between;
}

.hint {
  margin-top: 14px;
  opacity: 0.85;
}

/* ===== Details ===== */
.room-detail {
  position: relative;
  padding: 10px 0 20px;
}

.room-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 0 6px 12px;
}

.room-name {
  margin: 0;
  font-weight: 900;
}

.room-sub {
  opacity: 0.85;
}

.two-col {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
  align-items: start;
}

/* Panels */
.left-panel,
.right-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 12px;
}

/* ===== Tabs ===== */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.tab {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.18);
}

.tab.active {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.9);
}

/* Level block headers */
.level-block {
  margin-top: 12px;
}

.level-name {
  font-weight: 900;
  opacity: 0.9;
  text-align: left;
  margin: 6px 0 10px;
}

/* Sensor cards */
.section-label {
  font-weight: 900;
  opacity: 0.9;
  text-align: left;
  margin: 4px 0 8px;
}

.sensor-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  align-items: stretch;
  margin-bottom: 10px;
}

.sensor-card {
  width: 180px;
  min-height: 92px;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.18);
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
}

.sensor-card.selected {
  outline: 2px solid rgba(255, 255, 255, 0.9);
}

.card-title {
  font-weight: 900;
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-sub {
  font-size: 0.85rem;
  opacity: 0.85;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  font-size: 0.78rem;
  opacity: 0.75;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty.small {
  opacity: 0.75;
  font-size: 0.9rem;
  text-align: left;
  padding: 4px 0;
}

/* Right panel */
.panel-title {
  font-weight: 900;
  font-size: 1.05rem;
}

.panel-sub {
  opacity: 0.8;
  margin-top: 6px;
  margin-bottom: 12px;
}

.data-block {
  margin-top: 8px;
}

.data-row {
  margin: 6px 0;
}

/* Chart sections */
.chart-section {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.chart-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chart-title {
  font-weight: 900;
  opacity: 0.95;
}

.chart-sub {
  font-size: 0.85rem;
  opacity: 0.75;
}

.chart-header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-input {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  border-radius: 10px;
  padding: 7px 10px;
  outline: none;
}

.icon-btn {
  width: 38px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  font-weight: 900;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Charts */
.chart-canvas-wrap {
  position: relative;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  height: 260px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* IMPORTANT: scope canvas sizing to chart areas only */
.chart-canvas-wrap canvas,
.fs-canvas-wrap canvas {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
}

/* Loading overlay */
.chart-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

.chart-empty-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 700;
  pointer-events: none;
}

.chart-error-overlay {
  position: absolute;
  inset: 0;
  padding: 14px;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.err-title {
  font-weight: 900;
  color: #fff;
}

.err-msg {
  opacity: 0.9;
  font-size: 0.95rem;
}

.err-url {
  opacity: 0.7;
  font-size: 0.8rem;
  word-break: break-all;
  max-width: 92%;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Back button */
.back-button {
  position: absolute;
  top: 0px;
  right: 0px;
  padding: 8px 14px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  z-index: 5;
}

/* ===== Fullscreen modal ===== */
.fs-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px;
}

.fs-modal-inner {
  width: 100%;
  height: 100%;
  background: rgba(10, 31, 68, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fs-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.fs-title {
  font-weight: 900;
  font-size: 1.05rem;
}

.fs-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  width: 40px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  font-weight: 900;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

/* Fullscreen canvas wrap */
.fs-canvas-wrap {
  position: relative;
  flex: 1;
  padding: 12px;

  /* make chart 20% smaller */
  height: 80%;
  max-height: 80%;
  margin: 0 auto;

  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.fs-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
  text-align: center;
  padding: 12px;
}
</style>
