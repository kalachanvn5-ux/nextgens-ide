/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import path from 'path';
import { createRequire } from 'module';
import { run } from '../esbuild-webview-common.mts';

const srcDir = path.join(import.meta.dirname, 'preview-src');
const outDir = path.join(import.meta.dirname, 'media');

// Resolve @vscode/codicons from the nearest node_modules (extension-local or repo root)
const req = createRequire(import.meta.url);
const codiconsDir = path.dirname(req.resolve('@vscode/codicons/package.json'));
const codiconsCss = path.join(codiconsDir, 'dist', 'codicon.css');

run({
	entryPoints: {
		'index': path.join(srcDir, 'index.ts'),
		'codicon': codiconsCss,
	},
	srcDir,
	outdir: outDir,
	additionalOptions: {
		loader: {
			'.ttf': 'dataurl',
		}
	}
}, process.argv);
