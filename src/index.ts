// Main exports
export { FileSearch } from './search';
export { FileTypeDetector } from './fileType';
export { SizeCalculator } from './size';
export { PermissionChecker } from './permissions';

// Type exports
export type {
  FileInfo,
  SearchOptions,
  SearchResult,
  PermissionInfo,
  FileTypeInfo,
  SizeInfo,
} from './types';

// Convenience functions
export * as filesops from './utils';
