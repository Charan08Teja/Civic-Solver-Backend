const { imageHash } = require('image-hash');

const generateHash = (imagePath) => {
  return new Promise((resolve, reject) => {
    imageHash(imagePath, 16, true, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  });
};

module.exports = generateHash;