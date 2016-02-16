var gulp         = require('gulp'), // gulp core
    jade         = require('gulp-jade'),
    sass         = require('gulp-sass'), // sass compiler
    uglify       = require('gulp-uglify'), // uglifies the js
    jshint       = require('gulp-jshint'), // check if js is ok
    rename       = require("gulp-rename"); // rename files
    concat       = require('gulp-concat'), // concatinate js
    notify       = require('gulp-notify'), // send notifications to osx
    plumber      = require('gulp-plumber'), // disable interuption
    stylish      = require('jshint-stylish'), // make errors look good in shell
    minifycss    = require('gulp-minify-css'), // minify the css files
    browserSync  = require('browser-sync').create(), // inject code to all devices
    autoprefixer = require('gulp-autoprefixer'), // sets missing browserprefixes
    gulpif       = require('gulp-if'),
    imagemin     = require('gulp-imagemin');

var env          = process.env.NODE_ENV || 'development';
var outputDir    = 'builds/development/';

// folders relative to root dir
var target = {
    img_src : './src/img/*',                            // all image files
    img_dest : 'img',                                   // where to put minified images

    jade_src : './src/templates/**/*.jade',                            // all image files
    jade_dest : '',                                   // where to put minified images

    sass_src : './src/sass/**/*.scss',                        // all sass files
    css_dest : 'css',                                   // where to put minified css

    js_lint_src : [                                     // all js that should be linted
        './src/js/build/*.js',
        './src/js/build/custom/**/*.js'
    ],
    js_uglify_src : [                                   // all js files that should not be concatinated
        './src/js/build/vendor/modernizr.js'
    ],
    js_concat_src : [                                   // all js files that should be concatinated
        './src/js/build/custom/custom/modules/*.js',
        './src/js/build/*.js'
    ],
    js_dest : 'js'                                      // where to put minified js
};

gulp.task('images', function(){
    return gulp.src(target.img_src)
        .pipe(gulpif(env === 'production', imagemin()))
        .pipe(gulp.dest(outputDir + target.img_dest))
        .pipe(notify({message: 'Images processed!'}));    // notify when done
});

gulp.task('jade', function(){
    return gulp.src(target.jade_src)
        .pipe(plumber())
        .pipe(jade())
        .pipe(gulp.dest(outputDir + target.jade_dest))
        .pipe(browserSync.stream())
        .pipe(notify({message: 'JADE templates processed!'}));    // notify when done
});


gulp.task('sass', function() {
    var config = {};
    if (env === 'development'){
        config.sourceComments = 'map';
        config.outputStyle = "expanded";
    }

    if (env === 'production'){
        config.outputStyle = "compressed";
    }

    gulp.src(target.sass_src)                           // get the files
        .pipe(plumber())                                // make sure gulp keeps running on errors
        .pipe(sass(config))                                   // compile all sass
        .pipe(autoprefixer(                             // complete css with correct vendor prefixes
            'last 2 version',
            '> 1%',
            'ie 8',
            'ie 9',
            'ios 6',
            'android 4'
        ))
        .pipe(minifycss())                              // minify css
        .pipe(gulp.dest(outputDir + target.css_dest))   // where to put the file
        .pipe(notify({message: 'SCSS processed!'}));    // notify when done
});


// lint my custom js
gulp.task('js-lint', function() {
    gulp.src(target.js_lint_src)                        // get the files
        .pipe(jshint())                                 // lint the files
        .pipe(jshint.reporter(stylish))                 // present the results in a beautiful way
});

// minify all js files that should not be concatinated
gulp.task('js-uglify', function() {
    gulp.src(target.js_uglify_src)                      // get the files
        .pipe(uglify())                                 // uglify the files
        .pipe(rename(function(dir,base,ext){            // give the files a min suffix
            var trunc = base.split('.')[0];
            return trunc + '.min' + ext;
        }))
        .pipe(gulp.dest(outputDir + target.js_dest))                // where to put the files
        .pipe(notify({ message: 'JS processed!'}));     // notify when done
});

// minify & concatinate all other js
gulp.task('js-concat', function() {
    gulp.src(target.js_concat_src)                      // get the files
        .pipe(uglify())                                 // uglify the files
        .pipe(concat('scripts.min.js'))                 // concatinate to one file
        .pipe(gulp.dest(outputDir + target.js_dest))                // where to put the files
        .pipe(notify({message: 'JS processed!'}));      // notify when done
});


/*******************************************************************************
5. BROWSER SYNC
*******************************************************************************/

gulp.task('browser-sync', function() {
    browserSync.init({
        files: ['css/*.css', 'js/*.js'],                 // files to inject
        //proxy: 'localhost:2368',                          // development server & port
        server: {
            baseDir: outputDir
        }
    });
});


/*******************************************************************************
1. GULP TASKS
*******************************************************************************/

gulp.task('default', function() {
    gulp.run('sass', 'js-lint', 'js-uglify', 'js-concat', 'jade', 'images', 'browser-sync');
    gulp.watch(target.sass_src, function() {
        gulp.run('sass');
    }).on('change', browserSync.reload);
    gulp.watch(target.js_lint_src, function() {
        gulp.run('js-lint');
    });
    gulp.watch(target.js_minify_src, function() {
        gulp.run('js-uglify');
    }).on('change', browserSync.reload);
    gulp.watch(target.js_concat_src, function() {
        gulp.run('js-concat');
    }).on('change', browserSync.reload);
    gulp.watch(target.jade_src, function() {
        gulp.run('jade');
    }).on('change', browserSync.reload);
    gulp.watch(target.img_src, function() {
        gulp.run('images');
    }).on('change', browserSync.reload);
});
