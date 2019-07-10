'use script';

let fs = require('fs');
let http = require('https');
let ProgressBar = require('progress');

let config;

const now = get_date();
const tmrw = format_date(now);

/*  ### PROCESS ### */
main();

async function main() {
  if (!fs.existsSync('config.json')) {
    // ... create default config
    await create_config().then(conf => config = conf);
  } else {
    console.log("Loading config...")
    config = JSON.parse(fs.readFileSync('config.json'));
  }

  console.log(JSON.stringify(config, null, 2));

  if (!fs.existsSync(`${tmrw}.txt`)) {
    // ... download domains list
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

function create_config() {
  return new Promise((resolve, reject) => {
    console.log("Generating new config file...")

    const defaultConfig = { 
      keywords: ['mc', 'pvp'], 
      tlds: ['com', 'net', 'co'] 
    };

    fs.writeFile('config.json', JSON.stringify(defaultConfig, null, 2), (error) => {
      if (error) reject(error);
      resolve(defaultConfig);
    });
  }).catch(error => console.log(error));
}

function download_file() {
  return new Promise((resolve, reject) => {
    console.log("Downloading tomorrows list of expiring domains...");

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
        console.log("Downloading complete...")
        writer.end();
        request.end();
        resolve();
      });

      resource.on('error', (error) => {
        console.log(error);
      })
    });

    request.on('error', (error) => {
      writer.end();
      request.abort();
      reject(error);
    });

    request.end();
  }).catch(error => console.log(error));
}

async function filter(text, match) {
  return await text.filter(s => s.toLowerCase().includes(match));
}