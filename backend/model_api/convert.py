import insightface
import numpy as np
import cv2
import base64

class FaceProcessor:
    def __init__(self, model_name='buffalo_l', ctx_id=0):
        self.app = insightface.app.FaceAnalysis(
            name=model_name, 
            root='./insightface_model', 
            providers=['CPUExecutionProvider']
        )
        
        self.app.prepare(ctx_id=ctx_id, det_size=(640, 640))
        print("--- Khởi tạo InsightFace thành công! ---")

    def base64_to_cv2(self, base64_string):
        try:
            # Loại bỏ phần tiền tố 'data:image/jpeg;base64,' nếu có
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"Lỗi khi giải mã ảnh Base64: {e}")
            return None

    def get_embedding(self, base64_image):
        img = self.base64_to_cv2(base64_image)
        if img is None:
            return None
        
        faces = self.app.get(img)
        
        if not faces:
            print("Cảnh báo: Không tìm thấy khuôn mặt trong ảnh.")
            return None
        
        embedding_vector = faces[0].embedding.tolist()
        
        return embedding_vector
    
if __name__ == "__main__":
    processor = FaceProcessor()
    print("Mọi thứ hoạt động ổn định!")