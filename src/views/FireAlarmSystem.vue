<template>
  <div class="container mt-5 bordered-container">
    <h2 class="text-center mb-4">Fire Alarm System</h2>
    <div class="view-switcher">
      <button @click="toggleView('relation')" :class="{ 'active': currentView === 'relation' }">Schematic</button>
      <button @click="toggleView('devices')" :class="{ 'active': currentView === 'devices' }">Zones</button>
      <button @click="toggleView('alerts')" :class="{ 'active': currentView === 'alerts' }">Alert History</button>
    </div>

    <!-- Schematic View -->
    <div v-if="currentView === 'relation'" class="map-container">
      <!-- Fire Command Center -->
      <div class="fire-command-center"
           :style="{ top: fireCommandCenterPosition.top, left: fireCommandCenterPosition.left }">
        <img src="@/assets/fire-alarm-finder.png" alt="Fire Command Center" class="fire-command-center-image" />
      </div>

      <!-- Fire Alarm Images with SAP Labels and Zones -->
      <div v-for="(alarm, index) in sortedAlarms" :key="alarm.zone" class="fire-alarm-container"
           :style="{ top: fireAlarmPositions[index]?.top, left: fireAlarmPositions[index]?.left }"
           @mouseenter="onHover(index)" @mouseleave="onLeave(index)">
        <!-- Fire Alarm Image -->
        <img src="@/assets/fire-alarm.png" alt="Fire Alarm" class="fire-alarm-image" />

        <!-- SAP Label and Zone Information -->
        <div class="fire-alarm-labels">
          <p class="sap-label">SAP-{{ index + 1 }}</p>
          <p class="zone-label">{{ alarm.zone }}</p>
        </div>

        <!-- Show Zone Status on Hover -->
        <transition name="fade">
          <div v-if="hoveredZone === index" class="zone-status-popup">
            <p><strong>{{ alarm.zone }}</strong></p>
            <p>Status: 
              <span :class="alarm.status === 'OFF' ? 'text-success' : 'text-danger'">
                {{ alarmDisplayStatus(alarm.status) }}
              </span>
            </p>
            <p>Last Updated: {{ alarm.lastUpdated ? alarm.lastUpdated.toLocaleString() : 'N/A' }}</p>
          </div>
        </transition>
      </div>

      <!-- Floor Plan Image -->
      <img src="@/assets/ite_firealarm_relations.png" alt="Floor Plan" class="map-image">

      <!-- Alarm Statuses (if needed) -->
      <div v-for="(alarm, index) in sortedAlarms" :key="alarm.zone" class="alarm-status" :style="alarmPositions[index]"
           @mouseenter="onHover(index)" @mouseleave="onLeave(index)"
           :class="{ 'highlight': hoveredAlarm === index }">
        <span :class="{ 'online': alarm.status === 'OFF', 'offline': alarm.status === 'ON' }"></span>
      </div>
    </div>

    <!-- Zones View -->
    <div v-if="currentView === 'devices'" class="devices-grid">
      <div v-for="(alarm, index) in sortedAlarms" :key="alarm.zone"
           :class="['device-item', { 'highlight': hoveredAlarm === index }]"
           @mouseenter="onHover(index)" @mouseleave="onLeave(index)">
        <h5>{{ alarm.zone }}</h5>
        <p>
          Status:
          <span :class="{ 'text-success': alarm.status === 'OFF', 'text-danger': alarm.status === 'ON' }">
            {{ alarm.status === 'ON' ? 'Offline' : 'Online' }}
          </span>
        </p>
        <p>
          Last Updated: {{ alarm.lastUpdated ? alarm.lastUpdated.toLocaleString() : 'N/A' }}
        </p>
      </div>
    </div>

    <!-- Alert History View -->
    <div v-if="currentView === 'alerts'" class="alert-history-container">
      <h3>Alert History</h3>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Received At</th>
            <th>Status</th>
            <th>Timestamp</th>
            <th>Zone</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alert in sortedAlertHistory" :key="alert.id">
            <td>{{ alert.id }}</td>
            <td>{{ alert.received_at }}</td>
            <td>{{ alert.status }}</td>
            <td>{{ formatTimestamp(alert.timestamp) }}</td>
            <td>{{ alert.zone }}</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
import mqtt from 'mqtt';

const minutesAgo = minutes => new Date(Date.now() - minutes * 60 * 1000);

const demoAlertHistory = [
  { id: 1001, received_at: minutesAgo(240).toLocaleString(), status: 'Cleared', timestamp: minutesAgo(238).toISOString(), zone: 'Zone 2' },
  { id: 1002, received_at: minutesAgo(185).toLocaleString(), status: 'Acknowledged', timestamp: minutesAgo(181).toISOString(), zone: 'Zone 5' },
  { id: 1003, received_at: minutesAgo(126).toLocaleString(), status: 'Cleared', timestamp: minutesAgo(121).toISOString(), zone: 'Zone 1' },
  { id: 1004, received_at: minutesAgo(74).toLocaleString(), status: 'Cleared', timestamp: minutesAgo(68).toISOString(), zone: 'Zone 4' },
  { id: 1005, received_at: minutesAgo(32).toLocaleString(), status: 'Active', timestamp: minutesAgo(32).toISOString(), zone: 'Zone 3' },
  { id: 1006, received_at: minutesAgo(18).toLocaleString(), status: 'Investigating', timestamp: minutesAgo(18).toISOString(), zone: 'Zone 6' },
];

export default {
  name: 'FireAlarmSystem',
  data() {
    return {
      currentView: 'relation',
      hoveredAlarm: null,
      hoveredZone: null,
      alarms: {
        "Zone 1": { status: "OFF", lastUpdated: minutesAgo(2) },
        "Zone 2": { status: "OFF", lastUpdated: minutesAgo(3) },
        "Zone 3": { status: "ON", lastUpdated: minutesAgo(32) },
        "Zone 4": { status: "OFF", lastUpdated: minutesAgo(1) },
        "Zone 5": { status: "OFF", lastUpdated: minutesAgo(4) },
        "Zone 6": { status: "ON", lastUpdated: minutesAgo(18) }
      },
      client: null,
      fireCommandCenterPosition: {
        top: '9%',
        left: '12.5%',
      },
      fireAlarmPositions: [
        { top: '9%', left: '73.3%' },
        { top: '9%', left: '52.5%' },
        { top: '9%', left: '31%' },
        { top: '56%', left: '73.3%' },
        { top: '56%', left: '52.5%' },
        { top: '56%', left: '31%' },
      ],
      alarmPositions: [
        { top: '41.1%', left: '84.2%' },
        { top: '41.1%', left: '63.3%' },
        { top: '41.1%', left: '42.3%' },
        { top: '87.9%', left: '84.2%' },
        { top: '87.9%', left: '63.3%' },
        { top: '87.9%', left: '42.3%' },
      ],
      alertHistory: demoAlertHistory,
    };
  },
  async created() {
    await this.fetchAlarms();
    // Optionally, pre-fetch alert history:
    // this.fetchAlerts();
  },
  computed: {
    sortedAlarms() {
      // Convert the alarms object into an array and sort by zone name.
      const alarmsArray = Object.entries(this.alarms).map(([zone, data]) => ({
        zone,
        status: data.status,
        lastUpdated: data.lastUpdated
      }));
      alarmsArray.sort((a, b) => a.zone.localeCompare(b.zone));
      return alarmsArray;
    },
    sortedAlertHistory() {
      // Return a sorted copy of alertHistory by ID in ascending order.
      return this.alertHistory.slice().sort((a, b) => a.id - b.id);
    }
  },
  methods: {
    toggleView(view) {
      this.currentView = view;
      if (view === 'alerts' && this.alertHistory.length === 0) {
        this.fetchAlerts();
      }
    },
    alarmDisplayStatus(status) {
      return status === 'OFF' ? 'Online – Normal' : 'Offline – Alarm Active';
    },
    fetchAlarms() {
      // Connect via MQTT using the proxy
      this.client = mqtt.connect('ws://152.42.161.80:9001');

      this.client.on('connect', () => {
        console.log('Connected to MQTT broker via proxy');
        this.client.subscribe('firealarm/status', (err) => {
          if (!err) {
            console.log('Subscribed to firealarm/status');
          } else {
            console.error('Subscription error:', err);
          }
        });
      });

      // Listen for incoming MQTT messages.
      this.client.on('message', (topic, message) => {
        if (topic === 'firealarm/status') {
          try {
            const parsed = JSON.parse(message.toString());
            const zoneName = parsed.Name ? parsed.Name.trim() : null;
            const newStatus = parsed.Status;
            const newTimestamp = parsed.DateTimeRecorded ? new Date(parsed.DateTimeRecorded) : new Date();

            if (zoneName) {
              if (this.alarms[zoneName] !== undefined) {
                this.alarms[zoneName].status = newStatus;
                this.alarms[zoneName].lastUpdated = newTimestamp;
                console.log(`Updated ${zoneName}: status=${newStatus}, lastUpdated=${newTimestamp}`);
              } else {
                console.warn(`Received update for unknown zone: ${zoneName}`);
              }
            }
          } catch (error) {
            console.error('Error parsing MQTT message:', error);
          }
        }
      });

      this.client.on('error', (error) => {
        console.error('MQTT Error:', error);
      });
    },
    fetchAlerts() {
      fetch('http://localhost:5003/alerts')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data) && data.length) this.alertHistory = data;
          console.log('Fetched alert history:', data);
        })
        .catch(error => {
          console.error('Error fetching alert history:', error);
          this.alertHistory = demoAlertHistory;
        });
    },
    formatTimestamp(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
    onHover(index) {
      this.hoveredZone = index;
      this.hoveredAlarm = index;
    },
    onLeave(index) {
      if (this.hoveredZone === index) this.hoveredZone = null;
      if (this.hoveredAlarm === index) this.hoveredAlarm = null;
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.view-switcher {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.view-switcher button {
  background-color: #f8f9fa;
  border: none;
  padding: 10px 20px;
  margin: 0 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.view-switcher button.active {
  background-color: #007bff;
  color: white;
}

/* Alert History Table Styling */
.alert-history-container {
  margin: 20px;
}

.alert-history-container h3 {
  text-align: center;
  margin-bottom: 20px;
}

.alert-history-container table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alert-history-container th,
.alert-history-container td {
  padding: 12px 15px;
  text-align: center;
}

.alert-history-container th {
  background-color: #1e6fc7;
  color: #fff;
}

.alert-history-container tr:nth-child(even) {
  background-color: #f2f2f2;
}

.alert-history-container tr:hover {
  background-color: #ddd;
}

/* Existing styles for schematic, zones, etc. */
.map-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid lightgrey;
  border-radius: 5px;
}

.map-image {
  width: 100%;
  height: auto;
}

.fire-command-center {
  position: absolute;
}

.fire-command-center-image {
  width: 73%;
}

.fire-alarm-container {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.fire-alarm-image {
  width: 50%;
}

.fire-alarm-labels {
  margin-top: 5px;
}

.sap-label {
  font-weight: bold;
  font-size: 1rem;
  margin: 0;
}

.zone-label {
  font-size: 0.875rem;
  margin: 0;
}

.zone-status-popup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  padding: 10px;
  background-color: black;
  color: white;
  border: 1px solid lightgray;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  z-index: 10;
}

.alarm-status {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1px solid black;
}

.alarm-status span {
  display: block;
  width: 100%;
  height: 100%;
}

.online {
  background-color: red;
  border-radius: 2px;
  border: 1px solid black;
}

.offline {
  background-color: green;
  border-radius: 2px;
  border: 1px solid black;
}

.text-danger {
  color: #dc3545 !important;
}

.text-success {
  color: #28a745 !important;
}

.highlight {
  border: 2px solid #00BCD4;
  border-radius: 2px;
}

.devices-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.device-item {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid lightgrey;
  transition: transform 0.3s, box-shadow 0.3s;
}

.device-item:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.device-item h5 {
  margin-bottom: 10px;
  font-size: 1.25rem;
  font-weight: bold;
  color: #007bff;
}
</style>
