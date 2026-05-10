// import React from 'react';
// import './App.css';
// // import MainLayout from './layouts/MainLayout.jsx';
// import Dashboard from './lecturer/dashboard.jsx';

// function App() {
//   return (
//     // <MainLayout userName="Nguyễn Thị Diệu Hiền">
//     //   <div style={{ width: '100%', minHeight: '80vh', padding: '0' }}>
//     //     {/*<h2>Chào mừng bạn đến với ứng dụng của chúng tôi</h2>
//     //     <p>Đây là một đoạn văn mẫu.</p>*/}
//     //   </div>
//     // </MainLayout>
//     <Dashboard/>
//   );
// }

// export default App;


import { useState } from "react";

import LecturerLayout from "./pages/lecturer/MainLayout";
import Dashboard from "./pages/lecturer/Dashboard";
import Attendance from "./pages/lecturer/Attendance";
import Statistics from "./pages/lecturer/Statistics";
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
      </LecturerLayout>
    );
  }

  if (role === "student") {
    // TRUYỀN DỮ LIỆU USER XUỐNG DASHBOARD
    return <StudentDashboard user={user} onBack={() => { setIsLoggedIn(false); setRole(null); setUser(null); }} />;
  }
}

export default App;