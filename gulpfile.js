const babel = require('gulp-babel')
const eslint = require('gulp-eslint')
const gulp = require('gulp')
const plumber = require('gulp-plumber')
const rename = require('gulp-rename')

const PATHS = {
  scripts: ['app/assets/ES6/*.js', 'app/assets/ES6/**/*.js'],
  dist: 'app/assets/javascripts'
}

gulp.task('dist', ['scripts'])
gulp.task('dev', ['scripts', 'watch'])

// gulp.task('scripts', ['lint'], () => {
gulp.task('scripts', () => {
  return gulp.src(PATHS.scripts)
    .pipe(plumber())
    .pipe(babel({
      presets: ['es2015', 'stage-0']
    }))
    .pipe(rename((path) => {
      path.basename += '-ES6'
      path.extname = '.js'
    }))
    .pipe(plumber.stop())
    .pipe(gulp.dest(PATHS.dist))
})

gulp.task('lint', () => {
  return gulp.src(PATHS.scripts)
    .pipe(plumber())
    .pipe(eslint())
    // .pipe(eslint.format('stylish'))
    // .pipe(eslint.failOnError(false))
    .pipe(plumber.stop())
})

gulp.task('watch', () => {
  gulp.watch([PATHS.scripts], ['scripts'])
})
