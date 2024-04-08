const { Client } = require("ssh2");
const path = require("path");
const archiver = require("archiver");

// Здесь будет необходимо адаптировать логику хранения sftp сессии
let sftp;

// Функция addItemsToArchive должна быть здесь или в отдельном модуле

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestedPath = req.query.path || "/";

  if (!sftp) {
    return res.status(500).send("SFTP session not initialized");
  }

  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${path.basename(requestedPath)}.zip"`,
  });

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    console.error("Ошибка при создании архива: ", err);
    return res.status(500).send("Ошибка сервера");
  });

  archive.pipe(res);

  try {
    await addItemsToArchive(archive, sftp, requestedPath);
    archive.finalize();
  } catch (err) {
    console.error("Ошибка при добавлении файлов в архив: ", err);
    archive.abort();
  }
};
