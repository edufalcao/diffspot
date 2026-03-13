import { ref, computed } from 'vue';
import type { Extension } from '@codemirror/state';

const leftText = ref('');
const rightText = ref('');
const language = ref('plaintext');

const EMPTY_EXTENSION = [] as unknown as Extension;

const languageMap: Record<string, { label: string, loadExtension: () => Promise<Extension> }> = {
  plaintext: { label: 'Plain Text', loadExtension: async () => EMPTY_EXTENSION },
  javascript: {
    label: 'JavaScript',
    loadExtension: async () => (await import('@codemirror/lang-javascript')).javascript()
  },
  typescript: {
    label: 'TypeScript',
    loadExtension: async () => (await import('@codemirror/lang-javascript')).javascript({ typescript: true })
  },
  jsx: {
    label: 'JSX',
    loadExtension: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true })
  },
  tsx: {
    label: 'TSX',
    loadExtension: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: true })
  },
  python: {
    label: 'Python',
    loadExtension: async () => (await import('@codemirror/lang-python')).python()
  },
  html: {
    label: 'HTML',
    loadExtension: async () => (await import('@codemirror/lang-html')).html()
  },
  css: {
    label: 'CSS',
    loadExtension: async () => (await import('@codemirror/lang-css')).css()
  },
  json: {
    label: 'JSON',
    loadExtension: async () => (await import('@codemirror/lang-json')).json()
  },
  markdown: {
    label: 'Markdown',
    loadExtension: async () => (await import('@codemirror/lang-markdown')).markdown()
  },
  xml: {
    label: 'XML',
    loadExtension: async () => (await import('@codemirror/lang-xml')).xml()
  },
  java: {
    label: 'Java',
    loadExtension: async () => (await import('@codemirror/lang-java')).java()
  },
  cpp: {
    label: 'C++',
    loadExtension: async () => (await import('@codemirror/lang-cpp')).cpp()
  },
  c: {
    label: 'C',
    loadExtension: async () => (await import('@codemirror/lang-cpp')).cpp()
  },
  rust: {
    label: 'Rust',
    loadExtension: async () => (await import('@codemirror/lang-rust')).rust()
  },
  go: {
    label: 'Go',
    loadExtension: async () => (await import('@codemirror/lang-go')).go()
  },
  php: {
    label: 'PHP',
    loadExtension: async () => (await import('@codemirror/lang-php')).php()
  },
  sql: {
    label: 'SQL',
    loadExtension: async () => (await import('@codemirror/lang-sql')).sql()
  }
};

const extensionToLanguage: Record<string, string> = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  jsx: 'jsx',
  tsx: 'tsx',
  py: 'python',
  pyw: 'python',
  html: 'html',
  htm: 'html',
  vue: 'html',
  svelte: 'html',
  css: 'css',
  scss: 'css',
  less: 'css',
  json: 'json',
  jsonc: 'json',
  md: 'markdown',
  mdx: 'markdown',
  xml: 'xml',
  svg: 'xml',
  xhtml: 'xml',
  java: 'java',
  cpp: 'cpp',
  cxx: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  h: 'c',
  c: 'c',
  rs: 'rust',
  go: 'go',
  php: 'php',
  sql: 'sql'
};

export function detectLanguageFromFilename(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return extensionToLanguage[ext] ?? null;
}

export async function loadLanguageExtension(lang: string): Promise<Extension> {
  const entry = languageMap[lang];
  if (entry) {
    return entry.loadExtension();
  }
  return EMPTY_EXTENSION;
}

export function useEditorState() {
  const supportedLanguages = computed(() =>
    Object.entries(languageMap).map(([value, { label }]) => ({
      label,
      value
    }))
  );

  return {
    leftText,
    rightText,
    language,
    supportedLanguages
  };
}
