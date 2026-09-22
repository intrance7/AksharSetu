const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const files = ['doodle-smile', 'doodle-heart', 'doodle-star', 'doodle-bulb'];

async function processImages() {
  for (const name of files) {
    const inPath = path.join(publicDir, `${name}.jpg`);
    const outPath = path.join(publicDir, `${name}.png`);
    
    if (fs.existsSync(inPath)) {
      console.log(`Processing ${inPath}...`);
      try {
        // Read the image, extract alpha channel if we wanted, but we want to make near-white transparent.
        // The easiest way is to use a composite or just extract the raw buffer and modify it.
        const { data, info } = await sharp(inPath)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
          
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          // Near white
          if (r > 225 && g > 225 && b > 225) {
            data[i+3] = 0; // Set alpha to 0
          }
        }
        
        await sharp(data, {
          raw: {
            width: info.width,
            height: info.height,
            channels: 4
          }
        }).png().toFile(outPath);
        
        console.log(`Successfully converted ${name}.png`);
      } catch (e) {
        console.error(`Error processing ${name}:`, e);
      }
    }
  }
  console.log("All done!");
}

processImages();
