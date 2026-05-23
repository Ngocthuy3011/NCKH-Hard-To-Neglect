import { useState } from "react";

import LecturerLayout from "./pages/lecturer/MainLayout";
import Dashboard from "./pages/lecturer/Dashboard";
import Attendance from "./pages/lecturer/Attendance";
import Statistics from "./pages/lecturer/Statistics";
import ManageClass from "./pages/lecturer/ManageClass";
import StudentDashboard from "./pages/student/StudentDashboard";
import RoleSelection from "./layouts/RoleSelection";
import Login from "./layouts/Login";
import Register from "./layouts/Register";

function App() {
  const [role, setRole] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [authType, setAuthType] = useState("login"); 
  const [page, setPage] = useState("dashboard");
  
  // BIẾN QUAN TRỌNG: Lưu thông tin người dùng sau khi đăng nhập
  const [user, setUser] = useState(null); 

  if (!role) {
    return <RoleSelection onSelectRole={setRole} />;
  }

  if (!isLoggedIn) {
    if (authType === "login") {
      return (
        <Login 
          role={role} 
          // HỨNG DỮ LIỆU TỪ BACKEND VÀ LƯU VÀO STATE
          onLoginSuccess={(userData) => {
            setUser(userData);
            setIsLoggedIn(true);
          }} 
          onSwitchToRegister={() => setAuthType("register")} 
          onBack={() => { setRole(null); setAuthType("login"); }} 
        />
      );
    } else {
      return (
        <Register 
          role={role} 
          onRegisterSuccess={() => setAuthType("login")} 
          onSwitchToLogin={() => setAuthType("login")} 
          onBack={() => { setRole(null); setAuthType("login"); }} 
        />
      );
    }
  }

  if (role === "lecturer") {
    return (
      <LecturerLayout setPage={setPage} user={user}>
        {page === "dashboard" && <Dashboard />}
        {page === "attendance" && <Attendance />}
        {page === "statistics" && <Statistics />}
        {page === "management" && <ManageClass />}
      </LecturerLayout>
    );
  }

  if (role === "student") {
    // TRUYỀN DỮ LIỆU USER XUỐNG DASHBOARD
    return <StudentDashboard user={user} onBack={() => { setIsLoggedIn(false); setRole(null); setUser(null); }} />;
  }
}

export default App;