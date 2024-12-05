from flask import Flask, request, jsonify
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import pandas as pd
import joblib
import os
from apscheduler.schedulers.background import BackgroundScheduler
import pymysql  # Thư viện kết nối MySQL
import datetime

# Khởi tạo Flask app
app = Flask(__name__)

# Đường dẫn lưu mô hình
AC_MODEL_PATH = "ac_model.pkl"
FAN_MODEL_PATH = "fan_model.pkl"

# Tải mô hình khi ứng dụng khởi động
ac_model = joblib.load(AC_MODEL_PATH) if os.path.exists(AC_MODEL_PATH) else None
fan_model = joblib.load(FAN_MODEL_PATH) if os.path.exists(FAN_MODEL_PATH) else None

# Cấu hình kết nối MySQL
MYSQL_CONFIG = {
    'host': 'localhost',  # Địa chỉ MySQL server
    'user': 'root',  # Tên người dùng MySQL
    'password': '1234',  # Mật khẩu MySQL
    'database': 'iot',  # Tên database
    'charset': 'utf8mb4'
}

# Hàm lấy dữ liệu từ MySQL
def get_training_data():
    try:
        # Kết nối tới MySQL
        connection = pymysql.connect(**MYSQL_CONFIG)
        query = """
        SELECT * FROM iot.devices
        WHERE time >= DATE_SUB(CURDATE(), INTERVAL 5 DAY);
        """
        data = pd.read_sql_query(query, connection)
        connection.close()

        # Kiểm tra dữ liệu
        if data.empty:
            raise ValueError("Không có dữ liệu trong 5 ngày gần đây.")
        return data
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu từ MySQL: {e}")
        return None

# Hàm tự động train lại mô hình
def retrain_models():
    global ac_model, fan_model
    try:
        print(f"[{datetime.datetime.now()}] Bắt đầu train lại mô hình...")

        # Lấy dữ liệu từ MySQL
        data = get_training_data()
        if data is None:
            print("Hủy việc train lại do không có dữ liệu.")
            return

        # Chuẩn bị dữ liệu
        X = data[['temperature', 'humidity']]
        y_ac = data['ac_temperature']
        y_fan = data['fan_status']

        # Chia tập train/test
        X_train_ac, _, y_train_ac, _ = train_test_split(X, y_ac, test_size=0.2, random_state=42)
        X_train_fan, _, y_train_fan, _ = train_test_split(X, y_fan, test_size=0.2, random_state=42)

        # Huấn luyện lại mô hình điều hòa
        new_ac_model = RandomForestRegressor(n_estimators=100, random_state=42)
        new_ac_model.fit(X_train_ac, y_train_ac)
        joblib.dump(new_ac_model, AC_MODEL_PATH)
        ac_model = new_ac_model  # Cập nhật mô hình trong ứng dụng

        # Huấn luyện lại mô hình quạt
        new_fan_model = RandomForestClassifier(n_estimators=100, random_state=42)
        new_fan_model.fit(X_train_fan, y_train_fan)
        joblib.dump(new_fan_model, FAN_MODEL_PATH)
        fan_model = new_fan_model  # Cập nhật mô hình trong ứng dụng

        print(f"[{datetime.datetime.now()}] Train lại mô hình hoàn tất.")
    except Exception as e:
        print(f"Lỗi khi train lại mô hình: {e}")

# Endpoint 1: Dự đoán nhiệt độ điều hòa
@app.route('/predict/ac', methods=['POST'])
def predict_ac():
    try:
        input_data = request.get_json()
        temperature = input_data['temperature']
        humidity = input_data['humidity']

        if not (20.0 <= temperature <= 35.0 and 30.0 <= humidity <= 90.0):
            return jsonify({"error": "Dữ liệu ngoài phạm vi cho phép"}), 400

        features = pd.DataFrame([[temperature, humidity]], columns=["temperature", "humidity"])
        predicted_temp = ac_model.predict(features)[0]

        return jsonify({
            "predicted_ac_temperature": round(predicted_temp, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint 2: Dự đoán trạng thái quạt
@app.route('/predict/fan', methods=['POST'])
def predict_fan():
    try:
        input_data = request.get_json()
        temperature = input_data['temperature']
        humidity = input_data['humidity']

        if not (20.0 <= temperature <= 30.0 and 30.0 <= humidity <= 70.0):
            return jsonify({"error": "Dữ liệu ngoài phạm vi cho phép"}), 400

        features = pd.DataFrame([[temperature, humidity]], columns=["temperature", "humidity"])
        predicted_status = fan_model.predict(features)[0]
        status = "on" if predicted_status == 1 else "off"

        return jsonify({
            "predicted_fan_status": status
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Chạy server
if __name__ == '__main__':
    app.run(debug=True)
    # Lập lịch tự động train lại sau mỗi 5 ngày
    scheduler = BackgroundScheduler()
    scheduler.add_job(retrain_models, 'interval', days=5)
    scheduler.start()
