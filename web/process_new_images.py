import os
import shutil
from PIL import Image

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    threshold = 220
    for item in datas:
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    img.save(out_path, "PNG")

artifacts_dir = r"C:\Users\TANIS\.gemini\antigravity-ide\brain\568c2162-0c67-431a-9e9e-dd3e569eb37f"
public_dir = r"d:\programming\AksharSetu\web\public"

images = {
    "books_plant_sketch_1790077111531.jpg": "doodle-plant-books.png",
    "books_glasses_sketch_1790077133676.jpg": "doodle-glasses-books.png",
    "books_bulb_sketch_1790077150216.jpg": "doodle-bulb-books.png",
    "books_airplane_sketch_1790077170407.jpg": "doodle-airplane-books.png"
}

for src_name, dest_name in images.items():
    src_path = os.path.join(artifacts_dir, src_name)
    dest_path = os.path.join(public_dir, dest_name)
    if os.path.exists(src_path):
        print(f"Processing {src_name} -> {dest_name}")
        remove_white_bg(src_path, dest_path)
    else:
        print(f"File not found: {src_path}")

print("Done!")
