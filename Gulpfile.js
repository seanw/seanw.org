var config = {
  paths: {
    build: "./_site/**",
    img: ["./img/**/*"],
    js: ["./js/**/*.js"],
    css: ["./css/**/*.css"],
    html: {
      src: ["./_site/**/*.html"],
      dest: "./build"
    }
  }
};

var secretConfig = require("./_secret-config.js")(config);
var args = require("yargs").argv;
var uglify = require("gulp-uglifyjs");
var gulp = require("gulp");
var gulpIf = require("gulp-if");
var browserSync = require("browser-sync");
var concat = require("gulp-concat");
var reload = browserSync.reload;
var minifyCSS = require("gulp-minify-css");
var ghPages = require("gulp-gh-pages");
var rimraf = require("gulp-rimraf");
var runSequence = require("run-sequence");
var minifyHTML = require("gulp-minify-html");
var imagemin = require("gulp-imagemin");
var http = require("http");
var cloudflare = require("cloudflare")(config.cloudflareAccount);
var less = require("gulp-less");

var modes = {
  prod: { minify: true },
  dev: { minify: false }
};

var modeSelect = args.mode || "dev";
var mode = modes[modeSelect];

console.log("Using mode " + modeSelect, mode);

gulp.task("imagemin", function() {
  return gulp
    .src(config.paths.img, {
      base: "./"
    })
    .pipe(
      imagemin({
        progressive: true
      })
    )
    .pipe(gulp.dest("./"));
});

gulp.task("clean", function(cb) {
  // rimraf(config.paths.build, cb);
  return gulp
    .src(config.paths.build, {
      read: false
    }) // much faster
    .pipe(rimraf());
});

gulp.task("upload", function() {
  return gulp.src(config.paths.build).pipe(ghPages(config.ghPages));
});

gulp.task("deploy", ["build"], function() {
  if (modeSelect !== "prod") throw "You can only deploy in production mode";
  return runSequence(
    ["html", "css"],
    "upload",
    "purge-online-cache",
    "submit-sitemap"
  );
});

gulp.task("submit-sitemap", function(cb) {
  require("submit-sitemap").submitSitemap(config.sitemapUrl, function(err) {
    if (err) console.warn(err);

    cb();
  });
});

// Purges website cache so updates are shown
gulp.task("purge-online-cache", function() {
  cloudflare.clearCache(config.siteDomain, 1, function() {});
});

gulp.task("html", function() {
  // Overwrite original files
  return gulp
    .src(config.paths.html.src, {
      base: "./"
    })
    .pipe(gulpIf(mode.minify, minifyHTML()))
    .pipe(gulp.dest("./"));
});

gulp.task("css", function() {
  return gulp
    .src("css/*.css", {
      base: "./"
    })
    .pipe(
      less().on("error", function(err) {
        console.log(err);
      })
    )
    .pipe(gulpIf(mode.minify, minifyCSS()))
    .pipe(concat("styles3.css"))
    .pipe(gulp.dest("_site/css/"));
});

gulp.task("js", function() {
  return gulp
    .src("js/*.js")
    .pipe(gulpIf(mode.minify, uglify()))
    .pipe(concat("scripts.js"))
    .pipe(gulp.dest("_site/js/"));
});

// Compile SASS & auto-inject into browsers
gulp.task("sass", function() {
  return gulp
    .src("scss/styles.scss")
    .pipe(
      sass({
        includePaths: ["scss"]
      })
    )
    .pipe(gulp.dest("css"))
    .pipe(
      browserSync.reload({
        stream: true
      })
    );
});

// Reload all Browsers
gulp.task("bs-reload", function() {
  browserSync.reload();
});

function jekyllBuild(done) {
  return require("child_process", done).exec(
    "jekyll build --trace",
    {
      stdio: "inherit"
    },
    done
  );
}

gulp.task("commit-and-deploy", function(done) {
  return require("child_process", done).exec(
    "git add . && git commit -m && git push && gulp deploy",
    {
      stdio: "inherit"
    },
    done
  );
});

gulp.task("jekyll", function(done) {
  jekyllBuild(done);
});

// Start the server
gulp.task("browser-sync", function() {
  browserSync({
    server: {
      baseDir: "./_site/"
    },
    open: false
  });
});

gulp.task("build", function(done) {
  runSequence("jekyll", ["css", "js"], "bs-reload", done);
});

gulp.task("default", ["build", "browser-sync"], function() {
  //gulp.task('default', function() {
  //gulp.watch(config.paths.html.src, ['html']);
  //gulp.watch(config.paths.css, runSequence('jekyll', 'css', 'bs-reload'));

  //gulp.watch(["./js/*.js", "./**/*.html", "./css/*.css"],   runSequence('jekyll', 'css', 'bs-reload'));
  gulp.watch(
    [
      "./js/*.js",
      "./_data/*.yaml",
      "./**/*.html",
      "./css/*.css",
      "./**/*.markdown",
      "./**/*.yml",
      "img/**/*",
      "!./build/**/*",
      "!./_site/**/*"
    ],
    ["build"]
  );

  //gulp.watch("./build/**/*", ['bs-reload']);
  //gulp.watch(["./js/*.js", "./**/*.html", "!./build/**/*", "!./_site/**/*"], ['jekyll-build', 'bs-reload']);
});

var favicons = require("favicons").stream;

gulp.task("favicons", function() {
  return gulp
    .src("img/avatar.jpg") // Fails silently if this doesn't exist!
    .pipe(
      favicons({
        appName: "My App",
        appShortName: "App",
        appDescription: "This is my application",
        developerName: "Hayden Bleasel",
        developerURL: "http://haydenbleasel.com/",
        background: "#020307",
        path: "favicons/",
        url: "http://haydenbleasel.com/",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/?homescreen=1",
        version: 1.0,
        logging: true,
        html: "_includes/favicons.html",
        pipeHTML: true,
        replace: true,
        icons: {
          // Platform Options:
          // - offset - offset in percentage
          // - background:
          //   * false - use default
          //   * true - force use default, e.g. set background for Android icons
          //   * color - set background for the specified icons
          //   * mask - apply mask in order to create circle icon (applied by default for firefox). `boolean`
          //   * overlayGlow - apply glow effect after mask has been applied (applied by default for firefox). `boolean`
          //   * overlayShadow - apply drop shadow after mask has been applied .`boolean`
          //
          android: false, // Create Android homescreen icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          appleIcon: false, // Create Apple touch icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          appleStartup: false, // Create Apple startup images. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          coast: false, // Create Opera Coast icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          favicons: true, // Create regular favicons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          firefox: false, // Create Firefox OS icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          windows: false, // Create Windows 8 tile icons. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
          yandex: false // Create Yandex browser icon. `boolean` or `{ offset, background, mask, overlayGlow, overlayShadow }`
        }
      })
    )
    .on("error", x => console.error(x))
    .pipe(gulp.dest("./"));
});
