const express = require('express');
const path = require('path');
const sessionRoutes = require('./routes/sessions');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/sessions', sessionRoutes);

module.exports = app;