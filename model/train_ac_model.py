import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from random import uniform

# Hàm tạo dữ liệu giả lập
def generate_data(num_samples):
    data = []
    for _ in range(num_samples):
        temperature = uniform(20.0, 35.0)  # Nhiệt độ từ 20 đến 35
        humidity = uniform(30.0, 90.0)    # Độ ẩm từ 30% đến 90%
        if temperature > 25.0 and humidity > 50.0:
            ac_status = 1
            ac_set_temperature = uniform(18.0, 24.0)
        else:
            ac_status = 0
            ac_set_temperature = 0
        data.append((temperature, humidity, ac_status, ac_set_temperature))
    return data

# Hàm huấn luyện mô hình
def train_model():
    # Tạo dữ liệu
    data_samples = generate_data(1000)
    df = pd.DataFrame(data_samples, columns=["temperature", "humidity", "ac_status", "ac_set_temperature"])
    
    # Lọc dữ liệu với ac_status = 1
    df = df[df["ac_status"] == 1]
    
    # Tách đặc trưng (X) và mục tiêu (y)
    X = df[["temperature", "humidity"]]
    y = df["ac_set_temperature"]
    
    # Huấn luyện mô hình
    model = LinearRegression()
    model.fit(X, y)
    
    # Lưu mô hình
    joblib.dump(model, "ac_model.pkl")
    print("Mô hình đã được lưu thành công!")

if __name__ == "__main__":
    train_model()
