<template>
    <div class="container">
      <h2 class="text-center mb-4">PPVC TRAINING ROOM</h2>
  
      <!-- First Row: Sensor Data and Chart -->
      <div class="row">
        <!-- Sensor Data Section -->
        <div class="col-lg-6 section-container">
          <h3 class="section-title">Sensor Data</h3>
          <div class="sensor-grid">
            <div v-for="sensor in sensorData" :key="sensor.label" class="sensor-reading">
              <span>{{ sensor.label }}</span><strong>{{ sensor.value }} {{ sensor.unit }}</strong>
            </div>
          </div>
        </div>
  
        <!-- Chart Section -->
        <div class="col-lg-6 section-container chart-container">
          <div class="chart-box">
            <h3 class="section-title">KWH Daily Consumption</h3>
            <canvas id="kwhChart"></canvas>
          </div>
        </div>
      </div>
  
      <!-- Second Row: Floorplan and Console Control -->
      <div class="row mt-4">
        <!-- Floorplan Section - 80% width -->
        <div class="col-lg-8 section-container">
          <h3 class="section-title">Room Layout</h3>
          <div class="floorplan-container">
            <div class="floorplan-image-container">
              <img :src="floorplanImage" alt="Floorplan for B05-13/14" class="floorplan-image" />
            </div>
          </div>
        </div>
  
        <!-- Console Control Section - 20% width -->
        <div class="col-lg-4 section-container">
          <h3 class="section-title">Console Control</h3>
          <div class="console-box">
            <div v-for="control in controls" :key="control.name" class="control-row">
              <span>{{ control.name }}</span>
              <span :class="control.isOn ? 'control-on' : 'control-off'">{{ control.isOn ? 'ON' : 'OFF' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  
  export default {
    data() {
      return {
        floorplanImage: require('@/assets/Sub System and Icons/V2/PPVC Training Zone.png'), // Replace with your correct image path
        sensorData: [
          { label: 'Room Temperature', value: 24.3, unit: '°C' },
          { label: 'Relative Humidity', value: 58, unit: '%' },
          { label: 'CO₂', value: 512, unit: 'ppm' },
          { label: 'PM2.5', value: 9, unit: 'µg/m³' },
          { label: 'Occupancy', value: 18, unit: 'pax' },
          { label: 'Illuminance', value: 465, unit: 'lux' },
        ],
        controls: [
          { name: 'Fresh Air Fan', isOn: true },
          { name: 'Training Lights', isOn: false },
          { name: 'Air Conditioning', isOn: true },
          { name: 'Extraction Fan', isOn: false },
        ],
      };
    },
    methods: {
      generateChart() {
        // Registering the required components
        Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);
  
        const ctx = document.getElementById('kwhChart').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), // 0:00 to 23:00 for 24-hour data
            datasets: [
              {
                label: 'KWH Consumption',
                data: [30, 35, 32, 40, 42, 39, 50, 55, 52, 60, 62, 65, 66, 67, 64, 63, 70, 75, 72, 80, 82, 85, 87, 90], // Example 24-hour data
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'KWH',
                  color: 'white',
                },
                ticks: {
                  color: 'white',
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
              },
              x: {
                title: {
                  display: true,
                  text: 'Hour (0-24)',
                  color: 'white',
                },
                ticks: {
                  color: 'white',
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  color: 'white',
                },
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleColor: 'white',
                bodyColor: 'white',
              },
            },
          },
        });
      },
    },
    mounted() {
      this.generateChart(); // Generate the KWH consumption chart
    },
  };
  </script>
  
  <style scoped>
.sensor-grid h4{
    text-align:center;
}
.sensor-reading, .control-row { display:flex; justify-content:space-between; padding:10px 12px; margin:8px 0; background:rgba(255,255,255,.1); border-radius:6px; }
.control-on { color:#5ee47b; font-weight:700; }
.control-off { color:#ff7b7b; font-weight:700; }
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
    /* display: grid; */
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .sensor-box {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 15px;
    text-align: center;
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
    padding: 10px;
    display: flex;
    justify-content: center;
  }
  
  .floorplan-image {
    width: 100%;
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
  }
  
  .section-container {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    padding: 20px;
    margin-bottom: 30px;
    flex: 1;
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
  </style>
  
