function showSection(sectionId) {
  // Hide all sections
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("sensor-data").style.display = "none";
  // Show the selected section
  document.getElementById(sectionId).style.display = "block";
}

//sidebar function
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const container = document.querySelector(".container");

  sidebar.classList.toggle("collapsed");
  container.classList.toggle("collapsed");

  const toggleBtn = document.getElementById("toggleBtn");
  if (sidebar.classList.contains("collapsed")) {
    toggleBtn.innerHTML = "&#8594;"; // Right arrow when collapsed
  } else {
    toggleBtn.innerHTML = "Menu"; // Left arrow when expanded
  }
}
// Hàm để ẩn thanh sidebar khi nhấp vào bên ngoài
function handleClickOutside(event) {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleBtn");

  // Kiểm tra nếu nhấp bên ngoài thanh sidebar và nút toggle
  if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
    sidebar.classList.add("collapsed");
    document.querySelector(".container").classList.add("collapsed");
    toggleBtn.innerHTML = "&#8594;"; // Đặt lại biểu tượng khi sidebar bị thu gọn
  }
}

// Đăng ký sự kiện click toàn bộ tài liệu
document.addEventListener("click", handleClickOutside);
