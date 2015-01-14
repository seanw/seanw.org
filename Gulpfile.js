var gulp        = require('gulp');
var browserSync = require('browser-sync');
var reload      = browserSync.reload;
var minifyCSS   = require('gulp-minify-css');
var ghPages     = require('gulp-gh-pages');
var rimraf      = require('gulp-rimraf');
var runSequence = require('run-sequence');

minifyHTML = require("gulp-minify-html");

var config = {
  paths: {
    build: "./_site/**",
    html: {
      src:  ["./_site/**/*.html"],
      css:  ["./_site/**/*.css"],
      dest: "./build"
    },
  },
  pagesUrl : 'http://seanw.github.com/seanw.org',
  ghPages : {remoteUrl: 'https://github.com/seanw/seanw.org/'}
}

gulp.task('clean', function (cb) {
  // rimraf(config.paths.build, cb);
  return gulp.src(config.paths.build, { read: false }) // much faster
  .pipe(rimraf());
})

gulp.task('upload', function () {
  return gulp.src(config.paths.build)
  .pipe(ghPages(config.ghPages));
});

gulp.task('deploy', function () {
  return runSequence(['html', 'css'], 'upload');
});

gulp.task("html", function(){
  // return gulp.src(config.paths.html.src)
  // .pipe(minifyHTML())
  // .pipe(gulp.dest(config.paths.html.dest));

  // Overwrite original files
  return gulp.src(config.paths.html.src, {base: './'})
  .pipe(minifyHTML())
  .pipe(gulp.dest('./'));
});

gulp.task("css", function(){
  // Overwrite original files
  return gulp.src(config.paths.html.css, {base: './'})
  .pipe(minifyCSS())
  .pipe(gulp.dest('./'));
});

// Start the server
gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: "./_site/"
    }
  });
});

// Compile SASS & auto-inject into browsers
gulp.task('sass', function () {
  return gulp.src('scss/styles.scss')
  .pipe(sass({includePaths: ['scss']}))
  .pipe(gulp.dest('css'))
  .pipe(browserSync.reload({stream:true}));
});

// Reload all Browsers
gulp.task('bs-reload', function () {
  browserSync.reload();
});

gulp.task('jekyll-build', function () {
  jekyllBuild();
});

function jekyllBuild(done) {
  return require('child_process').exec('jekyll', ['build'], {stdio: 'inherit'}, done);
}

gulp.task('default', ['browser-sync'], function () {
  gulp.watch(config.paths.html.src, ['html']);
  //gulp.watch("./build/**/*", ['bs-reload']);
  gulp.watch(["./**/*.html", "!./build/**/*", "!./_site/**/*"], ['jekyll-build', 'bs-reload']);
});
