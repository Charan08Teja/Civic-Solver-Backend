const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Classifies an issue based on title, description, and image.
 * Prefers image-based AI classification, falls back to keyword-based.
 * @param {string} title - Issue title
 * @param {string} description - Issue description
 * @param {string} imagePath - Path to the uploaded image
 * @returns {string} - Category enum value
 */
async function classifyIssue(title, description, imagePath) {
  try {
    // Try image-based classification first
    if (imagePath && fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = getMimeType(imagePath);

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and classify the issue into one of these categories: POTHOLE, GARBAGE, WATER_LEAKAGE, STREETLIGHT, ROAD_DAMAGE, OTHER. Respond with only the category name in uppercase.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 10
      });

      const category = response.choices[0].message.content.trim().toUpperCase();
      const validCategories = ['POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'STREETLIGHT', 'ROAD_DAMAGE', 'OTHER'];

      if (validCategories.includes(category)) {
        return category;
      }
    }
  } catch (error) {
    console.log('Image classification failed, falling back to text-based classification:', error.message);
  }

  // Fallback to keyword-based classification
  return keywordClassification(title, description);
}

/**
 * Keyword-based classification
 * @param {string} title
 * @param {string} description
 * @returns {string}
 */
function keywordClassification(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (text.includes('pothole')) return 'POTHOLE';
  if (text.includes('garbage') || text.includes('trash') || text.includes('waste')) return 'GARBAGE';
  if (text.includes('water') && (text.includes('leak') || text.includes('pipe') || text.includes('leakage'))) return 'WATER_LEAKAGE';
  if (text.includes('streetlight') || text.includes('street light') || text.includes('light')) return 'STREETLIGHT';
  if (text.includes('road') && (text.includes('crack') || text.includes('damage') || text.includes('broken'))) return 'ROAD_DAMAGE';

  return 'OTHER';
}

/**
 * Get MIME type based on file extension
 * @param {string} filePath
 * @returns {string}
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
}

module.exports = { classifyIssue };