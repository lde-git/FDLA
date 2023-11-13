const db = require('./database.js');


// Create a table to store events
db.query(`
  CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    eventname VARCHAR(255),
    published DATE,
    updated DATE,
    summary VARCHAR(255) DEFAULT NULL,
    name VARCHAR(255)
  )
`, (error, results, fields) => {
  if (error) {
    console.error('Error creating events table:', error);
  } else {
    console.log('Events table created or already exists.');
  }
});


