import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib  # Thêm thư viện joblib để lưu mô hình

# Tạo dữ liệu giả lập
data = {
    'temperature': np.random.uniform(20, 30, 1000),  # Nhiệt độ từ 20 đến 30 độ C
    'humidity': np.random.uniform(30, 70, 1000),      # Độ ẩm từ 30% đến 70%
    'status': np.random.choice(['ON', 'OFF'], 1000)   # Trạng thái bật/tắt
}

df = pd.DataFrame(data)

# Chuyển đổi trạng thái thành số
df['status'] = df['status'].map({'ON': 1, 'OFF': 0})

# Tách dữ liệu thành đặc trưng và nhãn
X = df[['temperature', 'humidity']]
y = df['status']

# Chia dữ liệu thành tập huấn luyện và tập kiểm tra
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Tạo mô hình Random Forest
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Dự đoán trên tập kiểm tra
y_pred = model.predict(X_test)

# Đánh giá mô hình
accuracy = accuracy_score(y_test, y_pred)
print(f"Độ chính xác của mô hình: {accuracy:.2f}")

# Lưu mô hình
joblib.dump(model, 'fan_model.pkl')  # Lưu mô hình vào file