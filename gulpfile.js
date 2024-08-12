const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const webserver = require('gulp-webserver');
const clean = require('gulp-clean');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const noop = require('gulp-noop');
const isDevelopment = process.env.NODE_ENV === 'development';
const outpuCSS = 'public/css';
const fs = require('fs');
function cleanJs(){
    const dir = './public/js';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    return src(`${dir}/**`)
    .pipe(clean());
}
function minJs(){
    return src('./js/index.js')
    .pipe(uglify({
        mangle: true
    }))
    .pipe(dest('./public/js'))
}

function cleanCss(){
    const dir = './public/css';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    return src([`${dir}/*.css`, `${dir}/*.scss`], { allowEmpty: true })
    .pipe(clean());
}

function minCss(){
    return src(`${outpuCSS}/*.css`)
    .pipe(cleanCSS({
        debug: true
    }, (details)=>{
        console.log(`${details.name}: ${details.stats.originalSize}`);
        console.log(`${details.name}: ${details.stats.minifiedSize}`);
    }))
    .pipe(dest(outpuCSS))
}


function compileSass(){
    return src('./sass/**/*.scss')
    .pipe(isDevelopment ? sourcemaps.init() : noop())
    .pipe(sass().on('error', sass.logError))
    .pipe(isDevelopment ? sourcemaps.write() : noop())
    .pipe(dest(outpuCSS))
}

function copyJs(){
    return src('./js/index.js')
    .pipe(dest('public/js'))
}

function copySass(){
    return src('sass/**/*.scss')
    .pipe(dest(outpuCSS))
}
function copyHtml(){
    return src('index.html')
    .pipe(dest('public'))
}
function initSever(){
    return src('public')
    .pipe(webserver({
        livereload: true,
        open: false
    }))  
}

const runTasksJs = series([cleanJs, minJs]);
const runTasksCss = series([cleanCss, minCss, compileSass]);
const runTasksJsDev = series([cleanJs, copyJs]);
const runTasksCssDev = series([cleanCss, copySass, compileSass]);
const tasksDev = series([parallel([runTasksJsDev, runTasksCssDev, copyHtml]), initSever])
const tasksProd = series([parallel([runTasksJs, runTasksCss, copyHtml]), initSever])

watch(['./js/*.js'], {usePolling: true}, isDevelopment ? runTasksJsDev : runTasksJs);
watch(['./sass/*.scss'], {usePolling: true}, isDevelopment ? runTasksCssDev : runTasksCss);
watch(['./index.html'], {usePolling: true}, copyHtml);

exports.js = runTasksJs;
exports.css = runTasksCss;

exports.default = isDevelopment ? tasksDev : tasksProd;