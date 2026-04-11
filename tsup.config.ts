import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'], // 仅输出 ESModule
  dts: true, // 生成 .d.ts 类型文件
  splitting: false,
  sourcemap: true,
  clean: true, // 每次构建前先清理 dist 目录
  minify: true, // 压缩输出文件
  outDir: 'dist',
  // 排除不需要的文件
  external: [
    'axios',
    'mitt',
    'iconv-lite',
    'nongyu-jiaowu'
  ],
  // 忽略的文件模式
  ignoreWatch: [
    '**/test/**',
    '**/rules/**',
    '**/*.md',
    'package.json',
  ],
});
