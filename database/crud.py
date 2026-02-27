from sqlalchemy.orm import Session

# HÀM THÊM MỚI TỔNG QUÁT
def create_item(db: Session, model_class, schema_data):
    """
    Dùng cho: Thêm Account, Student, Class, Major... bất cứ bảng nào.
    - model_class: Là Class trong models.py (ví dụ: models.Account)
    - schema_data: Dữ liệu bạn muốn thêm (dạng dict hoặc Pydantic object)
    """
    # Chuyển dữ liệu thành object của SQLAlchemy
    db_item = model_class(**schema_data) 
    
    db.add(db_item) #Thêm vào hàng đợi
    db.commit()  #Thêm vào data
    db.refresh(db_item) #Cập nhật
    return db_item

# HÀM LẤY DANH SÁCH TỔNG QUÁT
def get_all_items(db: Session, model_class, skip: int = 0, limit: int = 100):
    """Lấy danh sách cho bất kỳ bảng nào"""
    return db.query(model_class).offset(skip).limit(limit).all()