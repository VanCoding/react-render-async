var gulp = require("gulp");
var babel = require("gulp-babel");

gulp.task("build",function(){
	return gulp.src("./src/**/*")
		.pipe(babel({
			presets:["es2015"],
			plugins:["syntax-async-functions","transform-regenerator"]
		}))
		.pipe(gulp.dest("./lib"))
})

gulp.task("run",["build"],function(){
	require("./lib");
})
