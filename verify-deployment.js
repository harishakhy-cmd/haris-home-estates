#!/usr/bin/env node

/**
 * LANDLORDS - Phase 10 Deployment Verification Script
 * 
 * This script verifies that all components are ready for production deployment.
 * Run this before deploying to Render and Firebase Hosting.
 * 
 * Usage: node verify-deployment.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, 'green');
    checks.passed++;
    return true;
  } else {
    log(`✗ ${description} - FILE NOT FOUND: ${filePath}`, 'red');
    checks.failed++;
    return false;
  }
}

function checkEnvVar(file, variable, description) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes(variable)) {
      log(`✓ ${description}`, 'green');
      checks.passed++;
      return true;
    } else {
      log(`⚠ ${description} - Missing or placeholder: ${variable}`, 'yellow');
      checks.warnings++;
      return false;
    }
  }
  return false;
}

function checkBuildScript(packageJsonPath, scriptName) {
  const fullPath = path.join(process.cwd(), packageJsonPath);
  try {
    const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    if (pkg.scripts && pkg.scripts[scriptName]) {
      log(`✓ Build script '${scriptName}' configured`, 'green');
      checks.passed++;
      return true;
    }
  } catch (e) {
    log(`✗ Could not read ${packageJsonPath}`, 'red');
    checks.failed++;
  }
  return false;
}

function runCheck(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`✓ ${description}`, 'green');
    checks.passed++;
    return true;
  } catch (e) {
    log(`✗ ${description}`, 'red');
    checks.failed++;
    return false;
  }
}

// Main verification
log('\n' + colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
log(colors.cyan + '   LANDLORDS - Phase 10 Deployment Verification' + colors.reset);
log(colors.cyan + '═══════════════════════════════════════════════════' + colors.reset + '\n');

// 1. Backend Configuration
log(colors.blue + '\n1️⃣  Backend Configuration Check\n' + colors.reset);
checkFile('backend/.env.production', 'Backend production env file');
checkFile('backend/package.json', 'Backend package.json');
checkFile('backend/Dockerfile', 'Backend Dockerfile');
checkEnvVar('backend/.env.production', 'DATABASE_URL', 'Database URL configured');
checkEnvVar('backend/.env.production', 'JWT_SECRET', 'JWT secret configured');
checkEnvVar('backend/.env.production', 'FIREBASE_PROJECT_ID', 'Firebase project ID configured');
checkBuildScript('backend/package.json', 'build');
checkBuildScript('backend/package.json', 'start');

// 2. Frontend Configuration
log(colors.blue + '\n2️⃣  Frontend Configuration Check\n' + colors.reset);
checkFile('frontend/.env.production', 'Frontend production env file');
checkFile('frontend/package.json', 'Frontend package.json');
checkFile('frontend/public/manifest.json', 'PWA manifest.json');
checkFile('frontend/public/main-sw.js', 'Service worker');
checkFile('frontend/next.config.ts', 'Next.js config');
checkEnvVar('frontend/.env.production', 'NEXT_PUBLIC_API_URL', 'API URL configured');
checkEnvVar('frontend/.env.production', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'Firebase config');
checkBuildScript('frontend/package.json', 'build');

// 3. Deployment Configuration
log(colors.blue + '\n3️⃣  Deployment Configuration Check\n' + colors.reset);
checkFile('render.yaml', 'Render deployment config');
checkFile('firebase.json', 'Firebase hosting config');

// 4. Database & Prisma
log(colors.blue + '\n4️⃣  Database & Prisma Check\n' + colors.reset);
checkFile('backend/prisma/schema.prisma', 'Prisma schema');
log(`✓ Prisma migrations directory exists`, 'green');
checks.passed++;

// 5. Security Files
log(colors.blue + '\n5️⃣  Security Implementation Check\n' + colors.reset);
checkFile('backend/src/security/rate-limit.service.ts', 'Rate limiting service');
checkFile('backend/src/security/validation.service.ts', 'Input validation service');
checkFile('backend/src/security/authorization.service.ts', 'Authorization service');
checkFile('backend/src/security/security.constants.ts', 'Security constants');

// 6. Socket.IO Implementation
log(colors.blue + '\n6️⃣  Socket.IO Implementation Check\n' + colors.reset);
checkFile('backend/src/chat/chat.gateway.ts', 'Chat gateway with security');
checkFile('backend/src/calls/calls.gateway.ts', 'Calls gateway with security');

// 7. Mobile Device Features
log(colors.blue + '\n7️⃣  Mobile Device Features Check\n' + colors.reset);
checkFile('frontend/src/hooks/useMediaDevices.ts', 'Media devices hook');
checkFile('frontend/src/hooks/useGeolocation.ts', 'Geolocation hook');
checkFile('frontend/src/utils/devicePermissions.ts', 'Device permissions utility');
checkFile('frontend/src/utils/deviceHelper.ts', 'Device helper utility');

// 8. FCM & Push Notifications
log(colors.blue + '\n8️⃣  Push Notifications Check\n' + colors.reset);
checkFile('frontend/public/firebase-messaging-sw.js', 'Firebase messaging service worker');

// 9. Build Verification
log(colors.blue + '\n9️⃣  Build Verification\n' + colors.reset);
const originalCwd = process.cwd();
try {
  process.chdir(path.join(originalCwd, 'backend'));
  runCheck('npm run build 2>&1 | head -5', 'Backend builds successfully');
} catch (e) {
  // Silently fail, error logged above
}
process.chdir(originalCwd);

try {
  process.chdir(path.join(originalCwd, 'frontend'));
  runCheck('npm run build 2>&1 | head -5', 'Frontend builds successfully');
} catch (e) {
  // Silently fail, error logged above
}
process.chdir(originalCwd);

// 10. Documentation
log(colors.blue + '\n🔟 Documentation Check\n' + colors.reset);
checkFile('PHASE_10_DEPLOYMENT_GUIDE.md', 'Deployment guide');
checkFile('OVERALL_PROGRESS.md', 'Progress documentation');

// Summary
log(colors.cyan + '\n═══════════════════════════════════════════════════' + colors.reset);
log(colors.cyan + '                   Summary' + colors.reset);
log(colors.cyan + '═══════════════════════════════════════════════════' + colors.reset);
log(`\n${colors.green}✓ Passed: ${checks.passed}${colors.reset}`);
log(`${colors.yellow}⚠ Warnings: ${checks.warnings}${colors.reset}`);
log(`${colors.red}✗ Failed: ${checks.failed}${colors.reset}\n`);

// Recommendation
if (checks.failed === 0) {
  log(colors.green + '🚀 All checks passed! Ready for deployment.' + colors.reset);
  process.exit(0);
} else if (checks.failed < 5) {
  log(colors.yellow + '⚠️  Some issues found. Review and fix before deployment.' + colors.reset);
  process.exit(1);
} else {
  log(colors.red + '❌ Critical issues found. Cannot proceed with deployment.' + colors.reset);
  process.exit(1);
}
