# filesops

A comprehensive Node.js library for advanced file operations including search, type detection, size calculation, and permission utilities.

## Features

- **Advanced File Search**: Powerful search functionality with pattern matching, filtering, and recursive directory traversal
- **File Type Detection**: Intelligent file type detection using both file extensions and magic numbers
- **Size Calculation**: Comprehensive file and directory size utilities with human-readable formatting
- **Permission Checking**: Cross-platform file permission analysis and validation

## Installation

```bash
npm install filesops
```

## Quick Start

```typescript
import { FileSearch, FileTypeDetector, SizeCalculator, PermissionChecker } from 'filesops';

// Search for JavaScript files larger than 1MB
const result = await FileSearch.search('./src', {
  extensions: ['.js', '.ts'],
  minSize: 1024 * 1024, // 1MB
  pattern: '*.component.*'
});

// Detect file type
const fileType = await FileTypeDetector.detectFromContent('./image.png');
console.log(fileType.mimeType); // 'image/png'

// Calculate directory size
const size = await SizeCalculator.getDirectorySize('./dist');
console.log(size.formatted); // '15.2 MB'

// Check file permissions
const permissions = await PermissionChecker.getPermissions('./script.sh');
console.log(permissions.executable); // true/false
```

## API Reference

### FileSearch

Advanced file searching with multiple filtering options.

#### Methods

- `search(path, options)` - Search for files with advanced filtering
- `findByName(path, pattern, caseSensitive)` - Find files by name pattern
- `findByExtension(path, extensions)` - Find files by extension
- `findLargeFiles(path, minSize)` - Find files larger than specified size
- `findRecentFiles(path, since)` - Find recently modified files
- `exists(path)` - Check if file/directory exists

#### Search Options

```typescript
interface SearchOptions {
  pattern?: string | RegExp;        // Name pattern to match
  extensions?: string[];            // File extensions to include
  maxDepth?: number;               // Maximum recursion depth
  includeHidden?: boolean;         // Include hidden files
  caseSensitive?: boolean;         // Case sensitive pattern matching
  followSymlinks?: boolean;        // Follow symbolic links
  maxSize?: number;               // Maximum file size in bytes
  minSize?: number;               // Minimum file size in bytes
  modifiedSince?: Date;           // Files modified after this date
  modifiedBefore?: Date;          // Files modified before this date
}
```

### FileTypeDetector

Intelligent file type detection and classification.

#### Methods

- `detectFromPath(filePath)` - Detect type from file extension
- `detectFromContent(filePath)` - Detect type from file content (magic numbers)
- `isTextFile(filePath)` - Check if file is text-based
- `getSupportedExtensions()` - Get all supported file extensions
- `getExtensionsByCategory(category)` - Get extensions for a specific category

#### File Type Information

```typescript
interface FileTypeInfo {
  extension: string;      // File extension
  mimeType: string;      // MIME type
  category: string;      // File category (Code, Image, Document, etc.)
  description: string;   // Human-readable description
  isBinary: boolean;     // Is binary file
  isText: boolean;       // Is text file
  isImage: boolean;      // Is image file
  isVideo: boolean;      // Is video file
  isAudio: boolean;      // Is audio file
  isArchive: boolean;    // Is archive file
  isExecutable: boolean; // Is executable file
}
```

### SizeCalculator

File and directory size calculation utilities.

#### Methods

- `getFileSize(filePath)` - Get file size information
- `getDirectorySize(dirPath, includeHidden)` - Calculate total directory size
- `getDirectoryStats(dirPath, includeHidden)` - Get comprehensive directory statistics
- `findLargestFiles(dirPath, limit, includeHidden)` - Find largest files in directory
- `compareItems(paths)` - Compare sizes of multiple files/directories
- `getSizeByPattern(dirPath, pattern, includeHidden)` - Calculate size of files matching pattern
- `formatBytes(bytes, decimals)` - Format bytes as human-readable string
- `parseSize(sizeString)` - Parse human-readable size to bytes

#### Size Information

```typescript
interface SizeInfo {
  bytes: number;         // Size in bytes
  kilobytes: number;     // Size in KB
  megabytes: number;     // Size in MB
  gigabytes: number;     // Size in GB
  terabytes: number;     // Size in TB
  formatted: string;     // Human-readable format
}
```

### PermissionChecker

File and directory permission utilities.

#### Methods

- `canAccess(filePath)` - Check if file is accessible
- `canRead(filePath)` - Check if file is readable
- `canWrite(filePath)` - Check if file is writable
- `canExecute(filePath)` - Check if file is executable
- `getPermissions(filePath)` - Get detailed permission information
- `checkPermissions(filePath, permissions)` - Check multiple permissions at once
- `formatPermissions(permissions)` - Format permissions as Unix-style string
- `isOwner(filePath)` - Check if current user owns the file
- `getDetailedInfo(filePath)` - Get comprehensive file information
- `isDirectoryWritable(dirPath)` - Check if directory allows file creation

#### Permission Information

```typescript
interface PermissionInfo {
  readable: boolean;     // Can current user read
  writable: boolean;     // Can current user write
  executable: boolean;   // Can current user execute
  owner: {              // Owner permissions
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  group: {              // Group permissions
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  others: {             // Others permissions
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  mode: number;         // Numeric mode
  octal: string;        // Octal representation
}
```

## Utility Functions

The package also provides convenient utility functions for common operations:

```typescript
import * as filesops from 'filesops/filesops';

// Get comprehensive file information
const info = await filesops.getFileInfo('./file.txt');

// Find files by type and size
const largeImages = await filesops.findByTypeAndSize('./photos', 'Image', 1024 * 1024);

// Get disk usage summary
const usage = await filesops.getDiskUsage('./project');
```

Alternatively, you can import utility functions directly:

```typescript
import { getFileInfo, getDiskUsage, findByTypeAndSize } from 'filesops/filesops';

// Use functions directly
const info = await getFileInfo('./file.txt');
const usage = await getDiskUsage('./project');
```

## Examples

### Finding Large Files

```typescript
import { FileSearch, SizeCalculator } from 'filesops';

// Find files larger than 100MB
const largeFiles = await FileSearch.findLargeFiles('./downloads', 100 * 1024 * 1024);

// Get the top 10 largest files in a directory
const largest = await SizeCalculator.findLargestFiles('./videos', 10);
largest.forEach(file => {
  console.log(`${file.path}: ${file.size.formatted}`);
});
```

### Analyzing Directory Structure

```typescript
import { SizeCalculator, FileTypeDetector } from 'filesops';

const stats = await SizeCalculator.getDirectoryStats('./project');
console.log(`Total size: ${stats.totalSize.formatted}`);
console.log(`Files: ${stats.fileCount}, Directories: ${stats.directoryCount}`);

// Group files by type
const searchResult = await FileSearch.search('./project');
const filesByType = new Map();

for (const file of searchResult.files) {
  const type = FileTypeDetector.detectFromPath(file.path);
  if (!filesByType.has(type.category)) {
    filesByType.set(type.category, []);
  }
  filesByType.get(type.category).push(file);
}
```

### Permission Auditing

```typescript
import { PermissionChecker } from 'filesops';

const files = ['./script.sh', './config.json', './data.db'];
const summary = await PermissionChecker.getPermissionSummary(files);

summary.forEach(({ path, permissions, accessible }) => {
  if (accessible && permissions) {
    console.log(`${path}: ${PermissionChecker.formatPermissions(permissions)}`);
  } else {
    console.log(`${path}: Not accessible`);
  }
});
```

## Requirements

- Node.js 14.0.0 or higher
- TypeScript 5.0.0 or higher (for TypeScript projects)

## Development

### Setup
```bash
# Clone the repository
git clone https://github.com/arsh342/filesops.git
cd filesops

# Install dependencies (use npm ci for exact versions)
npm ci

# Build the project
npm run build

# Run tests
npm test

# Run development mode (watch for changes)
npm run dev
```

### CI/CD
The project includes GitHub Actions workflows for automated testing and publishing. The CI process:
1. Runs `npm ci` for exact dependency installation
2. Builds the TypeScript project
3. Runs the full test suite
4. Publishes to NPM on successful builds to main branch

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
