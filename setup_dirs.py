import os
import sys

# Create directory structure
dirs = [
    'd:\\LANDLORDS\\backend',
    'd:\\LANDLORDS\\frontend', 
    'd:\\LANDLORDS\\shared\\types'
]

for dir_path in dirs:
    os.makedirs(dir_path, exist_ok=True)
    print(f"Created: {dir_path}")

print("Directory structure created successfully!")
