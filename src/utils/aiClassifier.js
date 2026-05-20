/**
 * Classifies an issue using a local keyword-based classifier.
 * @param {string} title - Issue title
 * @param {string} description - Issue description
 * @returns {string} - Category enum value
 */
function classifyIssue(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();

  if (text.includes('pothole')) {
    return 'POTHOLE';
  }

  if (text.includes('garbage')) {
    return 'GARBAGE';
  }

  if (text.includes('water')) {
    return 'WATER_LEAKAGE';
  }

  if (text.includes('streetlight') || text.includes('light')) {
    return 'STREETLIGHT';
  }

  if (text.includes('road') || text.includes('crack')) {
    return 'ROAD_DAMAGE';
  }

  return 'OTHER';
}

module.exports = classifyIssue;
