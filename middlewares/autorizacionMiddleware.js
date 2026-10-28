const perfilRepositorio = require('../repositories/perfilRepositorio');

const autorizacionMiddleware = {
    // Middleware para verificar si el usuario es administrador
    verificarAdministrador: async function(solicitud, respuesta, siguiente) {
        try {
            // El ID del usuario viene en la solicitud (previamente validado por Supabase Auth)
            const id_usuario = solicitud.user.id;
            const perfil = await perfilRepositorio.obtenerPerfilPorId(id_usuario);

            if (perfil.rol !== 'administrador') {
                return respuesta.status(403).json({
                    mensaje: 'Acceso denegado: Se requieren permisos de administrador'
                });
            }

            // Si es admin, pasamos a la siguiente función (el controlador)
            siguiente();
        } catch (error) {
            respuesta.status(500).json({ mensaje: error.message });
        }
    }
};

module.exports = autorizacionMiddleware;