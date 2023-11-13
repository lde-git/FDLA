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
  const uuid = "urn:uuid:"+uuidv4();
  const sourceID = "https://fdla.vercel.app/atom.xml";
  db.query('INSERT INTO events (id ,eventname, published, updated, content, sourceID, sourceTitle, sourceUpdated ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [uuid, eventName, eventDate, eventDate, eventSummary, sourceID, "Events Feed", eventDate  ],
      (err, result) => {
          if (err) {
              return console.error(err.message);
          }

          const eventId = result.insertId;
          console.log(`Event added with ID: ${uuid}`);
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
              returnText = "XML data processed and events added successfully!";

              const entries = result.feed.entry;
              const sourceID = result.feed.id[0];
              const sourceTitle = result.feed.title[0];
              const sourceUpdated = result.feed.updated[0];



              entries.forEach(entry => {
                  const id = entry.id[0];
                  const published = entry.published[0];
                  const updated = entry.updated[0]; 
                  const title = entry.title ? (entry.title[0]._ ?  entry.title[0]._ : entry.title[0] ) : null;            
                  const content = entry.summary ? (entry.summary[0]._ ? entry.summary[0]._ : null) : (entry.content ? (entry.content[0]._ ? entry.content[0]._ : "")  : "");


                  // Check if the entry already exists in the database
                  db.query('SELECT * FROM events WHERE id = ?', [id], (err, rows) => {
                      if (err) {
                          return console.error(err.message);
                      }

                      if (rows.length === 0) {
                          // Insert data into the database
                          db.query('INSERT INTO events (id, eventname, published, updated, content, sourceID, sourceTitle, sourceUpdated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                              [id, title, new Date(published), new Date(updated), content, sourceID, sourceTitle, new Date(sourceUpdated)  ],
                              (err, result) => {
                                  if (err) {
                                      return console.error(err.message);
                                  }
                                  const eventId = result.insertId;
                                  console.log(`Event added with ID: ${id}`);
                              }
                          );
                                        /*
id VARCHAR(100) PRIMARY KEY,
    eventname VARCHAR(255),
    published DATE,
    updated DATE,
    content VARCHAR(255) DEFAULT NULL,
    sourceID VARCHAR(100),
    sourceTitle VARCHAR(255),
    sourceUpdated DATE
*/
                      } else {
                          // Check if the entry's "updated" field is later
                          const existingUpdated = rows[0].updated;
                          if (new Date(updated) > existingUpdated) {
                              db.query('UPDATE events SET eventname = ?, published = ?, updated = ?, content = ?, sourceID = ?, sourceTitle = ?, sourceUpdated = ? WHERE id = ?',
                                  [title, new Date(published), new Date(updated), content, sourceID, sourceTitle , new Date(sourceUpdated), id],
                                  (err, result) => {
                                      if (err) {
                                          return console.error(err.message);
                                      }
                                      console.log(`Event with ID ${id} updated`);
                                  }
                              );
                          } else {
                              console.log(`Event with ID ${id} already exists and is not updated.`);
                          }
                      }
                  });
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
                <id>urn:uuid:0d4db8b8-b668-4240-913f-1d1c90a6gfff</id>
                <updated>${new Date().toISOString()}</updated>
                <link rel="self" href="https://fdla.vercel.app/atom.xml"/>
                
                ${rows.map(event => `
                    <entry>
                        <title>${event.eventname}</title>
                        <id>${event.id}</id>
                        <content>${event.content}</content>
                        <published>${event.published.toISOString()}</published>
                        <updated>${event.updated.toISOString()}</updated>
                        
                        <source>
                          <id>${event.sourceID}</id>
                          <title>${event.sourceTitle}</title>
                          <updated>${event.sourceUpdated.toISOString()}</updated>
                        </source>
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
// Create a table to store events
db.query(`
  CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(100) PRIMARY KEY,
    eventname VARCHAR(255),
    published DATE,
    updated DATE,
    content VARCHAR(500) DEFAULT NULL,
    sourceID VARCHAR(100),
    sourceTitle VARCHAR(255),
    sourceUpdated DATE
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
