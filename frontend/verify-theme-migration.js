#!/usr/bin/env node

/**
 * Theme Migration Verification Script
 *
 * This script verifies that the UMSL Labor Mobility Platform has been
 * successfully migrated from Tailwind CSS to Material-UI theme system.
 *
 * Usage: node verify-theme-migration.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to colorize console output
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;

// Test results storage
let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Add test result
function addResult(test, status, message, details = null) {
  testResults.details.push({ test, status, message, details });
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else if (status === 'WARN') testResults.warnings++;
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

// Find files matching pattern
function findFiles(dir, pattern) {
  const files = [];

  function searchDir(directory) {
    try {
      const items = fs.readdirSync(path.join(__dirname, directory));

      for (const item of items) {
        const fullPath = path.join(directory, item);
        const fullSystemPath = path.join(__dirname, fullPath);

        if (fs.statSync(fullSystemPath).isDirectory()) {
          searchDir(fullPath);
        } else if (pattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  searchDir(dir);
  return files;
}

// Check for Tailwind CSS usage
function checkTailwindUsage(filePath) {
  const content = readFile(filePath);
  if (!content) return { found: false, matches: [] };

  const tailwindPatterns = [
    /className="[^"]*(?:bg-|text-|border-|p-|m-|w-|h-|flex|grid|rounded)/g,
    /className='[^']*(?:bg-|text-|border-|p-|m-|w-|h-|flex|grid|rounded)/g,
  ];

  const matches = [];
  tailwindPatterns.forEach(pattern => {
    const found = content.match(pattern);
    if (found) matches.push(...found);
  });

  return { found: matches.length > 0, matches };
}

// Check for Material-UI usage
function checkMaterialUIUsage(filePath) {
  const content = readFile(filePath);
  if (!content) return { found: false, imports: [], components: [] };

  const muiImportPattern = /import\s+{[^}]+}\s+from\s+['"]@mui\/material/g;
  const muiHookPattern = /import\s+{[^}]+}\s+from\s+['"]@mui\/material\/styles/g;
  const useThemePattern = /useTheme\(\)/g;
  const sxPattern = /sx=\{/g;

  const imports = [
    ...(content.match(muiImportPattern) || []),
    ...(content.match(muiHookPattern) || [])
  ];

  const components = [
    ...(content.match(useThemePattern) || []),
    ...(content.match(sxPattern) || [])
  ];

  return {
    found: imports.length > 0 || components.length > 0,
    imports,
    components
  };
}

// Main verification function
function verifyThemeMigration() {
  console.log(colorize('\n🎨 UMSL Labor Mobility - Theme Migration Verification', 'cyan'));
  console.log(colorize('=' .repeat(60), 'blue'));

  // Test 1: Check theme.js exists and is comprehensive
  console.log(colorize('\n📋 1. Checking Theme Configuration...', 'yellow'));

  if (fileExists('src/theme/theme.js')) {
    const themeContent = readFile('src/theme/theme.js');
  const hasUMSLColors = themeContent.includes('#3B82F6') && themeContent.includes('#78BE21');
    const hasCustomPalette = themeContent.includes('custom:');
    const hasTypography = themeContent.includes('typography:');
    const hasComponents = themeContent.includes('components:');

    if (hasUMSLColors && hasCustomPalette && hasTypography && hasComponents) {
      addResult('Theme Configuration', 'PASS', 'Comprehensive theme.js found with UMSL colors');
    } else {
      addResult('Theme Configuration', 'WARN', 'theme.js exists but may be incomplete');
    }
  } else {
    addResult('Theme Configuration', 'FAIL', 'theme.js not found');
  }

  // Test 2: Check ThemeProvider setup
  console.log(colorize('\n🎭 2. Checking Theme Provider...', 'yellow'));

  if (fileExists('src/providers/ThemeProvider.jsx')) {
    const providerContent = readFile('src/providers/ThemeProvider.jsx');
    const hasThemeImport = providerContent.includes('theme.js');
    const hasMuiProvider = providerContent.includes('ThemeProvider');

    if (hasThemeImport && hasMuiProvider) {
      addResult('Theme Provider', 'PASS', 'ThemeProvider.jsx properly configured');
    } else {
      addResult('Theme Provider', 'WARN', 'ThemeProvider.jsx exists but may need review');
    }
  } else {
    addResult('Theme Provider', 'FAIL', 'ThemeProvider.jsx not found');
  }

  // Test 3: Check for themed dashboard components
  console.log(colorize('\n🏠 3. Checking Dashboard Components...', 'yellow'));

  const expectedDashboards = [
    'src/pages/admin/AdminDashboard.jsx',
    'src/pages/candidate/Dashboard.jsx',
    'src/pages/trainer/Dashboard.jsx',
    'src/pages/recruiter/Dashboard.jsx',
    'src/pages/broker/Dashboard.jsx',
  ];

  let dashboardsFound = 0;
  let themedDashboards = 0;

  expectedDashboards.forEach(dashboard => {
    if (fileExists(dashboard)) {
      dashboardsFound++;
      const muiUsage = checkMaterialUIUsage(dashboard);
      const tailwindUsage = checkTailwindUsage(dashboard);

      if (muiUsage.found && !tailwindUsage.found) {
        themedDashboards++;
        addResult(`Dashboard: ${path.basename(dashboard)}`, 'PASS', 'Uses Material-UI theme');
      } else if (muiUsage.found && tailwindUsage.found) {
        addResult(`Dashboard: ${path.basename(dashboard)}`, 'WARN', 'Mixed Material-UI and Tailwind usage');
      } else if (tailwindUsage.found) {
        addResult(`Dashboard: ${path.basename(dashboard)}`, 'FAIL', 'Still uses Tailwind CSS');
      } else {
        addResult(`Dashboard: ${path.basename(dashboard)}`, 'WARN', 'No clear styling system detected');
      }
    } else {
      addResult(`Dashboard: ${path.basename(dashboard)}`, 'FAIL', 'Dashboard file not found');
    }
  });

  // Test 4: Check for themed layout components
  console.log(colorize('\n🗂️ 4. Checking Layout Components...', 'yellow'));

  if (fileExists('src/layouts/AppLayout.jsx')) {
    const layoutContent = readFile('src/layouts/AppLayout.jsx');
    const muiUsage = checkMaterialUIUsage('src/layouts/AppLayout.jsx');
    const tailwindUsage = checkTailwindUsage('src/layouts/AppLayout.jsx');

    if (muiUsage.found && !tailwindUsage.found) {
      addResult('AppLayout', 'PASS', 'Uses Material-UI theme system');
    } else {
      addResult('AppLayout', 'WARN', 'May need theme integration review');
    }
  } else {
    addResult('AppLayout', 'FAIL', 'AppLayout.jsx not found');
  }

  // Test 5: Scan for remaining Tailwind usage
  console.log(colorize('\n🔍 5. Scanning for Remaining Tailwind Usage...', 'yellow'));

  const jsxFiles = findFiles('src', /\.(jsx|js|tsx|ts)$/);
  let tailwindFiles = [];

  jsxFiles.forEach(file => {
    const tailwindUsage = checkTailwindUsage(file);
    if (tailwindUsage.found) {
      tailwindFiles.push({
        file,
        matches: tailwindUsage.matches.slice(0, 3) // First 3 matches
      });
    }
  });

  if (tailwindFiles.length === 0) {
    addResult('Tailwind Cleanup', 'PASS', 'No Tailwind CSS usage found');
  } else {
    addResult('Tailwind Cleanup', 'FAIL', `Found Tailwind usage in ${tailwindFiles.length} files`);
  }

  // Test 6: Check for Material-UI adoption
  console.log(colorize('\n⚡ 6. Checking Material-UI Adoption...', 'yellow'));

  let muiFiles = 0;
  let totalReactFiles = 0;

  jsxFiles.forEach(file => {
    // Skip test files, node_modules, etc.
    if (file.includes('node_modules') || file.includes('.test.') || file.includes('.spec.')) {
      return;
    }

    totalReactFiles++;
    const muiUsage = checkMaterialUIUsage(file);
    if (muiUsage.found) {
      muiFiles++;
    }
  });

  const adoptionRate = totalReactFiles > 0 ? (muiFiles / totalReactFiles * 100).toFixed(1) : 0;

  if (adoptionRate >= 80) {
    addResult('Material-UI Adoption', 'PASS', `${adoptionRate}% of components use Material-UI`);
  } else if (adoptionRate >= 50) {
    addResult('Material-UI Adoption', 'WARN', `${adoptionRate}% of components use Material-UI`);
  } else {
    addResult('Material-UI Adoption', 'FAIL', `Only ${adoptionRate}% of components use Material-UI`);
  }

  // Test 7: Check for required dependencies
  console.log(colorize('\n📦 7. Checking Dependencies...', 'yellow'));

  if (fileExists('package.json')) {
    const packageJson = JSON.parse(readFile('package.json'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      '@mui/material',
      '@emotion/react',
      '@emotion/styled'
    ];

    const missingDeps = requiredDeps.filter(dep => !deps[dep]);

    if (missingDeps.length === 0) {
      addResult('Dependencies', 'PASS', 'All required Material-UI dependencies found');
    } else {
      addResult('Dependencies', 'FAIL', `Missing dependencies: ${missingDeps.join(', ')}`);
    }
  } else {
    addResult('Dependencies', 'FAIL', 'package.json not found');
  }

  // Test 8: Check for migration documentation
  console.log(colorize('\n📚 8. Checking Documentation...', 'yellow'));

  const docFiles = [
    'THEME_MIGRATION_GUIDE.md',
    'THEME_IMPLEMENTATION_SUMMARY.md',
    'src/utils/themeValidator.js'
  ];

  let foundDocs = 0;
  docFiles.forEach(doc => {
    if (fileExists(doc)) {
      foundDocs++;
      addResult(`Documentation: ${doc}`, 'PASS', 'Found');
    } else {
      addResult(`Documentation: ${doc}`, 'WARN', 'Not found');
    }
  });

  // Generate final report
  console.log(colorize('\n📊 Migration Verification Results', 'cyan'));
  console.log(colorize('=' .repeat(60), 'blue'));

  testResults.details.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    const color = result.status === 'PASS' ? 'green' : result.status === 'FAIL' ? 'red' : 'yellow';
    console.log(`${icon} ${colorize(result.test, color)}: ${result.message}`);
  });

  // Summary
  console.log(colorize('\n📋 Summary', 'cyan'));
  console.log(colorize('-' .repeat(30), 'blue'));
  console.log(`${colorize('✅ Passed:', 'green')} ${testResults.passed}`);
  console.log(`${colorize('⚠️  Warnings:', 'yellow')} ${testResults.warnings}`);
  console.log(`${colorize('❌ Failed:', 'red')} ${testResults.failed}`);

  const totalTests = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = totalTests > 0 ? (testResults.passed / totalTests * 100).toFixed(1) : 0;

  console.log(`\n${colorize('Overall Success Rate:', 'cyan')} ${successRate}%`);

  // Final verdict
  if (testResults.failed === 0 && testResults.warnings <= 2) {
    console.log(colorize('\n🎉 MIGRATION SUCCESSFUL!', 'green'));
    console.log(colorize('The theme migration appears to be complete and successful.', 'green'));
  } else if (testResults.failed <= 2) {
    console.log(colorize('\n⚠️ MIGRATION MOSTLY COMPLETE', 'yellow'));
    console.log(colorize('Minor issues detected. Review the warnings and failures above.', 'yellow'));
  } else {
    console.log(colorize('\n❌ MIGRATION INCOMPLETE', 'red'));
    console.log(colorize('Significant issues detected. Migration may need additional work.', 'red'));
  }

  // Tailwind cleanup report
  if (tailwindFiles.length > 0) {
    console.log(colorize('\n🧹 Files Still Using Tailwind CSS:', 'yellow'));
    tailwindFiles.slice(0, 10).forEach(item => {
      console.log(`   • ${item.file}`);
      item.matches.slice(0, 2).forEach(match => {
        console.log(`     - ${match.substring(0, 60)}...`);
      });
    });

    if (tailwindFiles.length > 10) {
      console.log(`   ... and ${tailwindFiles.length - 10} more files`);
    }
  }

  console.log(colorize('\n🔧 Next Steps:', 'cyan'));
  if (testResults.failed > 0) {
    console.log('1. Address the failed tests listed above');
    console.log('2. Review THEME_MIGRATION_GUIDE.md for guidance');
  }
  if (tailwindFiles.length > 0) {
    console.log('3. Remove remaining Tailwind CSS usage');
    console.log('4. Convert remaining components to Material-UI');
  }
  console.log('5. Test the application thoroughly');
  console.log('6. Deploy to staging for validation\n');

  // Exit with appropriate code
  process.exit(testResults.failed > 3 ? 1 : 0);
}

// Run the verification
verifyThemeMigration();
