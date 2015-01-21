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

var options = {
  host: 'www.google.com',
  port: 80,
  path: '/upload',
  method: 'POST'
};

function submitSitemap(submitHost, submitPath, successCallback, errorCallback) {
  var options = {
    host: submitHost,
    port: 80,
    path: submitPath + encodeURIComponent(config.siteDomain),
    agent: false
  };

  http
    .get(options, function(req) {
      successCallback();
      req.on('data', function(chunk) {
        console.error('BODY: ' + chunk);
      });
    })
    .on('error', errorCallback)
    // .on('end', cb);
}

gulp.task('submit-sitemap', function(cb) {
  require('submit-sitemap').submitSitemap(config.sitemapUrl, function(err) {
    if (err)
      console.warn(err);
  });
});


// Purges website cache so updates are shown
gulp.task('purge-online-cache', function() {
  cloudflare.clearCache(config.siteDomain, 1, function() {});
});

gulp.task("html", function() {
  // return gulp.src(config.paths.html.src)
  // .pipe(minifyHTML())
  // .pipe(gulp.dest(config.paths.html.dest));

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
  gulp.src('js/*.js')
  .pipe(uglify())
  .pipe(concat('scripts.js'))
  .pipe(gulp.dest('js/'))
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
  return require('child_process', done).exec('jekyll build', {
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
    }
  });
});

gulp.task('build', function(done) {
  runSequence('jekyll', 'css', 'bs-reload', done);
});

gulp.task('default', ['browser-sync'], function() {
//gulp.task('default', function() {
  //gulp.watch(config.paths.html.src, ['html']);
  //gulp.watch(config.paths.css, runSequence('jekyll', 'css', 'bs-reload'));

  //gulp.watch(["./js/*.js", "./**/*.html", "./css/*.css"], runSequence('jekyll', 'css', 'bs-reload'));
  gulp.watch(["./js/*.js", "./**/*.html", "./css/*.css",
  "!./build/**/*", "!./_site/**/*"

  ], ['build']);

  //gulp.watch("./build/**/*", ['bs-reload']);
  //gulp.watch(["./js/*.js", "./**/*.html", "!./build/**/*", "!./_site/**/*"], ['jekyll-build', 'bs-reload']);
});
