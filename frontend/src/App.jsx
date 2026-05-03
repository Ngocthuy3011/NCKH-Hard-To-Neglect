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
import LecturerLayout from "./layouts/MainLayout";
import Dashboard from "./lecturer/Dashboard";
import Attendance from "./lecturer/Attendance";
import Statistics from "./lecturer/Statistics";

function App() {

  const [page, setPage] = useState("dashboard");

  return (
    <LecturerLayout setPage={setPage}>

      {page === "dashboard" && <Dashboard />}
      {page === "attendance" && <Attendance />}
      {page === "statistics" && <Statistics />}

    </LecturerLayout>
  );
}

export default App;