const imagemin = require('imagemin'),
	imageminJpegtran = require('imagemin-jpegtran'),
	imageminPngquant = require('imagemin-pngquant'),
	f_config = require('./initVariable.js'),
	md5 = require('md5');

module.exports = function(app, formidable, fs) {

	app.post('/img', (req, res) => {
		let form = new formidable.IncomingForm();
		//检测文件是否存在，不存在则创建
		fs.access(f_config.imgStatic, function(error) {
			if (!error) {
				// console.log('文件存在')
			} else {
				fs.mkdir('images', function(err) {
					if (!err) {
						// console.log('文件创建成功')
					}
				})
			}
		})

		form.parse(req, function(error, fields, files) {
			// console.log(files.file)
			let [name, type] = files.file.name.split('.')
			//保存图片
			fs.writeFileSync(f_config.imgStatic + "/" + md5(name) + '.' + type, fs.readFileSync(files.file.path));

			//压缩图片 防止出现特殊字符 使用md5加密成乱码
			(async () => {
				const filesList = await imagemin([f_config.imgStatic + "/" + md5(name) + '.' + type], {
					destination: 'build/images',
					plugins: [
						imageminJpegtran(),
						imageminPngquant({
							quality: [0.6, 0.8]
						})
					]
				});
				searchImg(name, type, res)
			})();
		});
	})

	//修改图片名称 匹配加密后的乱码 返回地址
	function searchImg(name, type, res) {
		fs.readdir(f_config.zipImgPath, function(err, files) {
			if (err) {
				console.log(err);
			}
			files.forEach((oldPath) => {
				if (oldPath == md5(name) + '.' + type) {
					fs.rename(f_config.zipImgPath + '/' + oldPath, f_config.zipImgPath + '/' + name + '.' + type, (err) => {
						returnData(name, type, res)
					})
				}
			})
		})
	}

	//拿到图片大小返回数据
	async function returnData(name, type, res) {
		let oldSize = ''
		await fs.stat(f_config.imgStatic + "/" + md5(name) + '.' + type, function(err, stats) {
			oldSize = stats.size
		})

		fs.stat(f_config.zipImgPath + '/' + name + '.' + type, function(err, stats) {
			if (!err) {
				res.send({
					code: 200,
					url: f_config.url + f_config.zipImgPath.replace('.', '') + '/' + name + '.' + type,
					size: change(stats.size),
					zipRatio:(((oldSize - stats.size) / oldSize * 10000) / 100.00).toFixed(2) + '%'
				})
			}
		})
	}

	//将文件大小转为KB MB GB
	function change(limit) {
		var size = "";
		if (limit < 0.1 * 1024) { //小于0.1KB，则转化成B
			size = limit.toFixed(2) + "B"
		} else if (limit < 0.1 * 1024 * 1024) { //小于0.1MB，则转化成KB
			size = (limit / 1024).toFixed(2) + "KB"
		} else if (limit < 0.1 * 1024 * 1024 * 1024) { //小于0.1GB，则转化成MB
			size = (limit / (1024 * 1024)).toFixed(2) + "MB"
		} else { //其他转化成GB
			size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB"
		}

		var sizeStr = size + ""; //转成字符串
		var index = sizeStr.indexOf("."); //获取小数点处的索引
		var dou = sizeStr.substr(index + 1, 2) //获取小数点后两位的值
		if (dou == "00") { //判断后两位是否为00，如果是则删除00
			return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
		}
		return size;
	}

}
