from ultralytics import YOLO
import cv2

img_path = "/Users/karan/.gemini/antigravity/brain/c0aca559-fdf3-437d-9cdb-f944444e5d99/media__1775158648898.png"
frame = cv2.imread(img_path)
if frame is None:
    print("Could not load image")
else:
    model = YOLO("yolov8n.pt")
    
    # test default
    res1 = model(frame, conf=0.4, verbose=False)
    count1 = sum([1 for r in res1 for b in r.boxes if int(b.cls[0]) == 0])
    
    # test 0.25
    res2 = model(frame, conf=0.25, classes=[0], verbose=False)
    count2 = sum([1 for r in res2 for b in r.boxes if int(b.cls[0]) == 0])
    
    print(f"Count at conf 0.4: {count1}")
    print(f"Count at conf 0.25: {count2}")
