const express = require('express');
const router = express.Router();
console.log('PRUEBA FERIA 123');


const controlador = require('../controller/productoControlador');
const verificarSesion = require('../middlewares/verificarSesionMiddleware');
const subidaImagen = require('../middlewares/subidaImagenMiddleware');

const recibirImagen = function(solicitud, respuesta, siguiente) {
    subidaImagen.single('imagen')(solicitud, respuesta, function(error) {
        if (error) {
            const mensaje = error.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen no puede superar los 5 MB.'
                : error.message;

            return respuesta.status(400).json({
                estado: 'error',
                mensaje
            });
        }

        siguiente();
    });
};

// Subir imagen del producto
router.post(
    '/productos/imagen',
    (solicitud, respuesta, siguiente) => {
        console.log('Ruta de subida de imagen alcanzada');
        console.log('Método:', solicitud.method);
        console.log('URL:', solicitud.originalUrl);
        siguiente();
    },
    verificarSesion,
    recibirImagen,
    controlador.subirImagen
);

// Registrar producto
router.post(
    '/productos',
    (solicitud, respuesta, siguiente) => {
        console.log('Ruta de registro de producto alcanzada');
        siguiente();
    },
    verificarSesion,
    controlador.registrar
);

// Listar productos de un expositor
router.get(
    '/productos/expositor/:idExpositor',
    controlador.listar
);

// Actualizar producto
router.put(
    '/productos/:id',
    verificarSesion,
    controlador.actualizar
);

// Eliminar producto
router.delete(
    '/productos/:id',
    verificarSesion,
    controlador.eliminar
);

module.exports = router;
