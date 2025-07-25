import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { FileTypeInfo } from './types';

const readFile = promisify(fs.readFile);

/**
 * File type detection and analysis
 */
export class FileTypeDetector {
  private static readonly mimeTypes: Record<string, string> = {
    // Text files
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.jsx': 'application/javascript',
    '.tsx': 'application/typescript',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.cpp': 'text/x-c++src',
    '.c': 'text/x-csrc',
    '.h': 'text/x-chdr',
    '.php': 'application/x-httpd-php',
    '.rb': 'application/x-ruby',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.sh': 'application/x-sh',
    '.bat': 'application/x-bat',
    '.ps1': 'application/x-powershell',
    
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    
    // Video
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',
    '.bz2': 'application/x-bzip2',
    
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Executables
    '.exe': 'application/x-msdownload',
    '.msi': 'application/x-msi',
    '.deb': 'application/vnd.debian.binary-package',
    '.rpm': 'application/x-rpm',
    '.dmg': 'application/x-apple-diskimage',
    '.app': 'application/x-apple-app',
  };

  private static readonly categories: Record<string, string> = {
    // Text categories
    '.txt': 'Text',
    '.md': 'Documentation',
    '.json': 'Data',
    '.xml': 'Data',
    '.html': 'Web',
    '.htm': 'Web',
    '.css': 'Web',
    '.js': 'Code',
    '.ts': 'Code',
    '.jsx': 'Code',
    '.tsx': 'Code',
    '.py': 'Code',
    '.java': 'Code',
    '.cpp': 'Code',
    '.c': 'Code',
    '.h': 'Code',
    '.php': 'Code',
    '.rb': 'Code',
    '.go': 'Code',
    '.rs': 'Code',
    '.sh': 'Script',
    '.bat': 'Script',
    '.ps1': 'Script',
    
    // Media categories
    '.jpg': 'Image',
    '.jpeg': 'Image',
    '.png': 'Image',
    '.gif': 'Image',
    '.bmp': 'Image',
    '.svg': 'Image',
    '.webp': 'Image',
    '.ico': 'Image',
    '.tiff': 'Image',
    '.tif': 'Image',
    '.mp3': 'Audio',
    '.wav': 'Audio',
    '.flac': 'Audio',
    '.aac': 'Audio',
    '.ogg': 'Audio',
    '.m4a': 'Audio',
    '.mp4': 'Video',
    '.avi': 'Video',
    '.mov': 'Video',
    '.wmv': 'Video',
    '.flv': 'Video',
    '.webm': 'Video',
    '.mkv': 'Video',
    
    // Other categories
    '.zip': 'Archive',
    '.rar': 'Archive',
    '.tar': 'Archive',
    '.gz': 'Archive',
    '.7z': 'Archive',
    '.bz2': 'Archive',
    '.pdf': 'Document',
    '.doc': 'Document',
    '.docx': 'Document',
    '.xls': 'Document',
    '.xlsx': 'Document',
    '.ppt': 'Document',
    '.pptx': 'Document',
    '.exe': 'Executable',
    '.msi': 'Executable',
    '.deb': 'Executable',
    '.rpm': 'Executable',
    '.dmg': 'Executable',
    '.app': 'Executable',
  };

  private static readonly descriptions: Record<string, string> = {
    '.txt': 'Plain text file',
    '.md': 'Markdown document',
    '.json': 'JSON data file',
    '.xml': 'XML document',
    '.html': 'HTML web page',
    '.htm': 'HTML web page',
    '.css': 'CSS stylesheet',
    '.js': 'JavaScript file',
    '.ts': 'TypeScript file',
    '.jsx': 'React JavaScript file',
    '.tsx': 'React TypeScript file',
    '.py': 'Python script',
    '.java': 'Java source file',
    '.cpp': 'C++ source file',
    '.c': 'C source file',
    '.h': 'C/C++ header file',
    '.php': 'PHP script',
    '.rb': 'Ruby script',
    '.go': 'Go source file',
    '.rs': 'Rust source file',
    '.sh': 'Shell script',
    '.bat': 'Batch file',
    '.ps1': 'PowerShell script',
    '.jpg': 'JPEG image',
    '.jpeg': 'JPEG image',
    '.png': 'PNG image',
    '.gif': 'GIF image',
    '.bmp': 'Bitmap image',
    '.svg': 'SVG vector image',
    '.webp': 'WebP image',
    '.ico': 'Icon file',
    '.tiff': 'TIFF image',
    '.tif': 'TIFF image',
    '.mp3': 'MP3 audio file',
    '.wav': 'WAV audio file',
    '.flac': 'FLAC audio file',
    '.aac': 'AAC audio file',
    '.ogg': 'OGG audio file',
    '.m4a': 'M4A audio file',
    '.mp4': 'MP4 video file',
    '.avi': 'AVI video file',
    '.mov': 'QuickTime video',
    '.wmv': 'Windows Media video',
    '.flv': 'Flash video',
    '.webm': 'WebM video',
    '.mkv': 'Matroska video',
    '.zip': 'ZIP archive',
    '.rar': 'RAR archive',
    '.tar': 'TAR archive',
    '.gz': 'Gzip compressed file',
    '.7z': '7-Zip archive',
    '.bz2': 'Bzip2 compressed file',
    '.pdf': 'PDF document',
    '.doc': 'Word document',
    '.docx': 'Word document',
    '.xls': 'Excel spreadsheet',
    '.xlsx': 'Excel spreadsheet',
    '.ppt': 'PowerPoint presentation',
    '.pptx': 'PowerPoint presentation',
    '.exe': 'Windows executable',
    '.msi': 'Windows installer',
    '.deb': 'Debian package',
    '.rpm': 'RPM package',
    '.dmg': 'macOS disk image',
    '.app': 'macOS application',
  };

  private static readonly binaryExtensions = new Set([
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.tiff', '.tif', '.webp',
    '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a',
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv',
    '.zip', '.rar', '.tar', '.gz', '.7z', '.bz2',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.msi', '.deb', '.rpm', '.dmg', '.app'
  ]);

  private static readonly executableExtensions = new Set([
    '.exe', '.msi', '.deb', '.rpm', '.dmg', '.app', '.sh', '.bat', '.ps1', '.com', '.cmd'
  ]);

  /**
   * Detect file type information from file path
   */
  static detectFromPath(filePath: string): FileTypeInfo {
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      extension: ext,
      mimeType: this.mimeTypes[ext] || 'application/octet-stream',
      category: this.categories[ext] || 'Unknown',
      description: this.descriptions[ext] || 'Unknown file type',
      isBinary: this.binaryExtensions.has(ext),
      isText: !this.binaryExtensions.has(ext),
      isImage: this.categories[ext] === 'Image',
      isVideo: this.categories[ext] === 'Video',
      isAudio: this.categories[ext] === 'Audio',
      isArchive: this.categories[ext] === 'Archive',
      isExecutable: this.executableExtensions.has(ext),
    };
  }

  /**
   * Detect file type from file content (magic numbers)
   */
  static async detectFromContent(filePath: string): Promise<FileTypeInfo> {
    const baseInfo = this.detectFromPath(filePath);
    
    try {
      const buffer = await readFile(filePath);
      const magicInfo = this.detectMagicNumbers(buffer);
      
      // Override extension-based detection with magic number detection if available
      if (magicInfo) {
        return {
          ...baseInfo,
          mimeType: magicInfo.mimeType,
          category: magicInfo.category,
          description: magicInfo.description,
          isBinary: magicInfo.isBinary,
          isText: !magicInfo.isBinary,
          isImage: magicInfo.category === 'Image',
          isVideo: magicInfo.category === 'Video',
          isAudio: magicInfo.category === 'Audio',
          isArchive: magicInfo.category === 'Archive',
        };
      }
    } catch (error) {
      // Fall back to extension-based detection if file can't be read
    }
    
    return baseInfo;
  }

  private static detectMagicNumbers(buffer: Buffer): { mimeType: string; category: string; description: string; isBinary: boolean } | null {
    if (buffer.length < 4) return null;

    const hex = buffer.subarray(0, 16).toString('hex').toUpperCase();
    
    // Image formats
    if (hex.startsWith('FFD8FF')) {
      return { mimeType: 'image/jpeg', category: 'Image', description: 'JPEG image', isBinary: true };
    }
    if (hex.startsWith('89504E47')) {
      return { mimeType: 'image/png', category: 'Image', description: 'PNG image', isBinary: true };
    }
    if (hex.startsWith('47494638')) {
      return { mimeType: 'image/gif', category: 'Image', description: 'GIF image', isBinary: true };
    }
    if (hex.startsWith('424D')) {
      return { mimeType: 'image/bmp', category: 'Image', description: 'BMP image', isBinary: true };
    }
    if (hex.startsWith('52494646') && hex.includes('57454250')) {
      return { mimeType: 'image/webp', category: 'Image', description: 'WebP image', isBinary: true };
    }

    // Archive formats
    if (hex.startsWith('504B0304') || hex.startsWith('504B0506') || hex.startsWith('504B0708')) {
      return { mimeType: 'application/zip', category: 'Archive', description: 'ZIP archive', isBinary: true };
    }
    if (hex.startsWith('526172211A07')) {
      return { mimeType: 'application/vnd.rar', category: 'Archive', description: 'RAR archive', isBinary: true };
    }
    if (hex.startsWith('377ABCAF271C')) {
      return { mimeType: 'application/x-7z-compressed', category: 'Archive', description: '7-Zip archive', isBinary: true };
    }
    if (hex.startsWith('1F8B')) {
      return { mimeType: 'application/gzip', category: 'Archive', description: 'Gzip compressed file', isBinary: true };
    }

    // Document formats
    if (hex.startsWith('25504446')) {
      return { mimeType: 'application/pdf', category: 'Document', description: 'PDF document', isBinary: true };
    }

    // Executable formats
    if (hex.startsWith('4D5A')) {
      return { mimeType: 'application/x-msdownload', category: 'Executable', description: 'Windows executable', isBinary: true };
    }

    // Audio formats
    if (hex.startsWith('494433') || hex.startsWith('FFFB') || hex.startsWith('FFF3') || hex.startsWith('FFF2')) {
      return { mimeType: 'audio/mpeg', category: 'Audio', description: 'MP3 audio file', isBinary: true };
    }
    if (hex.startsWith('52494646') && hex.includes('57415645')) {
      return { mimeType: 'audio/wav', category: 'Audio', description: 'WAV audio file', isBinary: true };
    }

    // Video formats
    if (hex.includes('667479706D703432') || hex.includes('667479706D703431')) {
      return { mimeType: 'video/mp4', category: 'Video', description: 'MP4 video file', isBinary: true };
    }
    if (hex.startsWith('52494646') && hex.includes('415649')) {
      return { mimeType: 'video/x-msvideo', category: 'Video', description: 'AVI video file', isBinary: true };
    }

    return null;
  }

  /**
   * Check if file is likely to be text based on content
   */
  static async isTextFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await readFile(filePath, { encoding: 'binary' });
      const sample = buffer.slice(0, 8192); // Check first 8KB
      
      // Count non-printable characters
      let nonPrintable = 0;
      for (let i = 0; i < sample.length; i++) {
        const char = sample.charCodeAt(i);
        if (char < 32 && char !== 9 && char !== 10 && char !== 13) {
          nonPrintable++;
        }
      }
      
      // If more than 30% non-printable characters, consider it binary
      return (nonPrintable / sample.length) < 0.3;
    } catch {
      return false;
    }
  }

  /**
   * Get all supported file extensions
   */
  static getSupportedExtensions(): string[] {
    return Object.keys(this.mimeTypes);
  }

  /**
   * Get file extensions by category
   */
  static getExtensionsByCategory(category: string): string[] {
    return Object.entries(this.categories)
      .filter(([, cat]) => cat === category)
      .map(([ext]) => ext);
  }
}
