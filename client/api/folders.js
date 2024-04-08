const { Client } = require("ssh2");
const path = require("path");

// Здесь будет необходимо адаптировать логику хранения sftp сессии
let sftp;

// Ваша функция findDirectoriesWithUnderScores должна быть здесь или в отдельном модуле

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestedPath = req.query.path || "/";

  // Здесь нужно инициализировать и управлять sftp сессией
  try {
    const directories = await findDirectoriesWithUnderScores(requestedPath, sftp);
    res.json({ path: requestedPath, directories });
  } catch (error) {
    console.error("Error fetching folders: ", error);
    res.status(500).send("Server error");
  }
};
