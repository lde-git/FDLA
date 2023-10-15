const db = require('./database.js');

// Create a table to store events
db.query(`
  CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    date DATE
  )
`, (error, results, fields) => {
  if (error) {
    console.error('Error creating events table:', error);
  } else {
    console.log('Events table created or already exists.');
  }
});
