import { FileSearch } from '../search';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('FileSearch', () => {
  let testDir: string;
  
  beforeEach(async () => {
    // Create a temporary test directory
    testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'filesops-test-'));
    
    // Create test files and directories
    await fs.promises.mkdir(path.join(testDir, 'subdir'));
    await fs.promises.writeFile(path.join(testDir, 'test.txt'), 'Hello World');
    await fs.promises.writeFile(path.join(testDir, 'test.js'), 'console.log("test");');
    await fs.promises.writeFile(path.join(testDir, 'subdir', 'nested.md'), '# Test');
    await fs.promises.writeFile(path.join(testDir, '.hidden'), 'hidden file');
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  test('should find all files in directory', async () => {
    const result = await FileSearch.search(testDir);
    
    expect(result.totalFiles).toBe(3); // Excludes hidden file by default
    expect(result.totalDirectories).toBe(1);
    expect(result.files.some(f => f.name === 'test.txt')).toBe(true);
    expect(result.files.some(f => f.name === 'test.js')).toBe(true);
    expect(result.files.some(f => f.name === 'nested.md')).toBe(true);
  });

  test('should find hidden files when includeHidden is true', async () => {
    const result = await FileSearch.search(testDir, { includeHidden: true });
    
    expect(result.totalFiles).toBe(4);
    expect(result.files.some(f => f.name === '.hidden')).toBe(true);
  });

  test('should filter by extension', async () => {
    const result = await FileSearch.search(testDir, { extensions: ['.js'] });
    
    expect(result.totalFiles).toBe(1);
    expect(result.files[0].name).toBe('test.js');
  });

  test('should filter by pattern', async () => {
    const result = await FileSearch.search(testDir, { pattern: 'test.*' });
    
    expect(result.totalFiles).toBe(2);
    expect(result.files.every(f => f.name.startsWith('test'))).toBe(true);
  });

  test('should respect maxDepth', async () => {
    const result = await FileSearch.search(testDir, { maxDepth: 0 });
    
    expect(result.totalFiles).toBe(2); // Only files in root directory
    expect(result.files.some(f => f.name === 'nested.md')).toBe(false);
  });

  test('should find files by name pattern', async () => {
    const files = await FileSearch.findByName(testDir, '*.js');
    
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('test.js');
  });

  test('should find files by extension', async () => {
    const files = await FileSearch.findByExtension(testDir, ['txt', 'md']);
    
    expect(files).toHaveLength(2);
    expect(files.some(f => f.name === 'test.txt')).toBe(true);
    expect(files.some(f => f.name === 'nested.md')).toBe(true);
  });

  test('should check if file exists', async () => {
    const exists = await FileSearch.exists(path.join(testDir, 'test.txt'));
    const notExists = await FileSearch.exists(path.join(testDir, 'nonexistent.txt'));
    
    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });
});
