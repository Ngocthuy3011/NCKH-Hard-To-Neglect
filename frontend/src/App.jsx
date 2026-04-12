import './App.css';
import MainLayout from './layouts/MainLayout.jsx';

function App() {
  return (
    <MainLayout userName="Nguyễn Thị Diệu Hiền">
      <div style={{ width: '100%', minHeight: '80vh', padding: '0' }}>
        {/*<h2>Chào mừng bạn đến với ứng dụng của chúng tôi</h2>
        <p>Đây là một đoạn văn mẫu.</p>*/}
      </div>
    </MainLayout>
  );
}

export default App;
