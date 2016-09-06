/// <binding BeforeBuild='rebuild' Clean='clean' ProjectOpened='default' />
'use strict';

let paths = {
    srcDir: './src/evetron',
    testsDir: './tests/evetron',
    packDir: './pack/',
    installBuilderDir: './dist/',
    appDir: `${(process.platform === 'darwin'
        ? 'Electron.app/Contents/Resources'
        : 'resources')}/app`,
    electron_dist: './node_modules/electron/dist',
    packagerDir: 'tools/packager',
    platformResourcesDir: `resources/${process.platform}`,
    ts: {
        src: '/scripts/**/*.ts'
    },
    scss: {
        src: '/sass/**/*.scss'
    },
    html: {
        src: '/html/**/*.html'
    },
}
paths.srcBinDir = `${paths.srcDir}/bin`;
paths.testssrcBinDir = `${paths.testsDir}/bin`;
paths.destDir = `${paths.srcBinDir}/${paths.appDir}`;
paths.iconPath = `${paths.platformResourcesDir}/icon`;

let gulp = require('gulp'),
    ncu = require('npm-check-updates'),
    fs = require('fs-extra'),
    del = require('del'),
    runsequence = require('run-sequence'),
    tslint = require("gulp-tslint"),
    tsc = require('gulp-typescript'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    typings = require('gulp-typings'),
    rename = require('gulp-rename'),
    packager = require('electron-packager'),
    builder = require('electron-builder'),
    packageJson = require(`${paths.srcDir}/package.prod.json`);


/******* npm packages check ********/

gulp.task('check-packages-updates', function () {
    return ncu.run({
        packageFile: 'package.json',
    }).then(function (upgraded) {
        console.log('Dependencies to upgrade:',
            !Object.keys(upgraded).length ? 'None' : upgraded);
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


/******* tslint ********/

gulp.task("tslint", function () {
    return gulp.src([`${paths.srcDir}${paths.ts.src}`])
        .pipe(tslint())
        .pipe(tslint.report("verbose", {
            emitError: false,
            summarizeFailureOutput: true
        }));
});


/******* src ********/

gulp.task('clean:js', ['clean:js.map'], function () {
    return del(`${paths.destDir}/**/*.js`);
});

gulp.task('clean:js.map', function () {
    return del(`${paths.destDir}/**/*.js.map`);
});

gulp.task('clean:html', function () {
    return del(`${paths.destDir}/**/*.html`);
});

gulp.task('clean:css', ['clean:css.map'], function () {
    return del(`${paths.destDir}/**/*.css`);
});

gulp.task('clean:css.map', function () {
    return del(`${paths.destDir}/**/*.css.map`);
});

gulp.task('clean', function () {
    return del(paths.srcBinDir);
});

gulp.task('copy:html', ['clean:html'], function () {
    return gulp.src(`${paths.srcDir}${paths.html.src}`)
        .pipe(gulp.dest(paths.destDir));
});


/******* sass ********/

gulp.task('compile:sass', ['clean:css'], function () {
    return gulp.src(`${paths.srcDir}${paths.scss.src}`)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: (process.platform === 'darwin'
                ? '../../../../../'
                : '../../../') + 'sass/'
        }))
        .pipe(gulp.dest(paths.destDir));
});


/******* typescript ********/

gulp.task('compile:ts', ['clean:js'], function () {
    let tscProject = tsc.createProject(`${paths.srcDir}/tsconfig.json`);

    return tscProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsc(tscProject))
        .pipe(sourcemaps.write('.', {
            includeContent: false,
            sourceRoot: (process.platform === 'darwin'
                ? '../../../../../'
                : '../../../') + 'scripts/'
        }))
        .pipe(gulp.dest(paths.destDir));
});


/******* build ********/

gulp.task('compile', ['compile:ts', 'compile:sass', 'copy:html'], function () {
    return gulp.src(`${paths.srcDir}/package.prod.json`)
        .pipe(rename('package.json'))
        .pipe(gulp.dest(paths.destDir));
})

gulp.task('build', ['compile'], function (cb) {
    return fs.copy(paths.electron_dist, paths.srcBinDir,
        new RegExp('^(?!.+default_app\.asar)'),
        cb
    );
})

gulp.task('rebuild', function () {
    runsequence('clean', 'build');
});


/******* watchers ********/

gulp.task('watch:html', function () {
    return gulp.watch([`${paths.srcDir}${paths.html.src}`], ['copy:html']);
})

gulp.task('watch:ts', function () {
    return gulp.watch([`${paths.srcDir}${paths.ts.src}`], ['compile:ts', 'tslint']);
})

gulp.task('watch:sass', function () {
    gulp.watch(`${paths.srcDir}${paths.scss.src}`, ['compile:sass']);
});

gulp.task('watch:tests', function () {
    return gulp.watch([`${paths.testsDir}${paths.ts.src}`], ['compile-tests', 'tslint']);
});


/******* tests ********/

gulp.task('clean-tests', function () {
    return del(`${paths.testssrcBinDir}`);
});

gulp.task('compile-tests', ['clean-tests'], function () {
    let tscProject = tsc.createProject(`${paths.testsDir}/tsconfig.json`);

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

let packagerOptions = {
    'dir': paths.destDir,
    'platform': process.platform,
    'arch': 'x64',
    'name': packageJson.name,
    //version: packageJson.devDependencies['electron-prebuilt'],
    //download: { cache: `./${paths.packagerDir}/cache` },
    'ignore': '.+\.map',
    'out': paths.packDir,
    'icon': `./${paths.packagerDir}/${paths.iconPath}`,
    'asar': true,
    'overwrite': true,
    'app-version': packageJson.version,
    'app-copyright': packageJson.copyright,
    'build-version': packageJson.version,
    'version-string': {
        'CompanyName': packageJson.author.name,
        'FileDescription': packageJson.productName,
        'ProductName': packageJson.productName,
        'OriginalFilename': packageJson.name + '.exe'
    },
    'extend-info': `./${paths.packagerDir}/${paths.platformResourcesDir}/evetron.plist`
};

gulp.task('clean:package', function () {
    return del(paths.packDir);
});

gulp.task('package', ['clean:package', 'compile'], function (cb) {
    return packager(packagerOptions, cb);
});


/******* installer *******/

let installerOptions = {
    'devMetadata': {
        'build': {
            'win': {
                // README: https://github.com/electron-userland/electron-builder/wiki/Options#buildwin
                'iconUrl': `${packageJson.repository}/blob/master/${paths.packagerDir}/${paths.iconPath}.ico?raw=true`
            },
            'linux': {
                // README: https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#linux
                // https://github.com/electron-userland/electron-builder/wiki/Options#buildlinux
                'target': ['deb', 'rpm']
            },
            'mac': {
                // README: https://github.com/electron-userland/electron-builder/wiki/Multi-Platform-Build#macos
                // https://github.com/electron-userland/electron-builder/wiki/Options#buildmac
            }
        },
        directories: {
            buildResources: `./${paths.packagerDir}/${paths.platformResourcesDir}`,
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
        .then(() => {
            console.log(`Installer for ${process.platform} created successfully.`)
        })
        .catch((error) => {
            console.log(`Error: ${error.message}`)
        })
});


/******* default *******/

gulp.task('default', ['watch:ts', 'watch:sass', 'watch:html', 'watch:tests']);
