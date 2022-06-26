const gulp = require('gulp'); // gulp
const htmlmin = require('gulp-htmlmin'); // 压缩html
const uglify = require('gulp-uglify'); // 压缩js
const babel = require('gulp-babel'); // babel
const webServer = require('browser-sync').create(); // 本地服务器
const del = require('del'); // 清空目录
const fsExtra = require('fs-extra'); // 复制文件夹
const nunjucksRender = require('gulp-nunjucks-render') // render文件
const cssmin = require('gulp-cssmin'); // 压缩css
const autoprefixer = require('gulp-autoprefixer'); // css文件前缀自动补充
const dartSass = require('gulp-dart-sass'); // scss文件编译
const gulpIf = require('gulp-if');
const sourceMaps = require('gulp-sourcemaps'); // 生成map文件
const path = require('path');

// 是否生产环境
const isProduct = process.env.NODE_ENV === 'production'
// 源码目录
const SRC_PATH = path.resolve(__dirname, 'src');
// 构建目录
const BUILD_PATH = path.resolve(__dirname, 'dist')

/**
 * 源码目录拼接文件后缀方法
 * @param {String} dir
 * @returns
 */
function srcResolve(dir) {
  return path.resolve(SRC_PATH, dir);
}

// 清空目录
gulp.task('clean', async function (done) {
  try {
    await del([BUILD_PATH]);
    console.log('[CleanFile] Success!')
    done();
  } catch (error) {
    console.log('[CleanFile] get an error' + error);
  }
});

// 静态文件目录复制(不需要编译的文件放这里，比如jquery)
gulp.task('copy', async function (done) {
  try {
    await fsExtra.copy('./public/', BUILD_PATH)
    console.log('[Copyfiles] Success!')
    done()
  } catch (error) {
    console.log('[Copyfiles] get an error' + error)
  }
})

// 复制图片文件
gulp.task('image', function () {
  return gulp.src(srcResolve('**/*.{png,jpg,jpeg,gif}'))
    .pipe(gulp.dest(BUILD_PATH))
})

// 复制视频文件
gulp.task('media', function () {
  return gulp
    .src(srcResolve('**/*.{mp3,wav,mp4,flv}'))
    .pipe(gulp.dest(BUILD_PATH))
})

// 页面文件编译
gulp.task('view', function () {
  const options = {
    removeComments: true, // 清除HTML注释
    collapseWhitespace: true, // 压缩HTML
    collapseBooleanAttributes: true, // 省略布尔属性
    removeEmptyAttributes: true, // 删除所有空属性
    removeScriptTypeAttributes: true, // 删除script标签上的type属性
    removeAttributeQuotes: true, // 删除属性上的双引号
    removeStyleLinkTypeAttributes: true, // 删除style和link标签上的type="text/css"属性
    minifyJS: true, // 压缩页面JS
    minifyCSS: true // 压缩页面CSS
  }

  return gulp
    .src([srcResolve('**/*.html'), "!**/_*.html"])
    .pipe(nunjucksRender({
      path: ['src/']
    }))
    .pipe(gulpIf(isProduct, htmlmin(options)))
    .pipe(gulp.dest(BUILD_PATH))
})

// js文件编译
gulp.task('script', function () {
  return gulp.src(srcResolve('**/*.js'))
    .pipe(babel())
    .pipe(gulpIf(!isProduct, sourceMaps.init()))
    .pipe(gulpIf(isProduct, uglify()))
    .pipe(gulpIf(!isProduct, sourceMaps.write('./')))
    .pipe(gulp.dest(BUILD_PATH))
})

// css文件编译
gulp.task('cssmin', function () {
  return gulp
    .src(srcResolve('**/*.css'))
    .pipe(autoprefixer())
    .pipe(gulpIf(!isProduct, sourceMaps.init()))
    .pipe(gulpIf(isProduct, cssmin()))
    .pipe(gulpIf(!isProduct, sourceMaps.write('./')))
    .pipe(gulp.dest(BUILD_PATH))
})
// sass编译
gulp.task('sass', function () {
  return gulp
    .src(srcResolve('**/*.{scss,sass}'))
    .pipe(dartSass.sync().on('error', dartSass.logError))
    .pipe(autoprefixer())
    .pipe(gulpIf(!isProduct, sourceMaps.init()))
    .pipe(gulpIf(isProduct, cssmin()))
    .pipe(gulpIf(!isProduct, sourceMaps.write('./')))
    .pipe(gulp.dest(BUILD_PATH))
})

// 本地服务器/监听任务
gulp.task('watch', function () {
  webServer.init({
    server: BUILD_PATH,
    port: 3000,
    watch: true,
    open: false,
    ui: false,
    uglify: false
  });

  // 文件监听
  gulp.watch('./src/**/*.html', gulp.series('view', (done) => {
    webServer.reload();
    done();
  }));
  gulp.watch('./src/**/*.js', gulp.series('script', (done) => {
    webServer.reload();
    done();
  }))

  gulp.watch('./src/**/*.{png,jpg,jpeg,gif}', gulp.series('image', (done) => {
    webServer.reload()
    done()
  }))

  gulp.watch('./src/**/*.css', gulp.series('cssmin', (done) => {
    webServer.reload();
    done();
  }))

  gulp.watch('./src/**/*.{scss,sass}', gulp.series('sass', (done) => {
    webServer.reload()
    done();
  }))

})

// 本地任务
gulp.task('serve', gulp.series('clean', gulp.parallel('copy', 'image', 'media', 'view', 'script', 'cssmin', 'sass'), 'watch'))

// 编译任务
gulp.task('build', gulp.series('clean', gulp.parallel('copy', 'image', 'media', 'view', 'script', 'cssmin', 'sass')))