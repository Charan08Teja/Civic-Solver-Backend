const { imageHash } = require('image-hash');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generateHash = async (imageUrl) => {

  return new Promise(async (resolve, reject) => {

    try {

      // Temporary file path
      const tempFilePath = path.join(
        __dirname,
        `temp-${Date.now()}.jpg`
      );

      // Download image from Cloudinary
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
      });

      // Save locally
      const writer = fs.createWriteStream(tempFilePath);

      response.data.pipe(writer);

      writer.on('finish', () => {

        // Generate hash from local temp image
        imageHash(tempFilePath, 16, true, (error, data) => {

          // Delete temp file
          fs.unlinkSync(tempFilePath);

          if (error) {
            return reject(error);
          }

          resolve(data);
        });
      });

      writer.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = generateHash;