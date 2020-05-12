import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default [
	{
		input: 'src/content_scripts/main.js',
		output: {
			name: 'bundle',
			format: 'umd',
			file: 'bundle.js',
			sourcemap: true
		},
		plugins: [
			resolve(),
			commonjs()
		]
	}
]

