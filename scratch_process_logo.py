from PIL import Image, ImageOps

# Load the image
img_path = "/Users/faizankhan/Projects/CODE_SJBIT/frontend/public/dentra-logo.jpg"
img = Image.open(img_path).convert("RGBA")

# Get data
datas = img.getdata()

# The background color is peach, let's sample the top-left pixel
bg_color = datas[0]

new_data = []
for item in datas:
    # Calculate distance to background color
    diff = abs(item[0] - bg_color[0]) + abs(item[1] - bg_color[1]) + abs(item[2] - bg_color[2])
    
    # If the pixel is close to the background color (peach), make it transparent
    if diff < 30:
        new_data.append((255, 255, 255, 0))
    else:
        # It's part of the logo. The logo is dark. Let's make it WHITE so it shows up on dark mode.
        # We can just force all non-background pixels to be white (or light gray)
        new_data.append((255, 255, 255, 255))

img.putdata(new_data)

# Crop the transparent borders
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

# Save as PNG
out_path = "/Users/faizankhan/Projects/CODE_SJBIT/frontend/public/dentra-logo-transparent.png"
img.save(out_path, "PNG")
print("Saved cropped and transparent logo!")
