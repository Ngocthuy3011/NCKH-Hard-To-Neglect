import "./Dashboard.css";

function Dashboard() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth(); // 0 - 11
  const currentYear = today.getFullYear();

  // Lấy tên tháng tiếng Anh giống hình mẫu
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];

  // Logic tính số ngày trong tháng và ngày bắt đầu (thứ mấy)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Chuyển đổi getDay (0 là CN) sang thứ tự Mon, Tue... (Mon là 0)
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  // Thêm các ô trống cho những ngày thuộc tháng trước
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  // Thêm các ngày trong tháng
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === currentDay;
    days.push(
      <div key={d} className={`calendar-day ${isToday ? "today-bold" : ""}`}>
        {d}
      </div>
    );
  }
  return (
    <div>
      <div className="dashboard-header-line">
        <h2 className="dashboard-title">Trang chủ</h2>
        {/* <div className="dashboard-subtitle">Chào mừng bạn đến với hệ thống điểm danh bằng nhận diện khuôn mặt</div> */}
      </div>

      <div className="card">
        <h3>Học kỳ hiện tại</h3>
        <h1 className="semester-title">
          Học Kỳ II / 2025 - 2026
        </h1>
      </div>

      <div className="dashboard-main-row">

        <div className="left-content">
          <div className="card">
            <h3>Ghi chú</h3>
            {/* <p style={{color: '#4a5568', marginBottom: '10px'}}>Ghi chú</p> */}

            <textarea
              placeholder="Ghi chú lịch giảng dạy..."
              rows="6"
            />
          </div>
        </div>

        {/* BÊN PHẢI */}
        <div className="right-section">
          <div className="mini-calendar">
            <div className="calendar-title">Calendar</div>

            <div className="calendar-header">
              <button className="nav-btn">◀</button>
              <span className="month-year">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button className="nav-btn">▶</button>
            </div>

            <div className="calendar-grid">
              <div className="day-name">Mon</div>
              <div className="day-name">Tue</div>
              <div className="day-name">Wed</div>
              <div className="day-name">Thu</div>
              <div className="day-name">Fri</div>
              <div className="day-name">Sat</div>
              <div className="day-name">Sun</div>

              {days}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;