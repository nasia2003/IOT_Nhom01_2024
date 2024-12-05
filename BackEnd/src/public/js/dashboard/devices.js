const options = {
  host: "localhost",
  port: 9001, // Thay đổi cổng thành 9001 nếu broker sử dụng cổng này cho WebSocket
  username: "iot_01",
  password: "Nhom01IOT",
  protocol: "ws", // Thêm dòng này để sử dụng WebSocket
};

let latestData;
const fanButtons = document.querySelectorAll(".fan-button");
const acButtons = document.querySelectorAll(".ac-button");
let currentTemp = 0;

// Sử dụng mqtt.connect với URL WebSocket
const client = mqtt.connect(`ws://${options.host}:${options.port}/mqtt`, {
  username: options.username,
  password: options.password,
});

// Xử lý sự kiện kết nối
client.on("connect", () => {
  console.log("Connected to MQTT broker, port 9001");
});

// Function to publish MQTT messages
function sendMQTTMessage(topic, message) {
  client.publish(topic, message, (err) => {
    if (err) {
      console.error("Publish error:", err);
    } else {
      console.log(`Message sent to ${topic}: ${message}`);
    }
  });
}

// Helper function to save the state to local storage
function saveStateToLocalStorage(device, state) {
  localStorage.setItem(device, state);
}

// Helper function to load the state from local storage
function loadStateFromLocalStorage(device) {
  return localStorage.getItem(device);
}

// Function to handle LED button clicks
function toggleLed(state) {
  const ledButtonOn = document.querySelector("#led-on");
  const ledButtonOff = document.querySelector("#led-off");
  const ledImg = document.getElementById("led");

  if (state === "on") {
    ledImg.src = "images/ledOn.png";
    ledButtonOn.classList.remove("active");
    ledButtonOff.classList.add("active");
    saveStateToLocalStorage("led", "on");
  } else {
    ledImg.src = "images/ledOff.png";
    ledButtonOff.classList.remove("active");
    ledButtonOn.classList.add("active");
    saveStateToLocalStorage("led", "off");
  }
}

// Function to handle Fan button clicks
function toggleFan(state) {
  // const fanButtonOn = document.querySelector("#fan-on");
  // const fanButtonOff = document.querySelector("#fan-off");
  const fanImg = document.getElementById("fan");

  fanButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Xóa class active khỏi tất cả các nút
      fanButtons.forEach((btn) => btn.classList.remove("active"));
      // Thêm class active cho nút được click
      button.classList.add("active");
    });
  });

  let now = "off";

  if (state === "auto") {
    const filteredData = {
      temperature: latestData.temperature,
      humidity: latestData.humidity,
    };

    fetch("http://127.0.0.1:5000/predict/fan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredData),
    })
      .then((response) => response.json())
      .then((data) => {
        now = data.predicted_fan_status; // Gán giá trị từ API vào biến now
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  } else {
    now = state;
  }

  if (now === "on") {
    fanImg.src = "images/fanOn.gif";
    // fanButtonOn.classList.remove("active");
    // fanButtonOff.classList.add("active");
    // saveStateToLocalStorage("fan", "on");
    sendMQTTMessage("home/devices/quat", "ON");
  } else {
    fanImg.src = "images/fanOff.png";
    // fanButtonOff.classList.remove("active");
    // fanButtonOn.classList.add("active");
    // saveStateToLocalStorage("fan", "off");
    sendMQTTMessage("home/devices/quat", "OFF");
  }
}

// Function to handle Air Conditioner button clicks
function toggleAC(state) {
  // const acButtonOn = document.querySelector("#ac-on");
  // const acButtonOff = document.querySelector("#ac-off");
  const acImg = document.getElementById("ac");

  acButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Xóa class active khỏi tất cả các nút
      acButtons.forEach((btn) => btn.classList.remove("active"));
      // Thêm class active cho nút được click
      button.classList.add("active");
    });
  });

  const acTempDiv = document.getElementById("ac-temp");

  let now = "off";

  if (state === "auto") {
    const filteredData = {
      temperature: latestData.temperature,
      humidity: latestData.humidity,
    };

    fetch("http://127.0.0.1:5000/predict/ac", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filteredData),
    })
      .then((response) => response.json())
      .then((data) => {
        now = "on";
        currentTemp = data.predicted_ac_temperature;
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  } else {
    now = state;
  }

  if (now === "on") {
    acImg.src = "images/acOn.gif";
    acTempDiv.style.display = "block";
    if (currentTemp == 0) currentTemp = 25;
    updateTemperatureDisplay();
    // acButtonOn.classList.remove("active");
    // acButtonOff.classList.add("active");
    // saveStateToLocalStorage("ac", "on");
  } else {
    acImg.src = "images/acOff.png";
    acTempDiv.style.display = "none";
    // acButtonOff.classList.remove("active");
    // acButtonOn.classList.add("active");
    // saveStateToLocalStorage("ac", "off");
    currentTemp = 0;
  }
  sendMQTTMessage("home/devices/dieuhoa", String(currentTemp));
}

// Update functions for the state restoration
// function restoreDeviceState() {
//   const fanState = loadStateFromLocalStorage("fan");
//   toggleFan(fanState === "on" ? "on" : "off");

//   const acState = loadStateFromLocalStorage("ac");
//   toggleAC(acState === "on" ? "on" : "off");
// }

// Call the restore function when the page loads
// window.onload = restoreDeviceState;

// Function to update colors based on values
function updateColor(elementId, value, minValue, maxValue, baseHue) {
  const element = document.getElementById(elementId);

  if (value < minValue) {
    element.style.backgroundColor = `hsl(${baseHue}, 100%, 30%)`; // Màu tối hơn cho giá trị thấp
  } else if (value > maxValue) {
    element.style.backgroundColor = `hsl(${baseHue}, 100%, 80%)`; // Màu sáng hơn cho giá trị cao
  } else {
    const percentage = (value - minValue) / (maxValue - minValue);
    const lightness = 30 + percentage * 50; // Điều chỉnh độ sáng từ 30% (tối) đến 80% (sáng)
    element.style.backgroundColor = `hsl(${baseHue}, 100%, ${lightness}%)`;
  }
}

// Thêm sự kiện cho nút tăng/giảm nhiệt độ
document.getElementById("increase-temp").addEventListener("click", () => {
  if (currentTemp < 30) {
    // Giới hạn tối đa 30°C
    currentTemp++;
    updateTemperatureDisplay();
    sendMQTTMessage("home/devices/dieuhoa", `SET_TEMP_${currentTemp}`);
  }
});

document.getElementById("decrease-temp").addEventListener("click", () => {
  if (currentTemp > 16) {
    // Giới hạn tối thiểu 16°C
    currentTemp--;
    updateTemperatureDisplay();
    sendMQTTMessage("home/devices/dieuhoa", `SET_TEMP_${currentTemp}`);
  }
});

function updateTemperatureDisplay() {
  const acTempValue = document.getElementById("ac-temp-value");
  acTempValue.textContent = currentTemp;
}

async function fetchDataAndUpdateUI() {
  try {
    const response = await fetch("/api");
    const data = await response.json();

    latestData = data[data.length - 1];

    document.getElementById(
      "nhietdo"
    ).textContent = `${latestData.temperature}ºC`;
    document.getElementById("doam").textContent = `${latestData.humidity}%`;
    toggleLed(latestData.light == 1 ? "on" : "off");

    // Base hues: Red for temperature, Green for humidity, Yellow for light
    updateColor("tp", latestData.temperature, 0, 45, 0); // Red
    updateColor("hm", latestData.humidity, 30, 70, 240); // Green
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Call fetchDataAndUpdateUI every 5 seconds to update the UI
setInterval(fetchDataAndUpdateUI, 5000);

// Call it initially when the page loads
window.addEventListener("load", fetchDataAndUpdateUI);
