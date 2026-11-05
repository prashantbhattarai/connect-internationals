function compileTypeScript(module, filename) {
 const source = require('fs').readFileSync(filename, 'utf8');
 module._compile(require('typescript').transpileModule(source, { fileName: filename, compilerOptions: { module: 1, target: 9, jsx: 4, esModuleInterop: true } }).outputText, filename);
}
require.extensions['.ts'] = compileTypeScript;
require.extensions['.tsx'] = compileTypeScript;
require(require('path').resolve(process.argv[2]));
