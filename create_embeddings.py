import pickle
import os

os.makedirs("data", exist_ok=True)

# embedding giả để test backend
fake_embeddings = {
    "51801003": [0.1, 0.2, 0.3, 0.4],
    "51801004": [0.2, 0.1, 0.4, 0.3],
}

with open("data/known_faces_embeddings.pkl", "wb") as f:
    pickle.dump(fake_embeddings, f)

print("✅ Tạo embeddings thành công")
