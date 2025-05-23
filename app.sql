CREATE TABLE IF NOT EXISTS images(
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  matricula VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  carrera VARCHAR(100) NOT NULL,
  status BOOLEAN 
);

CREATE INDEX idx_matricula ON alumnos(matricula);
CREATE INDEX idx_nombre ON alumnos(nombre);
CREATE INDEX idx_carrera ON alumnos(carrera);