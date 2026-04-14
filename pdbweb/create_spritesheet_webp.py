import os
import json
from PIL import Image
import sys

results_dir = r'D:\trae\solo\ampmodel\bigdata\pdb\pdbweb\results'
output_dir = r'D:\trae\solo\ampmodel\bigdata\pdb\pdbweb'

image_files = sorted([f for f in os.listdir(results_dir) if f.endswith('.webp')])
print(f'Total images: {len(image_files)}')

if not image_files:
    print('No images found')
    exit(1)

sample_img = Image.open(os.path.join(results_dir, image_files[0]))
img_width, img_height = sample_img.size
sample_img.close()

print(f'Single image size: {img_width}x{img_height}')

max_sprites_per_sheet = 2500
sprites_per_row = 50
sprites_per_col = (max_sprites_per_sheet + sprites_per_row - 1) // sprites_per_row

sheet_width = sprites_per_row * img_width
sheet_height = sprites_per_col * img_height

print(f'Each sheet size: {sheet_width}x{sheet_height}')

num_sheets = (len(image_files) + max_sprites_per_sheet - 1) // max_sprites_per_sheet
print(f'Will create {num_sheets} spritesheets')

manifest = {}

for sheet_idx in range(num_sheets):
    start_idx = sheet_idx * max_sprites_per_sheet
    end_idx = min((sheet_idx + 1) * max_sprites_per_sheet, len(image_files))
    sheet_files = image_files[start_idx:end_idx]
    
    print(f'Creating spritesheet {sheet_idx + 1}/{num_sheets} with {len(sheet_files)} images...')
    
    sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    for idx, filename in enumerate(sheet_files):
        accession = filename.replace('.webp', '')
        
        row = idx // sprites_per_row
        col = idx % sprites_per_row
        
        x = col * img_width
        y = row * img_height
        
        img_path = os.path.join(results_dir, filename)
        img = Image.open(img_path)
        
        sheet.paste(img, (x, y))
        img.close()
        
        manifest[accession] = {
            'sheet': sheet_idx,
            'x': x,
            'y': y,
            'width': img_width,
            'height': img_height
        }
        
        if (idx + 1) % 500 == 0:
            print(f'  Processed {idx + 1}/{len(sheet_files)} images')
    
    output_spritesheet = os.path.join(output_dir, f'spritesheet_{sheet_idx}.webp')
    sheet.save(output_spritesheet, 'WEBP', quality=80, method=6)
    sheet.close()
    
    file_size = os.path.getsize(output_spritesheet) / 1024 / 1024
    print(f'  Saved to: {output_spritesheet} ({file_size:.1f} MB)')

output_manifest = os.path.join(output_dir, 'spritesheet_manifest.json')
with open(output_manifest, 'w') as f:
    json.dump(manifest, f, indent=2)

print(f'Manifest saved to: {output_manifest}')
print('Done!')