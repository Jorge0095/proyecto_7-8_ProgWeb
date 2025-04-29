const connectDB = require('./module/db');
const express = require('express');
const fs = require('fs');
const app = express();
const path = require('path');
const multer = require('multer');
const alumnoDB = require('./module/model');
//const db = require('./module/db');
const apiRouter = require('./routes/api');
const cors = require('cors');
const PORT = process.env.PORT || 4000;

// Configuraciones generales
app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Multer para subir imágenes
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Async
(async () => {
  const db = await connectDB();

  // Leer el archivo SQL
  const sqlPath = path.join(__dirname, 'app.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await db.query(sql);
    console.log('Script SQL ejecutado correctamente.');
  } catch (err) {
    console.error('Error al ejecutar app.sql:', err);
  }
})();

// Rutas principales
app.use('/', apiRouter);

// Ruta raíz redirige a /api/alumnos
app.get('/', (req, res) => {
  res.send('<h1>Servidor corriendo correctamente</h1><p>Accede a "/inicio" para ver la GUI</p>');
});

// Página principal con render EJS
app.get('/inicio', async (req, res) => {
  try {
    const db = await connectDB();
    const [images] = await db.query('SELECT * FROM images ORDER BY id DESC');
    const alumnos = await alumnoDB.getAllAlumnos();
    
    res.render('index', {
      alumnoPorId: null,
      alumnosFiltrados: alumnos,
      imagenPorId: null,
      images,
      alumnos
    });
  } catch (error) {
    console.error('Error al cargar la vista principal:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cargar la página' 
    });
  }
});

// Obtener alumnos
app.get('/api/alumnos', async (req, res) => {
  try {
    const alumnos = await alumnoDB.getAllAlumnos();
    res.render('alumnos', { alumnos });
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener alumnos' 
    });
  }
});

// Registrar alumno
app.post('/api/alumnos', async (req, res) => {
  const { matricula, nombre, carrera, status } = req.body;

  try {
    // Validación
    if (!matricula || !nombre || !carrera) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios' 
      });
    }

    const carrerasMap = {
      '1': 'Ingeniería Mecatrónica',
      '2': 'Ingeniería en Biotecnología',
      '3': 'Ingeniería en Informática',
      '4': 'Ingeniería en Energía',
      '5': 'Ingeniería Logística y Transporte',
      '6': 'Ingeniería en Tecnología Ambiental',
      '7': 'Ingeniería Biomédica',
      '8': 'Ingeniería en Animación y Efectos Visuales',
      '9': 'Ingeniería en Nanotecnología',
      '10': 'Ingeniería en Energía y Desarrollo Sostenible'
    };

    // Obtener último ID
    const db = await connectDB();
    const [lastIdResult] = await db.query('SELECT MAX(id) as lastId FROM alumnos');
    const nextId = (lastIdResult[0].lastId || 0) + 1;

    // Insertar en base de datos
    await db.query(
      'INSERT INTO alumnos (id, matricula, nombre, carrera, status) VALUES (?, ?, ?, ?, ?)',
      [nextId, matricula, nombre, carrerasMap[carrera], status ? 1 : 0]
    );

    // Guardar en archivo JSON
    const alumnosPath = path.join(__dirname, 'uploads/alumnos.json');
    let alumnosArray = [];
    
    try {
      const jsonContent = await fs.promises.readFile(alumnosPath, 'utf8');
      alumnosArray = JSON.parse(jsonContent);
    } catch (err) {
      // Si el archivo no existe o está vacío, crear array vacío
      alumnosArray = [];
    }

    // Agregar nuevo alumno al array
    alumnosArray.push({
      id: nextId,
      matricula,
      nombre,
      carrera: carrerasMap[carrera] || 'Carrera no especificada',
      status: status ? true : false,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    });

    // Guardar archivo JSON actualizado
    await fs.promises.writeFile(alumnosPath, JSON.stringify(alumnosArray, null, 2));

    res.status(201).json({ 
      success: true,
      message: 'Alumno registrado correctamente',
      data: alumnosArray[alumnosArray.length - 1]
    });

  } catch (error) {
    console.error('Error al registrar alumno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar alumno' 
    });
  }
});

// Subir imagen (POST /api/upload-image)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const filename = req.file.filename;
    await alumnoDB.insertarImagen(filename);
    res.status(200).json({ mensaje: 'Imagen subida correctamente' });
  } catch (err) {
    console.error('Error al subir imagen:', err);
    res.status(500).send('Error al subir imagen');
  }
});

// Página de subida de imagen
app.get('/api/upload', (req, res) => {
  res.render('upload');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});