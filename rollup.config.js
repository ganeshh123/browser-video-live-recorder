import resolve from 'rollup-plugin-node-resolve'

export default [
	{
		input: 'src/content_scripts/worker/live-recorder-worker.js',
		output: {
			name: 'worker',
			format: 'iife', //?
			file: 'live-recorder-worker-bundle.js'
		},
		plugins: [
			resolve({
				jsnext: true,
				browser: true
			})
		]
	},
	{
		input: 'src/content_scripts/main.js',
		output: {
			name: 'bundle',
			format: 'iife',
			file: 'bundle.js',
			sourcemap: true
		},
		plugins: [
			resolve({
				jsnext: true,
				browser: true
			})
		]
	}
]

