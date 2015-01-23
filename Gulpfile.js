var config = {
  paths: {
    build: "./_site/**",
    img: ["./img/**/*"],
    js: ["./js/**/*.js"],
    css: ["./css/**/*.css"],
    html: {
      src: ["./_site/**/*.html"],
      dest: "./build"
    },
  },
};
var secretConfig = require('./secret-config.js')(config);

var uglify = require('gulp-uglifyjs');
var gulp = require('gulp');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var reload = browserSync.reload;
var minifyCSS = require('gulp-minify-css');
var ghPages = require('gulp-gh-pages');
var rimraf = require('gulp-rimraf');
var runSequence = require('run-sequence');
var minifyHTML = require("gulp-minify-html");
var imagemin = require('gulp-imagemin');
var http = require('http');
var cloudflare = require('cloudflare').createClient(config.cloudflareAccount);

gulp.task('imagemin', function() {
  return gulp.src(config.paths.img, {
      base: './'
    })
    .pipe(imagemin({
      progressive: true
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('clean', function(cb) {
  // rimraf(config.paths.build, cb);
  return gulp.src(config.paths.build, {
      read: false
    }) // much faster
    .pipe(rimraf());
});

gulp.task('upload', function() {
  return gulp.src(config.paths.build)
    .pipe(ghPages(config.ghPages));
});

gulp.task('deploy', function() {
  return runSequence(['html', 'css'], 'upload', 'purge-online-cache', 'submit-sitemap');
});

gulp.task('submit-sitemap', function(cb) {
  require('submit-sitemap').submitSitemap(config.sitemapUrl, function(err) {
    if (err)
      console.warn(err);

    cb();
  });
});

// Purges website cache so updates are shown
gulp.task('purge-online-cache', function() {
  cloudflare.clearCache(config.siteDomain, 1, function() {});
});

gulp.task("html", function() {
  // Overwrite original files
  return gulp.src(config.paths.html.src, {
      base: './'
    })
    .pipe(minifyHTML())
    .pipe(gulp.dest('./'));
});

gulp.task("css", function() {
  return gulp.src("css/*.css", {
      base: './'
    })
    .pipe(minifyCSS())
    .pipe(concat('styles.css'))
    .pipe(gulp.dest('_site/css/'));
});

gulp.task('js', function() {
  return gulp.src('js/*.js')
  .pipe(uglify())
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest('_site/js/'));
});

// Compile SASS & auto-inject into browsers
gulp.task('sass', function() {
  return gulp.src('scss/styles.scss')
    .pipe(sass({
      includePaths: ['scss']
    }))
    .pipe(gulp.dest('css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

// Reload all Browsers
gulp.task('bs-reload', function() {
  browserSync.reload();
});

function jekyllBuild(done) {
  return require('child_process', done).exec('jekyll build --trace', {
    stdio: 'inherit'
  }, done);
}

gulp.task('jekyll', function(done) {
  jekyllBuild(done);
});

// Start the server
gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: "./_site/"
    },
    open: false
  });
});

gulp.task('build', function(done) {
  runSequence('jekyll', ['css', 'js'], 'bs-reload', done);
});

gulp.task('default', ['build', 'browser-sync'], function() {
//gulp.task('default', function() {
  //gulp.watch(config.paths.html.src, ['html']);
  //gulp.watch(config.paths.css, runSequence('jekyll', 'css', 'bs-reload'));

  //gulp.watch(["./js/*.js", "./**/*.html", "./css/*.css"],   runSequence('jekyll', 'css', 'bs-reload'));
  gulp.watch(["./js/*.js", "./**/*.html", "./css/*.css", "./**/*.markdown", "./**/*.yml",
  "!./build/**/*", "!./_site/**/*"], ['build']);


  //gulp.watch("./build/**/*", ['bs-reload']);
  //gulp.watch(["./js/*.js", "./**/*.html", "!./build/**/*", "!./_site/**/*"], ['jekyll-build', 'bs-reload']);
});
