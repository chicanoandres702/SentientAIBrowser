// Feature: User Data Upload Handler | Trace: shared/userDataUpload.handler.js
const fs = require('fs');
const path = require('path');

function handleUserDataUpload(userId, buffer) {
  const userDir = path.join(__dirname, '../user_data', userId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
  // Save uploaded buffer as zip or file
  const filePath = path.join(userDir, 'profile.zip');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { handleUserDataUpload };
