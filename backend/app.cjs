const express = require('express');
const app = express();
const path = require('path');
const triageRoutes = require('./routes/triage.routes.cjs');

app.use(express.json());
app.use('/api', triageRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Smart Hospital Congestion Control API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
