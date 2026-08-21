import os
from PIL import Image

def remove_background(image_path, output_path, bg_color=(0, 0, 0), tolerance=30):
    """Converte o fundo (preto ou branco) em transparente."""
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Verifica se o pixel está próximo da cor de fundo (RGB)
        if all(abs(item[i] - bg_color[i]) <= tolerance for i in range(3)):
            new_data.append((255, 255, 255, 0)) # Transparente
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"[OK] Processado e salvo em: {output_path}")

def slice_spritesheet(sheet_path, num_frames, output_dir, prefix):
    """Fatia um spritesheet horizontal em frames individuais padronizados."""
    img = Image.open(sheet_path)
    sheet_width, sheet_height = img.size
    frame_width = sheet_width // num_frames
    
    os.makedirs(output_dir, exist_ok=True)
    for i in range(num_frames):
        box = (i * frame_width, 0, (i + 1) * frame_width, sheet_height)
        frame = img.crop(box)
        frame.save(os.path.join(output_dir, f"{prefix}_{i}.png"), "PNG")
    print(f"[OK] {num_frames} frames fatiados em: {output_dir}")

if __name__ == "__main__":
    print("Pipeline de Processamento de Sprites Ativo.")
