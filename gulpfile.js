'use strict';
/*eslint-disable*/
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var gulp = require('gulp');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var eslint = require('gulp-eslint');
var header = require('gulp-header');

var pkg = require('./package.json');

/**
 * Paths
 */
var SOURCE_DIR = './src/**/*';
var ENTRY = 'index.js';
var DIST = 'dist';
var NAME = pkg.name;

var banner = ['/**',
    ' * <%= pkg.name %>',
    ' * @author <%= pkg.author %>',
    ' * @version v<%= pkg.version %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');

gulp.task('connect', function() {
    connect.server();
});

gulp.task('eslint', function() {
    return gulp.src([SOURCE_DIR])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('bundle', ['eslint'], function() {
    return browserify({entries: ENTRY, debug: true})
        .bundle()
        .on('error', function(err) {
            console.log(err.message);
            this.emit('end');
        })
        .pipe(source(NAME + '.js'))
        .pipe(buffer())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest(DIST))
        .pipe(uglify())
        .pipe(rename(NAME + '.min.js'))
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest(DIST))
});

