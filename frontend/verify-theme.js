#!/usr/bin/env node

/**
 * Theme Verification Script for UMSL Labor Mobility Platform
 *
 * This script verifies that:
 * 1. Theme files are properly structured
 * 2. All required theme properties are defined
 * 3. CSS variables are correctly set
 * 4. Material-UI integration is working
 * 5. RTL support is available
 * 6. All colors meet accessibility standards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class ThemeVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.projectRoot = path.resolve(__dirname);
    this.srcPath = path.join(this.projectRoot, 'src');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'success':
        console.log(`${colors.green}✅ ${prefix} ${message}${colors.reset}`);
        this.successes.push(message);
        break;
      case 'warning':
        console.log(`${colors.yellow}⚠️  ${prefix} ${message}${colors.reset}`);
        this.warnings.push(message);
        break;
      case 'error':
        console.log(`${colors.red}❌ ${prefix} ${message}${colors.reset}`);
        this.errors.push(message);
        break;
      case 'info':
        console.log(`${colors.blue}ℹ️  ${prefix} ${message}${colors.reset}`);
        break;
      case 'header':
        console.log(`${colors.cyan}${colors.bright}\n🎨 ${message}${colors.reset}`);
        console.log(`${colors.dim}${'='.repeat(60)}${colors.reset}\n`);
        break;
    }
  }

  async verifyFileExists(filePath, description) {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      this.log(`${description} exists`, 'success');
      return true;
    } catch {
      this.log(`${description} not found at ${filePath}`, 'error');
      return false;
    }
  }

  async verifyThemeStructure() {
    this.log('Theme Structure Verification', 'header');

    const themeFiles = [
      { path: path.join(this.srcPath, 'theme', 'theme.js'), desc: 'Main theme file' },
      { path: path.join(this.srcPath, 'providers', 'ThemeProvider.jsx'), desc: 'Theme Provider component' },
      { path: path.join(this.srcPath, 'utils', 'styleLoader.js'), desc: 'Style loader utilities' },
      { path: path.join(this.srcPath, 'index.css'), desc: 'Main CSS file' }
    ];

    let allExist = true;
    for (const file of themeFiles) {
      const exists = await this.verifyFileExists(file.path, file.desc);
      if (!exists) allExist = false;
    }

    return allExist;
  }

  async verifyThemeContent() {
    this.log('Theme Content Verification', 'header');

    try {
      const themeFilePath = path.join(this.srcPath, 'theme', 'theme.js');
      const themeContent = await fs.promises.readFile(themeFilePath, 'utf8');

      // Check for required theme properties
      const requiredProperties = [
        { prop: 'palette.primary.main', desc: 'Primary color' },
        { prop: 'palette.secondary.main', desc: 'Secondary color' },
        { prop: 'typography.fontFamily', desc: 'Font family' },
        { prop: 'breakpoints.values', desc: 'Breakpoint values' },
        { prop: 'components', desc: 'Component overrides' },
        { prop: 'palette.custom', desc: 'Custom status colors' }
      ];

      for (const { prop, desc } of requiredProperties) {
        if (themeContent.includes(prop.split('.').pop())) {
          this.log(`${desc} defined`, 'success');
        } else {
          this.log(`${desc} missing in theme`, 'warning');
        }
      }

      // Check for UMSL brand colors
      const brandColors = [
    { color: '#3B82F6', name: 'UMSL Primary Blue' },
        { color: '#78BE21', name: 'UMSL Secondary Green' },
        { color: '#00A2DB', name: 'UMSL Info Blue' }
      ];

      for (const { color, name } of brandColors) {
        if (themeContent.includes(color)) {
          this.log(`${name} (${color}) found`, 'success');
        } else {
          this.log(`${name} (${color}) not found`, 'warning');
        }
      }

      // Check for RTL theme
      if (themeContent.includes('rtlTheme')) {
        this.log('RTL theme variant available', 'success');
      } else {
        this.log('RTL theme variant missing', 'warning');
      }

      // Check for dark theme
      if (themeContent.includes('darkTheme')) {
        this.log('Dark theme variant available', 'success');
      } else {
        this.log('Dark theme variant missing', 'warning');
      }

    } catch (error) {
      this.log(`Failed to read theme file: ${error.message}`, 'error');
      return false;
    }

    return true;
  }

  async verifyCSSVariables() {
    this.log('CSS Variables Verification', 'header');

    try {
      const cssFilePath = path.join(this.srcPath, 'index.css');
      const cssContent = await fs.promises.readFile(cssFilePath, 'utf8');

      const requiredVariables = [
        '--color-primary',
        '--color-secondary',
        '--color-background',
        '--color-surface',
        '--color-text-primary',
        '--color-text-secondary',
        '--font-family',
        '--font-family-arabic',
        '--border-radius',
        '--shadow-soft',
        '--transition-normal'
      ];

      for (const variable of requiredVariables) {
        if (cssContent.includes(variable)) {
          this.log(`CSS variable ${variable} defined`, 'success');
        } else {
          this.log(`CSS variable ${variable} missing`, 'error');
        }
      }

      // Check for RTL support
      if (cssContent.includes("[dir='rtl']")) {
        this.log('RTL CSS support available', 'success');
      } else {
        this.log('RTL CSS support missing', 'warning');
      }

      // Check for dark mode support
      if (cssContent.includes('@media (prefers-color-scheme: dark)')) {
        this.log('Dark mode CSS support available', 'success');
      } else {
        this.log('Dark mode CSS support missing', 'warning');
      }

    } catch (error) {
      this.log(`Failed to read CSS file: ${error.message}`, 'error');
      return false;
    }

    return true;
  }

  async verifyMaterialUIIntegration() {
    this.log('Material-UI Integration Verification', 'header');

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));

      const requiredMuiPackages = [
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled'
      ];

      for (const pkg of requiredMuiPackages) {
        if (packageJson.dependencies?.[pkg]) {
          this.log(`${pkg} installed (${packageJson.dependencies[pkg]})`, 'success');
        } else {
          this.log(`${pkg} not installed`, 'error');
        }
      }

      // Check main.jsx for ThemeProvider integration
      const mainFilePath = path.join(this.srcPath, 'main.jsx');
      const mainContent = await fs.promises.readFile(mainFilePath, 'utf8');

      if (mainContent.includes('ThemeProvider')) {
        this.log('ThemeProvider integrated in main.jsx', 'success');
      } else {
        this.log('ThemeProvider not found in main.jsx', 'error');
      }

      if (mainContent.includes('loadAllStyles')) {
        this.log('Style loading integrated', 'success');
      } else {
        this.log('Style loading not integrated', 'warning');
      }

    } catch (error) {
      this.log(`Failed to verify Material-UI integration: ${error.message}`, 'error');
      return false;
    }

    return true;
  }

  async verifyAccessibility() {
    this.log('Accessibility Verification', 'header');

    // Color contrast ratios (simplified check)
    const colorPairs = [
      { bg: '#3B82F6', fg: '#ffffff', name: 'Primary button' },
      { bg: '#78BE21', fg: '#000000', name: 'Secondary button' },
      { bg: '#f8fafc', fg: '#0f172a', name: 'Background text' }
    ];

    for (const { bg, fg, name } of colorPairs) {
      // Basic luminance calculation (simplified)
      const bgLum = this.calculateLuminance(bg);
      const fgLum = this.calculateLuminance(fg);
      const ratio = (Math.max(bgLum, fgLum) + 0.05) / (Math.min(bgLum, fgLum) + 0.05);

      if (ratio >= 4.5) {
        this.log(`${name} contrast ratio: ${ratio.toFixed(2)} (WCAG AA compliant)`, 'success');
      } else if (ratio >= 3) {
        this.log(`${name} contrast ratio: ${ratio.toFixed(2)} (WCAG AA Large compliant)`, 'warning');
      } else {
        this.log(`${name} contrast ratio: ${ratio.toFixed(2)} (Not WCAG compliant)`, 'error');
      }
    }

    return true;
  }

  calculateLuminance(hex) {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Apply gamma correction
    const gamma = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
  }

  async verifyRTLSupport() {
    this.log('RTL Support Verification', 'header');

    try {
      const themeProviderPath = path.join(this.srcPath, 'providers', 'ThemeProvider.jsx');
      const themeProviderContent = await fs.promises.readFile(themeProviderPath, 'utf8');

      if (themeProviderContent.includes('rtlTheme')) {
        this.log('RTL theme variant in ThemeProvider', 'success');
      } else {
        this.log('RTL theme variant missing from ThemeProvider', 'warning');
      }

      if (themeProviderContent.includes("document.dir = rtl ? 'rtl' : 'ltr'")) {
        this.log('Document direction switching logic', 'success');
      } else {
        this.log('Document direction switching missing', 'warning');
      }

      // Check for Arabic font support
      const cssFilePath = path.join(this.srcPath, 'index.css');
      const cssContent = await fs.promises.readFile(cssFilePath, 'utf8');

      if (cssContent.includes('Noto Sans Arabic')) {
        this.log('Arabic font (Noto Sans Arabic) included', 'success');
      } else {
        this.log('Arabic font support missing', 'warning');
      }

    } catch (error) {
      this.log(`Failed to verify RTL support: ${error.message}`, 'error');
      return false;
    }

    return true;
  }

  async verifyPerformance() {
    this.log('Performance Verification', 'header');

    try {
      const styleLoaderPath = path.join(this.srcPath, 'utils', 'styleLoader.js');
      const styleLoaderContent = await fs.promises.readFile(styleLoaderPath, 'utf8');

      const performanceFeatures = [
        { feature: 'preloadFonts', desc: 'Font preloading' },
        { feature: 'ensureCSSLoaded', desc: 'CSS loading verification' },
        { feature: 'preloadCriticalImages', desc: 'Image preloading' },
        { feature: 'monitorStylePerformance', desc: 'Performance monitoring' }
      ];

      for (const { feature, desc } of performanceFeatures) {
        if (styleLoaderContent.includes(feature)) {
          this.log(`${desc} implemented`, 'success');
        } else {
          this.log(`${desc} missing`, 'warning');
        }
      }

    } catch (error) {
      this.log(`Failed to verify performance features: ${error.message}`, 'error');
      return false;
    }

    return true;
  }

  async generateReport() {
    this.log('Verification Report', 'header');

    console.log(`${colors.bright}Summary:${colors.reset}`);
    console.log(`${colors.green}✅ Successes: ${this.successes.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${this.warnings.length}${colors.reset}`);
    console.log(`${colors.red}❌ Errors: ${this.errors.length}${colors.reset}\n`);

    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
      this.warnings.forEach((warning, index) => {
        console.log(`${colors.yellow}  ${index + 1}. ${warning}${colors.reset}`);
      });
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log(`${colors.red}${colors.bright}Errors:${colors.reset}`);
      this.errors.forEach((error, index) => {
        console.log(`${colors.red}  ${index + 1}. ${error}${colors.reset}`);
      });
      console.log('');
    }

    const score = Math.round((this.successes.length / (this.successes.length + this.warnings.length + this.errors.length)) * 100);

    let scoreColor = colors.green;
    if (score < 70) scoreColor = colors.red;
    else if (score < 85) scoreColor = colors.yellow;

    console.log(`${colors.bright}Overall Score: ${scoreColor}${score}%${colors.reset}\n`);

    // Recommendations
    if (this.errors.length > 0 || this.warnings.length > 0) {
      console.log(`${colors.cyan}${colors.bright}Recommendations:${colors.reset}`);

      if (this.errors.length > 0) {
        console.log(`${colors.red}• Fix all errors before deploying to production${colors.reset}`);
      }

      if (this.warnings.length > 0) {
        console.log(`${colors.yellow}• Address warnings to improve theme completeness${colors.reset}`);
      }

      console.log(`${colors.blue}• Run 'npm run dev' to test theme in development mode${colors.reset}`);
      console.log(`${colors.blue}• Use browser developer tools to verify CSS variables${colors.reset}`);
      console.log(`${colors.blue}• Test RTL mode by calling window.themeControls.switchToRTL()${colors.reset}`);
    } else {
      console.log(`${colors.green}${colors.bright}🎉 Theme verification passed! Your UMSL Labor Mobility theme is ready.${colors.reset}\n`);
    }

    return this.errors.length === 0;
  }

  async run() {
    console.log(`${colors.cyan}${colors.bright}`);
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║       🎨 UMSL Labor Mobility Theme Verifier 🎨          ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`${colors.reset}\n`);

    try {
      await this.verifyThemeStructure();
      await this.verifyThemeContent();
      await this.verifyCSSVariables();
      await this.verifyMaterialUIIntegration();
      await this.verifyAccessibility();
      await this.verifyRTLSupport();
      await this.verifyPerformance();

      const success = await this.generateReport();
      process.exit(success ? 0 : 1);

    } catch (error) {
      this.log(`Fatal error during verification: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new ThemeVerifier();
  verifier.run().catch(console.error);
}

export default ThemeVerifier;
