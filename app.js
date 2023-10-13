const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database.js');
const atom = require('atom');
const fs = require('fs');

const app = express();

app.use(express.static('public'));
app.use(express.static('views'));

// ATOM feed route
app.get('/atom-feed', (req, res) => {
    db.query('SELECT * FROM events', (err, rows) => {
        if (err) {
            throw err;
        }

        const feedXML = `<?xml version="1.0" encoding="utf-8"?>
            <feed xmlns="http://www.w3.org/2005/Atom">
                <title>Event Feed</title>
                <id>http://localhost:3000/atom-feed</id>
                <updated>${new Date().toISOString()}</updated>
                <author>
                    <name>Lukas Daude</name>
                    <email>lukas.daude@gmail.com</email>
                </author>
                ${rows.map(event => `
                    <entry>
                        <title>${event.name}</title>
                        <id>http://localhost:3000/event/${event.id}</id>
                        <link href="http://localhost:3000/event/${event.id}"/>
                        <content>${event.name}</content>
                        <updated>${new Date(event.date).toISOString()}</updated>
                    </entry>
                `).join('')}
            </feed>`;

        fs.writeFileSync('public/atom.xml', feedXML);
        res.sendFile(__dirname + '/public/atom.xml');
    });
});









app.use(bodyParser.urlencoded({ extended: true }));



app.get('/add-event', (req, res) => {
  res.sendFile(__dirname + '/views/add-event.html');
});

app.post('/add-event', (req, res) => {
    const { eventName, eventDate } = req.body;

    db.query('INSERT INTO events (name, date) VALUES (?, ?)', [eventName, eventDate], (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        const eventId = result.insertId;
        console.log(`Event added with ID: ${eventId}`);
        res.send('Event added successfully!');
    });
});


app.get('/', (req, res) => {
  res.send('Welcome to the event publishing web app!');
});

app.get('/events-list', (req, res) => {
    db.query('SELECT * FROM events', (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('events-list', { events: rows });
    });
});

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
