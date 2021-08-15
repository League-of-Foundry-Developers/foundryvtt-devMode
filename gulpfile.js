const chalk = require('chalk');
const fs = require('fs-extra');
const gulp = require('gulp');
const sass = require('gulp-dart-sass');

/********************/
/*  CONFIGURATION   */
/********************/

const name = 'foundryvtt-devMode';
const sourceDirectory = '.';
const distDirectory = './';
const stylesDirectory = `${sourceDirectory}/styles`;
const stylesExtension = 'scss';

/********************/
/*      BUILD       */
/********************/

/**
 * Build style sheets
 */
function buildStyles() {
  return gulp
    .src(`${stylesDirectory}/${name}.${stylesExtension}`)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(`${distDirectory}`));
}

/**
 * Watch for changes for each build step
 */
function buildWatch() {
  gulp.watch(`${stylesDirectory}/**/*.${stylesExtension}`, { ignoreInitial: false }, buildStyles);
}

/********************/
/*      CLEAN       */
/********************/

/**
 * Remove built files from `dist` folder while ignoring source files
 */
async function clean() {
  const files = [];

  if (fs.existsSync(`${stylesDirectory}/${name}.${stylesExtension}`)) {
    files.push(`${name}.css`);
  }

  console.log(' ', chalk.yellow('Files to clean:'));
  console.log('   ', chalk.blueBright(files.join('\n    ')));

  for (const filePath of files) {
    await fs.remove(`${distDirectory}/${filePath}`);
  }
}

const execBuild = gulp.parallel(buildStyles);

exports.build = gulp.series(clean, execBuild);
exports.watch = buildWatch;
exports.clean = clean;
