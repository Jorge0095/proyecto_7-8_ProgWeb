const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'J0RG1nh@',
  database: 'proyectofinal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

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
