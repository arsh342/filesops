export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
}

export interface SearchOptions {
  pattern?: string | RegExp;
  extensions?: string[];
  maxDepth?: number;
  includeHidden?: boolean;
  caseSensitive?: boolean;
  followSymlinks?: boolean;
  maxSize?: number;
  minSize?: number;
  modifiedSince?: Date;
  modifiedBefore?: Date;
}

export interface SearchResult {
  files: FileInfo[];
  directories: FileInfo[];
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
}

export interface PermissionInfo {
  readable: boolean;
  writable: boolean;
  executable: boolean;
  owner: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  group: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  others: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  mode: number;
  octal: string;
}

export interface FileTypeInfo {
  extension: string;
  mimeType: string;
  category: string;
  description: string;
  isBinary: boolean;
  isText: boolean;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isArchive: boolean;
  isExecutable: boolean;
}

export interface SizeInfo {
  bytes: number;
  kilobytes: number;
  megabytes: number;
  gigabytes: number;
  terabytes: number;
  formatted: string;
}
