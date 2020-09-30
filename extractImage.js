const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const extractFrames = require('ffmpeg-extract-frames');
const ffmpeg = require('fluent-ffmpeg');
const Jimp = require('jimp');

const { getVideoDurationInSeconds } = require('get-video-duration');
const numFrames = 5;

ffmpeg.setFfmpegPath(ffmpegPath);

async function getDuration(pathVideo){
     let durationVideo = 0;
     await getVideoDurationInSeconds(pathVideo).then((duration) => {
          console.log('Video duration: ' +duration);
          durationVideo = duration*1000;
     })
     return durationVideo;
}

function extractImages(pathVideo){
     return new Promise((resolve, reject) => {
          getDuration(pathVideo).then(async (res) => {
               await extractFrames({
                    input: pathVideo,
                    output: __dirname +'/res/IMAGEN-%i.png',
                    offsets: getRandomDuration(numFrames, res)
               })
               resolve('Images generated successfully');
          })
     })
     
}

function getRandomDuration(numframes, duration){
     let numRandoms = [];
     for(let i=0; i<numframes; i++){
          let numRandom = Math.round(Math.random()*(duration-1)+1);
          console.log('Random frame at millisecond ' +numRandom);
          numRandoms.push(numRandom);
     }
     return numRandoms;
}

exports.extractImages = extractImages;