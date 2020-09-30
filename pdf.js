const PDF = require('pdfkit');
const fs = require('fs');
const pathI = require('path');
const nodemailer = require('nodemailer');

var doc = new PDF();

doc.pipe(fs.createWriteStream(__dirname + '/ejemplo.pdf'));

var transporter = nodemailer.createTransport({
     service: "gmail",
     auth: {
       user: "distributed.systemUPTC",
       pass: "distributed01_system2020",
     },
});

function sendMail(destiny) {
     var mailOptions = {
       from: "distributed.systemUPTC@gmail.com",
       to: destiny,
       subject: "REPORTE DE COLORES EN IMAGENES",
       text: "Versión que se encarga de enviar el reporte de los colores de imagenes",
       attachments: getFilesAttachment()
     };
     transporter.sendMail(mailOptions, function (err, info) {
       if (err) {
         console.log(err);
       } else {
         console.log("Email sended: " + info.response);
       }
     });
}

function drawTable(doc, myArray, initPoint){
     let y = initPoint;
     for (var [ key, value ] of myArray) {
          if(y+30 >= 730){
               doc.addPage();
               y = 80;
          }
          row(doc, y);
          let color = JSON.parse(key);
          textInRowFirst(doc, color.r, 140, y+7);
          drawSeparation(doc, 210, y);
          textInRowFirst(doc, color.g, 240, y+7);
          drawSeparation(doc, 310, y);
          textInRowFirst(doc, color.b, 340, y+7);
          drawSeparation(doc, 410, y);
          textInRowFirst(doc, value, 440, y+7);
          y += 20;
     }
}

function drawBlockTable(title, colors, y, path){
     console.log('Imagen:' +path);
     row(doc, y-40);
     textInRowFirst(doc, title, 260, y-33);
     drawHeader(doc, y);
     drawTable(doc, colors, y);
     // doc.end();
}

async function multipleTables(data, destiny){
     let buffers = [];
     doc.on("data", buffers.push.bind(buffers));
     doc.on("end", () => {
          let pdfData = Buffer.concat(buffers);
          sendMail(destiny);
     });
     for(let i = 0; i < data.length; i++){
          await drawBlockTable(data[i].title, data[i].arrayColors, data[i].position, data[i].path);
          if(i < data.length-1){
               doc.addPage();
          }
     }
     console.log('Reporte creado con éxito');
     doc.end();
}

function closePDF(){
     doc.end();
}

function addNewPage(){
     doc.addPage();
}

function drawHeader(doc, point){
     row(doc, point-20);
     textInRowFirst(doc, 'r', 145, point-13);
     drawSeparation(doc, 210, point-20);
     textInRowFirst(doc, 'g', 245, point-13);
     drawSeparation(doc, 310, point-20);
     textInRowFirst(doc, 'b', 345, point-13);
     drawSeparation(doc, 410, point-20);
     textInRowFirst(doc, 'Cantidad', 425, point-13);
}

function drawSeparation(doc, x, y){
     doc.lineCap('butt')
          .moveTo(x, y+20)
          .lineTo(x, y)
          .stroke();
}

function textInRowFirst(doc, text, width, heigth) {
	doc.y = heigth;
	doc.x = width;
	doc.fillColor('black');
	doc.text(text, {
		paragraphGap: 5,
		indent: 10,
		align: 'justify',
		columns: 1
	});
	return doc;
}

function getFilesAttachment(){
     let attachments = [];
     attachments.push({filename: "file.pdf", contentType: "application/pdf", path: "ejemplo.pdf"});
     for(let i = 1; i <= 5; i++){
          attachments.push({filename: "figura_" +i +".png", content: fs.createReadStream('./res/IMAGEN-' +i +'.png')})
     }
     return attachments;
}

function row(doc, heigth) {
	doc.lineJoin('miter').rect(110, heigth, 400, 20).stroke();
	return doc;
}

exports.drawBlockTable = drawBlockTable;
exports.closePDF = closePDF;
exports.addNewPage = addNewPage;
exports.multipleTables = multipleTables;



