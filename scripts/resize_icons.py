import os
from PIL import Image

def resize_android_icons():
    source_path = r"e:\LR-Generator\attached_assets\LOGO_1780855254430.png"
    res_path = r"e:\LR-Generator\LR-WEBAPP\android\app\src\main\res"
    
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return
        
    if not os.path.exists(res_path):
        print(f"Error: Android res folder not found at {res_path}")
        return
        
    print(f"Opening source image: {source_path}")
    source_img = Image.open(source_path)
    
    # Walk the resource directory to find mipmap folders
    replaced_count = 0
    for root, dirs, files in os.walk(res_path):
        if "mipmap" in root:
            for file in files:
                if file.startswith("ic_launcher") and file.endswith(".png"):
                    target_file_path = os.path.join(root, file)
                    try:
                        # Open the existing icon to get its exact dimensions
                        with Image.open(target_file_path) as current_icon:
                            target_size = current_icon.size
                        
                        # Resize source image to the exact target size
                        # Use Resampling.LANCZOS for high quality resizing
                        resized_img = source_img.resize(target_size, Image.Resampling.LANCZOS)
                        
                        # Save back to target file
                        resized_img.save(target_file_path, "PNG")
                        print(f"Replaced: {os.path.relpath(target_file_path, res_path)} with size {target_size}")
                        replaced_count += 1
                    except Exception as e:
                        print(f"Failed to replace {file} in {root}: {e}")
                        
    print(f"Finished. Replaced {replaced_count} icons.")

if __name__ == "__main__":
    resize_android_icons()
