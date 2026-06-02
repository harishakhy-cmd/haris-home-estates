import os

# Create NestJS backend directory structure
dirs = [
    'd:\\LANDLORDS\\backend\\src',
    'd:\\LANDLORDS\\backend\\src\\auth',
    'd:\\LANDLORDS\\backend\\src\\users',
    'd:\\LANDLORDS\\backend\\src\\properties',
    'd:\\LANDLORDS\\backend\\src\\search',
    'd:\\LANDLORDS\\backend\\src\\favorites',
    'd:\\LANDLORDS\\backend\\src\\bookings',
    'd:\\LANDLORDS\\backend\\src\\messaging',
    'd:\\LANDLORDS\\backend\\src\\admin',
    'd:\\LANDLORDS\\backend\\src\\common',
    'd:\\LANDLORDS\\backend\\src\\common\\decorators',
    'd:\\LANDLORDS\\backend\\src\\common\\guards',
    'd:\\LANDLORDS\\backend\\src\\common\\middleware',
    'd:\\LANDLORDS\\backend\\src\\common\\exceptions',
    'd:\\LANDLORDS\\backend\\src\\database',
    'd:\\LANDLORDS\\backend\\prisma',
    'd:\\LANDLORDS\\backend\\test'
]

print('Creating NestJS backend directory structure...\n')

created_count = 0
skipped_count = 0

for dir_path in dirs:
    try:
        if not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
            print(f'✓ Created: {dir_path}')
            created_count += 1
        else:
            print(f'- Exists: {dir_path}')
            skipped_count += 1
    except Exception as err:
        print(f'✗ Error creating {dir_path}: {err}')

print(f'\n✅ Done! Created: {created_count}, Already existed: {skipped_count}')
