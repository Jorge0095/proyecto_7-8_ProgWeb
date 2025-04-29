const mysql = require('mysql2/promise');

// const db = mysql.createPool({
//   host: process.env.MYSQL_HOST || process.env.DB_URL,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   port: process.env.DB_PORT,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

const mysql = await mysql.createConnection({
  host: process.env.DB_HOST || process.env.DB_URL,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
});

// Verificar conexión al iniciar
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    connection.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
})();

module.exports = db;
