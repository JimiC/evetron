/// <binding BeforeBuild='rebuild' Clean='clean' ProjectOpened='default' />
'use strict';

var paths = {
    srcDir: './src/evetron',
    testsDir: './tests/evetron',
    packDir: './pack/',
    installBuilderDir: './dist/',
    appDir: (process.platform === 'darwin'
        ? 'Electron.app/Contents/Resources'
        : 'resources') + '/app',
    electronDist: './node_modules/electron/dist',
    packagerDir: 'tools/packager',
    platformResourcesDir: 'resources/' + process.platform,
    ts: {
        src: '/scripts/**/*.ts'
    },
    scss: {
        src: '/sass/**/*.scss'
    },
    html: {
        src: '/html/**/*.html'
    },
};

paths.srcBinDir = paths.srcDir + '/bin';
paths.testssrcBinDir = paths.testsDir + '/bin';
paths.destDir = paths.srcBinDir + '/' + paths.appDir;
paths.iconPath = paths.platformResourcesDir + '/icon';

var gulp = require('gulp'),
    util = require('util'),
    ncu = require('npm-check-updates'),
    fs = require('fs-extra'),
    del = require('del'),
    runsequence = require('run-sequence'),
    log = require('loglevel'),
    chalk = require('chalk'),
    eslint = require('gulp-eslint'),
    tslint = require('gulp-tslint'),
    tsc = require('gulp-typescript'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    typings = require('gulp-typings'),
    rename = require('gulp-rename'),
    packager = require('electron-packager'),
    builder = require('electron-builder'),
    packageJson = require(paths.srcDir + '/package.prod.json');

log.enableAll();

/******* npm packages check ********/

gulp.task('check-packages-updates', function () {
    return ncu.run({
        packageFile: 'package.json',
    }).then(function (upgraded) {
        var str = 'None';
        if (Object.keys(upgraded).length) {
            str = '';
            for (var upgrade in upgraded) {
                str += '\n';
                str += util.format('    - %s : %s', upgrade, upgraded[upgrade]);
            }
        }

        log.info('Dependencies to upgrade: %s', str);
    });
});

gulp.task('update-packages', function () {
    return ncu.run({
        packageFile: 'package.json',
        upgrade: true,
        loglevel: 'warn'
    });
});


/******* typings ********/

gulp.task('install-typings', function () {
    return gulp.src('./typings.json')
        .pipe(typings())
        .pipe(gulp.dest('.'));
});


/******* eslint ********/

gulp.task('eslint', function () {
    return gulp.src(['gulpfile.js', '!node_modules/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});


/******* tslint ********/

gulp.task('tslint', function () {
    return gulp.src([paths.srcDir + paths.ts.src])
        .pipe(tslint())
        .pipe(tslint.report('verbose', {
            emitError: false,
            summarizeFailureOutput: true
        }));
});


/******* src ********/

gulp.task('clean:js', ['clean:js.map'], function () {
    return del(paths.destDir + '/**/*.js');
});

gulp.task('clean:js.map', function () {
    return del(paths.destDir + '/**/*.js.map');
});

gulp.task('clean:html', function () {
    return del(paths.destDir + '/**/*.html');
});

gulp.task('clean:css', ['clean:css.map'], function () {
    return del(paths.destDir + '/**/*.css');
});

gulp.task('clean:css.map', function () {
    return del(paths.destDir + '/**/*.css.map');
});

gulp.task('clean', function () {
    return del(paths.srcBinDir);
});

gulp.task('copy:html', ['clean:html'], function () {
    return gulp.src(paths.srcDir + paths.html.src)
        .pipe(gulp.dest(paths.destDir));
});


/******* sass ********/

gulp.task('compile:sass', ['clean:css'], function () {
    return gulp.src(paths.srcDir + paths.scss.src)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: util.format('../../../%s/sass/',
                process.platform === 'darwin'
                    ? '../..'
                    : '')
        }))
        .pipe(gulp.dest(paths.destDir));
});


/******* typescript ********/

gulp.task('compile:ts', ['clean:js'], function () {
    var tscProject = tsc.createProject(paths.srcDir + '/tsconfig.json');

    return tscProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsc(tscProject))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: util.format('../../../%s/scripts/',
                process.platform === 'darwin'
                    ? '../..'
                    : '')
        }))
        .pipe(gulp.dest(paths.destDir));
});


/******* build ********/

gulp.task('compile', ['compile:ts', 'compile:sass', 'copy:html'], function () {
    return gulp.src(paths.srcDir + '/package.prod.json')
        .pipe(rename('package.json'))
        .pipe(gulp.dest(paths.destDir));
});

gulp.task('build', ['compile'], function (cb) {
    return fs.copy(paths.electronDist, paths.srcBinDir,
        new RegExp('^(?!.+default_app\.asar)'),
        cb
    );
});

gulp.task('rebuild', function () {
    runsequence('clean', 'build');
});


/******* watchers ********/

gulp.task('watch:html', function () {
    return gulp.watch([paths.srcDir + paths.html.src], ['copy:html']);
});

gulp.task('watch:ts', function () {
    return gulp.watch([paths.srcDir + paths.ts.src], ['compile:ts', 'tslint']);
});

gulp.task('watch:sass', function () {
    gulp.watch(paths.srcDir + paths.scss.src, ['compile:sass']);
});

gulp.task('watch:tests', function () {
    return gulp.watch([paths.testsDir + paths.ts.src], ['compile-tests', 'tslint']);
});


/******* tests ********/

gulp.task('clean-tests', function () {
    return del(paths.testssrcBinDir);
});

gulp.task('compile-tests', ['clean-tests'], function () {
    var tscProject = tsc.createProject(paths.testsDir + '/tsconfig.json');

    return tscProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsc(tscProject))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: '../../scripts/'
        }))
        .pipe(gulp.dest(paths.testssrcBinDir));
});

gulp.task('pretest', function () {
    runsequence('rebuild', 'compile-tests');
});


/******* packager ********/

var packagerOptions = {
    dir: paths.destDir,
    platform: process.platform,
    arch: 'x64',
    name: packageJson.name,
    //version: packageJson.devDependencies['electron-prebuilt'],
    //download: { cache: util.format('./%s/cache', paths.packagerDir)},
    ignore: '.+\.map',
    out: paths.packDir,
    icon: util.format('./%s/%s', paths.packagerDir, paths.iconPath),
    asar: true,
    overwrite: true,
    appVersion: packageJson.version,
    appCopyright: packageJson.copyright,
    buildVersion: packageJson.version,
    versionString: {
        CompanyName: packageJson.author.name,
        FileDescription: packageJson.productName,
        ProductName: packageJson.productName,
        OriginalFilename: packageJson.name + '.exe'
    },
    extendInfo: util.format('./%s/%s/evetron.plist', paths.packagerDir, paths.platformResourcesDir)
};

gulp.task('clean:package', function () {
    return del(paths.packDir);
});

gulp.task('package', ['clean:package', 'compile'], function (cb) {
    return packager(packagerOptions, cb);
});


/******* installer *******/

var installerOptions = {
    devMetadata: {
        build: {
            win: {
                // README: https://github.com/electron-userland/electron-builder/wiki/Options#buildwin
                iconUrl: util.format('%s/blob/master/%s/%s.ico?raw=true', packageJson.repository, paths.packagerDir, paths.iconPath)
            },
            linux: {
                // README: https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#linux
                // https://github.com/electron-userland/electron-builder/wiki/Options#buildlinux
                target: ['deb', 'rpm']
            },
            mac: {
                // README: https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#macos
                // https://github.com/electron-userland/electron-builder/wiki/Options#buildmac
            }
        },
        directories: {
            buildResources: util.format('./%s/%s', paths.packagerDir, paths.platformResourcesDir),
            app: paths.destDir,
            output: paths.installBuilderDir
        }
    }
};

gulp.task('clean:installer', function () {
    return del(paths.installBuilderDir);
});

gulp.task('installer', ['clean:installer', 'compile'], function () {
    return builder.build(installerOptions)
        .then(function () {
            log.info(chalk.green('Installer for %s created successfully.'), process.platform);
        })
        .catch(function (error) {
            log.error(chalk.red('Error: %s'), error.message);
        });
});


/******* default *******/

gulp.task('default', ['watch:ts', 'watch:sass', 'watch:html', 'watch:tests']);
