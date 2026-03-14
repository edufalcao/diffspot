const TEXT_FILE_EXTENSIONS = new Set([
  'bash',
  'c',
  'cc',
  'cjs',
  'conf',
  'cpp',
  'css',
  'csv',
  'cts',
  'cxx',
  'diff',
  'env',
  'go',
  'h',
  'hpp',
  'htm',
  'html',
  'ini',
  'java',
  'js',
  'json',
  'jsonc',
  'jsx',
  'less',
  'log',
  'markdown',
  'md',
  'mdx',
  'mjs',
  'mts',
  'patch',
  'php',
  'py',
  'pyw',
  'rs',
  'scss',
  'sh',
  'sql',
  'svg',
  'text',
  'toml',
  'ts',
  'tsx',
  'txt',
  'xhtml',
  'xml',
  'xsd',
  'yaml',
  'yml',
  'zsh'
]);

const TEXT_MIME_TYPES = new Set([
  'application/javascript',
  'application/json',
  'application/ld+json',
  'application/sql',
  'application/typescript',
  'application/x-javascript',
  'application/x-sh',
  'application/x-shellscript',
  'application/x-typescript',
  'application/x-yaml',
  'application/xml',
  'application/yaml'
]);

const SUSPICIOUS_CONTROL_BYTE_THRESHOLD = 0.1;

function getFileExtension(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext && ext !== filename.toLowerCase() ? ext : null;
}

function hasKnownTextExtension(file: File): boolean {
  const ext = getFileExtension(file.name);
  return ext != null && TEXT_FILE_EXTENSIONS.has(ext);
}

function hasTextMimeType(file: File): boolean {
  return file.type.startsWith('text/') || TEXT_MIME_TYPES.has(file.type);
}

async function hasTextLikeContent(file: File): Promise<boolean> {
  const sample = new Uint8Array(await file.slice(0, 8192).arrayBuffer());
  if (sample.length === 0) return true;

  let suspiciousControlBytes = 0;

  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 7 || (byte > 13 && byte < 32)) {
      suspiciousControlBytes++;
    }
  }

  return suspiciousControlBytes / sample.length < SUSPICIOUS_CONTROL_BYTE_THRESHOLD;
}

export const acceptedTextFileTypes = [
  'text/*',
  ...Array.from(TEXT_FILE_EXTENSIONS, ext => `.${ext}`)
].join(',');

export async function isSupportedTextFile(file: File): Promise<boolean> {
  if (hasTextMimeType(file) || hasKnownTextExtension(file)) {
    return hasTextLikeContent(file);
  }

  return hasTextLikeContent(file);
}

export function getTextFileValidationMessage(): string {
  return 'Only text-based files are supported.';
}
