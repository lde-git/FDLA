const db = require('./database.js');

// Create a table to store events
db.query(`
  CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    eventname VARCHAR(255),
    date DATE,
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
