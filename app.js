// app.js
const express = require('express');
const app = express();

// Add your code here

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
