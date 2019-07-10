'use script';

let fs = require('fs');
let http = require('https');
let ProgressBar = require('progress');

const now = get_date();
const tmrw = format_date(now);

/*  ### PROCESS ### */
main();

async function main() {
  if (!fs.existsSync(`${tmrw}.txt`)) {
    await download_file();
  }

  // ... filter domains
  
}
/* ### END PROCESS ### */

function get_date() {
  const now = new Date();
  now.setDate(now.getDate() + 1);

  return now;
}

function format_date(date) {
  const m = date.getMonth();
  const dd = date.getDate() < 10 ? '0' + date.getDate() : '' + date.getDate();
  const yyyy = date.getFullYear();

  return `${m}-${dd}-${yyyy}`;
}

function download_file() {
  return new Promise((resolve, reject) => {
    console.log("Downloading tomorrows list of expiring domains.");

    const options = {
      host: 'namejet.com',
      path: `/download/${tmrw}.txt`,
      method: 'GET',
    };

    const request = http.request(options, (resource) => {
      const writer = fs.createWriteStream(`${tmrw}.txt`);
      const len = parseInt(resource.headers['content-length'], 10);
      const bar = new ProgressBar('Downloading [:bar] [:etas] [:percent]', {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: len
      });

      resource.on('data', function (chunk) {
        writer.write(chunk);
        bar.tick(chunk.length);
      });

      resource.on('end', function () {
        console.log("Downloading complete.")
        writer.end();
        request.end();
        resolve();
      });

      resource.on('error', (error) => {
        console.log(error);
      })
    });

    request.on('error', (error) => {
      console.log(error);
      writer.end();
      request.abort();
      reject();
    });

    request.end();
  });
}

async function filter(text, match) {
  return await text.filter(s => s.toLowerCase().includes(match));
}