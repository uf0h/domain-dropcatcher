"use script";

let fs = require("fs");
let readline = require("readline");
let http = require("https");
let ProgressBar = require("progress");

let config;

const now = get_date();
const tmrw = format_date(now);

/*  ### PROCESS ### */
main();

async function main() {
  if (!fs.existsSync("config.json")) {
    // ... create default config
    await create_config().then(conf => (config = conf));
  } else {
    console.log("Loading config...");
    config = JSON.parse(fs.readFileSync("config.json"));
  }

  console.log(JSON.stringify(config, null, 2) + "\n");

  if (!fs.existsSync(`${tmrw}.txt`)) {
    // ... download domains list
    await download_file();
  }

  // ... filter domains
  await filter_domains().then(matched => {
    console.log("The following domains have matched your criteria:");
    for (const [i, match] of matched.entries()) {
      console.log(`[ ${i < 10 ? "0" + i : "" + i} ]  ${match}`);
    }
  });
}
/* ### END PROCESS ### */

function get_date() {
  const now = new Date();
  now.setDate(now.getDate() + 1);

  return now;
}

function format_date(date) {
  const m = date.getMonth();
  const dd = date.getDate() < 10 ? "0" + date.getDate() : "" + date.getDate();
  const yyyy = date.getFullYear();

  return `${m}-${dd}-${yyyy}`;
}

function create_config() {
  return new Promise((resolve, reject) => {
    console.log("Generating new config file...");

    const defaultConfig = {
      maxLength: 10,
      filterOutNumbers: true,
      keywords: ["mc", "pvp", "craft"],
      tlds: ["com", "net", "co", "org", "io"]
    };

    fs.writeFile(
      "config.json",
      JSON.stringify(defaultConfig, null, 2),
      error => {
        if (error) reject(error);
        resolve(defaultConfig);
      }
    );
  }).catch(error => console.log(error));
}

function download_file() {
  return new Promise((resolve, reject) => {
    console.log("Downloading tomorrows list of expiring domains...");

    const options = {
      host: "namejet.com",
      path: `/download/${tmrw}.txt`,
      method: "GET"
    };

    const request = http.request(options, resource => {
      const writer = fs.createWriteStream(`${tmrw}.txt`);
      const len = parseInt(resource.headers["content-length"], 10);
      const bar = new ProgressBar("Downloading [:bar] [:etas] [:percent]", {
        complete: "█",
        incomplete: "#",
        width: 30,
        total: len
      });

      resource.on("data", function(chunk) {
        writer.write(chunk);
        bar.tick(chunk.length);
      });

      resource.on("end", function() {
        console.log("Downloading complete...");
        writer.end();
        request.end();
        resolve();
      });

      resource.on("error", error => {
        console.log(error);
      });
    });

    request.on("error", error => {
      writer.end();
      request.abort();
      reject(error);
    });

    request.end();
  }).catch(error => console.log(error));
}

function filter_domains() {
  return new Promise((resolve, reject) => {
    console.log(
      "Filtering domains according to the defined criteria..." + "\n"
    );

    const matched = [];

    const reader = readline.createInterface({
      input: fs.createReadStream(`${tmrw}.txt`),
      terminal: false
    });

    reader.on("line", line => {
      if (meets_length_criteria(line) && meets_number_criteria(line)) {
        if (matches_keyword(line) && has_valid_tld(line)) {
          matched.push(line);
        }
      }
    });

    reader.on("close", () => {
      resolve(matched);
    });
  });
}

function meets_length_criteria(text) {
  return text.length <= config.maxLength;
}

function meets_number_criteria(text) {
  if (config.filterOutNumbers) {
    if (/\d/.test(text)) return false;
  }
  return true;
}

function matches_keyword(text) {
  for (const keyword of config.keywords) {
    if (text.includes(keyword)) {
      return true;
    }
  }
  return false;
}

function has_valid_tld(text) {
  for (const tld of config.tlds) {
    if (text.includes(`.${tld}`)) {
      return true;
    }
  }
  return false;
}
