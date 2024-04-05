const express = require("express");
const { Client } = require("ssh2");
const cors = require("cors");
const archiver = require("archiver");
const path = require("path");

const app = express();
const port = 3000;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const client = new Client();
let sftp;

const findDirectoriesWithUnderScores = async (directoryPath) => {
  try {
    const directories = [];
    const list = await new Promise((resolve, reject) => {
      sftp.readdir(directoryPath, (err, list) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(list);
      });
    });

    const promises = list.map(async (item) => {
      if (item.attrs.isDirectory()) {
        const underscoresCount = item.filename.split("_").length - 1;
        if (underscoresCount >= 2) {
          const folderPath = path.posix.join(directoryPath, item.filename);
          const stats = await new Promise((resolve, reject) => {
            sftp.stat(folderPath, (err, stats) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(stats);
            });
          });
          directories.push({
            // Удаляем начальную часть пути и добавляем свойство name
            path: folderPath.replace("/var/www/", ""),
            name: item.filename,
            createdAt: stats.atime,
            modifiedAt: stats.mtime,
          });
        } else {
          const fullPath = path.posix.join(directoryPath, item.filename);
          const nestedDirectories = await findDirectoriesWithUnderScores(
            fullPath
          );
          directories.push(...nestedDirectories);
        }
      }
    });

    await Promise.all(promises);
    return directories;
  } catch (err) {
    console.error("Error retrieving directories: ", err);
    throw err;
  }
};

app.post("/api/login", (req, res) => {
  const { username, password, host = "91.223.123.165", port = 3333 } = req.body;

  const client = new Client();

  client.on("ready", () => {
    console.log("Client is ready");
    client.sftp((err, sftpSession) => {
      if (err) {
        console.error("Ошибка при создании SFTP сессии: ", err);
        return res.status(500).json({ error: "Ошибка при создании SFTP сессии" });
      }
      // Устанавливаем глобальную переменную sftp или храните ее в сессии
      sftp = sftpSession;
      // Отправляем токен или другой маркер успешного входа
      res.json({ token: "token" });
    });
  })
  .on('error', (err) => {
    console.error("Ошибка при подключении: ", err);
    res.status(500).json({ error: "Невозможно установить SSH соединение" });
  })
  .connect({
    host: host,
    port: port,
    username: username,
    password: password,
  });
});


app.get("/folders", async (req, res) => {
  const requestedPath = req.query.path || "/";

  try {
    const directories = await findDirectoriesWithUnderScores(requestedPath);
    res.json({ path: requestedPath, directories });
  } catch (error) {
    console.error("Error fetching folders: ", error);
    res.status(500).send("Server error");
  }
});

app.get("/download", async (req, res) => {
  const requestedPath = req.query.path || "/";

  if (!sftp) {
    return res.status(500).send("SFTP session not initialized");
  }

  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${path.basename(
      requestedPath
    )}.zip"`,
  });

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    console.error("Ошибка при создании архива: ", err);
    return res.status(500).send("Ошибка сервера");
  });

  archive.pipe(res);

  // Рекурсивное добавление содержимого папки в архив
  const addItemsToArchive = (
    archive,
    sftp,
    folderPath,
    rootPath = folderPath
  ) => {
    return new Promise((resolve, reject) => {
      sftp.readdir(folderPath, (err, items) => {
        if (err) {
          console.error("Ошибка при чтении директории: ", folderPath, err);
          reject(err);
          return;
        }

        const promises = items.map((item) => {
          const itemPath = path.posix.join(folderPath, item.filename);
          // Определяем путь в архиве, сохраняя структуру относительно корневой папки
          const archivePath = path.posix.relative(rootPath, itemPath);

          if (item.attrs.isDirectory()) {
            return addItemsToArchive(archive, sftp, itemPath, rootPath);
          } else {
            return new Promise((resolve, reject) => {
              const readStream = sftp.createReadStream(itemPath);
              archive.append(readStream, { name: archivePath });
              readStream.on("close", resolve);
              readStream.on("error", reject);
            });
          }
        });

        Promise.all(promises).then(resolve).catch(reject);
      });
    });
  };

  addItemsToArchive(archive, sftp, requestedPath)
    .then(() => archive.finalize())
    .catch((err) => {
      console.error("Ошибка при добавлении файлов в архив: ", err);
      archive.abort();
    });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
