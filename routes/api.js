const express = require('express');
const router = express.Router();
const connectDB = require('../module/db');
const alumnoDB = require('../module/model'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/inicio', async (req, res) => {
  try {
    const db = await connectDB();
    const [rows] = await db.query('SELECT * FROM alumnos');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error al consultar la base de datos:', error);
    res.json({ success: false, message: 'Error al cargar la página' });
  }
});


router.get('/alumnos', (req, res) => {
  console.log('Accediendo a la ruta /alumnos');
  res.render('alumnos', {
    title: 'Registrar Alumno'
  });
});



// Buscar imagen por ID
router.get('/api/buscar-id', async (req, res) => {
  const { id } = req.query;
  const db = await connectDB();
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID requerido' 
    });
  }

  try {
    const db = await connectDB();
    const [result] = await db.query('SELECT * FROM images WHERE id = ?', [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Imagen no encontrada' 
      });
    }
    
    const [images] = await db.query('SELECT * FROM images ORDER BY id DESC');
    const [alumnos] = await db.query('SELECT * FROM alumnos ORDER BY id DESC');
    
    return res.status(200).json({
      success: true,
      message: 'Imagen encontrada',
      data: {
        imagenPorId: result[0],
        alumnosFiltrados: [],
        images,
        alumnos
      }
    });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al buscar imagen',
      error: err.message 
    });
  }
});

module.exports = router;



router.get('/api/mostrar-alumnos', async (req, res) => {
  try {
    const { id, nombre, matricula, carrera, status } = req.query;
    const alumnosPath = path.join(__dirname, '../uploads/alumnos.json');
    const jsonContent = await fs.readFile(alumnosPath, 'utf8');
    let alumnos = JSON.parse(jsonContent);
    
    // Apply filters if query params exist
    if (Object.keys(req.query).length > 0) {
      alumnos = alumnos.filter(alumno => {
        let matchesFilter = true;
        
        if (id && matchesFilter) {
          matchesFilter = alumno.id === parseInt(id);
        }
        
        if (nombre && matchesFilter) {
          matchesFilter = alumno.nombre.toLowerCase().includes(nombre.toLowerCase());
        }
        
        if (matricula && matchesFilter) {
          matchesFilter = alumno.matricula.includes(matricula);
        }
        
        if (carrera && matchesFilter) {
          // Handle both numeric and text carrera values
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
          const carreraText = carrerasMap[carrera] || carrera;
          matchesFilter = alumno.carrera === carreraText;
        }
        
        if (status !== undefined && matchesFilter) {
          // Convert string 'true'/'false' to boolean
          const statusBool = status === 'true';
          matchesFilter = alumno.status === statusBool;
        }
        return matchesFilter;
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Se muestran los siguientes resultados`,
      data: {
        alumnosFiltrados: alumnos
      }
    });
  } catch (error) {
    console.error('Error al leer alumnos:', error);
    res.status(404).json({ 
      success: false,
      message: 'No se encontraron alumnos'
    });
  }
});

router.get('/upload', async (req, res) => {
  try {
    const db = await connectDB();
    const [images] = await db.query('SELECT * FROM images ORDER BY id DESC');
    res.render('upload', { images });
  } catch (error) {
    console.error('Error al cargar imágenes:', error);
    res.status(500).send('Error al cargar la página');
  }
});



router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }

  try {
    const result = await alumnoDB.insertarImagen(req.file.filename);
    res.redirect('/api/upload');
  } catch (error) {
    console.error('Error al guardar la imagen:', error);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

router.post('/alumnos', async (req, res) => {
  const { matricula, nombre, carrera, status } = req.body;

  try {
    // Validación básica
    if (!matricula || !nombre || !carrera) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son obligatorios' 
      });
    }

    // Mapeo de carreras
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

    // Obtener último ID del JSON
    const alumnosPath = path.join(__dirname, '../uploads/alumnos.json');
    let alumnosArray = [];
    
    try {
      const jsonContent = await fs.readFile(alumnosPath, 'utf8');
      alumnosArray = JSON.parse(jsonContent);
    } catch (err) {
      alumnosArray = [];
    }

    const nextId = alumnosArray.length > 0 
      ? Math.max(...alumnosArray.map(a => a.id)) + 1 
      : 1;

    // Crear nuevo alumno
    const nuevoAlumno = {
      id: nextId,
      matricula,
      nombre,
      carrera: carrerasMap[carrera] || 'Carrera no especificada',
      status: status ? true : false,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    // Agregar al array y guardar
    alumnosArray.push(nuevoAlumno);
    await fs.writeFile(alumnosPath, JSON.stringify(alumnosArray, null, 2));

    res.status(201).json({ 
      success: true,
      message: 'Alumno registrado correctamente',
      data: nuevoAlumno
    });

  } catch (error) {
    console.error('Error al registrar alumno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar alumno' 
    });
  }
});