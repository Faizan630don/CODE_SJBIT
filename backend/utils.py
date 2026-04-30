import os
import pydicom
import io
from PIL import Image
import numpy as np
from fastapi import UploadFile

def process_dicom_or_image(file_bytes: bytes, filename: str) -> bytes:
    """
    Reads file bytes. If it's DICOM, extracts the pixel array and returns JPEG bytes.
    If it's SVG, returns empty bytes (viewer will use original SVG).
    If it's already an image, just converts it to a standard JPEG format and returns bytes.
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext == '.svg':
        # PIL cannot process SVG, so we return empty bytes. 
        # The frontend is configured to fall back to the original URL for SVGs.
        return b""

    if ext in ['.dcm', '.dicom']:
        try:
            with io.BytesIO(file_bytes) as f:
                ds = pydicom.dcmread(f)
                
                # Extract pixel array
                pixel_array = ds.pixel_array.astype(float)
                
                # Apply Rescale Slope and Intercept (Standard DICOM)
                rescale_slope = getattr(ds, 'RescaleSlope', 1)
                rescale_intercept = getattr(ds, 'RescaleIntercept', 0)
                pixel_array = pixel_array * rescale_slope + rescale_intercept

                # Clinical Windowing (Level/Width)
                if hasattr(ds, 'WindowCenter') and hasattr(ds, 'WindowWidth'):
                    wc = ds.WindowCenter
                    ww = ds.WindowWidth
                    # Handle multi-value tags
                    if isinstance(wc, (pydicom.multival.MultiValue, list)): wc = wc[0]
                    if isinstance(ww, (pydicom.multival.MultiValue, list)): ww = ww[0]
                    
                    lower = wc - ww / 2
                    upper = wc + ww / 2
                    pixel_array = np.clip(pixel_array, lower, upper)
                
                # Normalize to [0, 255]
                pixel_min = pixel_array.min()
                pixel_max = pixel_array.max()
                if pixel_max > pixel_min:
                    pixel_array = (pixel_array - pixel_min) / (pixel_max - pixel_min) * 255.0
                
                # Handle Photometric Interpretation (Inversion)
                # MONOCHROME1 means 0 is white, MONOCHROME2 means 0 is black
                if getattr(ds, 'PhotometricInterpretation', '') == 'MONOCHROME1':
                    pixel_array = 255.0 - pixel_array
                
                # Handle Multi-frame DICOMs
                if pixel_array.ndim == 3:
                    pixel_array = pixel_array[0] # Take first frame
                
                pixel_array = pixel_array.astype(np.uint8)
                img = Image.fromarray(pixel_array)
                
                # Standardize to 1280px (maintaining aspect ratio)
                img.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
                
                # Convert to RGB for JPEG
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=95)
                return img_byte_arr.getvalue()
        except Exception as e:
            print(f"DICOM Conversion Error: {e}")
            raise Exception(f"Failed to process medical DICOM: {str(e)}")
    else:
        try:
            # Assuming it's already an image format PIL can handle
            with io.BytesIO(file_bytes) as f:
                img = Image.open(f)
                img = img.convert("RGB")
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG')
                return img_byte_arr.getvalue()
        except Exception as e:
            print(f"Error processing image: {e}")
            raise Exception(f"Unsupported image format or processing error: {str(e)}")
