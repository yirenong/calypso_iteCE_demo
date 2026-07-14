<template>
  <div class="container">
    <h2 class="text-center mb-4">Smart Washroom [B05]</h2>

    <!-- First Row: Sensor Data and Chart -->
    <div class="row">
      <!-- Sensor Data Section -->
      <div class="col-lg-6 section-container">
        <h3 class="section-title">Sensor Data</h3>
        <div class="row justify-content-center">
          <div class="col-lg-4 sensor-box">
            <h4 class="text-center"><u>Male Toilet</u></h4>
            <p><b>Occupancy:</b> {{ maleToiletData.occupancy }} pax</p>
            <p><b>Ammonium:</b> {{ maleToiletData.nh3 }} ppm</p>
            <p><b>Hydrogen Sulfide:</b> {{ maleToiletData.h2s }} ppm</p>
            <p><b>Temperature:</b> {{ femaleToiletData.temperature }}°C</p>
            <p><b>Humidity:</b> {{ femaleToiletData.humidity }}%</p>
          </div>
          <div class="col-lg-4 sensor-box">
            <h4 class="text-center"><u>Female Toilet</u></h4>
            <p><b>Occupancy:</b> {{ femaleToiletData.occupancy }} pax</p>
            <p><b>Ammonium:</b> {{ femaleToiletData.nh3 }} ppm</p>
            <p><b>Hydrogen Sulfide:</b> {{ femaleToiletData.h2s }} ppm</p>
            <p><b>Temperature:</b> {{ maleToiletData.temperature }}°C</p>
            <p><b>Humidity:</b> {{ maleToiletData.humidity }}%</p>
          </div>
        </div>
      </div>

      <!-- Chart Section -->
      <div class="col-lg-6 section-container chart-container" style="width: 48%;">
        <div class="chart-box">
          <h3 class="section-title">Daily Water Consumption</h3>
          <canvas id="kwhChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Second Row: Floorplan and Sensor Icons -->
    <div class="row mt-4">
      <div class="col-lg-12 section-container">
        <h3 class="section-title">Room Layout</h3>
        <div class="floorplan-container position-relative">
          <img :src="floorplanImage" alt="Floorplan for B05-13/14" class="floorplan-image" />

          <!-- Loop through icons to display them on the floorplan -->
          <div v-for="(icon, index) in icons" :key="index" class="icon-container"
            :style="{ top: icon.top, left: icon.left }" @mouseenter="showValue(index, $event)"
            @mouseleave="hideValue">
            <img :src="icon.src" alt="Sensor Icon" class="icon-image" />

            <!-- Tooltip that appears on hover -->
            <div v-if="hoveredIndex === index" class="value-tooltip"
              :style="{ top: `${tooltipY}px`, left: `${tooltipX}px` }">
              <h5>{{ icon.label }}</h5>
              <template v-if="icon.type === 'People Counter'">
                <p>Period In: {{ icon.periodIn }}</p>
                <p>Period Out: {{ icon.periodOut }}</p>
              </template>
              <template v-else-if="icon.type === 'Odor Sensor'">
                <p>Battery: {{ icon.battery }}%</p>
                <p>Ammonia Level: {{ icon.nh3 }} ppm</p>
                <p>Hydrogen Sulfide Level: {{ icon.h2s }} ppm</p>
                <p>Temperature: {{ icon.temperature }}°C</p>
                <p>Humidity: {{ icon.humidity }}%</p>
              </template>
              <!-- Water Meter tooltip using your provided snippet -->
              <template v-else-if="icon.type === 'Water Meter'">
                <p v-if="icon.dailyUsage && icon.dailyUsage.length > 0">
                  Daily Usage (Past 7 days):
                  {{ Math.min(...icon.dailyUsage.map(item => item.usage)).toFixed(2) }} m³ -
                  {{ Math.max(...icon.dailyUsage.map(item => item.usage)).toFixed(2) }} m³
                </p>
                <p v-else>No data available</p>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import peopleCounterIcon from '@/assets/peopleCounter.png';
import odorIcon from '@/assets/Odor.png';
import waterMeterIcon from '@/assets/water-meter-sensor.png';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

const demoWashroomUsage = [
  { date: '2026-07-08', usage: 6.20 },
  { date: '2026-07-09', usage: 5.85 },
  { date: '2026-07-10', usage: 6.40 },
  { date: '2026-07-11', usage: 7.05 },
  { date: '2026-07-12', usage: 6.80 },
  { date: '2026-07-13', usage: 5.90 },
  { date: '2026-07-14', usage: 6.55 },
];

export default {
  name: 'B05Washroom',
  data() {
    return {
      maleToiletData: {
        occupancy: 7,
        nh3: 2.1,
        h2s: 0.4,
        temperature: 24.6,
        humidity: 61
      },
      femaleToiletData: {
        occupancy: 6,
        nh3: 1.8,
        h2s: 0.3,
        temperature: 24.2,
        humidity: 59
      },
      floorplanImage: require('@/assets/Sub System and Icons/V2/smart washroom_full1.png'),
      icons: [
        { top: '51%', left: '66%', src: peopleCounterIcon, label: 'Female People Counter', type: 'People Counter', devEUI: '24e124716d496118', periodIn: 48, periodOut: 42 },
        { top: '40.6%', left: '44%', src: peopleCounterIcon, label: 'Male People Counter', type: 'People Counter', devEUI: '24e124716d496395', periodIn: 44, periodOut: 37 },
        { top: '37.6%', left: '64.7%', src: odorIcon, label: 'Female Odor Sensor', type: 'Odor Sensor', devEUI: '24e124798d482365', battery: 92, nh3: 1.8, h2s: 0.3, temperature: 24.2, humidity: 59 },
        { top: '36%', left: '18%', src: odorIcon, label: 'Male Odor Sensor', type: 'Odor Sensor', devEUI: '24e124798d482591', battery: 87, nh3: 2.1, h2s: 0.4, temperature: 24.6, humidity: 61 },
        { top: '46%', left: '51.5%', src: waterMeterIcon, label: 'Water Meter', type: 'Water Meter', dailyUsage: demoWashroomUsage }
      ],
      hoveredIndex: null,
      tooltipX: 0,
      tooltipY: 0,
      chartLabels: demoWashroomUsage.map(item => item.date.split('-').reverse().join('/')),
      chartData: demoWashroomUsage.map(item => item.usage),
      chartInstance: null
    };
  },
  methods: {
    showValue(index, event) {
      const containerRect = event.currentTarget.getBoundingClientRect();
      const pointRect = event.target.getBoundingClientRect();
      this.tooltipX = pointRect.x + pointRect.width / 2 - containerRect.x;
      this.tooltipY = pointRect.y - containerRect.y - 10;
      this.hoveredIndex = index;
    },
    hideValue() {
      this.hoveredIndex = null;
    },
    async fetchSensorData() {
      // Implement sensor API calls here if needed.
    },
    async fetchPeopleData() {
      try {
        const response = await axios.get(
          '/api/lorawan/data/latest/People',
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        const peopleDataArray = response.data;
        console.log("People API Data:", peopleDataArray);

        const femaleSensor = peopleDataArray.find(
          sensor => sensor.devEUI === "24e124716d496395"
        );
        const maleSensor = peopleDataArray.find(
          sensor => sensor.devEUI === "24e124716d496118"
        );

        if (femaleSensor && femaleSensor.data) {
          const periodIn = parseInt(femaleSensor.data.period_in, 10) || 0;
          const periodOut = parseInt(femaleSensor.data.period_out, 10) || 0;
          this.femaleToiletData.occupancy = periodIn - periodOut;
        } else {
          this.femaleToiletData.occupancy = 0;
        }

        if (maleSensor && maleSensor.data) {
          const periodIn = parseInt(maleSensor.data.period_in, 10) || 0;
          const periodOut = parseInt(maleSensor.data.period_out, 10) || 0;
          this.maleToiletData.occupancy = periodIn - periodOut;
        } else {
          this.maleToiletData.occupancy = 0;
        }

        // Update People Counter icons
        const updatedPeopleData = {
          '24e124716d496118': maleSensor ? maleSensor.data : {},
          '24e124716d496395': femaleSensor ? femaleSensor.data : {}
        };
        this.updateIcons(updatedPeopleData);
      } catch (error) {
        console.error("Error fetching people data:", error);
      }
    },
    async fetchOdorData() {
      try {
        const response = await axios.get(
          '/api/lorawan/data/latest/Odor',
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        const odorDataArray = response.data;
        console.log("Odor Sensor Data:", odorDataArray);

        const femaleToiletOdorSensor = odorDataArray.find(
          sensor => sensor.devEUI === "24e124798d482591"
        );
        const maleToiletOdorSensor = odorDataArray.find(
          sensor => sensor.devEUI === "24e124798d482365"
        );

        this.femaleToiletData = {
          occupancy: 0,
          nh3: femaleToiletOdorSensor && femaleToiletOdorSensor.data ? femaleToiletOdorSensor.data.nh3 || 0 : 0,
          h2s: femaleToiletOdorSensor && femaleToiletOdorSensor.data ? femaleToiletOdorSensor.data.h2s || 0 : 0,
          temperature: femaleToiletOdorSensor && femaleToiletOdorSensor.data ? femaleToiletOdorSensor.data.temperature || 0 : 0,
          humidity: femaleToiletOdorSensor && femaleToiletOdorSensor.data ? femaleToiletOdorSensor.data.humidity || 0 : 0,
        };

        this.maleToiletData = {
          occupancy: 0,
          nh3: maleToiletOdorSensor && maleToiletOdorSensor.data ? maleToiletOdorSensor.data.nh3 || 0 : 0,
          h2s: maleToiletOdorSensor && maleToiletOdorSensor.data ? maleToiletOdorSensor.data.h2s || 0 : 0,
          temperature: maleToiletOdorSensor && maleToiletOdorSensor.data ? maleToiletOdorSensor.data.temperature || 0 : 0,
          humidity: maleToiletOdorSensor && maleToiletOdorSensor.data ? maleToiletOdorSensor.data.humidity || 0 : 0,
        };

        const odorMapping = {
          '24e124798d482591': (femaleToiletOdorSensor && femaleToiletOdorSensor.data) || {},
          '24e124798d482365': (maleToiletOdorSensor && maleToiletOdorSensor.data) || {}
        };

        this.updateIcons(odorMapping);
      } catch (error) {
        console.error("Error fetching odor data:", error);
      }
    },
    updateIcons(data) {
      this.icons.forEach(icon => {
        if (icon.type === 'People Counter') {
          if (icon.devEUI === '24e124716d496395') {
            const deviceData = data['24e124716d496395'];
            if (deviceData) {
              icon.periodIn = deviceData.period_in;
              icon.periodOut = deviceData.period_out;
            }
          } else if (icon.devEUI === '24e124716d496118') {
            const deviceData = data['24e124716d496118'];
            if (deviceData) {
              icon.periodIn = deviceData.period_in;
              icon.periodOut = deviceData.period_out;
            }
          }
        } else if (icon.type === 'Odor Sensor') {
          if (icon.devEUI === '24e124798d482591') {
            const deviceData = data['24e124798d482591'];
            if (deviceData) {
              icon.battery = deviceData.battery || 0;
              icon.nh3 = deviceData.nh3 || 0;
              icon.h2s = deviceData.h2s || 0;
              icon.temperature = deviceData.temperature || 0;
              icon.humidity = deviceData.humidity || 0;
            }
          } else if (icon.devEUI === '24e124798d482365') {
            const deviceData = data['24e124798d482365'];
            if (deviceData) {
              icon.battery = deviceData.battery || 0;
              icon.nh3 = deviceData.nh3 || 0;
              icon.h2s = deviceData.h2s || 0;
              icon.temperature = deviceData.temperature || 0;
              icon.humidity = deviceData.humidity || 0;
            }
          }
        }
      });
    },
    async fetchWaterMeterData() {
      try {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        const start_date_str = startDate.toISOString();
        const end_date_str = endDate.toISOString();
        const url = `/api/lorawan/data/history/WaterMeter?start_date=${start_date_str}&end_date=${end_date_str}`;
        console.log("Fetching water meter history from:", url);
        const response = await axios.get(url, { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const historyData = response.data;
        console.log("Water Meter History Data:", historyData);

        let groupedReadings = {};
        historyData.forEach(item => {
          if (item.data && item.data.datas) {
            item.data.datas.forEach(reading => {
              const postDate = reading.postDate;
              const dateKey = postDate.split(" ")[0];
              if (!groupedReadings[dateKey] || new Date(reading.postDate) > new Date(groupedReadings[dateKey].postDate)) {
                groupedReadings[dateKey] = reading;
              }
            });
          }
        });

        let expectedDates = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          expectedDates.push(`${year}-${month}-${day}`);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log("Expected Dates:", expectedDates);

        let readingsArray = expectedDates.map(date => {
          if (groupedReadings[date]) {
            return { date: date, reading: parseFloat(groupedReadings[date].dispNum) };
          } else {
            return { date: date, reading: null };
          }
        });

        for (let i = 0; i < readingsArray.length; i++) {
          if (readingsArray[i].reading === null) {
            readingsArray[i].reading = i > 0 ? readingsArray[i - 1].reading : 0;
          }
        }
        console.log("Completed Readings Array:", readingsArray);

        let dailyUsage = [];
        for (let i = 1; i < readingsArray.length; i++) {
          dailyUsage.push({
            date: readingsArray[i].date,
            usage: readingsArray[i].reading - readingsArray[i - 1].reading
          });
        }
        console.log("Calculated Daily Usage:", dailyUsage);

        // Update the water meter icon's dailyUsage property
        const waterMeterIcon = this.icons.find(icon => icon.type === 'Water Meter');
        if (waterMeterIcon) {
          waterMeterIcon.dailyUsage = dailyUsage;
        }
      } catch (error) {
        console.error("Error fetching water meter data:", error);
      }
    },
    generateChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      const canvas = document.getElementById('kwhChart');
      if (!canvas) return;
      const existingChart = Chart.getChart(canvas);
      if (existingChart) existingChart.destroy();
      const ctx = canvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.chartLabels,
          datasets: [
            {
              label: 'Water Consumption (m³)',
              data: this.chartData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              pointBackgroundColor: '#fff',
              pointRadius: 5,
              borderWidth: 3,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: 'white' }
            },
            title: {
              display: true,
              text: 'Daily Water Consumption (Past 7 days)',
              color: 'white'
            },
            tooltip: {
              titleColor: 'white',
              bodyColor: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Date', color: 'white' },
              ticks: { color: 'white' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
              title: { display: true, text: 'm³', color: 'white' },
              ticks: { color: 'white' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });
    },
    fetchChartData() {
      // Use the water meter icon's dailyUsage data to build chart labels and dataset
      const waterMeterIcon = this.icons.find(icon => icon.type === 'Water Meter');
      if (waterMeterIcon && waterMeterIcon.dailyUsage) {
        this.chartLabels = waterMeterIcon.dailyUsage.map(item => {
          const parts = item.date.split("-");
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        });
        this.chartData = waterMeterIcon.dailyUsage.map(item => item.usage);
        this.generateChart();
      }
    }
  },
  mounted() {
    this.generateChart();
  }
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
    background-color: rgba(255, 255, 255, 0.1);
    margin-right: 1%;
}

.section-title {
    text-align: center;
    margin-bottom: 20px;
    color: white;
    font-weight: bold;
}

/* Floorplan and Icons */
.floorplan-container {
    position: relative;
}

.floorplan-image {
    width: 100%;
    height: auto;
    border-radius: 5px;
}

.icon-container {
    position: absolute;
    width: 24px;
    height: 24px;
    transform: translate(-50%, -50%);
    cursor: pointer;
}

.icon-image {
    width: 100%;
    height: 100%;
    visibility: hidden;
}

.value-tooltip {
    position: absolute;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px;
    border-radius: 5px;
    white-space: nowrap;
    font-size: 0.9rem;
    text-align: center;
}

.chart-box {
    height: 300px;
    width: 100%;
}

.sensor-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 10%;
}

.sensor-box {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 15px;
    text-align: center;
    margin-left: 2%;
    margin-bottom: 5%;
}

.face-indicator {
    display: flex;
    justify-content: center;
    margin-top: 10px;
}

.face-icon {
    font-size: 1.5rem;
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

.fas.fa-smile {
    color: #90ee90;
    /* Light green */
}

.chart-container {
  position: relative;
  height: 400px; /* adjust as needed */
}
</style>
