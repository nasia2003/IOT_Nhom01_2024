#include <DHT.h>
#include <WiFi.h> 
#include <PubSubClient.h>
#include <string> 

#define DHTPIN 4       // Chuyển chân DHT sang một GPIO khác, ví dụ GPIO15
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

const int led = 25;    // Chuyển relay sang GPIO13 hoặc chân khác có thể output
const int pirIn = 27;    // GPIO35 - input only
const int pirOut = 26;   // GPIO34 - input only
const int AC = 23;  
const int fan = 32;  
int entered = 0;
String fan_status = "OFF";
int ac_temperature = 0;

int segmentPins[] = {5, 18, 19, 21, 22, 23, 13}; // Chân a, b, c, d, e, f, g
int digitPins[] = {15, 2};                // Chân D1, D2 (2 số đầu)

byte digitMap[10] = {
    0b00111111, // Số 0
    0b00000110, // Số 1
    0b01011011, // Số 2
    0b01001111, // Số 3
    0b01100110, // Số 4
    0b01101101, // Số 5
    0b01111101, // Số 6
    0b00000111, // Số 7
    0b01111111, // Số 8
    0b01101111  // Số 9
};

const char* ssid = "Dung";        // Tên WiFi
const char* password = "Dung301120033";        // Mật khẩu WiFi
const char* mqtt_server = "192.168.1.34";    // Địa chỉ IP của MQTT broker 
const char* mqtt_username = "iot";     // Tên đăng nhập MQTT
const char* mqtt_password = "1234";            // Mật khẩu MQTT

// Khởi tạo đối tượng để kết nối WiFi và MQTT
WiFiClient espClient;                         // Tạo client WiFi
PubSubClient client(espClient);

void setup_wifi()
{
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // Lặp cho đến khi kết nối thành công
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Thử kết nối với MQTT broker
    if (client.connect("ESP8266Client", mqtt_username, mqtt_password)) {
      Serial.println("connected");
      // Subscribe vào các topic cần thiết
      client.subscribe("home/devices/den");      // Topic điều khiển đèn
      client.subscribe("home/devices/quat");     // Topic điều khiển quạt
      client.subscribe("home/devices/dieuhoa");  // Topic điều khiển điều hòa
    } else {
      // Nếu kết nối thất bại
      Serial.print("failed, rc=");
      Serial.print(client.state());             // In ra mã lỗi
      Serial.println(" try again in 5 seconds");
      delay(5000);                              // Đợi 5 giây trước khi thử lại
    }
  }
}

#include <string>  // Đảm bảo rằng bạn đã bao gồm thư viện string

void callback(char* topic, byte* payload, unsigned int length)
{
  String message;
  for (int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(" | Message: ");
  Serial.println(message);

  // Xử lý điều khiển quạt
  if (strcmp(topic, "home/devices/quat") == 0) {
    if (message == "ON") {
      fan_status = "ON";
      digitalWrite(fan, HIGH);                       // Bật quạt
      client.publish("home/devices/quat/status", "ON");    // Gửi trạng thái
      Serial.println("Fan turned ON");
    } else if (message == "OFF") {
      fan_status = "OFF";
      digitalWrite(fan, LOW);                       // Tắt quạt
      client.publish("home/devices/quat/status", "OFF");   // Gửi trạng thái
      Serial.println("Fan turned OFF");
    }
  }

  // Xử lý điều khiển điều hòa
  if (strcmp(topic, "home/devices/dieuhoa") == 0) {
    // Chuyển đổi String sang std::string
    std::string std_message = message.c_str();  // Chuyển String thành std::string

    // Dùng std::stoi để chuyển đổi std::string thành số nguyên
    ac_temperature = std::stoi(std_message);
    if (ac_temperature > 0) {
      digitalWrite(AC, HIGH);                         // Bật điều hòa
      client.publish("home/devices/dieuhoa/status", "ON");   // Gửi trạng thái
      Serial.println("Air conditioner turned ON");
    } else {
      digitalWrite(AC, LOW);                         // Tắt điều hòa
      client.publish("home/devices/dieuhoa/status", "OFF");  // Gửi trạng thái
      Serial.println("Air conditioner turned OFF");
    }
  }
}

void setup()
{
  Serial.begin(115200);
  Serial.println("Start.....");
  
  // Kết nối WiFi
  setup_wifi();

  WiFiClient testClient;
  if (testClient.connect("192.168.1.34", 1883)) {
    Serial.println("Broker is reachable!");
    testClient.stop();
  } else {
    Serial.println("Cannot reach broker. Check IP or port.");
  }

  client.setServer(mqtt_server, 1883);    // Cấu hình MQTT broker và port
  client.setCallback(callback);
  dht.begin();

  pinMode(AC, OUTPUT);
  pinMode(fan, OUTPUT);
  pinMode(led, OUTPUT);
  pinMode(pirIn, INPUT);
  pinMode(pirOut, INPUT);
  for (int i = 0; i < 7; i++) {
    pinMode(segmentPins[i], OUTPUT);
  }
  for (int i = 0; i < 2; i++) { // Chỉ dùng D1 và D2
    pinMode(digitPins[i], OUTPUT);
  }
}

void displayDigit(int digit, int num) {
  // Tắt tất cả chữ số trước khi bật chữ số mới
  for (int i = 0; i < 2; i++) { 
    digitalWrite(digitPins[i], HIGH); 
  }
  
  // Bật chữ số được chọn
  digitalWrite(digitPins[digit], LOW);
  
  // Hiển thị số bằng cách bật/tắt các đoạn
  for (int i = 0; i < 7; i++) {
    digitalWrite(segmentPins[i], digitMap[num] & (1 << i));
  }
}

// Định nghĩa các mảng previousMillis và interval cho các cảm biến và dữ liệu
unsigned long previousMillis[4];  // Mảng lưu thời gian cho các cảm biến và payload
long interval[4] = {1500, 1500, 5, 2000};  // Mảng interval cho từng tác vụ

// Định nghĩa các chỉ số cho từng mảng previousMillis và interval
const int pirInIndex = 0;
const int pirOutIndex = 1;
const int ledDisplayIndex = 2;
const int payloadIndex = 3;

void loop() {
  unsigned long currentMillis = millis();  // Lấy thời gian hiện tại

  // Kiểm tra thời gian đã đủ để xử lý pirIn (1.5s)
  if (currentMillis - previousMillis[pirInIndex] >= interval[pirInIndex]) {
    // Kiểm tra nếu cảm biến pirIn phát hiện chuyển động
    if (digitalRead(pirIn) == HIGH) {
      entered++;
      Serial.print("In: ");
      Serial.println(entered);
      previousMillis[pirInIndex] = currentMillis;  // Cập nhật thời gian cho pirIn
    }
  }

  // Kiểm tra thời gian đã đủ để xử lý pirOut (1s)
  if (currentMillis - previousMillis[pirOutIndex] >= interval[pirOutIndex]) {
    // Kiểm tra nếu cảm biến pirOut phát hiện chuyển động
    if (digitalRead(pirOut) == HIGH) {
      if (entered > 0) {
        entered--;
        Serial.print("Out: ");
        Serial.println(entered);
      }
      previousMillis[pirOutIndex] = currentMillis;  // Cập nhật thời gian cho pirOut
    }
  }

  // Điều khiển LED 4 số
  int Light = entered > 0;
  digitalWrite(led, Light ? HIGH : LOW);

  // Kiểm tra thời gian đã đủ để gửi payload (2s)
  if (currentMillis - previousMillis[payloadIndex] >= interval[payloadIndex]) {
    // Đọc dữ liệu từ các cảm biến
    float humidity = dht.readHumidity();            // Đọc độ ẩm
    float temperature = dht.readTemperature();      // Đọc nhiệt độ

    // Kiểm tra lỗi đọc cảm biến
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // Tạo chuỗi JSON để gửi dữ liệu
    String payload = "{";
    payload += "\"light\":" + String(Light);
    payload += ",\"humidity\":" + String(humidity);
    payload += ",\"temperature\":" + String(temperature);
    payload += ",\"fan_status\":" + String(fan_status);  // Thêm trạng thái quạt
    payload += ",\"ac_temperature\":" + String(ac_temperature);  // Thêm nhiệt độ điều hòa
    payload += "}";

    // Gửi dữ liệu lên MQTT broker
    client.publish("home/sensors", payload.c_str());
    Serial.print("Published data: ");
    Serial.println(payload);

    previousMillis[payloadIndex] = currentMillis;  // Cập nhật thời gian gửi payload
  }

  // Hiển thị LED 4 số
  int digit1 = ac_temperature / 10;  // Chữ số đầu tiên
  int digit2 = ac_temperature % 10;  // Chữ số thứ hai

  // Kiểm tra sự lệch thời gian trước khi hiển thị lại
  if (currentMillis - previousMillis[ledDisplayIndex] >= interval[ledDisplayIndex]) {
    // Hiển thị chữ số đầu tiên (D1)
    displayDigit(1, digit1);
    delay(5);  // Khoảng trống ngắn giữa việc hiển thị chữ số đầu tiên và thứ hai

    // Hiển thị chữ số thứ hai (D2)
    displayDigit(0, digit2);
    delay(5);

    // Cập nhật thời gian cho LED Display
    previousMillis[ledDisplayIndex] = currentMillis;  // Cập nhật thời gian cho LED Display
  }

  // Cập nhật thời gian cho LED Display (hoặc có thể sử dụng mảng nếu cần)
  previousMillis[ledDisplayIndex] = currentMillis;  // Cập nhật thời gian cho LED Display
}

