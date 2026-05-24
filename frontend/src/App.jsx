import { useState } from "react";
<<<<<<< HEAD

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

=======
import LecturerLayout from "./layouts/MainLayout";
import Dashboard from "./lecturer/Dashboard";
import Attendance from "./lecturer/Attendance";
import Statistics from "./lecturer/Statistics";
import ManageClass from "./lecturer/ManageClass";
>>>>>>> 0a5bc102cb09109128d8164ec8c6ff080bce47b0
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

<<<<<<< HEAD
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
            setRole(userData.role); 
          }
        }}
        // ĐÃ XÓA: onSwitchToRegister
        onBack={() => setRole(null)}
      />
    );
  }
=======
      {page === "dashboard" && <Dashboard />}
      {page === "attendance" && <Attendance />}
      {page === "statistics" && <Statistics />}
      {page === "management" && <ManageClass />}
>>>>>>> 0a5bc102cb09109128d8164ec8c6ff080bce47b0

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