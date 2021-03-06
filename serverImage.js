const express = require('express')
const app = express()
const port = process.argv[2];
const ipMiddleware = process.argv[3];
const timeOut = process.argv[4];
const nameQueue = process.argv[5];
const userRabbit = process.argv[6];
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const amqp = require('amqplib');
const fs = require('fs');

var Jimp = require('jimp');
const pdf = require('./pdf');
const extractImage = require('./extractImage');
const numFrames = 5;

var reportImages = [];

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


const storage = null;

/*multer.diskStorage({
	destination: path.join(__dirname, 'public/uploads'),
	filename(req, file, cb) {
		cb(null, new Date().getTime() + path.extname(file.originalname));
	}
});*/

app.use(multer({ storage }).single('video'));


app.post('/addVideo', function (req, res, next){
    var data = req;
	console.log(data);
	

    res.json({
        'message' : 'ha llegado el email'
    });
});


async function subscriber() {
	console.log(ipMiddleware)
	const connection = await amqp.connect(`amqp://${userRabbit}:${userRabbit}@${ipMiddleware}:5672`)
	const channel = await connection.createChannel();

	await channel.assertQueue(nameQueue);

	channel.prefetch(1);

	channel.consume(nameQueue, message => {
		const content = JSON.parse(message.content.toString())

		console.log(timeOut)
		setTimeout(() => {
			console.log('esperando');
			channel.ack(message);
		},timeOut);

		console.log(`received message from "${nameQueue}" queue`)
		console.log(content)
		//console.log(content.dataFile.buffer.data);

		/*fs.writeFile(content.dataFile.originalname, content.dataFile.buffer, null, function (err) {
			if (err) {
				console.log(err);
			} else {
				console.log("The file was saved!");
			}
		});*/

		
		
	})
}

subscriber().catch(error => {
	console.error(error)
	process.exit(1)
})


app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})

//============== METHODS ======================

function getColorPixels(inputImage) {
	return new Promise((resolve, reject) => {
		var colors = new Map();
		var count = 0;
		Jimp.read(inputImage)
			.then((image) => {
				image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
					var auxString = JSON.stringify(Jimp.intToRGBA(image.getPixelColor(x, y)));
					if (colors.has(auxString)) {
						count = colors.get(auxString) + 1;
						colors.set(auxString, count);
					} else {
						colors.set(auxString, 1);
					}
				});
				resolve(colors);
			})
			.catch((err) => {
				console.log(err);
			});
	});
}

function recorreMap(image, title, point) {
	return new Promise((resolve, reject) => {
		let pixelsColors = null;
		getColorPixels(image).then((res) => {
			pixelsColors = res;
			for (var [key, value] of pixelsColors) {
				console.log(key + ' : ' + value);
			}
			resolve(pixelsColors);
		}).catch(err => {
			console.log(err);
		})
	})
}

function changeSize() {
	console.log('Entra al for');
	for (let i = 1; i <= numFrames; i++) {
		let pathImage = './res/IMAGEN-' + i + '.png';
		reportImages.push({ path: pathImage, title: 'IMAGEN ' + i, position: 130 })
		Jimp.read(pathImage)
			.then(myImage => {
				return myImage
					.resize(100, 75)
					.quality(60)
					.write(pathImage);
			})
			.catch(err => {
				console.error(err);
			});
	}
}



async function addImages(destiny) {
	let report = [];

	for (let i = 0; i < reportImages.length; i++) {
		let path = reportImages[i].path;
		let title = reportImages[i].title;
		let position = reportImages[i].position;
		await recorreMap(path, title, position).then((res) => {
			report.push({ title: title, arrayColors: res, position: position, path: path })
		}).catch(err => {
			console.log(err);
		});
	}
	pdf.multipleTables(report, destiny);
	return report;

}

function processVideo(pathVideo, destinyReport){
    extractImage.extractImages(pathVideo).then((res) =>{
        console.log(res);
        changeSize();
        setTimeout(function(){ addImages(destinyReport); }, 3000);
    })
    .catch(err => {
        console.log('Video not found: ' +err);
    });
}