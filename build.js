const fs = require('fs');
const path = require('path');

const browserify = require("browserify");
const minify = require('html-minifier').minify;
const tsify = require("tsify");

const MINIFY_OPTIONS = {
  collapseWhitespace: true,
  minifyCSS: true,
};

const minifiedHtml = minify(fs.readFileSync('src/index.html', 'utf8'), MINIFY_OPTIONS);
fs.writeFileSync('build/index.html', minifiedHtml);

const bundleFile = fs.createWriteStream('build/webgl-maze.js');

browserify()
  .add('src/index.ts')
  .plugin(tsify)
  .bundle()
  .on('error', (error) => { console.log(error.toString()); })
  .pipe(bundleFile);
