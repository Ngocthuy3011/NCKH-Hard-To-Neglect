import { useState } from "react";

import LecturerLayout from "./pages/lecturer/MainLayout";
import Dashboard from "./pages/lecturer/Dashboard";
import Attendance from "./pages/lecturer/Attendance";
import Statistics from "./pages/lecturer/Statistics";
import ManageClass from "./pages/lecturer/ManageClass";

import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentStatistics from "./pages/student/StudentStatistics";
import StudentProfile from "./pages/student/StudentProfile";

import RoleSelection from "./layouts/RoleSelection";
import Login from "./layouts/Login";
// ĐÃ XÓA: import Register from "./layouts/Register";

function App() {
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [studentPage, setStudentPage] = useState("dashboard");
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  if (!role) {
    return <RoleSelection onSelectRole={setRole} />;
  }

  if (!isLoggedIn) {
    return (
      <Login
        role={role}
        onLoginSuccess={(userData) => {
          setUser(userData);
          setIsLoggedIn(true);
          // BẢO MẬT TUYỆT ĐỐI: Ghi đè role bằng data chuẩn từ Backend trả về
          // Nếu Backend báo là 'student', dù đang ở giao diện GV cũng bị bế sang trang SV
          if (userData.role) {
            const r = String(userData.role).toLowerCase();
            if (r === 'lecturer' || r.includes('lect') || r.includes('giang') || r.includes('teacher')) {
              setRole('lecturer');
            } else if (r === 'student' || r.includes('student') || r.includes('sv') || r.includes('sinh')) {
              setRole('student');
            } else {
              // Nếu backend trả về giá trị không mong đợi, giữ role đang chọn ban đầu
              console.warn('Unrecognized role from backend:', userData.role);
            }
          }
        }}
        // ĐÃ XÓA: onSwitchToRegister
        onBack={() => setRole(null)}
      />
    );
  }

  // ── Giao diện Giảng viên ──────────────────────────────
  if (role === "lecturer") {
    return (
      <LecturerLayout setPage={setPage} user={user} onLogout={handleLogout}>
        {page === "dashboard"   && <Dashboard />}
        {page === "attendance"  && <Attendance />}
        {page === "statistics"  && <Statistics />}
        {page === "management"  && <ManageClass />}
      </LecturerLayout>
    );
  }

  // ── Giao diện Sinh viên ───────────────────────────────
  if (role === "student") {
    return (
      <StudentLayout setPage={setStudentPage} user={user} onLogout={handleLogout}>
        {studentPage === "dashboard"  && <StudentDashboard user={user} />}
        {studentPage === "attendance" && <StudentAttendance user={user} />}
        {studentPage === "statistics" && <StudentStatistics user={user} />}
        {studentPage === "profile" && <StudentProfile user={user} />}
      </StudentLayout>
    );
  }
}

export default App;