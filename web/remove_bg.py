import os
from PIL import Image

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    
    datas = img.getdata()
    newData = []
    
    # Tolerance for "white"
    threshold = 220
    
    for item in datas:
        # Check if the pixel is near white
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # Make it fully transparent
            newData.append((255, 255, 255, 0))
        else:
            # For non-white, we want to keep it, but to prevent white fringes,
            # we can make the opacity proportional to how dark it is (for anti-aliasing)
            # Or just keep it as is.
            # Simple approach:
            newData.append(item)
            
    img.putdata(newData)
    img.save(out_path, "PNG")

public_dir = r"d:\programming\AksharSetu\web\public"
files = ["books-left-ai.jpg", "books-right-ai.jpg"]

for f in files:
    in_path = os.path.join(public_dir, f)
    out_path = os.path.join(public_dir, f.replace(".jpg", ".png"))
    if os.path.exists(in_path):
        print(f"Processing {f}...")
        remove_white_bg(in_path, out_path)
        # Delete original jpg
        os.remove(in_path)
    else:
        print(f"File {f} not found.")

print("Done!")
