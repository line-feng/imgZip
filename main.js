const express = require('express'),
	app = express(),
	history = require('connect-history-api-fallback'),
	formidable = require("formidable"),
	fs = require("fs"),
	f_config = require('./initVariable.js');
app.use(history());

app.use(express.static(f_config.staticService));

//上传压缩图片
require('./imgZip.js')(app,formidable,fs)


app.listen(f_config.port, (err) => {
	console.log('localhost:' + f_config.port)
})
