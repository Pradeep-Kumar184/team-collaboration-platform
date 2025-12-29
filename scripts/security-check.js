#!/usr/bin/env node

/**
 * Security Check Script
 * Verifies that the project is properly configured for secure deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Team Collaboration Platform - Security Check\n');

let hasErrors = false;
let hasWarnings = false;

function checkError(condition, message) {
  if (!condition) {
    console.log(`❌ ERROR: ${message}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${message}`);
  }
}

function checkWarning(condition, message) {
  if (!condition) {
    console.log(`⚠️  WARNING: ${message}`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${message}`);
  }
}

// Check if .env files exist
console.log('📁 Checking Environment Files...');
checkError(
  fs.existsSync('backend/.env.example'),
  'Backend .env.example exists'
);
checkError(
  fs.existsSync('frontend/.env.example'),
  'Frontend .env.example exists'
);
checkWarning(
  !fs.existsSync('backend/.env') || process.env.NODE_ENV === 'development',
  'Backend .env file should not exist in repository (development only)'
);
checkWarning(
  !fs.existsSync('frontend/.env') || process.env.NODE_ENV === 'development',
  'Frontend .env file should not exist in repository (development only)'
);

// Check .gitignore
console.log('\n📝 Checking .gitignore Configuration...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  checkError(gitignore.includes('.env'), '.gitignore includes .env files');
  checkError(gitignore.includes('node_modules'), '.gitignore includes node_modules');
  checkError(gitignore.includes('build/'), '.gitignore includes build directories');
} else {
  checkError(false, '.gitignore file exists');
}

// Check for hardcoded secrets in common files
console.log('\n🔍 Checking for Hardcoded Secrets...');
const filesToCheck = [
  'backend/server.js',
  'backend/config/db.js',
  'backend/config/firebase.js',
  'frontend/src/services/firebase.js'
];

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common secret patterns
    const secretPatterns = [
      /mongodb\+srv:\/\/[^:]+:[^@]+@/i, // MongoDB connection string with credentials
      /AIza[0-9A-Za-z-_]{35}/, // Firebase API key pattern
      /"private_key":\s*"-----BEGIN PRIVATE KEY-----/, // Firebase private key
      /sk_live_[0-9A-Za-z]{24}/, // Stripe live key
      /pk_live_[0-9A-Za-z]{24}/, // Stripe publishable key
    ];
    
    let hasSecrets = false;
    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasSecrets = true;
      }
    });
    
    checkError(!hasSecrets, `${filePath} - No hardcoded secrets found`);
  }
});

// Check package.json for security
console.log('\n📦 Checking Package Configuration...');
if (fs.existsSync('backend/package.json')) {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  checkWarning(
    backendPkg.scripts && backendPkg.scripts.start,
    'Backend has start script defined'
  );
}

if (fs.existsSync('frontend/package.json')) {
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  checkWarning(
    frontendPkg.scripts && frontendPkg.scripts.build,
    'Frontend has build script defined'
  );
}

// Check documentation
console.log('\n📚 Checking Documentation...');
checkError(fs.existsSync('README.md'), 'README.md exists');
checkError(fs.existsSync('DEPLOYMENT.md'), 'DEPLOYMENT.md exists');
checkError(fs.existsSync('SECURITY.md'), 'SECURITY.md exists');
checkError(fs.existsSync('PRODUCTION_CHECKLIST.md'), 'PRODUCTION_CHECKLIST.md exists');

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ SECURITY CHECK FAILED');
  console.log('Please fix the errors above before deploying to production.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  SECURITY CHECK PASSED WITH WARNINGS');
  console.log('Please review the warnings above.');
  process.exit(0);
} else {
  console.log('✅ SECURITY CHECK PASSED');
  console.log('Your project is ready for secure deployment!');
  process.exit(0);
}