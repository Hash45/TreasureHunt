const conn = require('./mysqlconn.js');
  const mysql = require('mysql2');
  const express = require('express');
  const session = require('express-session');
  const app = express();
  const bodyParser = require('body-parser');
  app.set('view engine', 'ejs');
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static('public'));
  app.use(express.static('images'));
  app.use(session({
    secret: 'treasure',
    resave: false,
    saveUninitialized: true
  }));
  
  app.get('/play', (req, res) => {
    const name = req.query.name;
    const id = req.query.id;
    const sql = 'SELECT * FROM riddles';
    conn.query(sql, (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else {
        const riddles = results;
        const score = 100;
        res.render('play', { riddles, id, name, score });
      }
    });
  });
  app.get('/validateImage', (req, res) => {
    const riddleId = req.query.riddleId;
    const imageName = req.query.imageName;
  
    const sql = 'SELECT * FROM riddles WHERE id = ? AND Correct = ?';
    conn.query(sql, [riddleId, imageName], (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else {
        const correct = results.length > 0;
        res.json({ correct });
      }
    });
  });
  app.get('/getClue', (req, res) => {
    const riddleId = req.query.riddleId;
    console.log(req.query)
    let clueCount = req.query.clueCount ;
    // console.log(clueCount);
    // let score = req.query.score;
  
    const sql = 'SELECT clues FROM clues WHERE id = ?';
    conn.query(sql, [riddleId], (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else if (result.length > 0) {
        const clues = result.map(row => row.clues); // Extract the 'clues' values from the result rows
        const totalClues = clues.length;
  
        if (clueCount < totalClues) {
          const nextClue = clues[clueCount];
          clueCount++;
  
          req.session.clueCount = clueCount; // Update clue count in session
          res.send(nextClue);
        } else {
          // No more clues available for the current riddle
          req.session.clueCount = 0; // Reset clue count
        console.log(req.session.name);
          // Redirect to main.ejs with the same name and id
          res.render('main', { name: req.session.name, id: req.session.userId });
        }
      } else {
        res.send('No clue found');
      }
    });
  });
  
  
  app.get('/nextRiddle', (req, res) => {
    const riddleId = req.query.riddleId;
    const sql = 'SELECT * FROM riddles WHERE id > ? ORDER BY id LIMIT 1';
    conn.query(sql, [riddleId], (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else if (result.length > 0) {
        const nextRiddle = result[0];
        res.redirect(`/play?name=${req.session.name}&id=${nextRiddle.id}`);
      } else {
        // All riddles completed
        // Calculate the time taken and display the score
        const endTime = new Date();
        const startTime = req.session.startTime;
        const timeDiff = Math.abs(endTime - startTime);
        const minutes = Math.floor(timeDiff / 60000);
        if (minutes > 5) {
          // Time limit exceeded
          const score = req.session.score;
          res.render('score', { score });
        } else {
          // All riddles completed within time limit
          const score = req.session.score;
          res.render('win', { score });
        }
      }
    });
  });
  
  app.get('/', (req, res) => {
    res.render('first');
  });
  
  app.get('/login', (req, res) => {
    res.render('login');
  });
  
  app.get('/signup', (req, res) => {
    res.render('signup');
  });
  
  app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const sql = 'SELECT userid,Name FROM users WHERE Email = ? AND Password = ?';
    conn.query(sql, [email, password], (err, result) => {
      if (err) {
        res.send("An error occurred");
      } else if (result.length > 0) {
        req.session.userId = result[0]['userid'];
        req.session.name = result[0]['Name'];
        console.log(result[0]['Name']);
        req.session.startTime = new Date(); // Store the start time
        req.session.score = 100; // Initialize the score
        res.render("main", { id: req.session.userId, name: req.session.name });
      } else {
        res.send('Invalid email/password');
      }
    });
  });
  app.get('/main',(req,res)=>{
    res.render("main",{ id: req.session.userId, name: req.session.name });
  })
  app.post('/signup', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const pwd = req.body.password;
    const gen = req.body.gen;
    const dob = req.body.dob;
    const profile = req.body.profile;
    console.log(req.body.name);
    console.log(email);
    console.log(pwd);
    console.log(gen);
  
    const sql =
      'INSERT INTO users (Name, Email, Password, Gender,DOB,profile) VALUES (?, ?, ?, ?,?,?)';
    const values = [name, email, pwd, gen, dob, profile];
  
    conn.query(sql, values, (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.render('login');
      }
    });
  });
  
  app.listen(3000, () => {
    console.log("server is running");
  });