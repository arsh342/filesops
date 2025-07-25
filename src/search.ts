import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { FileInfo, SearchOptions, SearchResult } from './types';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const access = promisify(fs.access);

/**
 * Advanced file search with multiple filtering options
 */
export class FileSearch {
  private static async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await stat(filePath);
    const parsedPath = path.parse(filePath);
    
    return {
      path: filePath,
      name: parsedPath.base,
      extension: parsedPath.ext,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
    };
  }

  private static matchesPattern(filename: string, pattern: string | RegExp, caseSensitive: boolean): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(filename);
    }
    
    const targetName = caseSensitive ? filename : filename.toLowerCase();
    const targetPattern = caseSensitive ? pattern : pattern.toLowerCase();
    
    // Support glob-like patterns
    const regexPattern = targetPattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(targetName);
  }

  private static matchesOptions(fileInfo: FileInfo, options: SearchOptions): boolean {
    // Extension filter
    if (options.extensions && options.extensions.length > 0) {
      const ext = fileInfo.extension.toLowerCase();
      const extensions = options.extensions.map(e => e.toLowerCase().startsWith('.') ? e : `.${e}`);
      if (!extensions.includes(ext)) {
        return false;
      }
    }

    // Size filters
    if (options.maxSize && fileInfo.size > options.maxSize) {
      return false;
    }
    if (options.minSize && fileInfo.size < options.minSize) {
      return false;
    }

    // Date filters
    if (options.modifiedSince && fileInfo.modifiedAt < options.modifiedSince) {
      return false;
    }
    if (options.modifiedBefore && fileInfo.modifiedAt > options.modifiedBefore) {
      return false;
    }

    return true;
  }

  /**
   * Search for files in a directory with advanced filtering options
   */
  static async search(searchPath: string, options: SearchOptions = {}): Promise<SearchResult> {
    const files: FileInfo[] = [];
    const directories: FileInfo[] = [];
    
    await this.searchRecursive(searchPath, options, files, directories, 0);
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      files,
      directories,
      totalFiles: files.length,
      totalDirectories: directories.length,
      totalSize,
    };
  }

  private static async searchRecursive(
    currentPath: string,
    options: SearchOptions,
    files: FileInfo[],
    directories: FileInfo[],
    currentDepth: number
  ): Promise<void> {
    // Check depth limit
    if (options.maxDepth !== undefined && currentDepth > options.maxDepth) {
      return;
    }

    try {
      const items = await readdir(currentPath);
      
      for (const item of items) {
        // Skip hidden files if not included
        if (!options.includeHidden && item.startsWith('.')) {
          continue;
        }

        const itemPath = path.join(currentPath, item);
        
        try {
          const fileInfo = await this.getFileInfo(itemPath);
          
          // Handle symlinks
          if (!options.followSymlinks && (await stat(itemPath)).isSymbolicLink()) {
            continue;
          }

          if (fileInfo.isDirectory) {
            if (this.matchesPattern(fileInfo.name, options.pattern || '*', options.caseSensitive || false)) {
              directories.push(fileInfo);
            }
            
            // Recursively search subdirectories
            await this.searchRecursive(itemPath, options, files, directories, currentDepth + 1);
          } else if (fileInfo.isFile) {
            // Check if file matches all criteria
            if (
              this.matchesPattern(fileInfo.name, options.pattern || '*', options.caseSensitive || false) &&
              this.matchesOptions(fileInfo, options)
            ) {
              files.push(fileInfo);
            }
          }
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
      return;
    }
  }

  /**
   * Find files by name pattern
   */
  static async findByName(searchPath: string, pattern: string | RegExp, caseSensitive = false): Promise<FileInfo[]> {
    const result = await this.search(searchPath, { pattern, caseSensitive });
    return result.files;
  }

  /**
   * Find files by extension
   */
  static async findByExtension(searchPath: string, extensions: string[]): Promise<FileInfo[]> {
    const result = await this.search(searchPath, { extensions });
    return result.files;
  }

  /**
   * Find files larger than specified size
   */
  static async findLargeFiles(searchPath: string, minSize: number): Promise<FileInfo[]> {
    const result = await this.search(searchPath, { minSize });
    return result.files.sort((a, b) => b.size - a.size);
  }

  /**
   * Find recently modified files
   */
  static async findRecentFiles(searchPath: string, since: Date): Promise<FileInfo[]> {
    const result = await this.search(searchPath, { modifiedSince: since });
    return result.files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  }

  /**
   * Check if a file or directory exists and is accessible
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
