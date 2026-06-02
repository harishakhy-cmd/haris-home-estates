const fs = require('fs');
const path = require('path');

// Create NestJS backend directory structure
const dirs = [
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
];

console.log('Creating NestJS backend directory structure...\n');

let createdCount = 0;
let skippedCount = 0;

dirs.forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created: ${dir}`);
      createdCount++;
    } else {
      console.log(`- Exists: ${dir}`);
      skippedCount++;
    }
  } catch (err) {
    console.error(`✗ Error creating ${dir}: ${err.message}`);
  }
});

console.log(`\n✅ Done! Created: ${createdCount}, Already existed: ${skippedCount}`);
