from ultralytics import YOLO
import torch
from PIL import Image
import os

model = YOLO("best.pt")
# Try to find an image to test
img_path = None
for root, dirs, files in os.walk("."):
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(root, f)
            break
    if img_path: break

if img_path:
    print(f"Testing on {img_path}")
    results = model.predict(img_path, conf=0.1, imgsz=640)
    if results:
        boxes = results[0].boxes
        print(f"Found {len(boxes)} detections total at 0.1 threshold.")
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            name = model.names[cls]
            print(f" - {name}: {conf:.4f}")
else:
    print("No test image found.")
