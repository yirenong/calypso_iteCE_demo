<template>
  <div class="container-fluid mt-5">
    <h2 class="text-center mb-4">Smart Energy Management System </h2>

    <!-- ================= OVERVIEW ================= -->
    <div v-if="showFirstPage" class="view-container">
      <h4 class="text-center mb-4">Rooms</h4>

      <div class="grid-container">
        <div v-for="(room, idx) in rooms" :key="idx" class="room-box" @click="openRoom(room)">
          <h5 class="room-title">{{ room.label }}</h5>

          <div class="room-metrics">
            <div v-if="room.label !== 'Landscape'" class="metric">
              <span class="label">Line V (V12/V23/V31):</span>
              <span class="value">
                <span v-if="!room.electricalSummary || room.electricalSummary.meterCount === 0">—</span>
                <span v-else>
                  {{ fmt(room.electricalSummary.line.v12, 1) }} /
                  {{ fmt(room.electricalSummary.line.v23, 1) }} /
                  {{ fmt(room.electricalSummary.line.v31, 1) }} V
                </span>
              </span>
            </div>

            <div v-if="room.label !== 'Landscape'" class="metric">
              <span class="label">Phase V (V1/V2/V3):</span>
              <span class="value">
                <span v-if="!room.electricalSummary || room.electricalSummary.meterCount === 0">—</span>
                <span v-else>
                  {{ fmt(room.electricalSummary.phase.v1, 1) }} /
                  {{ fmt(room.electricalSummary.phase.v2, 1) }} /
                  {{ fmt(room.electricalSummary.phase.v3, 1) }} V
                </span>
              </span>
            </div>

            <div v-if="room.label !== 'Landscape'" class="metric">
              <span class="label">Current (I1/I2/I3):</span>
              <span class="value">
                <span v-if="!room.electricalSummary || room.electricalSummary.meterCount === 0">—</span>
                <span v-else>
                  {{ fmt(room.electricalSummary.currents.i1, 2) }} /
                  {{ fmt(room.electricalSummary.currents.i2, 2) }} /
                  {{ fmt(room.electricalSummary.currents.i3, 2) }} A
                </span>
              </span>
            </div>

            <div v-if="room.label !== 'Landscape'" class="metric">
              <span class="label">Total Power Consumption:</span>
              <span class="value">
                <span v-if="!room.electricalSummary || room.electricalSummary.meterCount === 0">—</span>
                <span v-else>{{ fmt(room.electricalSummary.power_kw_total, 3) }} kW</span>
              </span>
            </div>

            <div class="metric">
              <span class="label">Total kWh Consumption (Today):</span>
              <span class="value">
                <span v-if="room.todayTotalKwh === null">—</span>
                <span v-else>{{ room.todayTotalKwh.toFixed(2) }} kWh</span>
              </span>
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
          <div class="sensor-grid-2x2">
            <div v-for="(s, i) in selectedRoom.sensors" :key="selectedSensorLandscapeKey(s, i)" class="sensor-card"
              :class="{ selected: selectedSensorLandscapeKey(s, i) === selectedLandscapeKey }"
              @click="selectLandscapeSensor(s, i)">
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
            <div class="data-row">
              <b>Device:</b> {{ selectedLandscapeSensor?.data?.deviceName || "-" }}
            </div>

            <div class="data-row">
              <b>Identifier:</b> {{ landscapeIdentifier(selectedLandscapeSensor) }}
            </div>

            <div class="data-row">
              <b>Power Consumption:</b>
              {{ landscapeKwh(selectedLandscapeSensor) }} kWh
            </div>

            <div class="data-row">
              <b>Power Factor:</b>
              {{ landscapePF(selectedLandscapeSensor) }}
            </div>

            <div class="data-row">
              <b>Voltage:</b>
              {{ landscapeV(selectedLandscapeSensor) }} V
            </div>
          </div>

          <div v-else class="panel-sub">Select a device on the left.</div>
        </div>
      </div>

      <!-- ================= POWERMETER ================= -->
      <div v-else class="two-col">
        <!-- LEFT -->
        <div class="left-panel">
          <!-- Collapsible categories for shared gateway rooms -->
          <div v-if="canCategorizeSelectedRoom">
            <div class="accordion">

              <!-- NEW: 3-Phase Main Incoming Supply -->
              <div class="acc-item">
                <button class="acc-head" @click="toggleLevel('MAIN3P')" type="button">
                  <span class="acc-title">3-Phase Main Incoming Supply</span>
                  <span class="acc-icon">{{ isLevelOpen('MAIN3P') ? '▾' : '▸' }}</span>
                </button>

                <div v-show="isLevelOpen('MAIN3P')" class="acc-body">
                  <div class="sensor-row">
                    <div v-if="categorizedMain3P" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === categorizedMain3P.meter_sn }"
                      @click="selectSensor(categorizedMain3P)">
                      <div class="card-title">{{ displayName(categorizedMain3P) }}</div>
                      <div class="card-meta">SN: {{ categorizedMain3P.meter_sn }}</div>
                    </div>

                    <div v-else class="empty small">None</div>
                  </div>
                </div>
              </div>

              <!-- Rename: 3-Phase -> 3-Phase Load -->
              <div class="acc-item">
                <button class="acc-head" @click="toggleLevel('LOAD3P')" type="button">
                  <span class="acc-title">3-Phase Load</span>
                  <span class="acc-icon">{{ isLevelOpen('LOAD3P') ? '▾' : '▸' }}</span>
                </button>

                <div v-show="isLevelOpen('LOAD3P')" class="acc-body">
                  <div class="sensor-row">
                    <div v-for="m in categorized3PLoads" :key="m.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === m.meter_sn }" @click="selectSensor(m)">
                      <div class="card-title">{{ displayName(m) }}</div>
                      <div class="card-meta">SN: {{ m.meter_sn }}</div>
                    </div>

                    <div v-if="!categorized3PLoads.length" class="empty small">None</div>
                  </div>
                </div>
              </div>

              <!-- Single Phase - L1 -->
              <div class="acc-item">
                <button class="acc-head" @click="toggleLevel('L1')" type="button">
                  <span class="acc-title">Single Phase - L1</span>
                  <span class="acc-icon">{{ isLevelOpen('L1') ? '▾' : '▸' }}</span>
                </button>

                <div v-show="isLevelOpen('L1')" class="acc-body">
                  <!-- S -->
                  <div class="sensor-row">
                    <div v-for="s in categorized1P.L1.S" :key="s.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }" @click="selectSensor(s)">
                      <div class="card-title">{{ displayName(s) }}</div>
                      <div class="card-meta">SN: {{ s.meter_sn }}</div>
                    </div>
                  </div>

                  <!-- P -->
                  <div class="sensor-row">
                    <div v-for="p in categorized1P.L1.P" :key="p.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === p.meter_sn }" @click="selectSensor(p)">
                      <div class="card-title">{{ displayName(p) }}</div>
                      <div class="card-meta">SN: {{ p.meter_sn }}</div>
                    </div>
                  </div>

                  <div v-if="!categorized1P.L1.S.length && !categorized1P.L1.P.length" class="empty small">None</div>
                </div>
              </div>

              <!-- Single Phase - L2 -->
              <div class="acc-item">
                <button class="acc-head" @click="toggleLevel('L2')" type="button">
                  <span class="acc-title">Single Phase - L2</span>
                  <span class="acc-icon">{{ isLevelOpen('L2') ? '▾' : '▸' }}</span>
                </button>

                <div v-show="isLevelOpen('L2')" class="acc-body">
                  <!-- S -->
                  <div class="sensor-row">
                    <div v-for="s in categorized1P.L2.S" :key="s.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }" @click="selectSensor(s)">
                      <div class="card-title">{{ displayName(s) }}</div>
                      <div class="card-meta">SN: {{ s.meter_sn }}</div>
                    </div>
                  </div>

                  <!-- P -->
                  <div class="sensor-row">
                    <div v-for="p in categorized1P.L2.P" :key="p.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === p.meter_sn }" @click="selectSensor(p)">
                      <div class="card-title">{{ displayName(p) }}</div>
                      <div class="card-meta">SN: {{ p.meter_sn }}</div>
                    </div>
                  </div>

                  <div v-if="!categorized1P.L2.S.length && !categorized1P.L2.P.length" class="empty small">None</div>
                </div>
              </div>

              <!-- Single Phase - L3 -->
              <div class="acc-item">
                <button class="acc-head" @click="toggleLevel('L3')" type="button">
                  <span class="acc-title">Single Phase - L3</span>
                  <span class="acc-icon">{{ isLevelOpen('L3') ? '▾' : '▸' }}</span>
                </button>

                <div v-show="isLevelOpen('L3')" class="acc-body">
                  <!-- S -->
                  <div class="sensor-row">
                    <div v-for="s in categorized1P.L3.S" :key="s.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }" @click="selectSensor(s)">
                      <div class="card-title">{{ displayName(s) }}</div>
                      <div class="card-meta">SN: {{ s.meter_sn }}</div>
                    </div>
                  </div>

                  <!-- P -->
                  <div class="sensor-row">
                    <div v-for="p in categorized1P.L3.P" :key="p.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === p.meter_sn }" @click="selectSensor(p)">
                      <div class="card-title">{{ displayName(p) }}</div>
                      <div class="card-meta">SN: {{ p.meter_sn }}</div>
                    </div>
                  </div>

                  <div v-if="!categorized1P.L3.S.length && !categorized1P.L3.P.length" class="empty small">None</div>
                </div>
              </div>

              <!-- Uncategorised -->
              <!-- <div class="acc-item">
                <button class="acc-head" @click="toggleLevel('Uncategorised')" type="button">
                  <span class="acc-title">Uncategorised</span>
                  <span class="acc-icon">{{ isLevelOpen('Uncategorised') ? '▾' : '▸' }}</span>
                </button>

                <div v-show="isLevelOpen('Uncategorised')" class="acc-body">
                  <div class="sensor-row">
                    <div v-for="u in uncategorised" :key="u.meter_sn" class="sensor-card"
                      :class="{ selected: selectedSensor?.meter_sn === u.meter_sn }" @click="selectSensor(u)">
                      <div class="card-title">{{ displayName(u) }}</div>
                      <div class="card-meta">SN: {{ u.meter_sn }}</div>
                    </div>

                    <div v-if="!uncategorised.length" class="empty small">None</div>
                  </div>
                </div>
              </div> -->

            </div>
          </div>

          <!-- Fallback view -->
          <div v-else>
            <div class="section-label">Sensors</div>
            <div class="sensor-row">
              <div v-for="s in selectedRoom.sensors" :key="s.meter_sn" class="sensor-card"
                :class="{ selected: selectedSensor?.meter_sn === s.meter_sn }" @click="selectSensor(s)">
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

            <div class="data-row">
              <b>Type:</b>
              {{ sensorElectrical?.meter_name === 'ADL400N' ? 'Three Phase (ADL400N)' : 'Single Phase (ADL200N)' }}
            </div>

            <div class="data-row"><b>Gateway:</b> {{ selectedRoom.gateway_sn }}</div>

            <template v-if="sensorElectrical">
              <!-- <div class="data-row"><b>Power Factor:</b> {{ fmt(sensorElectrical.electrical?.power_factor, 3) }}</div> -->
              <div class="data-row">
                <b>kWh Usage (Day):</b>
                <span v-if="sensorKwhToday === null">—</span>
                <span v-else>{{ sensorKwhToday.toFixed(3) }}</span>
              </div>

              <div class="data-row">
                <b>kWh Usage (MTD):</b>
                <span v-if="sensorKwhMTD === null">—</span>
                <span v-else>{{ sensorKwhMTD.toFixed(3) }}</span>
              </div>


              <!-- SINGLE PHASE -->
              <template v-if="sensorElectrical.electrical?.phase_type === '1p'">
                <div class="data-row"><b>Voltage:</b> {{ fmt(sensorElectrical.electrical?.voltage, 2) }} V</div>
                <div class="data-row"><b>Current:</b> {{ fmt(sensorElectrical.electrical?.current, 3) }} A</div>
                <div class="data-row"><b>Active Power:</b> {{ fmt(sensorElectrical.electrical?.active_power_kw, 3) }} kW
                </div>
              </template>

              <!-- THREE PHASE -->
              <template v-else>
                <div class="data-row"><b>Line V (V12/V23/V31):</b>
                  {{ fmt(sensorElectrical.electrical?.line_voltage_v?.[0], 1) }} /
                  {{ fmt(sensorElectrical.electrical?.line_voltage_v?.[1], 1) }} /
                  {{ fmt(sensorElectrical.electrical?.line_voltage_v?.[2], 1) }} V
                </div>

                <div class="data-row"><b>Phase V (V1/V2/V3):</b>
                  {{ fmt(sensorElectrical.electrical?.phase_voltage_v?.[0], 1) }} /
                  {{ fmt(sensorElectrical.electrical?.phase_voltage_v?.[1], 1) }} /
                  {{ fmt(sensorElectrical.electrical?.phase_voltage_v?.[2], 1) }} V
                </div>

                <div class="data-row"><b>Current (I1/I2/I3):</b>
                  {{ fmt(sensorElectrical.electrical?.current_a?.[0], 3) }} /
                  {{ fmt(sensorElectrical.electrical?.current_a?.[1], 3) }} /
                  {{ fmt(sensorElectrical.electrical?.current_a?.[2], 3) }} A
                </div>

                <div class="data-row"><b>Active Power (kW):</b>
                  {{ fmt(sensorElectrical.electrical?.active_power_kw?.total, 3) }} kW
                </div>
              </template>
            </template>

            <div v-else class="panel-sub" style="margin: 10px 0 0;">
              No latest electrical data found for this meter.
            </div>
          </div>

          <div v-else class="panel-sub">Select a sensor on the left to view details.</div>

          <!-- ================= SENSOR USAGE ================= -->
          <div class="chart-section">
            <div class="chart-header">
              <div class="chart-header-left">
                <div class="chart-title">Sensor Usage</div>
                <div class="chart-sub">Selected meter</div>
              </div>

              <div class="chart-header-right">
                <button class="chip-btn" :class="{ active: sensorMode === 'day24' }" @click="setSensorModeDay24"
                  type="button" :disabled="chartLoadingSensor || !selectedSensor">
                  Today
                </button>

                <button class="chip-btn" :class="{ active: sensorMode === 'last7' }" @click="setSensorModeLast7"
                  type="button" :disabled="chartLoadingSensor || !selectedSensor">
                  Last 7 Days
                </button>

                <input v-if="sensorMode === 'day24'" class="date-input" type="date" v-model="sensorDate"
                  @change="onSensorDateChange" />

                <button class="icon-btn" @click="openFullscreen('sensor')"
                  :disabled="!(sensorMode === 'day24' ? sensorSeries.labels.length : sensor7Series.labels.length)">
                  ⛶
                </button>
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
                <div class="chart-sub">Gateway total</div>
              </div>

              <div class="chart-header-right">
                <button class="chip-btn" :class="{ active: overallMode === 'day24' }" @click="setOverallModeDay24"
                  type="button" :disabled="chartLoadingOverall || !overallMeterSn">
                  Today
                </button>

                <button class="chip-btn" :class="{ active: overallMode === 'last7' }" @click="setOverallModeLast7"
                  type="button" :disabled="chartLoadingOverall || !overallMeterSn">
                  Last 7 Days
                </button>

                <input v-if="overallMode === 'day24'" class="date-input" type="date" v-model="overallDate"
                  @change="onOverallDateChange" />

                <button class="icon-btn" @click="openFullscreen('overall')"
                  :disabled="!(overallMode === 'day24' ? overallSeries.labels.length : last7Series.labels.length)">
                  ⛶
                </button>
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
              <template v-if="fullscreen.type === 'sensor'">
                <button class="chip-btn" :class="{ active: sensorMode === 'day24' }" @click="setSensorModeDay24"
                  type="button" :disabled="chartLoadingSensor || !selectedSensor">
                  Today
                </button>

                <button class="chip-btn" :class="{ active: sensorMode === 'last7' }" @click="setSensorModeLast7"
                  type="button" :disabled="chartLoadingSensor || !selectedSensor">
                  Last 7 Days
                </button>

                <input v-if="sensorMode === 'day24'" class="date-input" type="date" v-model="sensorDate"
                  @change="onSensorDateChange" />
              </template>

              <template v-else>
                <button class="chip-btn" :class="{ active: overallMode === 'day24' }" @click="setOverallModeDay24"
                  type="button" :disabled="chartLoadingOverall || !overallMeterSn">
                  Today
                </button>

                <button class="chip-btn" :class="{ active: overallMode === 'last7' }" @click="setOverallModeLast7"
                  type="button" :disabled="chartLoadingOverall || !overallMeterSn">
                  Last 7 Days
                </button>

                <input v-if="overallMode === 'day24'" class="date-input" type="date" v-model="overallDate"
                  @change="onOverallDateChange" />
              </template>

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
function createLimiter(max = 3) {
  let active = 0;
  const queue = [];

  const runNext = () => {
    if (active >= max || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve()
      .then(fn)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        active--;
        runNext();
      });
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      runNext();
    });
}


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
const MAIN_3PHASE_SN = "24052003410003";

/* mapping */
const METER_SUFFIX_NAME_MAP = {
  "410008": "L1S1",
  "410010": "L1S2",
  "410021": "L1S3",
  "410013": "L1P1",
  "410032": "L1P2",
  "410028": "L1P3",
  "410027": "L1P4",
  "410020": "L1P5",
  "770001": "L2S1",
  "410012": "L2S2",
  "410009": "L2S3",
  "410022": "L2P1",
  "410029": "L2P2",
  "410011": "L2P3",
  "410018": "L2P4",
  "410019": "L2P5",
  "410007": "L2P6",
  "410024": "L3S1",
  "410026": "L3S2",
  "410025": "L3S3",
  "410016": "L3P1",
  "410031": "L3P2",
  "770003": "L3P3",
  "410030": "L3P4",
  "410023": "L3P5",
};

const THREE_PHASE_NAME_MAP = {
  "24052003410003": "3-Phase Main Incoming Supply",
  "24052003410006": "3-Phase Load #1",
  "24052003410004": "3-Phase Load #2",
};

export default {
  name: "PowerMeterReadingPage",

  data() {
    return {
      day24CallCount: {},
      day24Cache: {},        // { [url]: { t: ms, data } }
      day24InFlight: {},     // { [url]: Promise }
      limit3: createLimiter(3), // at most 3 API calls at a time
      sensorAbort: null,
      monthTotalsCache: {},
      kwhTotalsCache: {}, // { "2405...|2026-02-10": { day: 1.23, mtd: 45.6 } }
      sensorKwhToday: null,
      sensorKwhMTD: null,
      overallMeterSn: MAIN_3PHASE_SN,
      latestElectricalCache: {},
      sensorElectrical: null,

      sensorMode: "day24",
      sensor7Series: { labels: [], values: [], label: "" },

      overallMode: "day24",
      last7Series: { labels: [], values: [], label: "" },

      // Updated open-state keys to include MAIN3P + LOAD3P
      levelOpen: {
        MAIN3P: true,
        LOAD3P: true,
        L1: true,
        L2: true,
        L3: true,
        Uncategorised: true
      },

      showFirstPage: true,
      loading: false,

      rooms: [
        {
          label: "B05-11/12",
          gateway_sn: "24011006420037",
          sensors: [],
          todayTotalKwh: null,
          electricalSummary: {
            line: { v12: null, v23: null, v31: null },
            phase: { v1: null, v2: null, v3: null },
            currents: { i1: null, i2: null, i3: null, total: null },
            power_kw_total: null,
            meterCount: 0,
            ts: null,
          },
        },
        {
          label: "B05-13/14",
          gateway_sn: "24060410030006",
          sensors: [],
          todayTotalKwh: null,
          electricalSummary: {
            line: { v12: null, v23: null, v31: null },
            phase: { v1: null, v2: null, v3: null },
            currents: { i1: null, i2: null, i3: null, total: null },
            power_kw_total: null,
            meterCount: 0,
            ts: null,
          },
        },
        {
          label: "B05-15/16/18",
          gateway_sn: "24052003410037",
          sensors: [],
          todayTotalKwh: null,
          electricalSummary: {
            line: { v12: null, v23: null, v31: null },
            phase: { v1: null, v2: null, v3: null },
            currents: { i1: null, i2: null, i3: null, total: null },
            power_kw_total: null,
            meterCount: 0,
            ts: null,
          },
        },
        {
          label: "B05-07",
          gateway_sn: "24052003410035",
          sensors: [],
          todayTotalKwh: null,
          electricalSummary: {
            line: { v12: null, v23: null, v31: null },
            phase: { v1: null, v2: null, v3: null },
            currents: { i1: null, i2: null, i3: null, total: null },
            power_kw_total: null,
            meterCount: 0,
            ts: null,
          },
        },
        {
          label: "B05-08",
          gateway_sn: "24052003410036",
          sensors: [],
          todayTotalKwh: null,
          electricalSummary: {
            line: { v12: null, v23: null, v31: null },
            phase: { v1: null, v2: null, v3: null },
            currents: { i1: null, i2: null, i3: null, total: null },
            power_kw_total: null,
            meterCount: 0,
            ts: null,
          },
        },
        {
          label: "B05-09",
          gateway_sn: "24052003410034",
          sensors: [],
          todayTotalKwh: null,
          electricalSummary: {
            line: { v12: null, v23: null, v31: null },
            phase: { v1: null, v2: null, v3: null },
            currents: { i1: null, i2: null, i3: null, total: null },
            power_kw_total: null,
            meterCount: 0,
            ts: null,
          },
        },
        { label: "Landscape", gateway_sn: null, sensors: [], todayTotalKwh: null },
      ],

      selectedRoom: {},
      activeLevel: "Overall",
      selectedSensor: null,

      selectedLandscapeSensor: null,
      selectedLandscapeKey: null,

      sensorDate: todayISO(),
      overallDate: todayISO(),

      sensorSeries: { labels: [], values: [], label: "" },
      overallSeries: { labels: [], values: [], label: "" },

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
        type: "sensor",
      },
    };
  },

  computed: {
    canCategorizeSelectedRoom() {
      return this.selectedRoom?.gateway_sn === "24011006420037";
    },

    categorizedMain3P() {
      if (!this.canCategorizeSelectedRoom) return null;
      const sensors = Array.isArray(this.selectedRoom.sensors) ? this.selectedRoom.sensors : [];

      return sensors.find(
        (s) =>
          isThreePhase(s.meter_name) &&
          String(s.meter_sn) === MAIN_3PHASE_SN
      ) || null;
    },


    // NEW: 3-phase loads = any ADL400 that is NOT the main incoming
    categorized3PLoads() {
      if (!this.canCategorizeSelectedRoom) return [];
      const sensors = Array.isArray(this.selectedRoom.sensors) ? this.selectedRoom.sensors : [];

      return sensors
        .filter(
          (s) =>
            isThreePhase(s.meter_name) &&
            String(s.meter_sn) !== MAIN_3PHASE_SN
        )
        .sort((a, b) => this.displayName(a).localeCompare(this.displayName(b)));
    },


    // NEW: Single-phase broken into L1/L2/L3 using existing displayName() mapping
    categorized1P() {
      const base = {
        L1: { S: [], P: [] },
        L2: { S: [], P: [] },
        L3: { S: [], P: [] },
      };

      if (!this.canCategorizeSelectedRoom) return base;

      const sensors = Array.isArray(this.selectedRoom.sensors)
        ? this.selectedRoom.sensors
        : [];

      for (const s of sensors) {
        const name = this.displayName(s);

        // Force these 2 meters to be treated as single phase
        const forceSinglePhase =
          name === "L2S1" ||
          name === "L3P3" ||
          String(s.meter_sn) === "24070105770001" ||
          String(s.meter_sn) === "24070105770003";

        if (!isSinglePhase(s.meter_name) && !forceSinglePhase) continue;

        const lvl = name.startsWith("L1")
          ? "L1"
          : name.startsWith("L2")
            ? "L2"
            : name.startsWith("L3")
              ? "L3"
              : null;

        if (!lvl) continue;

        if (name.includes("S")) {
          base[lvl].S.push(s);
        } else if (name.includes("P")) {
          base[lvl].P.push(s);
        }
      }

      for (const lvl of ["L1", "L2", "L3"]) {
        base[lvl].S.sort((a, b) =>
          this.displayName(a).localeCompare(this.displayName(b))
        );

        base[lvl].P.sort((a, b) =>
          this.displayName(a).localeCompare(this.displayName(b))
        );
      }

      return base;
    },

    uncategorised() {
      if (!this.canCategorizeSelectedRoom) return [];
      const sensors = Array.isArray(this.selectedRoom.sensors) ? this.selectedRoom.sensors : [];

      return sensors.filter((s) => {
        // exclude all 3-phase
        if (isThreePhase(s.meter_name)) return false;

        // exclude known single-phase L1/L2/L3
        const n = this.displayName(s);
        if (String(n).startsWith("L1") || String(n).startsWith("L2") || String(n).startsWith("L3")) return false;

        // anything else stays here
        return true;
      });
    },
  },

  methods: {
    applyDemoEnergyData() {
      const now = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

      this.rooms.forEach((room, roomIndex) => {
        if (room.label === 'Landscape') {
          room.sensors = Array.from({ length: 4 }, (_, index) => ({
            devEUI: `DEMO-LIGHT-${index + 1}`,
            data: {
              deviceName: `Landscape Lighting Zone ${index + 1}`,
              power_consumption: 1180 + index * 165,
              power_factor: 0.93 + index * 0.01,
              voltage: 229.4 + index * 0.7,
            },
          }));
          room.todayTotalKwh = 5.71;
          return;
        }

        const base = roomIndex * 10;
        const meter = (meter_sn, meter_name = 'ADL200N') => ({
          meter_sn, meter_name, gateway_sn: room.gateway_sn, last_ts: now,
        });

        const meters = roomIndex === 0 ? [
          meter(MAIN_3PHASE_SN, 'ADL400N'),
          meter('24052003410006', 'ADL400N'),
          meter('24052003410004', 'ADL400N'),
          meter('24052003410008'), // L1S1
          meter('24052003410010'), // L1S2
          meter('24052003410013'), // L1P1
          meter('24052003410032'), // L1P2
          meter('24070105770001'), // L2S1
          meter('24052003410012'), // L2S2
          meter('24052003410022'), // L2P1
          meter('24052003410029'), // L2P2
          meter('24052003410024'), // L3S1
          meter('24052003410026'), // L3S2
          meter('24052003410016'), // L3P1
          meter('24052003410031'), // L3P2
        ] : [
          meter(`DEMO-${roomIndex + 1}-MAIN`, 'ADL400N'),
          meter(`DEMO-${roomIndex + 1}-LOAD`, 'ADL400N'),
          meter(`DEMO-${roomIndex + 1}-L1`),
          meter(`DEMO-${roomIndex + 1}-L2`),
          meter(`DEMO-${roomIndex + 1}-L3`),
        ];

        room.sensors = meters;
        room.todayTotalKwh = Number((42.6 + base * 0.91).toFixed(2));
        room.electricalSummary = {
          line: { v12: 400.2 + roomIndex, v23: 399.5 + roomIndex, v31: 401.1 + roomIndex },
          phase: { v1: 231.1 + roomIndex * 0.2, v2: 230.4 + roomIndex * 0.2, v3: 231.6 + roomIndex * 0.2 },
          currents: { i1: 13.2 + roomIndex, i2: 12.6 + roomIndex, i3: 13.8 + roomIndex, total: 39.6 + roomIndex * 3 },
          power_kw_total: 8.42 + roomIndex * 1.13,
          meterCount: meters.length,
          ts: new Date().toISOString(),
        };

        const byMeterSn = {};
        meters.forEach((meter, meterIndex) => {
          const threePhase = meter.meter_name === 'ADL400N';
          byMeterSn[meter.meter_sn] = {
            ...meter,
            ts: new Date().toISOString(),
            electrical: threePhase ? {
              phase_type: '3p',
              line_voltage_v: [400.2, 399.7, 401.0],
              phase_voltage_v: [231.0, 230.5, 231.6],
              current_a: [8.4 + meterIndex, 7.9 + meterIndex, 8.7 + meterIndex],
              active_power_kw: { total: 5.61 + meterIndex * 0.72 },
              power_factor: 0.96,
            } : {
              phase_type: '1p', voltage: 230.8,
              current: 4.2 + meterIndex * 0.4,
              active_power_kw: 0.91 + meterIndex * 0.13,
              power_factor: 0.94,
            },
          };
        });
        this.latestElectricalCache[room.gateway_sn] = { byMeterSn };
      });

      this.sensorSeries = this.demoEnergySeries('Selected meter usage');
      this.overallSeries = this.demoEnergySeries('Gateway energy usage');
      this.sensor7Series = this.demoDailyEnergySeries('Selected meter – last 7 days');
      this.last7Series = this.demoDailyEnergySeries('Gateway – last 7 days');
    },

    demoEnergySeries(label) {
      return {
        labels: Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`),
        values: Array.from({ length: 24 }, (_, hour) => Number((0.18 + Math.sin((hour - 6) / 4) * 0.06 + (hour > 8 && hour < 19 ? 0.17 : 0)).toFixed(3))),
        label,
      };
    },

    demoDailyEnergySeries(label) {
      return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [41.8, 44.2, 43.5, 47.1, 46.4, 31.7, 29.9], label };
    },

    async getDay24Cached(url, ttlMs = 120000) {
      const now = Date.now();

      // count attempts (for debugging)
      this.day24CallCount[url] = (this.day24CallCount[url] || 0) + 1;
      console.log("[day24 attempt]", this.day24CallCount[url], url);

      const cached = this.day24Cache[url];
      if (cached && (now - cached.t) < ttlMs) return cached.data;

      if (this.day24InFlight[url]) return this.day24InFlight[url];

      this.day24InFlight[url] = axios.get(url)
        .then((res) => {
          this.day24Cache[url] = { t: Date.now(), data: res.data };
          return res.data;
        })
        .finally(() => {
          delete this.day24InFlight[url];
        });

      return this.day24InFlight[url];
    },

    monthKey(meterSN, dayISO) {
      // YYYY-MM
      return `${meterSN}|${String(dayISO).slice(0, 7)}`;
    },

    async ensureMonthTotals(meterSN, dayISO) {
      const key = this.monthKey(meterSN, dayISO);
      if (this.monthTotalsCache[key]) return;

      const startISO = this.firstDayOfMonthISO(dayISO);

      const url = `/api/powermeter/usage/range/day24?meter_sn=${encodeURIComponent(
        meterSN
      )}&start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(dayISO)}`;

      // use cached fetch
      const data = await this.getDay24Cached(url);
      const days = Array.isArray(data?.days) ? data.days : [];

      this.monthTotalsCache[key] = days.map((d) => ({
        day: d.day,
        total: this.sumUsage24(d), // <-- use the helper that actually exists
      }));
    },

    async computeMTD(meterSN, dayISO) {
      this.sensorKwhMTD = null;

      try {
        await this.ensureMonthTotals(meterSN, dayISO);

        const key = this.monthKey(meterSN, dayISO);
        const list = this.monthTotalsCache[key] || [];

        const mtd = list
          .filter((x) => x.day <= dayISO)
          .reduce((acc, x) => acc + (Number(x.total) || 0), 0);

        this.sensorKwhMTD = mtd;
      } catch (e) {
        console.error("computeMTD failed:", e);
        this.sensorKwhMTD = null;
      }
    },

    cacheKey(meterSn, dayISO) {
      return `${meterSn}|${dayISO}`;
    },

    async fetchSensorTotals() {
      // only MTD lives here now
      this.sensorKwhMTD = null;

      if (!this.selectedSensor?.meter_sn) return;

      try {
        const meterSN = this.selectedSensor.meter_sn;
        const dayISO = this.sensorDate || todayISO();
        await this.computeMTD(meterSN, dayISO);
      } catch (e) {
        console.error("fetchSensorTotals (MTD only) failed:", e);
        this.sensorKwhMTD = null;
      }
    },

    firstDayOfMonthISO(iso) {
      const d = this.parseISODate(iso || todayISO());
      d.setDate(1);
      return this.formatISODate(d);
    },

    sumUsage24(dayObj) {
      const arr = Array.isArray(dayObj?.usage_24) ? dayObj.usage_24 : [];
      return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    },


    formatPhaseType(phase) {
      if (phase === "1p") return "One Phase";
      if (phase === "3p") return "Three Phase";
      return phase || "-";
    },
    async ensureLatestElectricalForGateway(gateway) {
      if (!gateway) return;
      if (this.latestElectricalCache[gateway]) return;

      const url = `/api/powermeter/latest/electrical?gateway_sn=${encodeURIComponent(gateway)}`;
      const { data } = await axios.get(url);

      const single = Array.isArray(data?.single_phase) ? data.single_phase : [];
      const three = Array.isArray(data?.three_phase) ? data.three_phase : [];

      const byMeterSn = {};
      for (const item of [...single, ...three]) {
        const sn = String(item?.meter_sn ?? "");
        if (!sn) continue;
        if (item?.meterStatus === "missing") continue;
        byMeterSn[sn] = item;
      }

      this.latestElectricalCache[gateway] = { byMeterSn };
    },

    async setSelectedSensorElectrical() {
      this.sensorElectrical = null;
      if (!this.selectedRoom?.gateway_sn || !this.selectedSensor?.meter_sn) return;

      const gateway = this.selectedRoom.gateway_sn;
      await this.ensureLatestElectricalForGateway(gateway);

      const cache = this.latestElectricalCache[gateway];
      const key = String(this.selectedSensor.meter_sn);

      this.sensorElectrical = cache?.byMeterSn?.[key] || null;
    },

    num(x) {
      const n = Number(x);
      return Number.isFinite(n) ? n : 0;
    },

    fmt(x, dp = 2) {
      const n = Number(x);
      return Number.isFinite(n) ? n.toFixed(dp) : "—";
    },

    async fetchLatestElectricalForRooms() {
      try {
        const gateways = Array.from(
          new Set(
            this.rooms
              .filter((r) => r.label !== "Landscape" && r.gateway_sn)
              .map((r) => r.gateway_sn)
          )
        );

        const byGateway = {};

        const tasks = gateways.map(async (g) => {
          try {
            const url = `/api/powermeter/latest/electrical?gateway_sn=${encodeURIComponent(g)}`;
            const { data } = await axios.get(url);

            const list = Array.isArray(data?.three_phase) ? data.three_phase : [];
            const valid = list.filter(
              (m) => m?.electrical && m?.meterStatus !== "missing"
            );

            if (!valid.length) {
              byGateway[g] = null;
              return;
            }

            let sumV12 = 0, sumV23 = 0, sumV31 = 0;
            let sumV1 = 0, sumV2 = 0, sumV3 = 0;
            let sumI1 = 0, sumI2 = 0, sumI3 = 0;
            let sumPkw = 0;
            let latestTs = null;

            for (const m of valid) {
              const e = m.electrical || {};

              const lv = Array.isArray(e.line_voltage_v) ? e.line_voltage_v : [];
              const pv = Array.isArray(e.phase_voltage_v) ? e.phase_voltage_v : [];
              const ia = Array.isArray(e.current_a) ? e.current_a : [];
              const pkw = e.active_power_kw || {};

              sumV12 += Number(lv[0]) || 0;
              sumV23 += Number(lv[1]) || 0;
              sumV31 += Number(lv[2]) || 0;

              sumV1 += Number(pv[0]) || 0;
              sumV2 += Number(pv[1]) || 0;
              sumV3 += Number(pv[2]) || 0;

              sumI1 += Number(ia[0]) || 0;
              sumI2 += Number(ia[1]) || 0;
              sumI3 += Number(ia[2]) || 0;

              // supports either object or direct numeric value
              if (typeof pkw === "number") {
                sumPkw += Number(pkw) || 0;
              } else {
                sumPkw +=
                  (Number(pkw?.total) || 0) ||
                  (Number(pkw?.sum) || 0) ||
                  (Number(pkw?.kw) || 0);
              }

              const ts = m?.electrical?.ts || m?.last_ts || null;
              if (ts && (!latestTs || new Date(ts) > new Date(latestTs))) {
                latestTs = ts;
              }
            }

            const count = valid.length;

            byGateway[g] = {
              line: {
                v12: count ? sumV12 / count : null,
                v23: count ? sumV23 / count : null,
                v31: count ? sumV31 / count : null,
              },
              phase: {
                v1: count ? sumV1 / count : null,
                v2: count ? sumV2 / count : null,
                v3: count ? sumV3 / count : null,
              },
              currents: {
                i1: count ? sumI1 : null,
                i2: count ? sumI2 : null,
                i3: count ? sumI3 : null,
                total: sumI1 + sumI2 + sumI3,
              },
              power_kw_total: sumPkw,
              meterCount: count,
              ts: latestTs,
            };
          } catch (err) {
            console.error(`fetchLatestElectricalForRooms failed for gateway ${g}:`, err);
            byGateway[g] = null;
          }
        });

        await Promise.all(tasks);

        this.rooms = this.rooms.map((room) => ({
          ...room,
          electricalSummary:
            byGateway[room.gateway_sn] || {
              line: { v12: null, v23: null, v31: null },
              phase: { v1: null, v2: null, v3: null },
              currents: { i1: null, i2: null, i3: null, total: null },
              power_kw_total: null,
              meterCount: 0,
              ts: null,
            },
        }));
      } catch (e) {
        console.error("fetchLatestElectricalForRooms error:", e);
      }
    },

    async loadSensorSummaryAndDraw() {
      if (!this.selectedSensor) return;

      this.chartLoadingSensor = true;
      this.chartErrorSensor = "";
      this.lastSensorUrl = "";
      this.destroySensorChartOnly();

      if (this.sensorAbort) this.sensorAbort.abort();
      this.sensorAbort = new AbortController();

      const day = this.sensorDate || todayISO();
      const meterSN = this.selectedSensor.meter_sn;
      const display = this.displayName(this.selectedSensor);

      try {
        const url = `/api/powermeter/usage/summary/meter?meter_sn=${encodeURIComponent(
          meterSN
        )}&day=${encodeURIComponent(day)}`;

        this.lastSensorUrl = url;

        const { data } = await axios.get(url, {
          signal: this.sensorAbort.signal,
        });

        // ignore stale response if user already switched sensor
        if (!this.selectedSensor || this.selectedSensor.meter_sn !== meterSN) {
          return;
        }

        this.sensorKwhToday = Number(data?.today_total_kwh ?? 0);
        this.sensorKwhMTD = Number(data?.mtd_total_kwh ?? 0);

        const labelsRaw = Array.isArray(data?.day24?.labels_24)
          ? data.day24.labels_24
          : [];
        const usageRaw = Array.isArray(data?.day24?.usage_24)
          ? data.day24.usage_24
          : [];

        const trimmed = this.trimToHour(labelsRaw, usageRaw, day);

        this.sensorSeries = {
          labels: trimmed.labels.map((x) => this.to12HourLabel(x)),
          values: trimmed.values.map((v) => Number(v) || 0),
          label: `${display} usage (kWh)`,
        };

        this.sensor7Series = {
          labels: Array.isArray(data?.last7?.labels) ? data.last7.labels : [],
          values: Array.isArray(data?.last7?.values)
            ? data.last7.values.map((v) => Number(v) || 0)
            : [],
          label: `${display} last 7 days (kWh/day)`,
        };

        await this.$nextTick();
        const canvas = this.$refs.sensorChartCanvas;
        if (!canvas) return;

        const series = this.sensorMode === "last7" ? this.sensor7Series : this.sensorSeries;
        this.sensorChart = this.buildLineChart(canvas, series);

        if (this.fullscreen.open && this.fullscreen.type === "sensor") {
          this.$nextTick(() => this.drawFullscreen());
        }
      } catch (e) {
        if (e?.name === "CanceledError" || e?.name === "AbortError") {
          return;
        }

        const status = e?.response?.status;

        if (status === 404) {
          this.chartErrorSensor =
            "The backend summary API is not found. Please add /usage/summary/meter to the Flask API.";
        } else if (status === 504) {
          this.chartErrorSensor =
            "Usage service timed out (504). Please try again in a moment.";
        } else if (status === 502 || status === 503) {
          this.chartErrorSensor =
            "Usage service is temporarily unavailable. Please try again shortly.";
        } else {
          this.chartErrorSensor =
            e?.message || "Failed to load sensor usage summary.";
        }

        this.chartErrorSensor = "";
        this.sensorSeries = this.demoEnergySeries('Selected meter usage');
        this.sensor7Series = this.demoDailyEnergySeries('Selected meter – last 7 days');
        this.sensorKwhToday = 3.842;
        this.sensorKwhMTD = 58.617;

        await this.$nextTick();
        const canvas = this.$refs.sensorChartCanvas;
        if (canvas) this.sensorChart = this.buildLineChart(canvas, this.sensorSeries);

        console.error("loadSensorSummaryAndDraw error:", e);
      } finally {
        this.chartLoadingSensor = false;
      }
    },

    async loadSensorLast7Days() {
      if (!this.selectedSensor) return;
      this.sensorMode = "last7";
      await this.loadSensorSummaryAndDraw();
    },

    setSensorModeDay24() {
      if (!this.selectedSensor) return;
      this.sensorMode = "day24";
      this.loadSensorSummaryAndDraw();
    },

    setSensorModeLast7() {
      if (!this.selectedSensor) return;
      this.sensorMode = "last7";
      this.loadSensorSummaryAndDraw();
    },

    sumDayUsage(dayObj) {
      const arr = Array.isArray(dayObj?.usage_24) ? dayObj.usage_24 : [];
      return arr.reduce((acc, v) => acc + (Number(v) || 0), 0);
    },

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

    trimToHour(labels, values, dayISO) {
      const isToday = dayISO === todayISO();
      if (!isToday) return { labels, values };

      const now = new Date();
      const cutHour = now.getHours();

      const idx = labels.findIndex((lab) => {
        const mm = String(lab).match(/(\d{2}):00/);
        if (!mm) return false;
        return Number(mm[1]) === cutHour;
      });

      const end = idx >= 0 ? idx + 1 : labels.length;
      return { labels: labels.slice(0, end), values: values.slice(0, end) };
    },

    displayName(s) {
      if (!s) return "-";

      if (isThreePhase(s.meter_name)) {
        const sn = String(s.meter_sn || "");
        return THREE_PHASE_NAME_MAP[sn] || "3-Phase Load";
      }

      if (isSinglePhase(s.meter_name)) {
        const suffix = String(s.meter_sn).slice(-6);
        return METER_SUFFIX_NAME_MAP[suffix] || s.meter_sn;
      }

      return s.meter_sn;
    },


    toggleLevel(key) {
      this.levelOpen[key] = !this.levelOpen[key];
    },
    isLevelOpen(key) {
      return !!this.levelOpen[key];
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

    openRoom(room) {
      this.selectedRoom = room;
      this.showFirstPage = false;

      this.activeLevel = "Overall";
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

      this.destroyCharts();

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

    async selectSensor(s) {
      this.selectedSensor = s;

      this.selectedLandscapeSensor = null;
      this.selectedLandscapeKey = null;

      this.sensorKwhToday = null;
      this.sensorKwhMTD = null;
      this.chartErrorSensor = "";
      this.lastSensorUrl = "";
      this.sensorSeries = { labels: [], values: [], label: "" };
      this.sensor7Series = { labels: [], values: [], label: "" };

      await this.setSelectedSensorElectrical();

      this.$nextTick(() => {
        this.loadSensorSummaryAndDraw();
      });
    },


    async onSensorDateChange() {
      if (!this.selectedSensor) return;

      this.sensorMode = "day24";
      this.sensorKwhToday = null;
      this.sensorKwhMTD = null;
      this.chartErrorSensor = "";
      this.lastSensorUrl = "";

      await this.loadSensorSummaryAndDraw();
    },


    onOverallDateChange() {
      if (!this.selectedRoom?.gateway_sn) return;
      this.overallMode = "day24";
      this.loadOverallSeriesAndDraw();
    },

    setOverallModeDay24() {
      if (!this.overallMeterSn) return;
      this.overallMode = "day24";
      this.loadOverallSeriesAndDraw();
    },

    setOverallModeLast7() {
      if (!this.overallMeterSn) return;
      this.overallMode = "last7";
      this.loadOverallLast7Days();
    },


    parseISODate(iso) {
      const [y, m, d] = String(iso).split("-").map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    },
    formatISODate(d) {
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    },
    last7Range(endISO) {
      const end = this.parseISODate(endISO || todayISO());
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { startISO: this.formatISODate(start), endISO: this.formatISODate(end) };
    },
    sumDayFromPayload(dayObj) {
      const series = Array.isArray(dayObj?.total_usage) ? dayObj.total_usage : [];
      return series.reduce((acc, v) => acc + (Number(v) || 0), 0);
    },
    buildLast7DailyTotals(payload, startISO, endISO) {
      const daysArr = Array.isArray(payload?.days) ? payload.days : [];
      const map = {};
      for (const d of daysArr) {
        const dateKey = d?.date || d?.day || d?.label;
        if (!dateKey) continue;
        map[dateKey] = this.sumDayFromPayload(d);
      }

      const start = this.parseISODate(startISO);
      const end = this.parseISODate(endISO);

      const labels = [];
      const values = [];
      const cur = new Date(start);

      while (cur <= end) {
        const iso = this.formatISODate(cur);
        labels.push(iso);
        values.push(Number(map[iso] || 0));
        cur.setDate(cur.getDate() + 1);
      }

      return { labels, values };
    },

    async loadOverallLast7Days() {
      if (!this.overallMeterSn) return;

      this.chartLoadingOverall = true;
      this.chartErrorOverall = "";
      this.lastOverallUrl = "";
      this.overallMode = "last7";
      this.destroyOverallChartOnly();

      try {
        const endISO = this.overallDate || todayISO();
        const { startISO, endISO: endFinal } = this.last7Range(endISO);
        this.overallDate = endFinal;

        const meterSN = this.overallMeterSn;

        const url = `/api/powermeter/usage/range/day24?meter_sn=${encodeURIComponent(
          meterSN
        )}&start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endFinal)}`;

        this.lastOverallUrl = url;

        const { data } = await axios.get(url);
        const days = Array.isArray(data?.days) ? data.days : [];

        // Sum each day's 24h usage -> daily total
        const labels = days.map((d) => d.day);
        const values = days.map((d) => this.sumDayUsage(d));

        this.last7Series = {
          labels,
          values,
          label: `Overall (Main Incoming) ${meterSN} last 7 days (kWh/day)`,
        };

        await this.$nextTick();
        const canvas = this.$refs.overallChartCanvas;
        if (!canvas) return;

        this.overallChart = this.buildLineChart(canvas, this.last7Series);

        if (this.fullscreen.open && this.fullscreen.type === "overall") {
          this.$nextTick(() => this.drawFullscreen());
        }
      } catch (e) {
        console.error("Overall last-7 chart fetch/draw failed:", e);
        this.chartErrorOverall = "";
        this.last7Series = this.demoDailyEnergySeries('Gateway – last 7 days');
        await this.$nextTick();
        const canvas = this.$refs.overallChartCanvas;
        if (canvas) this.overallChart = this.buildLineChart(canvas, this.last7Series);
      } finally {
        this.chartLoadingOverall = false;
      }
    }
    ,

    destroyCharts() {
      this.destroySensorChartOnly();
      this.destroyOverallChartOnly();
      this.destroyFullscreenChartOnly();
    },
    destroySensorChartOnly() {
      if (this.sensorChart) {
        this.sensorChart.destroy();
        this.sensorChart = null;
      }
    },
    destroyOverallChartOnly() {
      if (this.overallChart) {
        this.overallChart.destroy();
        this.overallChart = null;
      }
    },
    destroyFullscreenChartOnly() {
      if (this.fullscreenChart) {
        this.fullscreenChart.destroy();
        this.fullscreenChart = null;
      }
    },


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
              tension: 0.35,          // ✅ smooth curve (0 = straight)
              cubicInterpolationMode: "monotone", // ✅ reduces weird overshoot
              pointRadius: 0,         // optional: hides dots for a cleaner look
              pointHoverRadius: 4,    // optional: still shows on hover
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: { labels: { color: "#fff" } },
            tooltip: {
              callbacks: {
                title: (items) => (items?.length ? String(items[0].label || "") : ""),
              },
            },
          },
          scales: {
            x: { ticks: { color: "#fff", maxRotation: 0, autoSkip: true }, grid: { color: "rgba(255,255,255,0.15)" } },
            y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.15)" }, beginAtZero: true },
          },
        },
      });
    },

    async loadSensorSeriesAndDraw() {
      if (!this.selectedSensor) return;
      this.sensorMode = "day24";
      await this.loadSensorSummaryAndDraw();
    },

    async loadOverallSeriesAndDraw() {
      if (!this.overallMeterSn) return;

      this.chartLoadingOverall = true;
      this.chartErrorOverall = "";
      this.lastOverallUrl = "";
      this.destroyOverallChartOnly();

      try {
        const day = this.overallDate || todayISO();
        const meterSN = this.overallMeterSn;

        const url = `/api/powermeter/usage/range/day24?meter_sn=${encodeURIComponent(
          meterSN
        )}&start=${encodeURIComponent(day)}&end=${encodeURIComponent(day)}`;

        this.lastOverallUrl = url;

        const { data } = await axios.get(url);

        // same shape as your sensor endpoint
        const d0 = Array.isArray(data?.days) ? data.days[0] : null;
        const labelsRaw = Array.isArray(d0?.labels_24) ? d0.labels_24 : [];
        const usageRaw = Array.isArray(d0?.usage_24) ? d0.usage_24 : [];

        const trimmed = this.trimToHour(labelsRaw, usageRaw, day);
        const labels = trimmed.labels.map((x) => this.to12HourLabel(x));
        const values = trimmed.values;

        this.overallSeries = {
          labels,
          values,
          label: `Overall (Main Incoming) ${meterSN} usage (kWh)`,
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
        this.chartErrorOverall = "";
        this.overallSeries = this.demoEnergySeries('Gateway energy usage');
        await this.$nextTick();
        const canvas = this.$refs.overallChartCanvas;
        if (canvas) this.overallChart = this.buildLineChart(canvas, this.overallSeries);
      } finally {
        this.chartLoadingOverall = false;
      }
    },

    openFullscreen(type) {
      this.fullscreenError = "";
      this.fullscreen.open = true;
      this.fullscreen.type = type;
      this.$nextTick(() => this.drawFullscreen());
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

      canvas.style.width = "100%";
      canvas.style.maxWidth = "100%";
      canvas.style.display = "block";

      const series =
        this.fullscreen.type === "sensor"
          ? this.sensorMode === "last7"
            ? this.sensor7Series
            : this.sensorSeries
          : this.overallMode === "last7"
            ? this.last7Series
            : this.overallSeries;

      if (!series || !series.labels || !series.labels.length) return;

      try {
        this.fullscreenChart = this.buildLineChart(canvas, series);
        requestAnimationFrame(() => {
          if (this.fullscreenChart) this.fullscreenChart.resize();
        });
      } catch (e) {
        console.error("Fullscreen draw failed:", e);
        this.fullscreenError = e?.message || "Fullscreen draw failed";
      }
    },

    async fetchPowermeterMeters() {
      const { data } = await axios.get("/api/powermeter/meters");
      const list = Array.isArray(data) ? data : [];
      if (!list.length) return;

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
        const demoMeters = Array.isArray(room.sensors) ? room.sensors : [];
        const liveMeters = byGateway[room.gateway_sn] || [];
        const merged = new Map(demoMeters.map(item => [String(item.meter_sn), item]));
        liveMeters.forEach(item => merged.set(String(item.meter_sn), item));
        room.sensors = Array.from(merged.values());
      }
    },

    sumSmartlightKwh(arr) {
      const list = Array.isArray(arr) ? arr : [];
      const totalWh = list.reduce((acc, item) => acc + (Number(item?.data?.power_consumption) || 0), 0);
      return totalWh / 1000;
    },

    async fetchTodayTotalsForRooms() {
      const day = todayISO();

      const tasks = this.rooms.map(async (room) => {
        if (room.label === "Landscape" || !room.gateway_sn) return;

        try {
          const url = `/api/powermeter/usage/range/day24/by_gateway?gateway_sn=${encodeURIComponent(
            room.gateway_sn
          )}&start=${encodeURIComponent(day)}&end=${encodeURIComponent(day)}`;

          const { data } = await axios.get(url);
          const total = this.sumUsageSeries(data);
          room.todayTotalKwh = total;
        } catch (e) {
          console.error(`Today total fetch failed for ${room.label}`, e);
          // Retain demo total when the live service is unavailable.
        }
      });

      await Promise.allSettled(tasks);
    },

    sumUsageSeries(payload) {
      const series =
        (Array.isArray(payload?.total_usage_series) && payload.total_usage_series) ||
        (Array.isArray(payload?.days?.[0]?.total_usage) && payload.days[0].total_usage) ||
        [];
      return series.reduce((acc, v) => acc + (Number(v) || 0), 0);
    },

    async fetchLandscape() {
      try {
        const { data } = await axios.get("/api/lorawan/data/latest/Smartlight");
        const arr = Array.isArray(data) ? data : [];
        const room = this.rooms.find((r) => r.label === "Landscape");
        if (room && arr.length) {
          room.sensors = arr;
          room.todayTotalKwh = this.sumSmartlightKwh(arr);
        }
      } catch (e) {
        console.error("Landscape fetch failed:", e);
        // Retain demo landscape readings when the live service is unavailable.
      }
    },

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
    landscapeKwh(s) {
      const wh = Number(s?.data?.power_consumption) || 0;
      return (wh / 1000).toFixed(2);
    },
    landscapePF(s) {
      const pf = Number(s?.data?.power_factor);
      return Number.isFinite(pf) ? pf.toFixed(2) : "-";
    },
    landscapeV(s) {
      const v = Number(s?.data?.voltage);
      return Number.isFinite(v) ? v.toFixed(2) : "-";
    },

    async fetchTodayTotalsForRoomsThrottled() {
      const day = todayISO();
      const rooms = this.rooms.filter(r => r.label !== "Landscape" && r.gateway_sn);

      await Promise.allSettled(
        rooms.map((room) =>
          this.limit3(async () => {
            try {
              const url = `/api/powermeter/usage/range/day24/by_gateway?gateway_sn=${encodeURIComponent(
                room.gateway_sn
              )}&start=${encodeURIComponent(day)}&end=${encodeURIComponent(day)}`;

              const { data } = await axios.get(url);
              room.todayTotalKwh = this.sumUsageSeries(data);
            } catch (e) {
              console.error(`Today total fetch failed for ${room.label}`, e);
              // Retain demo total when the live service is unavailable.
            }
          })
        )
      );
    },

    async fetchLatestElectricalForRoomsThrottled() {
      const gateways = Array.from(
        new Set(
          this.rooms
            .filter((r) => r.label !== "Landscape" && r.gateway_sn)
            .map((r) => r.gateway_sn)
        )
      );

      const byGateway = {};

      await Promise.allSettled(
        gateways.map((g) =>
          this.limit3(async () => {
            try {
              const url = `/api/powermeter/latest/electrical?gateway_sn=${encodeURIComponent(g)}`;
              const { data } = await axios.get(url);

              const list = Array.isArray(data?.three_phase) ? data.three_phase : [];
              const valid = list.filter((m) => m?.electrical && m?.meterStatus !== "missing");

              if (!valid.length) {
                byGateway[g] = null;
                return;
              }

              let sumV12 = 0, sumV23 = 0, sumV31 = 0;
              let sumV1 = 0, sumV2 = 0, sumV3 = 0;
              let sumI1 = 0, sumI2 = 0, sumI3 = 0;
              let sumPkw = 0;
              let latestTs = null;

              for (const m of valid) {
                const e = m.electrical || {};
                const lv = Array.isArray(e.line_voltage_v) ? e.line_voltage_v : [];
                const pv = Array.isArray(e.phase_voltage_v) ? e.phase_voltage_v : [];
                const ia = Array.isArray(e.current_a) ? e.current_a : [];
                const pkw = e.active_power_kw || {};

                sumV12 += Number(lv[0]) || 0;
                sumV23 += Number(lv[1]) || 0;
                sumV31 += Number(lv[2]) || 0;

                sumV1 += Number(pv[0]) || 0;
                sumV2 += Number(pv[1]) || 0;
                sumV3 += Number(pv[2]) || 0;

                sumI1 += Number(ia[0]) || 0;
                sumI2 += Number(ia[1]) || 0;
                sumI3 += Number(ia[2]) || 0;

                sumPkw += Number(pkw.total) || 0;

                const ts = m?.ts;
                if (ts && (!latestTs || String(ts) > String(latestTs))) latestTs = ts;
              }

              const n = valid.length;

              byGateway[g] = {
                line: { v12: sumV12 / n, v23: sumV23 / n, v31: sumV31 / n },
                phase: { v1: sumV1 / n, v2: sumV2 / n, v3: sumV3 / n },
                currents: { i1: sumI1 / n, i2: sumI2 / n, i3: sumI3 / n },
                power_kw_total: sumPkw,
                meterCount: n,
                ts: latestTs,
              };

              byGateway[g].currents.total =
                byGateway[g].currents.i1 + byGateway[g].currents.i2 + byGateway[g].currents.i3;
            } catch (err) {
              console.error(`latest/electrical failed for gateway ${g}`, err);
              byGateway[g] = null;
            }
          })
        )
      );

      for (const room of this.rooms) {
        if (room.label === "Landscape" || !room.gateway_sn) continue;

        const agg = byGateway[room.gateway_sn];
        if (!agg) {
          continue;
        }

        room.electricalSummary = {
          line: { ...agg.line },
          phase: { ...agg.phase },
          currents: { ...agg.currents },
          power_kw_total: agg.power_kw_total,
          meterCount: agg.meterCount,
          ts: agg.ts,
        };
      }
    },

    async getWithRetry(url, opts = {}, retries = 1) {
      try {
        return await axios.get(url, opts);
      } catch (e) {
        const status = e?.response?.status;
        if (retries > 0 && (status === 504 || status === 502 || status === 503)) {
          await new Promise(r => setTimeout(r, 600)); // small backoff
          return this.getWithRetry(url, opts, retries - 1);
        }
        throw e;
      }
    },

    async init() {
      this.loading = true;
      try {
        // 1) Load the meters list first (usually needed for everything else)
        await this.fetchPowermeterMeters();

        // 2) Then do the heavier multi-request calls with throttling
        await Promise.allSettled([
          this.limit3(() => this.fetchLandscape()),
          this.limit3(() => this.fetchTodayTotalsForRoomsThrottled()),
          this.limit3(() => this.fetchLatestElectricalForRoomsThrottled()),
        ]);
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        this.loading = false;
      }
    },

  },

  mounted() {
    this.applyDemoEnergyData();
    this.init();
  },
};
</script>

<style scoped>
/* (same CSS you already had — unchanged) */
.container-fluid {
  max-width: 1280px;
  color: #fff;
}

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

.room-detail {
  position: relative;
  padding: 10px 0 20px;
  padding-bottom: 13%;
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

.left-panel,
.right-panel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 12px;
}

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

.chart-canvas-wrap canvas,
.fs-canvas-wrap canvas {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
}

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

.fs-canvas-wrap {
  position: relative;
  flex: 1;
  padding: 12px;
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

.sensor-grid-2x2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.sensor-grid-2x2 .sensor-card {
  width: 100%;
}

.accordion {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.acc-item {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.12);
}

.acc-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: none;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.acc-head:hover {
  background: rgba(255, 255, 255, 0.12);
}

.acc-body {
  padding: 10px 10px 2px;
}

.acc-title {
  opacity: 0.95;
}

.acc-icon {
  opacity: 0.85;
  font-weight: 900;
}

.chip-btn {
  padding: 7px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  cursor: pointer;
  font-weight: 900;
  transition: all 0.2s ease;
}

.chip-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.chip-btn.active {
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.65);
}

.chip-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
