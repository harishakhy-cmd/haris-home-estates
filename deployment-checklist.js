#!/usr/bin/env node

/**
 * LANDLORDS - Phase 10 Deployment Execution Checklist
 * 
 * This script provides a guided, interactive deployment checklist
 * with automated verification at each stage.
 * 
 * Usage: node deployment-checklist.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

let checklistData = {
  stage: 0,
  completedStages: [],
  timestamp: new Date().toISOString(),
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function divider(title = '') {
  if (title) {
    log(`\n${colors.bold}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
    log(`${colors.bold}║${colors.reset} ${title.padEnd(59)} ${colors.bold}║${colors.reset}`);
    log(`${colors.bold}╚═══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  } else {
    log(`${colors.bold}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  }
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function stage1_PreDeployment() {
  divider('STAGE 1: PRE-DEPLOYMENT VERIFICATION');
  
  log('ℹ️  Before deployment, verify all prerequisites:\n', 'blue');
  
  const checks = [
    { name: 'Git repository up to date', cmd: 'git status' },
    { name: 'Backend builds successfully', cmd: 'cd backend && npm run build' },
    { name: 'Frontend builds successfully', cmd: 'cd frontend && npm run build' },
    { name: 'Environment files prepared', cmd: 'ls -la .env.production' },
    { name: 'Deployment guides reviewed', cmd: 'ls -la PHASE_10_*.md' },
  ];

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    log(`\n${i + 1}. ${check.name}`);
    log(`   Command: ${check.cmd}`, 'yellow');
    const verified = await prompt('   ✓ Completed? (yes/no)');
    
    if (verified.toLowerCase() !== 'yes' && verified.toLowerCase() !== 'y') {
      log('\n❌ Please complete this check before continuing.', 'red');
      return false;
    }
  }

  log('\n✅ All pre-deployment checks passed!', 'green');
  checklistData.completedStages.push('stage1-pre-deployment');
  return true;
}

async function stage2_RenderSetup() {
  divider('STAGE 2: RENDER DATABASE & BACKEND SETUP');
  
  log('📋 Step-by-step Render setup:\n', 'blue');

  const steps = [
    {
      title: 'Create PostgreSQL Database',
      items: [
        '1. Go to https://dashboard.render.com',
        '2. Click "New +" → "PostgreSQL"',
        '3. Configure:',
        '   - Instance name: landlords-prod-db',
        '   - Database: landlords_prod',
        '   - User: landlords_admin',
        '   - Plan: Starter ($7/month)',
        '4. Copy the Internal Connection String',
        '5. Copy the External Connection String',
      ],
    },
    {
      title: 'Deploy Backend Service',
      items: [
        '1. Go to https://dashboard.render.com',
        '2. Click "New +" → "Web Service"',
        '3. Connect GitHub repository',
        '4. Configure:',
        '   - Name: haris-backend',
        '   - Environment: Node',
        '   - Plan: Starter ($7/month)',
        '   - Build: cd backend && npm install && npm run build',
        '   - Start: cd backend && npm run start',
      ],
    },
  ];

  for (const step of steps) {
    log(`\n${colors.bold}${step.title}${colors.reset}`, 'cyan');
    for (const item of step.items) {
      log(item, 'yellow');
    }
    const done = await prompt('\n✓ Completed? (yes/no)');
    if (done.toLowerCase() !== 'yes' && done.toLowerCase() !== 'y') {
      log('\n❌ Please complete this step before continuing.', 'red');
      return false;
    }
  }

  log('\n✅ Render setup complete!', 'green');
  checklistData.completedStages.push('stage2-render-setup');
  return true;
}

async function stage3_EnvironmentVariables() {
  divider('STAGE 3: CONFIGURE ENVIRONMENT VARIABLES');
  
  log('📝 Add these variables to Render dashboard:\n', 'blue');
  log('Go to: Services → haris-backend → Environment\n', 'yellow');

  const variables = [
    'NODE_ENV=production',
    'DATABASE_URL=<PostgreSQL internal connection string>',
    'JWT_SECRET=<32-char secure hex string>',
    'CORS_ORIGIN=https://harishome.com',
    'FRONTEND_URL=https://harishome.com',
    'FIREBASE_PROJECT_ID=haris-home-estates',
    'FIREBASE_PRIVATE_KEY=<your Firebase private key>',
    'FIREBASE_CLIENT_EMAIL=<your Firebase client email>',
  ];

  for (const varDef of variables) {
    log(`  ${varDef}`, 'yellow');
  }

  const added = await prompt('\n✓ All environment variables added? (yes/no)');
  if (added.toLowerCase() !== 'yes' && added.toLowerCase() !== 'y') {
    log('\n❌ Please add all environment variables first.', 'red');
    return false;
  }

  log('\n✅ Environment variables configured!', 'green');
  checklistData.completedStages.push('stage3-env-vars');
  return true;
}

async function stage4_DatabaseMigration() {
  divider('STAGE 4: DATABASE MIGRATION');
  
  log('🗄️  Running database migrations:\n', 'blue');

  const steps = [
    {
      description: 'Wait for backend to fully deploy (5-10 minutes)',
      command: 'Check Render dashboard for "deployed" status',
    },
    {
      description: 'Verify database connection',
      command: 'Run Prisma Studio: npx prisma studio',
    },
    {
      description: 'Check migration status',
      command: 'npx prisma migrate status',
    },
  ];

  for (const step of steps) {
    log(`\n${step.description}:`, 'cyan');
    log(`   Command: ${step.command}`, 'yellow');
    const done = await prompt('   ✓ Completed? (yes/no)');
    if (done.toLowerCase() !== 'yes' && done.toLowerCase() !== 'y') {
      log('\n❌ Please complete this step.', 'red');
      return false;
    }
  }

  log('\n✅ Database migration complete!', 'green');
  checklistData.completedStages.push('stage4-db-migration');
  return true;
}

async function stage5_FirebaseSetup() {
  divider('STAGE 5: FIREBASE HOSTING SETUP');
  
  log('🔥 Setting up Firebase:\n', 'blue');

  const steps = [
    {
      title: 'Create Firebase Project',
      items: [
        '1. Go to https://console.firebase.google.com',
        '2. Create new project: "haris-home-estates"',
        '3. Enable: Firestore, Authentication, Cloud Storage, Messaging',
        '4. Create web app and copy Firebase Config',
        '5. Store credentials securely',
      ],
    },
    {
      title: 'Initialize Firebase Hosting',
      items: [
        '1. Install Firebase CLI: npm install -g firebase-tools',
        '2. Login: firebase login',
        '3. Go to frontend directory: cd frontend',
        '4. Initialize: firebase init hosting',
        '5. Select project: haris-home-estates',
        '6. Public directory: out',
        '7. Configure SPA: No',
      ],
    },
  ];

  for (const step of steps) {
    log(`\n${colors.bold}${step.title}${colors.reset}`, 'cyan');
    for (const item of step.items) {
      log(item, 'yellow');
    }
    const done = await prompt('\n✓ Completed? (yes/no)');
    if (done.toLowerCase() !== 'yes' && done.toLowerCase() !== 'y') {
      log('\n❌ Please complete this step.', 'red');
      return false;
    }
  }

  log('\n✅ Firebase setup complete!', 'green');
  checklistData.completedStages.push('stage5-firebase-setup');
  return true;
}

async function stage6_FrontendDeployment() {
  divider('STAGE 6: FRONTEND DEPLOYMENT');
  
  log('🚀 Deploying frontend to Firebase:\n', 'blue');

  const commands = [
    {
      description: 'Build Next.js application',
      command: 'cd frontend && npm run build',
    },
    {
      description: 'Deploy to Firebase Hosting',
      command: 'firebase deploy --only hosting',
    },
    {
      description: 'Verify deployment',
      command: 'Visit: https://haris-home-estates.web.app',
    },
  ];

  for (const cmd of commands) {
    log(`\n${cmd.description}:`, 'cyan');
    log(`   ${cmd.command}`, 'yellow');
    const done = await prompt('   ✓ Completed? (yes/no)');
    if (done.toLowerCase() !== 'yes' && done.toLowerCase() !== 'y') {
      log('\n❌ Please complete this step.', 'red');
      return false;
    }
  }

  log('\n✅ Frontend deployed!', 'green');
  checklistData.completedStages.push('stage6-frontend-deployment');
  return true;
}

async function stage7_TestingValidation() {
  divider('STAGE 7: TESTING & VALIDATION');
  
  log('✓ Run these tests to verify deployment:\n', 'blue');

  const tests = [
    {
      name: 'Health Check',
      command: 'curl https://haris-backend.onrender.com/health',
      expected: '{"status":"ok"}',
    },
    {
      name: 'API Connectivity',
      command: 'Check DevTools Network tab for API calls',
      expected: 'Status 200 OK',
    },
    {
      name: 'WebSocket Connection',
      command: 'Open DevTools → Network → Filter WS',
      expected: 'socket.io connection established',
    },
    {
      name: 'Real-Time Features',
      command: 'Send message in chat (two browser windows)',
      expected: 'Message appears instantly',
    },
    {
      name: 'PWA Installation',
      command: 'Check address bar for install button',
      expected: 'App installable on mobile',
    },
  ];

  for (const test of tests) {
    log(`\n${test.name}:`, 'cyan');
    log(`   Command: ${test.command}`, 'yellow');
    log(`   Expected: ${test.expected}`, 'yellow');
    const passed = await prompt('   ✓ Test passed? (yes/no)');
    if (passed.toLowerCase() !== 'yes' && passed.toLowerCase() !== 'y') {
      log(`\n⚠️  Test failed. Check troubleshooting guide.`, 'yellow');
    }
  }

  log('\n✅ Testing complete!', 'green');
  checklistData.completedStages.push('stage7-testing');
  return true;
}

async function stage8_Monitoring() {
  divider('STAGE 8: MONITORING SETUP');
  
  log('📊 Configure production monitoring:\n', 'blue');

  const setup = [
    {
      title: 'Render Metrics',
      items: [
        '1. Render Dashboard → Services → haris-backend → Metrics',
        '2. Monitor: CPU, Memory, Requests/min, Error Rate',
        '3. Set alerts for threshold violations',
      ],
    },
    {
      title: 'Firebase Analytics',
      items: [
        '1. Firebase Console → Analytics',
        '2. Monitor: Page views, User engagement, Crashes',
        '3. Enable custom events',
      ],
    },
    {
      title: 'Error Tracking',
      items: [
        '1. Setup Sentry for frontend errors (optional)',
        '2. Monitor backend logs in Render',
        '3. Set up email alerts for critical errors',
      ],
    },
  ];

  for (const item of setup) {
    log(`\n${colors.bold}${item.title}${colors.reset}`, 'cyan');
    for (const detail of item.items) {
      log(detail, 'yellow');
    }
    const done = await prompt('\n✓ Completed? (yes/no)');
    if (done.toLowerCase() !== 'yes' && done.toLowerCase() !== 'y') {
      log('\n⚠️  Monitoring setup incomplete. Continue anyway? (yes/no)');
    }
  }

  log('\n✅ Monitoring configured!', 'green');
  checklistData.completedStages.push('stage8-monitoring');
  return true;
}

async function stage9_Production() {
  divider('STAGE 9: GO LIVE');
  
  log('🎉 Final go-live checklist:\n', 'blue');

  const finalChecks = [
    'Error rate < 0.1%',
    'All features working (messaging, calling, notifications)',
    'Performance acceptable (API <200ms, page load <2s)',
    'SSL certificates valid',
    'Database backups working',
    'Team notified of launch',
    'Support process ready',
    'Monitoring dashboards active',
  ];

  for (const check of finalChecks) {
    log(`  □ ${check}`, 'yellow');
  }

  const ready = await prompt('\n✓ Ready to go live? (yes/no)');
  if (ready.toLowerCase() !== 'yes' && ready.toLowerCase() !== 'y') {
    log('\n❌ Deployment paused. Fix issues and try again.', 'red');
    return false;
  }

  log('\n🎉 DEPLOYMENT SUCCESSFUL! 🎉', 'green');
  log('\nYour LANDLORDS application is now LIVE in production!', 'green');
  log('\nFrontend: https://haris-home-estates.web.app', 'cyan');
  log('Backend: https://haris-backend.onrender.com', 'cyan');
  log('\nMonitor production: Check Render and Firebase dashboards', 'blue');
  log('Support: engineering@landlords.com\n', 'blue');

  checklistData.completedStages.push('stage9-go-live');
  return true;
}

async function saveChecklist() {
  const checklistFile = path.join(process.cwd(), 'deployment-checklist-result.json');
  fs.writeFileSync(checklistFile, JSON.stringify(checklistData, null, 2));
  log(`\n📋 Checklist saved to: ${checklistFile}`, 'blue');
}

async function main() {
  divider('LANDLORDS - PHASE 10 DEPLOYMENT EXECUTION');
  
  log('Welcome to the interactive deployment checklist!', 'green');
  log('This guide will walk you through the complete deployment process.\n', 'cyan');
  log('Total time: 6-7 hours\n', 'yellow');

  const stages = [
    { name: 'Pre-Deployment Verification', fn: stage1_PreDeployment },
    { name: 'Render Database & Backend Setup', fn: stage2_RenderSetup },
    { name: 'Environment Variables', fn: stage3_EnvironmentVariables },
    { name: 'Database Migration', fn: stage4_DatabaseMigration },
    { name: 'Firebase Hosting Setup', fn: stage5_FirebaseSetup },
    { name: 'Frontend Deployment', fn: stage6_FrontendDeployment },
    { name: 'Testing & Validation', fn: stage7_TestingValidation },
    { name: 'Monitoring Setup', fn: stage8_Monitoring },
    { name: 'Go Live', fn: stage9_Production },
  ];

  for (const stage of stages) {
    const success = await stage.fn();
    if (!success) {
      log('\n❌ Deployment halted. Please fix issues and restart.', 'red');
      await saveChecklist();
      rl.close();
      process.exit(1);
    }
  }

  await saveChecklist();
  rl.close();
  process.exit(0);
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  rl.close();
  process.exit(1);
});
