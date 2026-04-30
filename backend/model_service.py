import io
import os
from PIL import Image
from ultralytics import YOLO
import torch

# Severity mapping (1-5 numeric scale)
CLASS_MAP = {
    "Caries": 4,
    "Periapical Lesion": 5,
    "Bone Loss": 4,
    "Cyst": 5,
    "Fracture Teeth": 5,
    "Retained Root": 4,
    "Root Piece": 4,
    "Root Resorption": 4,
    "Bone Defect": 4,
    "Impacted Tooth": 4,

    "Attrition": 3,
    "Malaligned": 2,
    "Supra Eruption": 3,
    "Root Canal Treatment": 3,
    "Post - Core": 2,

    "Crown": 1,
    "Filling": 1,
    "Implant": 1,
    "Missing Teeth": 1,
    "Permanent Teeth": 1,
    "Primary Teeth": 1,
    "Mandibular Canal": 1,
    "Maxillary Sinus": 1,
    "Abutment": 1,
    "Gingival Former": 1,
    "Metal Band": 1,
    "Orthodontic Brackets": 1,
    "Permanent Retainer": 1,
    "Plating": 1,
    "Tad": 1,
    "Wire": 1,
}


class CNNModelService:
    def __init__(self, model_path: str = "best.pt"):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        full_model_path = os.path.join(base_dir, model_path)

        print(f"Loading YOLO model from {full_model_path}...")
        try:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model = YOLO(full_model_path)
            self.model.to(device)
            print(f"Model loaded successfully on {device}.")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None

    async def predict(self, image_bytes: bytes) -> tuple[list[dict], str, str]:
        if not self.model:
            return [], "GREEN", "Model not initialized."

        if not image_bytes:
            return [], "GREEN", "No image provided."

        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

            print(f"Running inference on {image.width}x{image.height} image...")
            results = self.model.predict(image, conf=0.25, iou=0.5, verbose=False)

            findings = []

            if results and len(results) > 0:
                result = results[0]
                boxes = result.boxes

                print(f"Detections found: {len(boxes)}")

                for i, box in enumerate(boxes):
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])

                    # Tuning threshold for best.pt sensitivity
                    if conf < 0.20:
                        continue

                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    cx = (x1 + x2) / 2
                    cy = (y1 + y2) / 2

                    raw_name = self.model.names.get(cls_id, f"Unknown ({cls_id})")
                    # Handle plural vs singular and capitalization
                    class_name = raw_name.replace("_", " ").strip().title()
                    if class_name.endswith('S'): 
                        # Very basic singularization: Crowns -> Crown, Fillings -> Filling
                        # But only if it's in our map
                        singular = class_name[:-1]
                        if singular in CLASS_MAP: class_name = singular

                    severity = CLASS_MAP.get(class_name, "Low")
                    print(f"Validated Finding: {class_name} ({conf:.2f}) at {self._get_region_label(cx, cy, image.width, image.height)}")

                    findings.append({
                        "id": f"det_{i}_{cls_id}",
                        "tooth_id": self._get_region_label(cx, cy, image.width, image.height),
                        "condition": class_name,
                        "severity": severity,
                        "confidence": round(conf, 2),
                        "bbox": {
                            "x": round(x1 / image.width, 4),
                            "y": round(y1 / image.height, 4),
                            "width": round((x2 - x1) / image.width, 4),
                            "height": round((y2 - y1) / image.height, 4)
                        },
                        "triage": self._severity_to_triage(severity)
                    })

            # ✅ REMOVE DUPLICATES
            findings = self._deduplicate_findings(findings)

            # ✅ SORT RESULTS (best UX)
            findings = sorted(
                findings,
                key=lambda x: (x["severity"], x["confidence"]),
                reverse=True
            )

            # ✅ TRIAGE CALCULATION
            max_severity = max([f["severity"] for f in findings]) if findings else 0
            triage = "RED" if max_severity >= 4 else "YELLOW" if max_severity >= 3 else "GREEN"

            # ✅ SUMMARY
            if not findings:
                summary = "No significant dental issues detected."
            else:
                summary = f"{len(findings)} key findings detected. Triage: {triage}."

            return findings, triage, summary

        except Exception as e:
            print(f"Prediction error: {e}")
            return [], "GREEN", f"Error during analysis: {str(e)}"

    def _severity_to_triage(self, severity: int) -> str:
        if severity >= 4:
            return "RED"
        if severity >= 3:
            return "YELLOW"
        return "GREEN"

    def _get_region_label(self, x, y, w, h):
        """
        Precise 1-32 Universal Numbering System Mapping.
        OPG View: Image Left (x=0) is Patient Right. Image Right (x=1) is Patient Left.
        """
        rel_x = x / w
        rel_y = y / h

        # Determine Quadrant Slot (0 to 7) within the 4 quadrants
        # x=0 to 0.5 is Patient Right (Teeth 1-8 and 25-32)
        # x=0.5 to 1.0 is Patient Left (Teeth 9-16 and 17-24)
        
        # Normalize rel_x for slot calculation
        if rel_x < 0.5:
            # Right Side of Patient (Image Left)
            slot = int((0.5 - rel_x) * 2 * 8)
        else:
            # Left Side of Patient (Image Right)
            slot = int((rel_x - 0.5) * 2 * 8)
            
        slot = max(0, min(slot, 7))

        if rel_y < 0.5:
            # UPPER JAW (1-16)
            if rel_x < 0.5:
                # Q1: UR (1 to 8). 1 is far right (x=0), 8 is center (x=0.5)
                tooth = 8 - slot
            else:
                # Q2: UL (9 to 16). 9 is center (x=0.5), 16 is far left (x=1.0)
                tooth = 9 + slot
        else:
            # LOWER JAW (17-32)
            if rel_x > 0.5:
                # Q3: LL (17 to 24). 17 is far left (x=1.0), 24 is center (x=0.5)
                tooth = 24 - slot
            else:
                # Q4: LR (25 to 32). 25 is center (x=0.5), 32 is far right (x=0)
                tooth = 25 + slot

        return str(max(1, min(tooth, 32)))

    def _deduplicate_findings(self, findings: list[dict]) -> list[dict]:
        """
        Keeps the best detection PER CONDITION per region.
        Example: If 'Upper Left Molar' has both a Crown and Caries, keep both.
        """
        best_findings = {}

        for f in findings:
            # Unique key: Region + Condition
            key = f"{f['tooth_id']}_{f['condition']}"

            if key not in best_findings:
                best_findings[key] = f
            else:
                if f["confidence"] > best_findings[key]["confidence"]:
                    best_findings[key] = f

        return list(best_findings.values())


# Singleton instance
cnn_service = CNNModelService()