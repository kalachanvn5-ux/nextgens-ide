/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import fse from 'fs-extra';
import path from 'path';
import { run } from '../esbuild-webview-common.mts';

const srcDir = path.join(import.meta.dirname, 'notebook');
const outDir = path.join(import.meta.dirname, 'notebook-out');

function postBuild(outDir: string) {
	// Prefer the extension-local katex; fall back to the repo-root node_modules
	// (needed when per-extension node_modules are not installed, e.g. CI with SKIP_SUBMODULE_DEPS).
	const localKatexDir = path.join(import.meta.dirname, 'node_modules', 'katex', 'dist');
	const rootKatexDir = path.join(import.meta.dirname, '..', '..', 'node_modules', 'katex', 'dist');
	const katexDir = fse.existsSync(path.join(localKatexDir, 'katex.min.css')) ? localKatexDir : rootKatexDir;

	fse.copySync(
		path.join(katexDir, 'katex.min.css'),
		path.join(outDir, 'katex.min.css'));

	const fontsDir = path.join(katexDir, 'fonts');
	const fontsOutDir = path.join(outDir, 'fonts/');

	fse.mkdirSync(fontsOutDir, { recursive: true });

	for (const file of fse.readdirSync(fontsDir)) {
		if (file.endsWith('.woff2')) {
			fse.copyFileSync(path.join(fontsDir, file), path.join(fontsOutDir, file));
		}
	}
}

run({
	entryPoints: [
		path.join(srcDir, 'katex.ts'),
	],
	srcDir,
	outdir: outDir,
}, process.argv, postBuild);
