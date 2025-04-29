const express = require('express');
const router = express.Router();
const db = require('../module/db');
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

router.get('/alumnos', (req, res) => {
  console.log('Accediendo a la ruta /alumnos');
  res.render('alumnos', {
    title: 'Registrar Alumno'
  });
});



// Buscar imagen por ID
router.get('/api/buscar-id', async (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'ID requerido' 
    });
  }

  try {
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

// router.get('/api', async (req, res) => {
//   const { campo, valor } = req.query;

//   if (!campo || !valor) {
//     // Siempre devuelve el array aunque falten parámetros
//     return res.status(400).json({ 
//       success: false, 
//       message: 'Se requieren campo y valor para la búsqueda',
//       data: { alumnosFiltrados: [] }
//     });
//   }

//   try {
//     const alumnos = await alumnoDB.getAllAlumnos();
//     let resultados = [];

//     switch (campo) {
//       case 'nombre':
//         resultados = alumnos.filter(a => 
//           (a.nombre || '').toLowerCase().includes(valor.toLowerCase())
//         );
//         break;
//       case 'matricula':
//         resultados = alumnos.filter(a => 
//           (a.matricula || '').includes(valor)
//         );
//         break;
//       case 'carrera':
//         const carrerasMap = {
//           '1': 'Ingeniería Mecatrónica',
//           '2': 'Ingeniería en Biotecnología',
//           '3': 'Ingeniería en Informática',
//           '4': 'Ingeniería en Energía',
//           '5': 'Ingeniería Logística y Transporte',
//           '6': 'Ingeniería en Tecnología Ambiental',
//           '7': 'Ingeniería Biomédica',
//           '8': 'Ingeniería en Animación y Efectos Visuales',
//           '9': 'Ingeniería en Nanotecnología',
//           '10': 'Ingeniería en Energía y Desarrollo Sostenible'
//         };
//         resultados = alumnos.filter(a => 
//           a.carrera === carrerasMap[valor]
//         );
//         break;
//       default:
//         return res.status(400).json({
//           success: false,
//           message: 'Campo de búsqueda no válido',
//           data: { alumnosFiltrados: [] }
//         });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Se encontraron ${resultados.length} resultados`,
//       data: {
//         alumnosFiltrados: resultados
//       }
//     });

//   } catch (error) {
//     console.error('Error en búsqueda:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error en la búsqueda',
//       data: { alumnosFiltrados: [] },
//       error: error.message
//     });
//   }
// });

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
    const [images] = await db.query('SELECT * FROM images ORDER BY id DESC');
    res.render('upload', { images });
  } catch (error) {
    console.error('Error al cargar imágenes:', error);
    res.status(500).send('Error al cargar la página');
  }
});

// router.post('/api/alumnos', async (req, res) => {
//   try {
//     // Obtener el último ID
//     const [lastIdResult] = await db.query('SELECT MAX(id) as lastId FROM alumnos');
//     const nextId = (lastIdResult[0].lastId || 0) + 1;

//     // Obtener datos del formulario
//     const { matricula, nombre, carrera } = req.body;
//     const status = req.body.status === 'on' ? true : false;
    
//     // Validación básica
//     if (!matricula || !nombre || !carrera) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Todos los campos son requeridos' 
//       });
//     }

//     // Mapeo de carreras (número a texto)
//     const carrerasMap = {
//       '1': 'Ingeniería Mecatrónica',
//       '2': 'Ingeniería en Biotecnología',
//       '3': 'Ingeniería en Informática',
//       '4': 'Ingeniería en Energía',
//       '5': 'Ingeniería Logística y Transporte',
//       '6': 'Ingeniería en Tecnología Ambiental',
//       '7': 'Ingeniería Biomédica',
//       '8': 'Ingeniería en Animación y Efectos Visuales',
//       '9': 'Ingeniería en Nanotecnología',
//       '10': 'Ingeniería en Energía y Desarrollo Sostenible'
//     };

//     const nuevoAlumno = {
//       id: nextId,
//       matricula,
//       nombre,
//       carrera: carrerasMap[carrera] || 'Carrera no especificada',
//       status
//     };

//     await alumnoDB.insertar(nuevoAlumno);
    
//     // Guardar en archivo JSON
//     const alumnosPath = path.join(__dirname, '../uploads/alumnos.json');
//     let alumnosArray = [];
    
//     try {
//       const jsonContent = await fs.readFile(alumnosPath, 'utf8');
//       alumnosArray = JSON.parse(jsonContent);
//     } catch (err) {
//       // Si el archivo no existe o está vacío, crear un array vacío
//       alumnosArray = [];
//     }
    
//     alumnosArray.push(nuevoAlumno);
//     await fs.writeFile(alumnosPath, JSON.stringify(alumnosArray, null, 2));
    
//     res.status(200).json({ 
//       success: true, 
//       message: 'Alumno registrado correctamente',
//       data: nuevoAlumno
//     });
    
//   } catch (err) {
//     console.error('Error al registrar alumno:', err);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Error al registrar alumno' 
//     });
//   }
// });

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

module.exports = router;
