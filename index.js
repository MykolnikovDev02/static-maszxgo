const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const configRouter = require('./router/config');
const userRouter = require('./router/user');
const gamesRouter = require('./router/games');
const decorationRouter = require('./router/decoration');
const mailboxRouter = require('./router/mailbox');
const friendRouter = require('./router/friend');

const databaseConfig = require('./config/database');

const app = express();
const port = 3000;

mongoose.connect(databaseConfig.databaseUrl)
  .then(() => {
    console.log(`You are connected to ${databaseConfig.databaseType} `);
  })
  .catch((error) => {
    console.log('You have been not connected to MongoDb. Reason:', error);
  });

app.use(express.json());

app.use('/config', configRouter);
app.use('/user', userRouter);
app.use('/games', gamesRouter);
app.use('/decoration', decorationRouter);
app.use('/mailbox', mailboxRouter);


app.all('/', (req, res) => {
  res.status(200).send('BlockMan Online Dispatch');
});

app.listen(port, () => {
  const colors = ['\x1b[31m', '\x1b[33m', '\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m', '\x1b[37m'];
const reset = '\x1b[0m';  // Reset color to default

// First message
const message1 = `Connected at localhost:${port}`;
let coloredMessage1 = '';

for (let i = 0; i < message1.length; i++) {
  coloredMessage1 += colors[i % colors.length] + message1[i];
}

console.log(coloredMessage1 + reset);

// Second message
const message2 = 'Dispatch have been Connected Successful!';
let coloredMessage2 = '';

for (let i = 0; i < message2.length; i++) {
  coloredMessage2 += colors[i % colors.length] + message2[i];
}

console.log(coloredMessage2 + reset);

  console.log("\x1b[31m All Files have been Successfuly Loaded!!");
  console.log("\x1b[31mAll credits to BlockyMod the official owner Discord: blockymod\x1b[0m");
});
