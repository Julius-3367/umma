#!/usr/bin/env node

/**
 * Labour Mobility Frontend Verification Script
 * Verifies that all components are properly synchronized and configured
 */

import fs from 'fs';
import path from 'path';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  const color = exists ? 'green' : 'red';
  log(`${status} ${description}`, color);
  return exists;
}

function checkDependency(packagePath, dependency) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const exists =
      packageJson.dependencies?.[dependency] ||
      packageJson.devDependencies?.[dependency];
    const status = exists ? '✅' : '❌';
    const color = exists ? 'green' : 'red';
    log(`${status} ${dependency}${exists ? ` (${exists})` : ''}`, color);
    return exists;
  } catch (error) {
    log(`❌ Cannot read package.json`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 Labour Mobility Frontend Verification\n', 'bold');

  let errors = 0;
  let warnings = 0;

  // Check core files
  log('📁 Core Files:', 'blue');
  if (!checkFile('package.json', 'package.json')) errors++;
  if (!checkFile('src/App.jsx', 'Main App component')) errors++;
  if (!checkFile('src/main.jsx', 'Entry point')) errors++;
  if (!checkFile('index.html', 'HTML template')) errors++;

  // Check essential dependencies
  log('\n📦 Essential Dependencies:', 'blue');
  const packagePath = 'package.json';
  if (!checkDependency(packagePath, 'react')) errors++;
  if (!checkDependency(packagePath, 'react-dom')) errors++;
  if (!checkDependency(packagePath, 'react-router-dom')) errors++;
  if (!checkDependency(packagePath, 'zustand')) errors++;
  if (!checkDependency(packagePath, '@heroicons/react')) errors++;
  if (!checkDependency(packagePath, 'tailwindcss')) errors++;

  // Check UI dependencies
  log('\n🎨 UI Dependencies:', 'blue');
  if (!checkDependency(packagePath, 'recharts')) warnings++;
  if (!checkDependency(packagePath, 'react-circular-progressbar')) warnings++;
  if (!checkDependency(packagePath, '@headlessui/react')) warnings++;
  if (!checkDependency(packagePath, 'notistack')) warnings++;

  // Check dashboard components
  log('\n🏗️  Dashboard Components:', 'blue');
  if (!checkFile('src/pages/admin/AdminDashboard.jsx', 'Admin Dashboard'))
    errors++;
  if (!checkFile('src/pages/candidate/Dashboard.jsx', 'Candidate Dashboard'))
    errors++;
  if (!checkFile('src/pages/recruiter/Dashboard.jsx', 'Recruiter Dashboard'))
    errors++;
  if (!checkFile('src/pages/broker/Dashboard.jsx', 'Broker Dashboard'))
    errors++;
  if (!checkFile('src/pages/trainer/Dashboard.jsx', 'Trainer Dashboard'))
    warnings++;

  // Check essential infrastructure
  log('\n⚙️  Infrastructure:', 'blue');
  if (!checkFile('src/store/authStore.js', 'Auth Store')) errors++;
  if (!checkFile('src/layouts/AppLayout.jsx', 'App Layout')) errors++;
  if (!checkFile('src/components/ProtectedRoute.jsx', 'Protected Route'))
    errors++;
  if (!checkFile('src/api/index.js', 'API Service')) errors++;
  if (!checkFile('src/seed/demoData.js', 'Demo Data')) errors++;

  // Check auth components
  log('\n🔐 Authentication:', 'blue');
  if (!checkFile('src/pages/auth/Login.jsx', 'Login Page')) errors++;
  if (!checkFile('src/pages/auth/Register.jsx', 'Register Page')) warnings++;

  // Check configuration files
  log('\n📄 Configuration:', 'blue');
  if (!checkFile('tailwind.config.js', 'Tailwind Config')) warnings++;
  if (!checkFile('vite.config.js', 'Vite Config')) warnings++;
  if (!checkFile('src/index.css', 'Global Styles')) warnings++;

  // Environment check
  log('\n🌍 Environment:', 'blue');
  const hasEnv = checkFile('.env', 'Environment file');
  if (!hasEnv) {
    log('ℹ️  .env file missing - demo mode will use defaults', 'yellow');
    warnings++;
  }

  // Demo data verification
  log('\n🎭 Demo Data:', 'blue');
  try {
    const demoDataPath = 'src/seed/demoData.js';
    if (fs.existsSync(demoDataPath)) {
      const demoContent = fs.readFileSync(demoDataPath, 'utf8');
      if (demoContent.includes('demoUsers'))
        log('✅ Demo users configured', 'green');
      else {
        log('❌ Demo users missing', 'red');
        errors++;
      }

      if (demoContent.includes('demoCandidates'))
        log('✅ Demo candidates configured', 'green');
      else {
        log('❌ Demo candidates missing', 'red');
        errors++;
      }

      if (demoContent.includes('demoCourses'))
        log('✅ Demo courses configured', 'green');
      else {
        log('❌ Demo courses missing', 'red');
        errors++;
      }

      if (demoContent.includes('mockApiResponses'))
        log('✅ Mock API responses configured', 'green');
      else {
        log('❌ Mock API responses missing', 'red');
        errors++;
      }
    }
  } catch (error) {
    log('❌ Cannot verify demo data', 'red');
    errors++;
  }

  // Summary
  log('\n📊 Verification Summary:', 'bold');

  if (errors === 0 && warnings === 0) {
    log('🎉 Perfect! All components are synchronized and ready.', 'green');
    log('\n🚀 You can now run:', 'blue');
    log('   npm run dev', 'bold');
    log('\n🎭 Demo credentials:', 'blue');
    log('   Admin: admin@labormobility.com / admin123');
    log('   Candidate: candidate@labormobility.com / candidate123');
    log('   Employer: employer@labormobility.com / employer123');
    log('   Broker: broker@labormobility.com / broker123');
  } else {
    if (errors > 0) {
      log(`❌ Found ${errors} critical error(s) that need to be fixed.`, 'red');
    }
    if (warnings > 0) {
      log(
        `⚠️  Found ${warnings} warning(s) that should be addressed.`,
        'yellow'
      );
    }

    log('\n🔧 Recommended fixes:', 'blue');

    if (errors > 0) {
      log('\nCritical fixes needed:', 'red');
      log('1. Install missing dependencies: npm install');
      log('2. Ensure all dashboard components exist');
      log('3. Verify auth store and API services are present');
    }

    if (warnings > 0) {
      log('\nOptional improvements:', 'yellow');
      log('1. Install missing UI dependencies');
      log('2. Create .env file with VITE_DEMO_MODE=true');
      log('3. Add missing dashboard components');
    }
  }

  // Feature summary
  log('\n✨ Available Features:', 'blue');
  log('• Role-based authentication and dashboards');
  log('• Interactive charts and analytics');
  log('• Document management system');
  log('• Real-time notifications');
  log('• Progress tracking and assessments');
  log('• Commission and payment management');
  log('• System health monitoring');
  log('• Mobile-responsive design');

  log('\n📚 For detailed setup instructions, see:', 'blue');
  log('   SETUP.md', 'bold');

  process.exit(errors > 0 ? 1 : 0);
}

main().catch(console.error);
