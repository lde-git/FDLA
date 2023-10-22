require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database.js');
const atom = require('atom');
const fs = require('fs');
const axios = require('axios');
const xml2js = require('xml2js');
const parser = require('xml2js').parseString;

const { v4: uuidv4 } = require('uuid');

const app = express();




app.use(express.static('public'));
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));

//Add-Event.html
app.get('/add-event', (req, res) => {
  res.sendFile(__dirname + '/views/add-event.html');
});


//On Form-Submit
app.post('/add-event', (req, res) => {
  const { eventName, eventDate, eventSummary, userName } = req.body;
  const uuid = uuidv4();
  db.query('INSERT INTO events (id ,eventname, published, updated, summary, name) VALUES (?,?, ?, ?, ?, ?)',
      [uuid, eventName, eventDate, eventDate, eventSummary, userName],
      (err, result) => {
          if (err) {
              return console.error(err.message);
          }

          const eventId = result.insertId;
          console.log(`Event added with ID: ${eventId}`);
          res.send('Event added successfully!');
      }
  );
});


app.get('/add-xml', (req, res) => {
  res.sendFile(__dirname + '/views/add-xml.html');
});

app.post('/add-xml', (req, res) => {
  const { xmlUrl } = req.body;

  axios.get(xmlUrl)
      .then(response => {
          const xmlData = response.data;
          parser(xmlData, (err, result) => {
              if (err) {
                  return console.error(err.message);
              }
              returnText= "XML data processed and events added successfully!";

              const entries = result.feed.entry;

              entries.forEach(entry => {
                  const title = entry.title[0];
                  const link = entry.link[0].$.href;
                  const id = entry.id[0];
                  const published = entry.published[0];
                  const updated = entry.updated[0];
                  const summary = entry.summary[0];
                  const author = entry.author[0].name[0];
                  console.log("test1");
                  // Check if the entry already exists in the database
                  db.query('SELECT * FROM events WHERE id = ?',
                      [id],
                      (err, rows) => {
                          if (err) {
                              return console.error(err.message);
                          }
                          console.log("rows:"+rows.length);

                          if (rows.length === 0) {
                            
                              // Insert data into the database
                              db.query('INSERT INTO events (id, eventname, published, updated, summary, name) VALUES (?, ?, ?, ?, ?, ?)',
                                  [id, title, new Date(published), new Date(updated), summary, author],
                                  (err, result) => {
                                      if (err) {
                                          return console.error(err.message);
                                      }

                                      const eventId = result.insertId;
                                      console.log(`Event added with ID: ${eventId}`);
                                  }
                              );
                          }

                          else {
                            console.log("failed to add");
                          }
                      }
                  );
              });

              res.send(returnText);
          });
      })
      .catch(error => {
          console.error(error);
          res.status(500).send('Error processing XML data');
      });
});












// ATOM feed route
app.get('/atom-feed', (req, res) => {
    db.query('SELECT * FROM events', (err, rows) => {
        if (err) {
            throw err;
        }
        
        const feedXML = `<?xml version="1.0" encoding="utf-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom">
                <title>Events Feed</title>
                <id>http://localhost:3000/atom-feed</id>
                <updated>${new Date().toISOString()}</updated>
                
                ${rows.map(event => `
                    <entry>
                        <title>${event.eventname}</title>
                        <link href="http://localhost:3000/event/${event.id}"/>
                        <id>urn:uuid:${event.id}</id>
                        <published>${event.published}</published>
                        <updated>${new Date(event.updated).toISOString()}</updated>
                        <summary>${event.summary}</summary>
                        <author>
                          <name>${event.name}$</name>
                        </author>
                    </entry>
                `).join('')}
            </feed>`;

        fs.writeFileSync('public/atom.xml', feedXML);
        res.sendFile(__dirname + '/public/atom.xml');
    });
});














app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Welcome to the Event Publishing Web App</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 50px;
            }
          </style>
        </head>
        <body>
          <h2>Welcome to the Event Publishing Web App!</h2>
          <p>
            <a href="/add-event">Add Event</a><br>
            <a href="/add-xml">Add ATOM Feed</a><br>
            <a href="/atom-feed">ATOM Feed</a><br>
          </p>
        </body>
      </html>
    `);
  });
  
  





// Create a table to store events
db.query(`
  CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(45),
    eventname VARCHAR(255),
    published DATE,
    updated DATE,
    summary VARCHAR(255),
    name VARCHAR(255)

  )
`, (error, results, fields) => {
  if (error) {
    console.error('Error creating events table:', error);
  } else {
    console.log('Events table created or already exists.');
  }
});




app.get('/events-list', (req, res) => {
  db.query('SELECT * FROM events', (err, rows) => {
      if (err) {
          throw err;
      }
      res.render('events-list', { events: rows });
  });
});

//Server Start
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

process.on('SIGINT', () => {
  db.end((err) => {
    if (err) {
      return console.error('error: ' + err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});
