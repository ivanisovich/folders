const { Client } = require("ssh2");

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, host = "91.223.123.165", port = 3333 } = req.body;
  const client = new Client();

  client.on("ready", () => {
    console.log("Client is ready");
    client.sftp((err, sftp) => {
      if (err) {
        console.error("Ошибка при создании SFTP сессии: ", err);
        return res.status(500).json({ error: "Ошибка при создании SFTP сессии" });
      }
      // Здесь можно сохранить sftp сессию в глобальной переменной или кэше, если это необходимо
      res.json({ token: "fake-token" }); // Отправка фейкового токена для демонстрации
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
};
