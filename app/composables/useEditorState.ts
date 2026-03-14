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
  bash: 'plaintext',
  c: 'c',
  cc: 'cpp',
  cjs: 'javascript',
  conf: 'plaintext',
  cpp: 'cpp',
  css: 'css',
  csv: 'plaintext',
  cts: 'typescript',
  cxx: 'cpp',
  diff: 'plaintext',
  env: 'plaintext',
  go: 'go',
  h: 'c',
  hpp: 'cpp',
  htm: 'html',
  html: 'html',
  ini: 'plaintext',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsonc: 'json',
  jsx: 'jsx',
  less: 'css',
  log: 'plaintext',
  markdown: 'markdown',
  md: 'markdown',
  mdx: 'markdown',
  mjs: 'javascript',
  mts: 'typescript',
  patch: 'plaintext',
  php: 'php',
  py: 'python',
  pyw: 'python',
  rs: 'rust',
  scss: 'css',
  sh: 'plaintext',
  sql: 'sql',
  svelte: 'html',
  svg: 'xml',
  text: 'plaintext',
  toml: 'plaintext',
  ts: 'typescript',
  tsx: 'tsx',
  txt: 'plaintext',
  vue: 'html',
  xhtml: 'xml',
  xml: 'xml',
  xsd: 'xml',
  yaml: 'plaintext',
  yml: 'plaintext',
  zsh: 'plaintext'
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
