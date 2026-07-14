const net = require('net');
const WebSocket = require('ws');

const MQTT_BROKER_HOST = '152.42.161.80';
const MQTT_BROKER_PORT = 1883;
const WS_PORT = 9001; // This is the WebSocket port for your proxy

const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`WebSocket proxy server started on port ${WS_PORT}`);
});

wss.on('connection', function (ws) {
  // Connect to your MQTT broker using TCP
  const tcpClient = net.connect(MQTT_BROKER_PORT, MQTT_BROKER_HOST, () => {
    console.log('Proxy connected to MQTT broker');
  });

  // When data comes from the WebSocket, forward it to the MQTT broker
  ws.on('message', function (data) {
    if (Buffer.isBuffer(data)) {
      tcpClient.write(data);
    } else if (data instanceof ArrayBuffer) {
      tcpClient.write(Buffer.from(data));
    } else {
      // If it’s a string (unlikely for MQTT binary data), convert it
      tcpClient.write(Buffer.from(data));
    }
  });

  // When data comes from the MQTT broker, send it back to the WebSocket client
  tcpClient.on('data', function (data) {
    ws.send(data);
  });

  // Clean up on close
  ws.on('close', function () {
    tcpClient.end();
    console.log('WebSocket client disconnected, MQTT client closed');
  });
  tcpClient.on('close', function () {
    ws.close();
  });

  // Error handling
  ws.on('error', (err) => console.error('WebSocket error:', err));
  tcpClient.on('error', (err) => console.error('TCP error:', err));
});
