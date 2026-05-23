import "./MainLayout.css";
import avatarImg from '../assets/user.png';
import { AiOutlineHome, AiOutlineCheckCircle, AiOutlineBarChart, AiOutlineSetting } from "react-icons/ai";
function LecturerLayout({ setPage, children }) {
  return (
    <div className="wrapper">
      <div className="header">
        {/* Sửa lại thẻ br ở đây */}
        <div className="system-name">
        ĐIỂM DANH BẰNG<br></br> NHẬN DIỆN KHUÔN MẶT
        </div>

        <div className="user-profile">
          <div className="user-info">Nguyễn Văn A</div>
            <img 
              src={avatarImg} 
              alt="User Avatar" 
              className="user-avatar" 
            />
      </div>
    </div>

      <div className="layout">
        <div className="sidebar">
          {/* Mỗi menu item bây giờ sẽ có thêm 1 thẻ span chứa icon */}
          <div onClick={() => setPage("dashboard")} className="menu">
            <AiOutlineHome className="menu-icon" /> <span>Trang chủ</span>
          </div>
          
          <div onClick={() => setPage("attendance")} className="menu">
            <AiOutlineCheckCircle className="menu-icon" /> <span>Điểm danh</span>
          </div>

          <div onClick={() => setPage("statistics")} className="menu">
            <AiOutlineBarChart className="menu-icon" /> <span>Thống kê</span>
          </div>

          {/* <div className="menu">
            <AiOutlineBarChart className="menu-icon" /> <span>Thống kê</span>
          </div> */}

          <div onClick={() => setPage("management")} className="menu">
            <AiOutlineSetting className="menu-icon" /> <span>Quản lý</span>
          </div>
        </div>

        <div className="main">
          <div className="content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
export default LecturerLayout;