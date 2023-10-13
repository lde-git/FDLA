const db = require('./database.js');

// Create a table to store events
db.run(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    name TEXT,
    date DATE
  )
`);
