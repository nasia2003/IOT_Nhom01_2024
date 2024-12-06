const mqtt = require("mqtt");
const connection = require("../config/database"); // Đảm bảo đường dẫn đúng đến module cấu hình cơ sở dữ liệu

const options = {
  host: "localhost",
  port: 1883,
  username: "iot_01",
  password: "Nhom01IOT",
};

const client = mqtt.connect(options);

// MQTT client connection setup
client.on("connect", () => {
  console.log("Connected to MQTT broker, port 1883");

  // Subscribe to relevant topics
  const topics = [
    "home/sensors", // Sensor data
    "home/devices/den/status", // Led status
    "home/devices/quat/status", // Fan status
    "home/devices/dieuhoa/status", // Air Conditioner status
  ];

  topics.forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  });
});

// Xử lý sự kiện lỗi
client.on("error", (err) => {
  console.error("Connection error: ", err);
});

// Function to handle incoming MQTT messages
client.on("message", (topic, message) => {
  try {
    let data;
    if (topic === "home/sensors") {
      // Try parsing JSON data
      data = JSON.parse(message.toString());
      const now = new Date();

      // Save sensor data to the database
      const query =
        "INSERT INTO devices (humidity, temperature, light, fan_status, ac_temperature, time) VALUES (?, ?, ?, ?, ?, ?)";
      connection.query(
        query,
        [
          data.humidity,
          data.temperature,
          data.light,
          data.fan_status,
          data.ac_temperature,
          now,
        ],
        (err) => {
          if (err) {
            console.error("Database insert error:", err);
          } else {
            console.log("Sensor data inserted into database");
          }
        }
      );
    }
  } catch (error) {
    console.error("Failed to process message:", error);
  }
});
