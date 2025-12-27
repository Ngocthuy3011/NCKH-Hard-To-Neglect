import os
import pickle
import cv2
import numpy as np

DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "data",
    "known_faces_embeddings.pkl"
)

known_embeddings = {}

if os.path.exists(DATA_PATH):
    with open(DATA_PATH, "rb") as f:
        known_embeddings = pickle.load(f)
else:
    print("⚠️  Chưa có file known_faces_embeddings.pkl")

def recognize_face(image_file):
    # Demo tạm thời
    if not known_embeddings:
        return None

    # TODO: xử lý nhận diện thật sau
    return list(known_embeddings.keys())[0]
