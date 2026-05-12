import React, { useState, useEffect } from 'react';
import './ManageClass.css';
import * as XLSX from 'xlsx';

const ManageClass = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");
  
  // Modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null); // Lớp đang được chỉnh sửa (nếu có)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [classFormData, setClassFormData] = useState({
    subject_id: '',
    subject_name: '',
    group_id: '',
    sub_id: '',
    semester: ''
  });
  const [studentFormData, setStudentFormData] = useState({
    student_id: '',
    full_name: '',
    class_name: ''
  });

  const teacherId = "2025001"; // Thay bằng teacher_id thật của giảng viên

  const fetchClasses = async () => {
    setLoadingClasses(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/lecturer/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setClassesData(data || []);
      if (!data || data.length === 0) {
        setError("Chưa có lớp nào cho giảng viên hoặc database chưa có dữ liệu.");
      }
    } catch (error) {
      console.error("Lỗi tải danh sách lớp:", error);
      setError("Không tải được danh sách lớp từ database. Kiểm tra backend và teacher_id.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async (classId) => {
    setLoadingStudents(true);
    setError("");
    try {
      const response = await fetch(`http://127.0.0.1:8000/class/${classId}/students`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setStudentsData(data || []);
      if (!data || data.length === 0) {
        setError("Lớp này chưa có sinh viên hoặc chưa có dữ liệu điểm danh.");
      }
    } catch (error) {
      console.error("Lỗi tải danh sách sinh viên:", error);
      setError("Không tải được danh sách sinh viên từ database. Kiểm tra backend và class_id.");
      setStudentsData([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.class_id);
    } else {
      setStudentsData([]);
    }
  }, [selectedClass]);

  const handleDeleteClass = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lớp này? Toàn bộ dữ liệu điểm danh sẽ bị mất!")) {
      console.log("Xóa lớp id:", id);
      // TODO: Gọi API xóa lớp nếu cần.
    }
  };

  const openCreateClassModal = () => {
    setEditingClass(null);
    setClassFormData({ subject_id: '', subject_name: '', group_id: '', sub_id: '', semester: '' });
    setExcelFile(null);
    setError('');
    setShowCreateClassModal(true);
  };

  const handleEditClass = (classItem) => {
    setEditingClass(classItem);
    setClassFormData({
      subject_id: classItem.subject_id || '',
      subject_name: classItem.subject_name || '',
      group_id: classItem.group_id ?? '',
      sub_id: classItem.sub_id ?? '',
      semester: classItem.semester || ''
    });
    setExcelFile(null);
    setError('');
    setShowCreateClassModal(true);
  };

  const closeClassModal = () => {
    setShowCreateClassModal(false);
    setEditingClass(null);
    setExcelFile(null);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setStudentFormData({ student_id: '', full_name: '', class_name: '' });
    setError('');
    setShowEditStudentModal(true);
  };

  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcelFile(file);
    }
  };

  const handleSaveClass = async () => {
    if (!classFormData.subject_id || !classFormData.subject_name || !classFormData.group_id || !classFormData.semester) {
      setError("Vui lòng điền đầy đủ thông tin lớp");
      return;
    }

    try {
      let students = [];
      if (!editingClass) {
        if (!excelFile) {
          setError("Vui lòng chọn file Excel để tải lên");
          return;
        }

        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const workbook = XLSX.read(event.target.result, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              students = XLSX.utils.sheet_to_json(worksheet);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error('Lỗi đọc file Excel'));
          reader.readAsArrayBuffer(excelFile);
        });
      }

      const payload = {
        subject_id: classFormData.subject_id,
        subject_name: classFormData.subject_name,
        group_id: classFormData.group_id,
        sub_id: classFormData.sub_id,
        semester: classFormData.semester,
        teacher_id: teacherId,
        students
      };

      if (editingClass) {
        const response = await fetch(`http://127.0.0.1:8000/class/${editingClass.class_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        setClassesData(prev => prev.map(item => item.class_id === editingClass.class_id ? { ...item, ...classFormData } : item));
        if (selectedClass?.class_id === editingClass.class_id) {
          setSelectedClass(prev => ({ ...prev, ...classFormData }));
        }
        setError("Cập nhật lớp học thành công!");
      } else {
        const response = await fetch('http://127.0.0.1:8000/class', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        await response.json();
        setError("Lớp mới được tạo thành công!");
      }

      setShowCreateClassModal(false);
      setEditingClass(null);
      setClassFormData({ subject_id: '', subject_name: '', group_id: '', sub_id: '', semester: '' });
      setExcelFile(null);
      fetchClasses();
    } catch (err) {
      setError("Lỗi lưu lớp: " + err.message);
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setStudentFormData({
      student_id: student.student_id,
      full_name: student.full_name || '',
      class_name: student.class_name || ''
    });
    setShowEditStudentModal(true);
  };

  const handleSaveStudent = async () => {
    if (!studentFormData.student_id || !studentFormData.full_name) {
      setError("Vui lòng điền đầy đủ thông tin sinh viên");
      return;
    }
    if (!selectedClass) {
      setError("Vui lòng chọn lớp trước khi thêm hoặc sửa sinh viên");
      return;
    }

    try {
      const payload = {
        full_name: studentFormData.full_name,
        class_name: studentFormData.class_name,
        class_id: selectedClass.class_id
      };
      const response = await fetch(`http://127.0.0.1:8000/student/${studentFormData.student_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      await response.json();

      const updatedStudent = {
        student_id: studentFormData.student_id,
        full_name: studentFormData.full_name,
        class_name: studentFormData.class_name
      };

      setStudentsData(prevData => {
        const exists = prevData.some(st => st.student_id === updatedStudent.student_id);
        if (exists) {
          return prevData.map(st => st.student_id === updatedStudent.student_id ? updatedStudent : st);
        }
        return [...prevData, updatedStudent];
      });

      setShowEditStudentModal(false);
      setError("Lưu sinh viên thành công!");
    } catch (err) {
      setError("Lỗi lưu sinh viên: " + err.message);
    }
  };

  return (
    <div className="manage-container">
      <div className="page-header">
        <h2 className="manage-class-title">{selectedClass ? `Lớp: ${selectedClass.subject_name || selectedClass.subject_id} - Nhóm ${selectedClass.group_id}${selectedClass.sub_id ? ` - Tổ ${selectedClass.sub_id}` : ''}` : "Quản lý lớp học"}</h2>
        <div className="header-actions">
          {selectedClass ? (
            <>
              <button className="btn-back" onClick={() => setSelectedClass(null)}>Quay lại</button>
              <button className="btn-add" onClick={handleAddStudent}>Thêm sinh viên</button>
            </>
          ) : (
            <>
              <button className="btn-add" onClick={openCreateClassModal}>Tạo lớp mới</button>
            </>
          )}
        </div>
      </div>

      {!selectedClass && (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã môn</th>
                <th>Tên môn</th>
                <th>Nhóm</th>
                <th>Tổ</th>
                <th>Học kỳ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingClasses ? (
                <tr>
                  <td colSpan={7} className="text-center">Đang tải danh sách lớp...</td>
                </tr>
              ) : classesData.length > 0 ? (
                classesData.map((item, index) => (
                  <tr key={item.class_id} className="row-hover" onClick={() => setSelectedClass(item)}>
                    <td>{index + 1}</td>
                    <td>{item.subject_id}</td>
                    <td className="text-blue">{item.subject_name || item.subject_id}</td>
                    <td>{item.group_id}</td>
                    <td>{item.sub_id || '-'}</td>
                    <td>{item.semester}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn-edit" onClick={() => handleEditClass(item)}>Sửa</button>
                      <button className="btn-delete" onClick={() => handleDeleteClass(item.class_id)}>Xóa</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">Không có lớp nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedClass && (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>MSSV</th>
                <th>Họ và Tên</th>
                <th>Lớp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingStudents ? (
                <tr>
                  <td colSpan={5} className="text-center">Đang tải sinh viên...</td>
                </tr>
              ) : studentsData.length > 0 ? (
                studentsData.map((st, idx) => (
                  <tr key={st.student_id}>
                    <td>{idx + 1}</td>
                    <td className="font-bold">{st.student_id}</td>
                    <td>{st.full_name || 'Chưa cập nhật'}</td>
                    <td>{st.class_name || '-'}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEditStudent(st)}>Sửa</button>
                      <button className="btn-delete">Xóa</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">Không có sinh viên trong lớp này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo/lưu lớp */}
      {showCreateClassModal && (
        <div className="modal-overlay" onClick={closeClassModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? 'Chỉnh sửa lớp học' : 'Tạo lớp mới'}</h3>
              <button className="btn-close" onClick={closeClassModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Mã môn học:</label>
                <input
                  type="text"
                  value={classFormData.subject_id}
                  onChange={(e) => setClassFormData({ ...classFormData, subject_id: e.target.value })}
                  placeholder="Ví dụ: INT101"
                />
              </div>
              <div className="form-group">
                <label>Tên môn học:</label>
                <input
                  type="text"
                  value={classFormData.subject_name}
                  onChange={(e) => setClassFormData({ ...classFormData, subject_name: e.target.value })}
                  placeholder="Ví dụ: Lập trình Python"
                />
              </div>
              <div className="form-group">
                <label>Nhóm:</label>
                <input
                  type="text"
                  value={classFormData.group_id}
                  onChange={(e) => setClassFormData({ ...classFormData, group_id: e.target.value })}
                  placeholder="Ví dụ: 1"
                />
              </div>
              <div className="form-group">
                <label>Tổ (tùy chọn):</label>
                <input
                  type="text"
                  value={classFormData.sub_id}
                  onChange={(e) => setClassFormData({ ...classFormData, sub_id: e.target.value })}
                  placeholder="Ví dụ: A"
                />
              </div>
              <div className="form-group">
                <label>Học kỳ:</label>
                <input
                  type="text"
                  value={classFormData.semester}
                  onChange={(e) => setClassFormData({ ...classFormData, semester: e.target.value })}
                  placeholder="Ví dụ: 1"
                />
              </div>
              {!editingClass && (
                <div className="form-group">
                  <label>Tải file Excel (danh sách sinh viên):</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelFileChange}
                    className="file-input"
                  />
                  {excelFile && <p className="file-name">✓ {excelFile.name}</p>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeClassModal}>Hủy</button>
              <button className="btn-save" onClick={handleSaveClass}>{editingClass ? 'Lưu thay đổi' : 'Tạo lớp'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa thông tin sinh viên */}
      {showEditStudentModal && (
        <div className="modal-overlay" onClick={() => setShowEditStudentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedStudent ? "Sửa thông tin sinh viên" : "Thêm sinh viên mới"}</h3>
              <button className="btn-close" onClick={() => setShowEditStudentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>MSSV:</label>
                <input
                  type="text"
                  value={studentFormData.student_id}
                  onChange={(e) => setStudentFormData({ ...studentFormData, student_id: e.target.value })}
                  placeholder="Ví dụ: 2024001"
                  disabled={selectedStudent}
                />
              </div>
              <div className="form-group">
                <label>Họ và Tên:</label>
                <input
                  type="text"
                  value={studentFormData.full_name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, full_name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>
              <div className="form-group">
                <label>Lớp:</label>
                <input
                  type="text"
                  value={studentFormData.class_name}
                  onChange={(e) => setStudentFormData({ ...studentFormData, class_name: e.target.value })}
                  placeholder="Ví dụ: CNTT1"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditStudentModal(false)}>Hủy</button>
              <button className="btn-save" onClick={handleSaveStudent}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ManageClass;