const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const util = require('util');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT || 3306,
  charset: 'utf8mb4',
  ssl: process.env.DATABASE_SSL_CA
    ? { ca: fs.readFileSync(process.env.DATABASE_SSL_CA) }
    : undefined,
});

const query = util.promisify(connection.query).bind(connection);

async function dbMigration() {
  // テーブルが存在しなければ作成する
  await query(`
    CREATE TABLE IF NOT EXISTS samples (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      value VARCHAR(255) NOT NULL
    )
  `);
  console.log('Table "samples" is ready');

  const results = await query('SELECT COUNT(*) AS count FROM samples');
  const count = results[0]['count'];

  if (count === 0) {
    // データが存在しない場合に初期データを挿入
    await query(`
      INSERT INTO samples (name, value) VALUES
      ('とらのあな', '同人誌販売'),
      ('とらのあなラボ', '開発')
    `);
    console.log('Initial data inserted');
  }
}

connection.connect(async (err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');

  try {
    await dbMigration();
  } catch (error) {
    console.error('Error during setup:', error);
  }
});

app.get('/api/samples', async (req, res) => {
  try {
    const results = await query('SELECT * FROM samples');
    res.json(results);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/healthCheck', async (req, res) => {
  res.json({});
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
