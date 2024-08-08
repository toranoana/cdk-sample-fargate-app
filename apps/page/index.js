const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const apiUrl = process.env.API_URL;

app.get('/', async (req, res) => {
  try {
    const response = await axios.get(apiUrl);
    const samples = response.data;

    // Caution: XSS対策されていないので、実際のアプリケーションでは使用しないでください
    let tableRows = samples
      .map((sample) => {
        return `<tr>${Object.values(sample)
          .map((value) => `<td>${value}</td>`)
          .join('')}</tr>`;
      })
      .join('');

    let html = `
      <html>
      <head>
        <title>Samples Table</title>
      </head>
      <body>
        <h1>Samples</h1>
        <table border="1">
          <tr>${Object.keys(samples[0])
            .map((key) => `<th>${key}</th>`)
            .join('')}</tr>
          ${tableRows}
        </table>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error fetching data from API:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/healthCheck', async (req, res) => {
  res.json({});
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
