const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',            
  password: 'Ramesh@SQL63', 
  database: 'pomodoro_db',
  waitForConnections: true,
  connectionLimit: 10
});
pool.query('SELECT 1')
  .then(() => console.log('MySQL connected'))
  .catch(err => console.error('MySQL error:', err.message));
module.exports = pool;