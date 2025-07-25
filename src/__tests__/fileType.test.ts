import { FileTypeDetector } from '../fileType';

describe('FileTypeDetector', () => {
  test('should detect JavaScript file type', () => {
    const fileType = FileTypeDetector.detectFromPath('test.js');
    
    expect(fileType.extension).toBe('.js');
    expect(fileType.mimeType).toBe('application/javascript');
    expect(fileType.category).toBe('Code');
    expect(fileType.isText).toBe(true);
    expect(fileType.isBinary).toBe(false);
  });

  test('should detect image file type', () => {
    const fileType = FileTypeDetector.detectFromPath('image.png');
    
    expect(fileType.extension).toBe('.png');
    expect(fileType.mimeType).toBe('image/png');
    expect(fileType.category).toBe('Image');
    expect(fileType.isImage).toBe(true);
    expect(fileType.isBinary).toBe(true);
  });

  test('should detect unknown file type', () => {
    const fileType = FileTypeDetector.detectFromPath('unknown.xyz');
    
    expect(fileType.extension).toBe('.xyz');
    expect(fileType.mimeType).toBe('application/octet-stream');
    expect(fileType.category).toBe('Unknown');
  });

  test('should get supported extensions', () => {
    const extensions = FileTypeDetector.getSupportedExtensions();
    
    expect(extensions).toContain('.js');
    expect(extensions).toContain('.png');
    expect(extensions).toContain('.pdf');
    expect(extensions.length).toBeGreaterThan(0);
  });

  test('should get extensions by category', () => {
    const codeExtensions = FileTypeDetector.getExtensionsByCategory('Code');
    
    expect(codeExtensions).toContain('.js');
    expect(codeExtensions).toContain('.ts');
    expect(codeExtensions).toContain('.py');
  });

  test('should handle case insensitive extensions', () => {
    const fileType1 = FileTypeDetector.detectFromPath('test.JS');
    const fileType2 = FileTypeDetector.detectFromPath('test.js');
    
    expect(fileType1.mimeType).toBe(fileType2.mimeType);
    expect(fileType1.category).toBe(fileType2.category);
  });
});
