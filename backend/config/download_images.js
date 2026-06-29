import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target gallery directory
const GALLERY_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'pets-gallery');

const PET_BREEDS = [
  { id: 1, keyword: 'goldenretriever', species: 'dog' },
  { id: 2, keyword: 'britishshorthair', species: 'cat' },
  { id: 3, keyword: 'labrador', species: 'dog' },
  { id: 4, keyword: 'cat', species: 'cat' },
  { id: 5, keyword: 'germanshepherd', species: 'dog' },
  { id: 6, keyword: 'rabbit', species: 'rabbit' },
  { id: 7, keyword: 'dog', species: 'dog' },
  { id: 8, keyword: 'beagle', species: 'dog' },
  { id: 9, keyword: 'siamesecat', species: 'cat' },
  { id: 10, keyword: 'parrot', species: 'bird' },
  { id: 11, keyword: 'husky', species: 'dog' },
  { id: 12, keyword: 'pug', species: 'dog' },
  { id: 13, keyword: 'labradordog', species: 'dog' },
  { id: 14, keyword: 'persiancat', species: 'cat' },
  { id: 15, keyword: 'mainecoon', species: 'cat' },
  { id: 16, keyword: 'bengalcat', species: 'cat' },
  { id: 17, keyword: 'rabbit', species: 'rabbit' },
  { id: 18, keyword: 'cockatiel', species: 'bird' },
  { id: 19, keyword: 'hamster', species: 'hamster' },
  { id: 20, keyword: 'boxerdog', species: 'dog' },
  { id: 21, keyword: 'ragdollcat', species: 'cat' },
  { id: 22, keyword: 'bordercollie', species: 'dog' },
  { id: 23, keyword: 'dove', species: 'bird' },
  { id: 24, keyword: 'greycat', species: 'cat' },
  { id: 25, keyword: 'australianshepherd', species: 'dog' },
  { id: 26, keyword: 'rabbit', species: 'rabbit' },
  { id: 27, keyword: 'corgi', species: 'dog' },
  { id: 28, keyword: 'scottishfold', species: 'cat' },
  { id: 29, keyword: 'dachshund', species: 'dog' },
  { id: 30, keyword: 'shihtzu', species: 'dog' },
  { id: 31, keyword: 'russianblue', species: 'cat' },
  { id: 32, keyword: 'abyssinian', species: 'cat' },
  { id: 33, keyword: 'rabbit', species: 'rabbit' },
  { id: 34, keyword: 'cockatoo', species: 'bird' },
  { id: 35, keyword: 'hamster', species: 'hamster' },
  { id: 36, keyword: 'chowchow', species: 'dog' },
  { id: 37, keyword: 'maltesedog', species: 'dog' },
  { id: 38, keyword: 'turkishangora', species: 'cat' },
  { id: 39, keyword: 'rabbit', species: 'rabbit' },
  { id: 40, keyword: 'guineapig', species: 'hamster' },
  { id: 41, keyword: 'pomeranian', species: 'dog' },
  { id: 42, keyword: 'lovebird', species: 'bird' }
];

// Helper to download a single image with redirects
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        try {
          const redirectUrl = new URL(res.headers.location, url).toString();
          downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        } catch (err) {
          reject(err);
        }
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download image. Status: ${res.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const main = async () => {
  console.log(`[Downloader] Target directory: ${GALLERY_DIR}`);
  if (!fs.existsSync(GALLERY_DIR)) {
    fs.mkdirSync(GALLERY_DIR, { recursive: true });
    console.log('[Downloader] Created target directory.');
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < PET_BREEDS.length; i++) {
    const pet = PET_BREEDS[i];
    const petNum = pet.id;
    const keyword = pet.keyword;

    console.log(`[Downloader] Starting pet ${petNum}/42 (${pet.species} - ${keyword})...`);

    for (let poseNum = 1; poseNum <= 3; poseNum++) {
      const lockId = (petNum - 1) * 3 + poseNum;
      const filename = `pet-${petNum}-pose-${poseNum}.jpg`;
      const filepath = path.join(GALLERY_DIR, filename);

      // Skip download if already exists and is not empty
      if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
        console.log(`  - Pose ${poseNum}: Already exists. Skipping.`);
        successCount++;
        continue;
      }

      let attempt = 0;
      let downloaded = false;

      while (attempt < 3 && !downloaded) {
        attempt++;
        // Use species as fallback keyword on attempts 2 and 3
        const currentKeyword = attempt === 1 ? keyword : pet.species;
        const url = `https://loremflickr.com/600/450/${currentKeyword}?lock=${lockId}`;
        try {
          await downloadImage(url, filepath);
          // Verify downloaded file is not empty
          if (fs.existsSync(filepath) && fs.statSync(filepath).size > 1000) {
            console.log(`  - Pose ${poseNum}: Success (lock=${lockId}, keyword=${currentKeyword}, attempt=${attempt}, size=${fs.statSync(filepath).size}B)`);
            downloaded = true;
            successCount++;
          } else {
            throw new Error('Downloaded file is empty or too small.');
          }
        } catch (err) {
          console.warn(`  - Pose ${poseNum}: Attempt ${attempt} failed with ${currentKeyword}. Error: ${err.message}`);
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // If still not downloaded, copy local SVG fallback to ensure the file exists
      if (!downloaded) {
        try {
          const svgSrc = path.join(__dirname, '..', '..', 'public', 'images', 'pets', `${pet.species}-pose-${poseNum}.svg`);
          if (fs.existsSync(svgSrc)) {
            fs.copyFileSync(svgSrc, filepath);
            console.log(`  - Pose ${poseNum}: Recovered using SVG fallback.`);
            downloaded = true;
            successCount++;
          } else {
            throw new Error('Fallback SVG source not found');
          }
        } catch (err) {
          console.error(`  - Pose ${poseNum}: FAILED both download and SVG recovery. ${err.message}`);
          failCount++;
        }
      }
    }
  }

  console.log(`[Downloader] Completed downloading. Successes: ${successCount}/126, Failures: ${failCount}`);
};

main();
