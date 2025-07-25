import * as fs from 'fs';
import { promisify } from 'util';
import { PermissionInfo } from './types';

const stat = promisify(fs.stat);
const access = promisify(fs.access);

/**
 * File and directory permission checking utilities
 */
export class PermissionChecker {
  /**
   * Check if current user can access a file/directory
   */
  static async canAccess(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if current user can read a file/directory
   */
  static async canRead(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if current user can write to a file/directory
   */
  static async canWrite(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if current user can execute a file
   */
  static async canExecute(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get detailed permission information
   */
  static async getPermissions(filePath: string): Promise<PermissionInfo> {
    try {
      const stats = await stat(filePath);
      const mode = stats.mode;
      
      // Extract permission bits
      const permissions = {
        readable: await this.canRead(filePath),
        writable: await this.canWrite(filePath),
        executable: await this.canExecute(filePath),
        owner: {
          read: !!(mode & parseInt('400', 8)),
          write: !!(mode & parseInt('200', 8)),
          execute: !!(mode & parseInt('100', 8)),
        },
        group: {
          read: !!(mode & parseInt('040', 8)),
          write: !!(mode & parseInt('020', 8)),
          execute: !!(mode & parseInt('010', 8)),
        },
        others: {
          read: !!(mode & parseInt('004', 8)),
          write: !!(mode & parseInt('002', 8)),
          execute: !!(mode & parseInt('001', 8)),
        },
        mode: mode,
        octal: (mode & parseInt('777', 8)).toString(8).padStart(3, '0'),
      };
      
      return permissions;
    } catch (error) {
      throw new Error(`Unable to get permissions for: ${filePath}`);
    }
  }

  /**
   * Check multiple permission types at once
   */
  static async checkPermissions(filePath: string, permissions: Array<'read' | 'write' | 'execute'>): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const permission of permissions) {
      switch (permission) {
        case 'read':
          results.read = await this.canRead(filePath);
          break;
        case 'write':
          results.write = await this.canWrite(filePath);
          break;
        case 'execute':
          results.execute = await this.canExecute(filePath);
          break;
      }
    }
    
    return results;
  }

  /**
   * Format permissions as Unix-style string (e.g., "rwxr-xr--")
   */
  static formatPermissions(permissions: PermissionInfo): string {
    const { owner, group, others } = permissions;
    
    const formatGroup = (perms: { read: boolean; write: boolean; execute: boolean }) => {
      return (perms.read ? 'r' : '-') + 
             (perms.write ? 'w' : '-') + 
             (perms.execute ? 'x' : '-');
    };
    
    return formatGroup(owner) + formatGroup(group) + formatGroup(others);
  }

  /**
   * Check if a path is a valid file or directory
   */
  static async exists(filePath: string): Promise<{ exists: boolean; isFile: boolean; isDirectory: boolean }> {
    try {
      const stats = await stat(filePath);
      return {
        exists: true,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
      };
    } catch {
      return {
        exists: false,
        isFile: false,
        isDirectory: false,
      };
    }
  }

  /**
   * Check if current user is likely the owner of the file
   */
  static async isOwner(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      // On Unix systems, compare with process UID
      if (process.getuid) {
        return stats.uid === process.getuid();
      }
      // On Windows, we can't easily determine ownership, so check write permissions
      return await this.canWrite(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Get file/directory creation and modification times along with permissions
   */
  static async getDetailedInfo(filePath: string): Promise<{
    permissions: PermissionInfo;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
    size: number;
    isFile: boolean;
    isDirectory: boolean;
    isSymbolicLink: boolean;
  }> {
    try {
      const stats = await stat(filePath);
      const permissions = await this.getPermissions(filePath);
      
      return {
        permissions,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
      };
    } catch (error) {
      throw new Error(`Unable to get detailed info for: ${filePath}`);
    }
  }

  /**
   * Check if file is hidden (starts with dot on Unix systems)
   */
  static isHidden(filePath: string): boolean {
    const filename = filePath.split(/[/\\]/).pop() || '';
    return filename.startsWith('.');
  }

  /**
   * Validate permission string (e.g., "755", "rwxr-xr-x")
   */
  static validatePermissionString(permString: string): boolean {
    // Check octal format (e.g., "755")
    if (/^[0-7]{3}$/.test(permString)) {
      return true;
    }
    
    // Check symbolic format (e.g., "rwxr-xr-x")
    if (/^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(permString)) {
      return true;
    }
    
    return false;
  }

  /**
   * Convert octal permission to symbolic format
   */
  static octalToSymbolic(octal: string): string {
    if (!/^[0-7]{3}$/.test(octal)) {
      throw new Error('Invalid octal permission format');
    }
    
    const digits = octal.split('').map(Number);
    const groups = digits.map(digit => {
      const read = digit & 4 ? 'r' : '-';
      const write = digit & 2 ? 'w' : '-';
      const execute = digit & 1 ? 'x' : '-';
      return read + write + execute;
    });
    
    return groups.join('');
  }

  /**
   * Convert symbolic permission to octal format
   */
  static symbolicToOctal(symbolic: string): string {
    if (!/^[r-][w-][x-][r-][w-][x-][r-][w-][x-]$/.test(symbolic)) {
      throw new Error('Invalid symbolic permission format');
    }
    
    const groups = [
      symbolic.slice(0, 3),
      symbolic.slice(3, 6),
      symbolic.slice(6, 9),
    ];
    
    const digits = groups.map(group => {
      let value = 0;
      if (group[0] === 'r') value += 4;
      if (group[1] === 'w') value += 2;
      if (group[2] === 'x') value += 1;
      return value.toString();
    });
    
    return digits.join('');
  }

  /**
   * Check if directory is writable (can create files in it)
   */
  static async isDirectoryWritable(dirPath: string): Promise<boolean> {
    const tempFile = `${dirPath}/.tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await fs.promises.writeFile(tempFile, '');
      await fs.promises.unlink(tempFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get permission summary for multiple files
   */
  static async getPermissionSummary(filePaths: string[]): Promise<Array<{
    path: string;
    permissions: PermissionInfo | null;
    accessible: boolean;
    error?: string;
  }>> {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const accessible = await this.canAccess(filePath);
        let permissions: PermissionInfo | null = null;
        
        if (accessible) {
          permissions = await this.getPermissions(filePath);
        }
        
        results.push({
          path: filePath,
          permissions,
          accessible,
        });
      } catch (error) {
        results.push({
          path: filePath,
          permissions: null,
          accessible: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    return results;
  }
}
