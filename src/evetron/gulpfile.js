/// <binding Clean='clean' ProjectOpened='watch' />
'use strict';

var gulp = require('gulp'),
    tsc = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    typings = require('gulp-typings'),
    rimraf = require('gulp-rimraf');

var paths = {
    root: 'bin',
    dest: 'bin/resources/app',
    maps: 'maps',
    ts: {
        src: 'scripts/**/*.ts'
    },
    html: {
        src: 'pages/**/*.html'
    }
}

gulp.task('clean:js', function () {
    return gulp.src(paths.dest + '/**/*.js')
        .pipe(rimraf());
});

gulp.task('clean:maps', function () {
    return gulp.src(paths.maps + '/**/*.map')
        .pipe(rimraf());
});

gulp.task('clean:html', function () {
    return gulp.src(paths.dest + '/**/*.html')
        .pipe(rimraf());
});

gulp.task('clean', function () {
    return gulp.src([paths.root, paths.maps])
        .pipe(rimraf());
});

gulp.task('compile:ts', ['clean:js', 'clean:maps'], function () {
    return gulp.src(paths.ts.src)
        .pipe(sourcemaps.init())
        .pipe(tsc(tsc.createProject('tsconfig.json')))
        .pipe(sourcemaps.write('../../../' + paths.maps))
        .pipe(gulp.dest(paths.dest));
});

gulp.task('compile:html', ['clean:html'], function () {
    return gulp.src(paths.html.src)
        .pipe(gulp.dest(paths.dest));
});

gulp.task('installTypings', function () {
    return gulp.src('typings.json')
        .pipe(typings());
});

gulp.task('copy-electron-dist', function () {
    return gulp.src('node_modules/electron-prebuilt/dist/**/*.*')
        .pipe(gulp.dest(paths.root));
});

gulp.task('compile', ['compile:ts', 'compile:html']);

gulp.task('build', ['copy-electron-dist', 'compile']);

gulp.task('rebuild', ['build'], function () {
    return gulp.src('package.json')
        .pipe(gulp.dest(paths.dest));
});

gulp.task('watch', function () {
    return gulp.watch([paths.ts.src, paths.html.src], ['compile']);
})