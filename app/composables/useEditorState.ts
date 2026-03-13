import { ref, computed } from 'vue';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { php } from '@codemirror/lang-php';
import { sql } from '@codemirror/lang-sql';
import type { Extension } from '@codemirror/state';

const leftText = ref('');
const rightText = ref('');
const language = ref('plaintext');

const languageMap: Record<string, { label: string, extension: () => Extension }> = {
  plaintext: { label: 'Plain Text', extension: () => [] as unknown as Extension },
  javascript: { label: 'JavaScript', extension: () => javascript() },
  typescript: { label: 'TypeScript', extension: () => javascript({ typescript: true }) },
  jsx: { label: 'JSX', extension: () => javascript({ jsx: true }) },
  tsx: { label: 'TSX', extension: () => javascript({ jsx: true, typescript: true }) },
  python: { label: 'Python', extension: () => python() },
  html: { label: 'HTML', extension: () => html() },
  css: { label: 'CSS', extension: () => css() },
  json: { label: 'JSON', extension: () => json() },
  markdown: { label: 'Markdown', extension: () => markdown() },
  xml: { label: 'XML', extension: () => xml() },
  java: { label: 'Java', extension: () => java() },
  cpp: { label: 'C++', extension: () => cpp() },
  c: { label: 'C', extension: () => cpp() },
  rust: { label: 'Rust', extension: () => rust() },
  go: { label: 'Go', extension: () => go() },
  php: { label: 'PHP', extension: () => php() },
  sql: { label: 'SQL', extension: () => sql() }
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

export function getLanguageExtension(lang: string): Extension {
  const entry = languageMap[lang];
  if (entry) {
    return entry.extension();
  }
  return [] as unknown as Extension;
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
    supportedLanguages,
    getLanguageExtension
  };
}
