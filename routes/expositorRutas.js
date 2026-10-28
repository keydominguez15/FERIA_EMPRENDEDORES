
const express = require('express');
const router = express.Router();

const controlador = require('../controller/expositorControlador');
const verificarSesion = require('../middlewares/verificarSesionMiddleware');
const { verificarAdministrador } = require('../middlewares/autorizacionMiddleware');

// Registro e inicio de sesión
router.post('/registrar', controlador.registrar);
router.post('/login', controlador.iniciarSesion);

// Consulta pública: la necesita el catálogo
router.get('/listar', controlador.obtenerTodos);
router.get('/expositor/:correo', controlador.obtenerPorCorreo);

// Operaciones exclusivas del administrador
router.post(
    '/expositores',
    verificarSesion,
    verificarAdministrador,
    controlador.agregarExpositor
);

router.put(
    '/expositores/:id',
    verificarSesion,
    verificarAdministrador,
    controlador.actualizarExpositor
);

router.delete(
    '/expositores/:id',
    verificarSesion,
    verificarAdministrador,
    controlador.eliminarExpositor
);

router.put(
    '/expositores/:id/estado',
    verificarSesion,
    verificarAdministrador,
    controlador.actualizarEstado
);

module.exports = router;
