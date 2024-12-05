const connection = require("../config/database"); // Kết nối tới cơ sở dữ liệu

const getAllData = (callback) => {
  const query = "SELECT * FROM Devices p";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Database query error: ", err);
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Xuất ra các hàm đã định nghĩa để sử dụng ở nơi khác
module.exports = {
  getAllData,
};
