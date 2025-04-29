const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const { json } = require('stream/consumers');

let conexion;

(async () => {
  try {
    conexion = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD  || 'J0RG1nh@', 
      database: process.env.DB_DATABASE || 'proyectofinal',
      port: process.env.DB_PORT || 3306,
    });
    console.log('Conectado a la base de datos proyectofinal');
  } catch (err) {
    console.error('Error de conexión a la base de datos:', err);
  }
})();

const alumnoDB = {
  async getAllAlumnos() {
    try {
      const alumnosPath = path.join(__dirname, '../uploads/alumnos.json');
      const jsonContent = await fs.readFile(alumnosPath, 'utf8');
      // console.log(jsonContent);
      // console.log(JSON.parse(jsonContent)[0].id);
      return JSON.parse(jsonContent);
    } catch (err) {
      console.error('Error leyendo alumnos.json:', err);
      return [];
    }
  },

  async insertar(alumno) {
    try {
      const alumnosPath = path.join(__dirname, '../uploads/alumnos.json');
      let alumnos = [];
      
      try {
        const jsonContent = await fs.readFile(alumnosPath, 'utf8');
        alumnos = JSON.parse(jsonContent);
      } catch (err) {
        alumnos = [];
      }

      alumnos.push({
        ...alumno,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });

      await fs.writeFile(alumnosPath, JSON.stringify(alumnos, null, 2));
      return { insertId: alumno.id };
    } catch (err) {
      throw err;
    }
  },

  async buscarPorId(id) {
    const alumnos = await this.getAllAlumnos();
    return alumnos.filter(a => a.id === parseInt(id));
  },

  async buscarPorMatricula(matricula) {
    const alumnos = await this.getAllAlumnos();
    return alumnos.filter(a => a.matricula === matricula);
  },

  insertarImagen: async (nombreArchivo) => {
    try {
      const [result] = await conexion.query(
        'INSERT INTO images (filename) VALUES (?)', 
        [nombreArchivo]
      );
      return result;
    } catch (err) {
      throw err;
    }
  },

  mostrarTodos: async () => {
    const [rows] = await conexion.query('SELECT * FROM alumnos');
    return rows;
  },

  borrarPorId: async (id) => {
    const [result] = await conexion.query('DELETE FROM alumnos WHERE id = ?', [id]);
    return result;
  },

  actualizarPorId: async (id, alumno) => {
    const [result] = await conexion.query('UPDATE alumnos SET ? WHERE id = ?', [alumno, id]);
    return result;
  },

  cambiarStatus: async (id, status) => {
    const [result] = await conexion.query('UPDATE alumnos SET status = ? WHERE id = ?', [status, id]);
    return result;
  },

  test: async () => {
    const nuevoAlumno = {
      matricula: 'A12345',
      nombre: 'kevin',
      carrera: 'ITI',
      status: true
    };

    try {
      const res = await alumnoDB.insertar(nuevoAlumno);
      console.log('Alumno insertado:', res.insertId);

      const rows = await alumnoDB.mostrarTodos();
      console.log('Todos los alumnos:', rows);
    } catch (err) {
      console.error(err);
    }
  }
};

module.exports = alumnoDB;