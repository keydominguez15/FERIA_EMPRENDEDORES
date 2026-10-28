const express = require('express');
const app = express();
const cors = require('cors');
const rutas_expositores = require('./routes/expositorRutas');
const rutas_productos = require('./routes/productoRutas');

require('dotenv').config();

app.use(cors());
app.use(express.json());

app.delete('/feria/prueba-ruta', (req, res) => {
    console.log('¡ENTRÓ A LA RUTA DE PRUEBA!');

    res.status(200).json({
        mensaje: 'La ruta DELETE funciona correctamente'
    });
});

app.use('/feria', rutas_expositores);
app.use('/feria', rutas_productos);


const puerto = process.env.PUERTO_SERVIDOR || 3000;

console.log('Rutas de productos cargadas correctamente');
console.log('Controlador:', require('./controller/productoControlador'));

console.log('Rutas de expositores cargadas:', rutas_expositores.stack.map(r => ({
    metodo: Object.keys(r.route?.methods || {}),
    ruta: r.route?.path
})));

app.listen(puerto, function () {
    console.log('--- Servidor de la Feria Iniciado ---');
    console.log('Archivo ejecutado:', __filename);
    console.log('Proceso:', process.pid);
    console.log('Escuchando en: http://localhost:' + puerto);
});
