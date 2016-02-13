'use strict';
/*eslint-disable*/
var path = require('path');
var gulp = require('gulp');
var connect = require('gulp-connect');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var sourceMap = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var karma = require('karma').server;
var hbsfy = require('hbsfy');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var eslint = require('gulp-eslint');
var filename = require('./package.json').name.replace('component-', '');

gulp.task('eslint', function() {
    return gulp.src(['./src/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('karma', ['eslint'], function(done) {
    karma.start({
        configFile: path.join(__dirname, 'karma.conf.private.js'),
        singleRun: true,
        logLevel: 'error'
    }, done);
});

gulp.task('connect', function() {
    connect.server({
        livereload: true
    });
    gulp.watch(['./src/**/*.js', './index.js'], ['liveBuild']);
});

gulp.task('liveBuild', function() {
    var b = browserify({
        entries: 'index.js',
        debug: true
    });

    return b.transform(hbsfy)
        .bundle()
        .on('error', function(err) {
            console.log(err.message);
            this.emit('end');
        })
        .pipe(source(filename + '.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./'))
        .pipe(concat(filename + '.js'))
        .pipe(gulp.dest('./samples/js/'))
        .pipe(uglify())
        .pipe(concat(filename + '.min.js'))
        .pipe(gulp.dest('./'));
        //.pipe(concat(filename + '.js'))
        //.pipe(gulp.dest('./samples/js/'));
});

gulp.task('bundle', ['karma'], function() {
    var b = browserify({
        entries: 'index.js',
        debug: true
    });

    return b.transform(hbsfy)
        .bundle()
        .on('error', function(err) {
            console.log(err.message);
            this.emit('end');
        })
        .pipe(source(filename + '.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./'));
});

gulp.task('compress', ['bundle'], function() {
    gulp.src(filename + '.js')
        .pipe(uglify())
        .pipe(concat(filename + '.min.js'))
        .pipe(gulp.dest('./'));

});

gulp.task('concat', ['compress'], function() {
    gulp.src(filename + '.js')
        .pipe(concat(filename + '.js'))
        .pipe(gulp.dest('./samples/js/'));
});

gulp.task('default', ['eslint', 'karma', 'bundle', 'compress', 'concat']);
