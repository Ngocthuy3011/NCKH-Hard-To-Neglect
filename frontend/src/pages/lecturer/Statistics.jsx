import React, { useState } from 'react';
import './Statistics.css';

function Statistics() {
  const [selectedClass, setSelectedClass] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [classList, setClassList] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [filteredSummary, setFilteredSummary] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showClassList, setShowClassList] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);
  const [studentDetailError, setStudentDetailError] = useState("");
  const [showStudentDetailModal, setShowStudentDetailModal] = useState(false);

  const teacherId = "2025001"; // Thay bằng teacher_id thật của giảng viên

  const handleLoadClasses = async () => {
    if (classList.length > 0) {
      setShowClassList(true);
      return;
    }

    setLoadingClasses(true);
    setShowClassList(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/lecturer/${teacherId}/classes`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setClassList(data);
      if (data.length === 0) {
        alert("Giảng viên này chưa có lớp hoặc dữ liệu chưa có sẵn.");
      }
    } catch (error) {
      console.error("Không tải được danh sách lớp:", error);
      alert("Không tải được danh sách lớp. Kiểm tra backend và teacher_id.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSearchByClass = async () => {
    if (!selectedClass) return alert("Vui lòng chọn lớp trước khi tìm kiếm.");

    setLoadingSummary(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/class/${selectedClass}/summary`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setAttendanceSummary(data);
      setFilteredSummary(data);
      if (data.length === 0) {
        alert("Không có dữ liệu thống kê cho lớp này.");
      }
    } catch (error) {
      console.error("Không tải được thống kê lớp:", error);
      alert("Không tải được thống kê. Kiểm tra backend và class_id.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    return `"${text}"`;
  };

  const handleExportExcel = () => {
    const dataToExport = filteredSummary.length ? filteredSummary : attendanceSummary;
    if (!dataToExport.length) {
      return alert("Chưa có dữ liệu để xuất file.");
    }

    const headers = ["STT", "MSSV", "Họ và Tên", "Buổi điểm danh", "Vắng", "Trễ", "Tỉ lệ chuyên cần"];
    const rows = dataToExport.map((item, index) => {
      const total = (item.present_count || 0) + (item.absent_count || 0) + (item.late_count || 0);
      const attendanceRate = total > 0 ? `${Math.round(((item.present_count || 0) / total) * 100)}%` : "0%";
      return [
        index + 1,
        item.student_id,
        item.full_name,
        total,
        item.absent_count || 0,
        item.late_count || 0,
        attendanceRate,
      ]
        .map(escapeCsvValue)
        .join(",");
    });

    const csvContent = [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `thong_ke_lop_${selectedClass || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSearchByName = () => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      setFilteredSummary(attendanceSummary);
      return;
    }
    const filtered = attendanceSummary.filter(item =>
      item.full_name?.toLowerCase().includes(keyword)
    );
    setFilteredSummary(filtered);
  };

  const handleStudentDoubleClick = async (studentId, studentName) => {
    if (!selectedClass) {
      return alert("Vui lòng chọn lớp trước khi xem chi tiết sinh viên.");
    }

    setLoadingStudentDetail(true);
    setStudentDetailError("");
    setShowStudentDetailModal(true);
    try {
      console.log("Loading student detail", studentId, selectedClass);
      const response = await fetch(`http://127.0.0.1:8000/student/${studentId}/attendance-stats/${selectedClass}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setStudentDetail({
        studentId,
        studentName,
        classId: selectedClass,
        history: data.history || [],
        summary: data.summary || {},
      });
      setStudentDetailError("");
    } catch (error) {
      console.error("Không tải được chi tiết sinh viên:", error);
      setStudentDetailError("Không lấy được chi tiết điểm danh. Vui lòng thử lại.");
      setStudentDetail({
        studentId,
        studentName,
        classId: selectedClass,
        history: [],
        summary: {},
      });
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  const closeStudentDetailModal = () => {
    setShowStudentDetailModal(false);
    setStudentDetail(null);
    setStudentDetailError("");
  };

  const selectedClassInfo = classList.find(c => String(c.class_id) === String(selectedClass));

  return (
    <div className="stats-container">
      <h2 className="dashboard-title">Thống kê điểm danh</h2>

      <div className="card filter-section" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <div className="search-group">
          <span>Lớp học:</span>
          <select
            className="select-box"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            onMouseDown={handleLoadClasses}
            onFocus={handleLoadClasses}
          >
            <option value="">-- Chọn lớp --</option>
            {classList.map(c => (
              <option key={c.class_id} value={c.class_id}>
                {`${c.subject_id} - ${c.subject_name} - Nhóm ${c.group_id}${c.sub_id ? ` - Tổ ${c.sub_id}` : ""} - HK ${c.semester}`}              </option>
            ))}
          </select>

          <button className="btn-search-blue" onClick={handleSearchByClass}>
            <i className="fas fa-search"></i> Tìm kiếm
          </button>
          <button className="btn-search-gray" onClick={handleExportExcel}>
            Xuất Excel
          </button>

          {loadingClasses && (
            <div className="small-note">Đang tải danh sách lớp...</div>
          )}

        </div>

        {/* Nhóm tìm tên */}
        <div className="search-group">
          <span>Tìm tên:</span>
          <input 
            type="text" 
            className="input-search" 
            placeholder="Nhập tên sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-search-gray" onClick={handleSearchByName}>Lọc</button>
        </div>
      </div>

      {selectedClass && (
        <div className="summary-card card">
          <div className="summary-header">
            <h3>Thống kê lớp</h3>
            <div className="summary-meta">
              {selectedClassInfo
                ? `${selectedClassInfo.subject_id} - ${selectedClassInfo.subject_name} - Nhóm ${selectedClassInfo.group_id}${selectedClassInfo.sub_id ? ` - Tổ ${selectedClassInfo.sub_id}` : ''} - HK ${selectedClassInfo.semester}`
                : 'Lớp đã chọn'}
            </div>
          </div>

          {loadingSummary ? (
            <div className="small-note">Đang tải dữ liệu thống kê...</div>
          ) : filteredSummary.length === 0 ? (
            <div className="small-note">Chưa có dữ liệu thống kê. Nhấn "Tìm kiếm" để load dữ liệu.</div>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MSSV</th>
                  <th>Họ và Tên</th>
                  <th>Buổi điểm danh</th>
                  <th>Vắng</th>
                  <th>Trễ</th>
                  <th>Tỉ lệ chuyên cần</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.map((item, index) => {
                  const total = (item.present_count || 0) + (item.absent_count || 0) + (item.late_count || 0);
                  const attendanceRate = total > 0 ? `${Math.round(((item.present_count || 0) / total) * 100)}%` : '0%';
                  return (
                    <tr key={item.student_id} onDoubleClick={() => handleStudentDoubleClick(item.student_id, item.full_name)} title="Nháy đúp để xem chi tiết điểm danh">
                      <td>{index + 1}</td>
                      <td>{item.student_id}</td>
                      <td className="student-name">{item.full_name}</td>
                      <td>{total}</td>
                      <td>{item.absent_count || 0}</td>
                      <td>{item.late_count || 0}</td>
                      <td style={{ color: attendanceRate === '100%' ? 'green' : '#6c757d', fontWeight: '600' }}>{attendanceRate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {showStudentDetailModal && studentDetail && (
            <div className="student-detail-modal-overlay" onClick={closeStudentDetailModal}>
              <div className="student-detail-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal" onClick={closeStudentDetailModal} aria-label="Đóng cửa sổ">×</button>
                <div className="summary-header">
                  <h3>Chi tiết điểm danh của {studentDetail.studentName}</h3>
                  <div className="summary-meta">MSSV: {studentDetail.studentId}</div>
                </div>

                {loadingStudentDetail ? (
                  <div className="small-note">Đang tải chi tiết...</div>
                ) : studentDetailError ? (
                  <div className="small-note" style={{ color: '#d63333' }}>{studentDetailError}</div>
                ) : (
                  <>
                    <div className="small-note">Tổng buổi: {studentDetail.summary?.tổng_buổi || 0}</div>
                    <table className="stats-table">
                      <thead>
                        <tr>
                          <th>Buổi</th>
                          <th>Trạng thái</th>
                          <th>Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentDetail.history.length > 0 ? (
                          studentDetail.history.map((row, idx) => (
                            <tr key={`${row.session_no}-${idx}`}>
                              <td>{row.session_no}</td>
                              <td>{row.status || 'Chưa điểm danh'}</td>
                              <td>{row.time ? new Date(row.time).toLocaleString() : '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3}>Chưa có dữ liệu điểm danh cho sinh viên này.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {!selectedClass && (
        <p style={{fontSize: '12px', color: '#858796', marginTop: '10px'}}>
          * Chọn lớp rồi nhấn "Tìm kiếm" để hiển thị bảng thống kê.
        </p>
      )}

    </div>
  );
}
export default Statistics;