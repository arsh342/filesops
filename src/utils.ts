import { FileSearch } from './search';
import { FileTypeDetector } from './fileType';
import { SizeCalculator } from './size';
import { PermissionChecker } from './permissions';
import { FileInfo, SearchOptions } from './types';

/**
 * Convenience functions that combine multiple utilities
 */

/**
 * Get comprehensive file information including type, size, and permissions
 */
export async function getFileInfo(filePath: string): Promise<{
  path: string;
  name: string;
  type: ReturnType<typeof FileTypeDetector.detectFromPath>;
  size: Awaited<ReturnType<typeof SizeCalculator.getFileSize>>;
  permissions: Awaited<ReturnType<typeof PermissionChecker.getPermissions>>;
  exists: boolean;
}> {
  const exists = await PermissionChecker.canAccess(filePath);
  
  if (!exists) {
    throw new Error(`File not found or not accessible: ${filePath}`);
  }

  const [type, size, permissions] = await Promise.all([
    FileTypeDetector.detectFromContent(filePath),
    SizeCalculator.getFileSize(filePath),
    PermissionChecker.getPermissions(filePath),
  ]);

  return {
    path: filePath,
    name: filePath.split(/[/\\]/).pop() || '',
    type,
    size,
    permissions,
    exists,
  };
}

/**
 * Find files by type and size criteria
 */
export async function findByTypeAndSize(
  searchPath: string,
  fileType: string,
  minSize?: number,
  maxSize?: number
): Promise<FileInfo[]> {
  const extensions = FileTypeDetector.getExtensionsByCategory(fileType);
  const options: SearchOptions = {
    extensions,
    minSize,
    maxSize,
  };
  
  const result = await FileSearch.search(searchPath, options);
  return result.files;
}

/**
 * Get disk usage summary for a directory
 */
export async function getDiskUsage(dirPath: string, includeHidden = false) {
  const [stats, largestFiles] = await Promise.all([
    SizeCalculator.getDirectoryStats(dirPath, includeHidden),
    SizeCalculator.findLargestFiles(dirPath, 10, includeHidden),
  ]);

  return {
    ...stats,
    largestFiles,
  };
}

/**
 * Clean up files based on criteria (age, size, type)
 */
export async function findFilesToCleanup(
  searchPath: string,
  options: {
    olderThan?: Date;
    largerThan?: number;
    extensions?: string[];
    includeHidden?: boolean;
  } = {}
): Promise<FileInfo[]> {
  const searchOptions: SearchOptions = {
    modifiedBefore: options.olderThan,
    minSize: options.largerThan,
    extensions: options.extensions,
    includeHidden: options.includeHidden,
  };

  const result = await FileSearch.search(searchPath, searchOptions);
  return result.files.sort((a, b) => b.size - a.size);
}

/**
 * Check if directory structure is readable/writable
 */
export async function checkDirectoryAccess(dirPath: string): Promise<{
  readable: boolean;
  writable: boolean;
  executable: boolean;
  canCreateFiles: boolean;
  permissions: Awaited<ReturnType<typeof PermissionChecker.getPermissions>>;
}> {
  const [readable, writable, executable, permissions] = await Promise.all([
    PermissionChecker.canRead(dirPath),
    PermissionChecker.canWrite(dirPath),
    PermissionChecker.canExecute(dirPath),
    PermissionChecker.getPermissions(dirPath),
  ]);

  const canCreateFiles = await PermissionChecker.isDirectoryWritable(dirPath);

  return {
    readable,
    writable,
    executable,
    canCreateFiles,
    permissions,
  };
}

/**
 * Find duplicate files by size and optionally by content hash
 */
export async function findDuplicatesBySize(searchPath: string): Promise<Array<{
  size: number;
  files: FileInfo[];
}>> {
  const result = await FileSearch.search(searchPath);
  const sizeGroups = new Map<number, FileInfo[]>();

  for (const file of result.files) {
    if (!sizeGroups.has(file.size)) {
      sizeGroups.set(file.size, []);
    }
    sizeGroups.get(file.size)!.push(file);
  }

  return Array.from(sizeGroups.entries())
    .filter(([, files]) => files.length > 1)
    .map(([size, files]) => ({ size, files }))
    .sort((a, b) => b.size - a.size);
}

/**
 * Get file system overview for a path
 */
export async function getFileSystemOverview(searchPath: string) {
  const [searchResult, directoryStats, permissions] = await Promise.all([
    FileSearch.search(searchPath, { maxDepth: 2 }),
    SizeCalculator.getDirectoryStats(searchPath),
    PermissionChecker.getPermissions(searchPath),
  ]);

  // Group files by type
  const filesByType = new Map<string, FileInfo[]>();
  for (const file of searchResult.files) {
    const type = FileTypeDetector.detectFromPath(file.path);
    if (!filesByType.has(type.category)) {
      filesByType.set(type.category, []);
    }
    filesByType.get(type.category)!.push(file);
  }

  return {
    overview: {
      totalFiles: searchResult.totalFiles,
      totalDirectories: searchResult.totalDirectories,
      totalSize: directoryStats.totalSize,
    },
    filesByType: Array.from(filesByType.entries()).map(([type, files]) => ({
      type,
      count: files.length,
      totalSize: SizeCalculator.getSizeInfo(files.reduce((sum, f) => sum + f.size, 0)),
    })),
    permissions,
    largestFiles: directoryStats.largestFiles,
  };
}

/**
 * Batch operations for multiple files
 */
export async function batchFileInfo(filePaths: string[]) {
  const results = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const info = await getFileInfo(filePath);
      return { filePath, info };
    })
  );

  return {
    successful: results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value),
    failed: results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map((result, index) => ({
        filePath: filePaths[index],
        error: result.reason?.message || 'Unknown error',
      })),
  };
}
