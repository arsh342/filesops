import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { SizeInfo } from './types';

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * File and directory size calculation utilities
 */
export class SizeCalculator {
  private static readonly UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  /**
   * Convert bytes to human-readable format
   */
  static formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
    
    return `${size} ${this.UNITS[i]}`;
  }

  /**
   * Get detailed size information for a given byte count
   */
  static getSizeInfo(bytes: number): SizeInfo {
    return {
      bytes,
      kilobytes: bytes / 1024,
      megabytes: bytes / (1024 * 1024),
      gigabytes: bytes / (1024 * 1024 * 1024),
      terabytes: bytes / (1024 * 1024 * 1024 * 1024),
      formatted: this.formatBytes(bytes),
    };
  }

  /**
   * Get file size
   */
  static async getFileSize(filePath: string): Promise<SizeInfo> {
    try {
      const stats = await stat(filePath);
      return this.getSizeInfo(stats.size);
    } catch (error) {
      throw new Error(`Unable to get size for file: ${filePath}`);
    }
  }

  /**
   * Calculate directory size recursively
   */
  static async getDirectorySize(dirPath: string, includeHidden = false): Promise<SizeInfo> {
    const size = await this.calculateDirectorySizeRecursive(dirPath, includeHidden);
    return this.getSizeInfo(size);
  }

  private static async calculateDirectorySizeRecursive(dirPath: string, includeHidden: boolean): Promise<number> {
    let totalSize = 0;
    
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        if (!includeHidden && item.startsWith('.')) {
          continue;
        }
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const stats = await stat(itemPath);
          
          if (stats.isFile()) {
            totalSize += stats.size;
          } else if (stats.isDirectory()) {
            totalSize += await this.calculateDirectorySizeRecursive(itemPath, includeHidden);
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return totalSize;
  }

  /**
   * Get size statistics for a directory (file count, total size, largest files)
   */
  static async getDirectoryStats(dirPath: string, includeHidden = false): Promise<{
    totalSize: SizeInfo;
    fileCount: number;
    directoryCount: number;
    largestFiles: Array<{ path: string; size: SizeInfo }>;
    averageFileSize: SizeInfo;
  }> {
    const stats = await this.gatherDirectoryStats(dirPath, includeHidden);
    
    return {
      totalSize: this.getSizeInfo(stats.totalSize),
      fileCount: stats.fileCount,
      directoryCount: stats.directoryCount,
      largestFiles: stats.largestFiles
        .sort((a, b) => b.size - a.size)
        .slice(0, 10)
        .map(file => ({
          path: file.path,
          size: this.getSizeInfo(file.size),
        })),
      averageFileSize: this.getSizeInfo(stats.fileCount > 0 ? stats.totalSize / stats.fileCount : 0),
    };
  }

  private static async gatherDirectoryStats(
    dirPath: string,
    includeHidden: boolean,
    stats = { totalSize: 0, fileCount: 0, directoryCount: 0, largestFiles: [] as Array<{ path: string; size: number }> }
  ): Promise<{ totalSize: number; fileCount: number; directoryCount: number; largestFiles: Array<{ path: string; size: number }> }> {
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        if (!includeHidden && item.startsWith('.')) {
          continue;
        }
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const itemStats = await stat(itemPath);
          
          if (itemStats.isFile()) {
            stats.totalSize += itemStats.size;
            stats.fileCount++;
            stats.largestFiles.push({ path: itemPath, size: itemStats.size });
          } else if (itemStats.isDirectory()) {
            stats.directoryCount++;
            await this.gatherDirectoryStats(itemPath, includeHidden, stats);
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return stats;
  }

  /**
   * Compare sizes of multiple files or directories
   */
  static async compareItems(paths: string[]): Promise<Array<{ path: string; size: SizeInfo; isDirectory: boolean }>> {
    const results = [];
    
    for (const itemPath of paths) {
      try {
        const stats = await stat(itemPath);
        let size: SizeInfo;
        
        if (stats.isFile()) {
          size = this.getSizeInfo(stats.size);
        } else if (stats.isDirectory()) {
          size = await this.getDirectorySize(itemPath);
        } else {
          continue;
        }
        
        results.push({
          path: itemPath,
          size,
          isDirectory: stats.isDirectory(),
        });
      } catch (error) {
        // Skip items that can't be accessed
        continue;
      }
    }
    
    return results.sort((a, b) => b.size.bytes - a.size.bytes);
  }

  /**
   * Find the largest files in a directory
   */
  static async findLargestFiles(dirPath: string, limit = 10, includeHidden = false): Promise<Array<{ path: string; size: SizeInfo }>> {
    const files: Array<{ path: string; size: number }> = [];
    await this.collectFiles(dirPath, files, includeHidden);
    
    return files
      .sort((a, b) => b.size - a.size)
      .slice(0, limit)
      .map(file => ({
        path: file.path,
        size: this.getSizeInfo(file.size),
      }));
  }

  private static async collectFiles(dirPath: string, files: Array<{ path: string; size: number }>, includeHidden: boolean): Promise<void> {
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        if (!includeHidden && item.startsWith('.')) {
          continue;
        }
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const stats = await stat(itemPath);
          
          if (stats.isFile()) {
            files.push({ path: itemPath, size: stats.size });
          } else if (stats.isDirectory()) {
            await this.collectFiles(itemPath, files, includeHidden);
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  /**
   * Calculate size of files matching a pattern
   */
  static async getSizeByPattern(dirPath: string, pattern: RegExp, includeHidden = false): Promise<SizeInfo> {
    let totalSize = 0;
    await this.collectSizeByPattern(dirPath, pattern, includeHidden, (size) => {
      totalSize += size;
    });
    
    return this.getSizeInfo(totalSize);
  }

  private static async collectSizeByPattern(
    dirPath: string,
    pattern: RegExp,
    includeHidden: boolean,
    callback: (size: number) => void
  ): Promise<void> {
    try {
      const items = await readdir(dirPath);
      
      for (const item of items) {
        if (!includeHidden && item.startsWith('.')) {
          continue;
        }
        
        const itemPath = path.join(dirPath, item);
        
        try {
          const stats = await stat(itemPath);
          
          if (stats.isFile() && pattern.test(item)) {
            callback(stats.size);
          } else if (stats.isDirectory()) {
            await this.collectSizeByPattern(itemPath, pattern, includeHidden, callback);
          }
        } catch (error) {
          // Skip files/directories that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  /**
   * Parse human-readable size string to bytes
   */
  static parseSize(sizeString: string): number {
    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([KMGTPE]?B?)$/i);
    if (!match) {
      throw new Error(`Invalid size format: ${sizeString}`);
    }
    
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    
    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
      'PB': 1024 * 1024 * 1024 * 1024 * 1024,
    };
    
    return Math.round(value * (multipliers[unit] || 1));
  }
}
