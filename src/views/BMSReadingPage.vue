<template>
  <div class="container">
    <h2 class="text-center mb-4">Building Management System</h2>
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: currentView === 'bms' }" @click="toggleView('bms')">BMS</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: currentView === 'groupings' }"
          @click="toggleView('groupings')">Groupings</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: currentView === 'downloads' }"
          @click="toggleView('downloads')">Downloads</a>
      </li>
    </ul>
    <div v-if="currentView === 'bms'" class="tab-content">
      <div class="image-container">
        <img src="@/assets/BMS.jpg" alt="Chiller Plant Room" class="background-image">
        <div v-for="(position, sensorName) in sensorPositions" :key="sensorName" class="sensor-value" :style="position"
          :class="{ slantedNegative: isSlantedNegative(sensorName), slantedPositive: isSlantedPositive(sensorName) }">
          {{ getValue(sensorName) }}
        </div>
      </div>
    </div>
    <div v-if="currentView === 'downloads'" class="tab-content">
      <div class="dropdown-container">
        <label for="month-year-dropdown">Select Month and Year to download Data:</label>
        <select id="month-year-dropdown" class="form-select" v-model="selectedMonthYear">
          <option v-for="(option, index) in downloadOptions" :key="index" :value="option.value"
            :disabled="option.disabled">
            {{ option.label }}
          </option>
        </select>
        <button class="btn btn-primary mt-3" :disabled="selectedMonthYear !== '2024-12'" @click="downloadData">
          Download Data
        </button>
      </div>
    </div>

    <div v-if="currentView === 'groupings'" class="group-sensors">
      <div v-for="(group) in filteredGroups" :key="group._id" class="mb-4">
        <h3>{{ group.name }}</h3>
        <div class="sensor-list">
          <div v-for="(id, index) in group.group" :key="id" class="sensor-item">
            <h5>{{ group.item_name[index] || 'Data Unavailable' }}</h5>
            <p>
              <span :class="['status-label', getStatusClass(findLatestDataById(id).status)]">
                Connection: {{ findLatestDataById(id).status || 'N/A' }}
              </span>
            </p>
            <p>
              <span v-if="shouldShowStatus(findLatestDataById(id).name || '')"
                :class="['status-label', getActiveClass(id)]">
                Status: {{ getActiveValue(id) || 'N/A'	 }}
              </span>
            </p>
            <p>Value: {{ formatValue(getPresentValue(id)) }} {{ group.units[index] || '' }}</p>
            <p>Last Updated: {{ formatDate(findLatestDataById(id).dateTime) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as CacheManager from '@/CacheManager.js';
import mqtt from 'mqtt';

const demoBmsTimestamp = new Date().toISOString();
const demoBmsData = [
  ['bms-01', 'NCE-02/FCB.Local Application.CHW FLOW RATE', 128.4],
  ['bms-02', 'NCE-02/Programming.AGILENT.CH-CHWR-TP', 13.8],
  ['bms-03', 'NCE-02/Programming.AGILENT.CH-CHWS-TP', 7.2],
  ['bms-04', 'NCE-02/Programming.AGILENT.CH-CWS-TP', 29.1],
  ['bms-05', 'NCE-02/FCB.Local Application.OA-T', 31.4],
  ['bms-06', 'NCE-02/FCB.Local Application.OA-H', 68.2],
  ['bms-07', 'NCE-02/FCB.Local Application.CT-TEMP', 28.7],
  ['bms-08', 'NCE-02/Energy.DATA.SYS-EFF', 0.71],
  ['bms-09', 'NCE-02/Energy.DATA.HEAT-BALANCE', 96.8],
  ['bms-10', 'NCE-02/Energy.DATA.TOT-CLG-KW', 316.8],
  ['bms-11', 'NCE-02/Energy.DATA.TOT-ELEC-KW', 225.4],
  ['bms-12', 'NCE-02/Programming.AGILENT.CH-CWR-TP', 31.2],
  ['bms-13', 'NCE-02/FCB.Local Application.CDW FLOWRATE', 142.6],
  ['bms-14', 'NAE35-01/Field Bus MSTP1.FAC-6.VALVE', 64],
  ['bms-15', 'NAE35-01/Field Bus MSTP1.FAC-6.AHU CHW-F', 21.5],
  ['bms-16', 'NAE35-01/Field Bus MSTP1.FAC-6.SAT', 14.6],
  ['bms-17', 'NCE-02/Programming.CHSEQ.SysFail-FF', 'NORMAL'],
  ['bms-18', 'NCE-02/FCB.Local Application.CDWP-CMD', 'START'],
  ['bms-19', 'NAE35-01/Field Bus MSTP1.FAC-6.AHU-CMD', 'START'],
  ['bms-20', 'NCE-02/Programming.CHSEQ.SysCMD', 'START'],
  ['bms-21', 'NCE-02/FCB.Local Application.CH-CMD', 'START'],
  ['bms-22', 'NCE-02/FCB.Local Application.CT-CMD', 'START'],
  ['bms-23', 'NCE-02/FCB.Local Application.CHWP-CMD', 'START'],
  ['bms-24', 'NAE35-01/Field Bus MSTP1.FAC-6.AHU-S', 'ON'],
  ['bms-25', 'NCE-02/FCB.Local Application.CDWP-S', 'ON'],
  ['bms-26', 'NCE-02/FCB.Local Application.CH-S', 'ON'],
  ['bms-27', 'NCE-02/FCB.Local Application.CT-S', 'ON'],
  ['bms-28', 'NCE-02/FCB.Local Application.CHWP-S', 'ON'],
].map(([objectId, name, value]) => ({ objectId, name, value, status: 'OK', dateTime: demoBmsTimestamp }));

const demoBmsGroups = [
  { _id: 'group-1', name: 'Chilled Water System', group: ['bms-01', 'bms-02', 'bms-03', 'bms-15'], item_name: ['CHW Flow Rate', 'CHW Return Temperature', 'CHW Supply Temperature', 'AHU CHW Flow'], units: ['L/s', '°C', '°C', 'L/s'] },
  { _id: 'group-2', name: 'Cooling Water System', group: ['bms-04', 'bms-07', 'bms-12', 'bms-13'], item_name: ['CW Supply Temperature', 'Cooling Tower Temperature', 'CW Return Temperature', 'Condenser Water Flow'], units: ['°C', '°C', '°C', 'L/s'] },
  { _id: 'group-3', name: 'Plant Energy Performance', group: ['bms-08', 'bms-09', 'bms-10', 'bms-11'], item_name: ['System Efficiency', 'Heat Balance', 'Total Cooling Load', 'Total Electrical Load'], units: ['kW/RT', '%', 'kW', 'kW'] },
  { _id: 'group-4', name: 'Equipment Status', group: ['bms-17', 'bms-18', 'bms-19', 'bms-24'], item_name: ['System Alarm', 'CDW Pump Command', 'AHU Command', 'AHU Status'], units: ['', '', '', ''] },
];

export default {
  data() {
    return {
      currentView: 'bms',
      groups: demoBmsGroups,
      loading: true,
      error: null,
      latestData: demoBmsData,
      refreshInterval: null,
      search: '',
      selectedMonthYear: '2024-12', // Default to December 2024
      sensorPositions : {
  'NCE-02/FCB.Local Application.CHW FLOW RATE': { top: '77.625%', left: '16.33%' },
  'NCE-02/Programming.AGILENT.CH-CHWR-TP': { top: '79.625%', left: '32.25%' },
  'NCE-02/Programming.AGILENT.CH-CHWS-TP': { top: '75.375%', left: '34.25%' },
  'NCE-02/Programming.AGILENT.CH-CWS-TP': { top: '37%', left: '56.5%' },
  'NCE-02/FCB.Local Application.OA-T': { top: '12.375%', left: '50.25%' },
  'NCE-02/FCB.Local Application.OA-H': { top: '16.875%', left: '50.25%' },
  'NCE-02/FCB.Local Application.CT-TEMP': { top: '25.5%', left: '41.5%' },
  'NCE-02/Energy.DATA.SYS-EFF': { top: '22.875%', left: '85.83%' },
  'NCE-02/Energy.DATA.HEAT-BALANCE': { top: '22.875%', left: '94.25%' },
  'NCE-02/Energy.DATA.TOT-CLG-KW': { top: '22.875%', left: '68.5%' },
  'NCE-02/Energy.DATA.TOT-ELEC-KW': { top: '22.875%', left: '77.33%' },
  'NCE-02/Programming.AGILENT.CH-CWR-TP': { top: '36.5%', left: '43.8%' },
  'NCE-02/FCB.Local Application.CDW FLOWRATE': { top: '42%', left: '45.5%' },
  'NAE35-01/Field Bus MSTP1.FAC-6.VALVE': { top: '63.375%', left: '68.5%' },
  'NAE35-01/Field Bus MSTP1.FAC-6.AHU CHW-F': { top: '71.66%', left: '59.75%' },
  'NAE35-01/Field Bus MSTP1.FAC-6.SAT': { top: '53.5%', left: '88.3%' },

  // Replacing the STOP/ OFF keys with their corresponding objectName strings:
  "NCE-02/Programming.CHSEQ.SysFail-FF": { top: '93.5%', left: '82.3%' },      // (was ALARM)
  "NCE-02/FCB.Local Application.CDWP-CMD": { top: '54.5%', left: '50.3%' },      // (was STOP 1)
  "NAE35-01/Field Bus MSTP1.FAC-6.AHU-CMD": { top: '60.5%', left: '88.5%' },   // (was STOP 2)
  "NCE-02/Programming.CHSEQ.SysCMD": { top: '86.375%', left: '84.8%' },         // (was STOP 3)
  "NCE-02/FCB.Local Application.CH-CMD": { top: '51.625%', left: '28.3%' },      // (was STOP 4)
  "NCE-02/FCB.Local Application.CT-CMD": { top: '24.375%', left: '17.7%' },      // (was STOP 5)
  "NCE-02/FCB.Local Application.CHWP-CMD": { top: '89%', left: '8.6%' },         // (was STOP 6)
	
  "NAE35-01/Field Bus MSTP1.FAC-6.AHU-S": { top: '64.5%', left: '88.5%' },       // (was OFF 1)
  "NCE-02/FCB.Local Application.CDWP-S": { top: '58.625%', left: '50.2%' },      // (was OFF 2)
  "NCE-02/FCB.Local Application.CH-S": { top: '55.5%', left: '28.08%' },         // (was OFF 3)
  "NCE-02/FCB.Local Application.CT-S": { top: '28.375%', left: '17.7%' },        // (was OFF 4 / Cooling Tower Off)
  "NCE-02/FCB.Local Application.CHWP-S": { top: '93.125%', left: '8.5%' }        // (was OFF 5)
},

      lastUpdated: '',
      downloadOptions: this.generateDownloadOptions(),
mqttClient: null, // Add MQTT client variable
    };
  },
  async created() {
    if (CacheManager.getItem('bms') != null) {
      this.latestData = CacheManager.getItem('bms');
      await this.fetchLatestData();
      await this.fetchData();
    } else {
      await this.fetchLatestData();
      await this.fetchData();
    }
    this.setRefreshInterval();
this.initializeMQTT(); // Initialize MQTT after data is fetched
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

if (this.mqttClient) {
      this.mqttClient.end(); // Clean up MQTT connection on component unmount
    }
  },
  computed: {
    filteredGroups() {
      const searchTerm = this.search.toLowerCase();
      return this.groups.filter(group => group.name.toLowerCase().includes(searchTerm));
    },
    isDecember2024() {
      return this.selectedMonthYear === '2024-12';
    }
  },
  methods: {
initializeMQTT() {
  this.mqttClient = mqtt.connect('ws://152.42.161.80:9001'); // Connect to the MQTT broker

  this.mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    this.mqttClient.subscribe('bms/data', (err) => {
      if (err) {
        console.log('Failed to subscribe to topic:', err);
      } else {
        console.log('Subscribed to topic: bms/data');
      }
    });
  });

  // Handle incoming MQTT messages
  this.mqttClient.on('message', (topic, message) => {
    if (topic === 'bms/data') {
      this.handleMQTTData(message.toString());
    }
  });
},

// Handle the incoming MQTT data and update latestData with transformed values
handleMQTTData(data) {
  try {
    const parsedData = JSON.parse(data);

    // Correct sensor type mapping:
    const sensorTypeMap = {
      "NCE-02/Programming.CHSEQ.SysFail-FF": "ALARM",
      "NCE-02/FCB.Local Application.CDWP-CMD": "STOP",
      "NAE35-01/Field Bus MSTP1.FAC-6.AHU-CMD": "STOP",
      "NCE-02/Programming.CHSEQ.SysCMD": "STOP",
      "NCE-02/FCB.Local Application.CH-CMD": "STOP",
      "NCE-02/FCB.Local Application.CT-CMD": "STOP",
      "NCE-02/FCB.Local Application.CHWP-CMD": "STOP",
      "NAE35-01/Field Bus MSTP1.FAC-6.AHU-S": "OFF",
      "NCE-02/FCB.Local Application.CDWP-S": "OFF",
      "NCE-02/FCB.Local Application.CH-S": "OFF",
      "NCE-02/FCB.Local Application.CT-S": "OFF",
      "NCE-02/FCB.Local Application.CHWP-S": "OFF"
    };

    for (const key in parsedData) {
      if (Object.prototype.hasOwnProperty.call(parsedData, key)) {
        const sensorData = parsedData[key];
        let transformedValue = sensorData.presentValue; // default to raw value
        const type = sensorTypeMap[sensorData.objectName];

        if (type === "STOP") {
          transformedValue = (sensorData.presentValue === "inactive") ? "STOP" : "START";
        } else if (type === "OFF") {
          transformedValue = (sensorData.presentValue === "inactive") ? "OFF" : "ON";
        } else if (type === "ALARM") {
          transformedValue = (sensorData.presentValue === "inactive") ? "NORMAL" : "ALARM";
        }
        
        const existingData = this.latestData.find(item => item.name === sensorData.objectName);
        if (existingData) {
          existingData.value = transformedValue;
          existingData.units = sensorData.units || '';
        } else {
          this.latestData.push({
            name: sensorData.objectName,
            value: transformedValue,
            units: sensorData.units || '',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing MQTT data:', error);
  }
},
    generateDownloadOptions() {
      const startDate = new Date(2024, 11); // December 2024
      const endDate = new Date(2025, 11); // December 2025
      const options = [];

      while (startDate <= endDate) {
        const year = startDate.getFullYear();
        const month = startDate.toLocaleString('default', { month: 'long' });
        const value = `${year}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

        options.push({
          label: `${month} ${year}`,
          value: value,
          disabled: value !== '2024-12' // Only enable December 2024
        });

        startDate.setMonth(startDate.getMonth() + 1);
      }

      return options;
    },
    downloadData() {
      const rows = [['Sensor', 'Value', 'Status', 'Timestamp'], ...this.latestData.map(item => [item.name, item.value, item.status, item.dateTime])];
      const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      link.download = 'BMS_Demo_Data.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    },
    toggleView(view) {
      this.currentView = view;
    },
    setRefreshInterval() {
      this.refreshInterval = setInterval(() => {
        this.fetchLatestData();
      }, 120000);
    },
    async fetchData() {
      this.loading = true;
      try {
        const response = await fetch('https://hammerhead-app-kva7n.ondigitalocean.app/Bacnet/api/get/east/bms/groups');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        let textData = await response.text();
        textData = textData.replace(/ObjectId\("([^"]+)"\)/g, '"$1"');
        const data = JSON.parse(textData);
        if (Array.isArray(data) && data.length) this.groups = data;
      } catch (error) {
        this.error = error.message;
        this.groups = demoBmsGroups;
      } finally {
        this.loading = false;
      }
    },
    async fetchLatestData() {
      this.loading = true;
      try {
        const response = await fetch('https://hammerhead-app-kva7n.ondigitalocean.app/Bacnet/api/get/all/east/latest/data');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        let textData = await response.text();
        textData = textData.replace(/ObjectId\("([^"]+)"\)/g, '"$1"');
        textData = textData.replace(/ISODate\("([^"]+)"\)/g, '"$1"');
        const data = JSON.parse(textData);
        const mappedData = Array.isArray(data) ? data.map(item => ({
          ...item,
          dateTime: this.adjustTimeZone(item.dateTime)
        })) : [];
        if (mappedData.length) this.latestData = mappedData;

        CacheManager.setItem('bms', this.latestData);
        this.updateLastUpdatedTime();
      } catch (error) {
        this.error = error.message;
        this.latestData = demoBmsData;
      } finally {
        this.loading = false;
      }
    },
    findLatestDataById(objectId) {
      const filteredData = this.latestData.filter(data => data.objectId === objectId);
      return filteredData.length > 0 ? filteredData[filteredData.length - 1] : {};
    },
    toggleGroupCommand(group, event) {
      const command = event.target.checked ? 0 : 1;
      group.group.forEach(id => {
        const data = this.findLatestDataById(id);
        if (data) {
          data.value = command;
        }
      });
    },
    getActiveValue(id) {
      const latestData = this.findLatestDataById(id);
      if (latestData.name && latestData.name.includes('Status')) {
        return latestData.value >= 1 ? 'On' : 'Off';
      } else if (latestData.name && latestData.name.includes('_GD')) {
        return latestData.value >= 1 ? 'Close' : 'Open';
      } else if (latestData.name && latestData.name.includes('_SD')) {
        return latestData.value >= 1 ? 'Close' : 'Open';
      }
      return 'Active';
    },
    getPresentValue(id) {
      const latestData = this.findLatestDataById(id);
      return latestData.value;
    },
    shouldShowStatus(name) {
      return name && (name.includes('Status') || name.includes('_GD') || name.includes('_SD'));
    },
    getStatusClass(status) {
      return status === 'OK' ? 'ok' : 'not-ok';
    },
    getActiveClass(id) {
      const activeValue = this.getActiveValue(id);
      return activeValue === 'On' || activeValue === 'Open' ? 'ok' : 'not-ok';
    },
    formatValue(value) {
      const numValue = Number(value);
      return isNaN(numValue) ? 'N/A' : numValue.toFixed(1);
    },
    formatDate(dateTime) {
      if (!dateTime) return 'N/A';
      const date = new Date(dateTime);
      date.setHours(date.getHours() + 8); // Adjust for timezone difference
      return date.toISOString().replace('T', ' ').substr(0, 19);
    },
    adjustTimeZone(dateTime) {
      const date = new Date(dateTime);
      date.setHours(date.getHours() + 8); // Adjust for timezone difference
      return date.toISOString();
    },
    getValue(sensorName) {
  const sensorData = this.latestData.find(data => data.name === sensorName);
  if (sensorData) {
    console.log(`Sensor ${sensorName} found with value: ${sensorData.value}`);
    
    // Special case for the sensor "NAE35-01/Field Bus MSTP1.FAC-6.AHU CHW-F"
    if (sensorName === "NAE35-01/Field Bus MSTP1.FAC-6.AHU CHW-F") {
      const numericValue = Number(sensorData.value);
      if (numericValue <= 0) {
        return "0.0";
      } else {
        return this.formatValue(sensorData.value);
      }
    }

    // For non-numeric command values, just return the value directly
    if (isNaN(Number(sensorData.value))) {
      return sensorData.value;
    }
    return `${this.formatValue(sensorData.value)}`;
  } else {
    // Define default values for command sensors if no data is available.
    const stopSensors = [
      "NCE-02/FCB.Local Application.CDWP-CMD",
      "NAE35-01/Field Bus MSTP1.FAC-6.AHU-CMD",
      "NCE-02/Programming.CHSEQ.SysCMD",
      "NCE-02/FCB.Local Application.CH-CMD",
      "NCE-02/FCB.Local Application.CT-CMD",
      "NCE-02/FCB.Local Application.CHWP-CMD"
    ];
    const offSensors = [
      "NAE35-01/Field Bus MSTP1.FAC-6.AHU-S",
      "NCE-02/FCB.Local Application.CDWP-S",
      "NCE-02/FCB.Local Application.CH-S",
      "NCE-02/FCB.Local Application.CT-S",
      "NCE-02/FCB.Local Application.CHWP-S"
    ];
    if (stopSensors.includes(sensorName)) {
      return "STOP";
    } else if (offSensors.includes(sensorName)) {
      return "OFF";
    } else {
      return 'N/A';
    }
  }
},
    isSlantedNegative(sensorName) {
      return [
        'NCE-02/FCB.Local Application.CHW FLOW RATE',
        'NCE-02/Programming.AGILENT.CH-CHWR-TP'
      ].includes(sensorName);
    },
    isSlantedPositive(sensorName) {
      return [
        'NCE-02/Programming.AGILENT.CH-CHWR-TP',
        'NCE-02/Programming.AGILENT.CH-CHWS-TP'
      ].includes(sensorName);
    },
    updateLastUpdatedTime() {
      const now = new Date();
      now.setHours(now.getHours() + 8); // Adjust for timezone difference
      this.lastUpdated = now.toISOString().replace('T', ' ').substr(0, 19);
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 70vh; /* Make the container fill the viewport height */
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}

.nav-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.nav-tabs .nav-item {
  margin-right: 5px;
}

.nav-tabs .nav-link {
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.nav-tabs .nav-link.active {
  background-color: #007bff;
  color: white;
}

.image-container {
  position: relative;
  width: 100%;
  /* Ensure the image container is 100% of the parent */
}

.background-image {
  width: 100%;
  height: auto;
  /* Maintain aspect ratio */
}

.sensor-value {
  position: absolute;
  padding: 5px;
  border-radius: 3px;
  font-weight: bold;
  transform: translate(-50%, -50%);
  /* Center the sensor value on the position */
  color: black;
}


.slantedNegative {
  transform: rotate(-20deg);
}

.slantedPositive {
  transform: rotate(20deg);
}

.group-sensors {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sensor-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.sensor-item {
  border: 1px solid lightgrey;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 18rem;
}

.status-label {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.375rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.ok {
  color: #fff;
  background-color: #28a745;
}

.not-ok {
  color: #fff;
  background-color: #dc3545;
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

.grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px;
}

.grid-item {
  border: 1px solid lightgrey;
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.last-updated {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.7);
  padding: 5px;
  border-radius: 3px;
  font-weight: bold;
}

.button-container {
  text-align: right;
  margin-bottom: 10px;
}

.btn-primary {
  display: inline-block;
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
  padding: 10px 15px;
  text-decoration: none;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #004085;
}

.dropdown-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

#month-year-dropdown {
  width: 300px;
  padding: 5px;
  border-radius: 5px;
  margin-top: 10px;
}

.btn-primary {
  margin-top: 15px;
}
</style>
