#!/usr/bin/env node

/**
 * Example usage of the filesops library
 * Run with: npx ts-node examples/usage.ts
 */

import { FileSearch, FileTypeDetector, SizeCalculator, PermissionChecker, filesops } from '../src';

async function main() {
  console.log('🔍 filesops Library Examples\n');

  // Example 1: Basic file search
  console.log('1. Basic File Search');
  console.log('Searching for JavaScript and TypeScript files...');
  try {
    const searchResult = await FileSearch.search('./src', {
      extensions: ['.js', '.ts'],
      maxDepth: 2
    });
    
    console.log(`Found ${searchResult.totalFiles} files:`);
    searchResult.files.forEach(file => {
      console.log(`  - ${file.name} (${SizeCalculator.formatBytes(file.size)})`);
    });
  } catch (error: any) {
    console.log('  Error:', error.message);
  }
  console.log();

  // Example 2: File type detection
  console.log('2. File Type Detection');
  const testFiles = ['package.json', 'README.md', 'src/index.ts'];
  
  for (const file of testFiles) {
    try {
      const fileType = FileTypeDetector.detectFromPath(file);
      console.log(`  ${file}:`);
      console.log(`    Type: ${fileType.category}`);
      console.log(`    MIME: ${fileType.mimeType}`);
      console.log(`    Description: ${fileType.description}`);
    } catch (error: any) {
      console.log(`  ${file}: Error - ${error.message}`);
    }
  }
  console.log();

  // Example 3: Size calculations
  console.log('3. Size Calculations');
  try {
    const dirSize = await SizeCalculator.getDirectorySize('./src');
    console.log(`Source directory size: ${dirSize.formatted}`);
    
    const stats = await SizeCalculator.getDirectoryStats('./src');
    console.log(`  Files: ${stats.fileCount}`);
    console.log(`  Directories: ${stats.directoryCount}`);
    console.log(`  Average file size: ${stats.averageFileSize.formatted}`);
    
    if (stats.largestFiles.length > 0) {
      console.log('  Largest files:');
      stats.largestFiles.slice(0, 3).forEach(file => {
        console.log(`    - ${file.path.split('/').pop()} (${file.size.formatted})`);
      });
    }
  } catch (error: any) {
    console.log('  Error:', error.message);
  }
  console.log();

  // Example 4: Permission checking
  console.log('4. Permission Checking');
  const checkFiles = ['package.json', 'src', 'README.md'];
  
  for (const file of checkFiles) {
    try {
      const permissions = await PermissionChecker.getPermissions(file);
      const formatted = PermissionChecker.formatPermissions(permissions);
      console.log(`  ${file}: ${formatted} (${permissions.octal})`);
    } catch (error: any) {
      console.log(`  ${file}: Error - ${error.message}`);
    }
  }
  console.log();

  // Example 5: Utility functions
  console.log('5. Utility Functions');
  try {
    console.log('Getting file system overview...');
    const overview = await filesops.getFileSystemOverview('./src');
    
    console.log(`  Total files: ${overview.overview.totalFiles}`);
    console.log(`  Total size: ${overview.overview.totalSize.formatted}`);
    console.log('  Files by type:');
    
    overview.filesByType.forEach(({ type, count, totalSize }) => {
      console.log(`    ${type}: ${count} files (${totalSize.formatted})`);
    });
  } catch (error: any) {
    console.log('  Error:', error.message);
  }
  console.log();

  // Example 6: Find large files
  console.log('6. Finding Large Files');
  try {
    const largeFiles = await SizeCalculator.findLargestFiles('./src', 5);
    if (largeFiles.length > 0) {
      console.log('  Largest files in src:');
      largeFiles.forEach(file => {
        console.log(`    - ${file.path.split('/').pop()} (${file.size.formatted})`);
      });
    } else {
      console.log('  No files found in src directory');
    }
  } catch (error: any) {
    console.log('  Error:', error.message);
  }
  console.log();

  // Example 7: Pattern search
  console.log('7. Pattern-based Search');
  try {
    const testFiles = await FileSearch.findByName('./src', '*.test.*');
    console.log(`Found ${testFiles.length} test files:`);
    testFiles.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  } catch (error: any) {
    console.log('  Error:', error.message);
  }
  console.log();

  console.log('✅ Examples completed!');
}

// Run examples if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;
