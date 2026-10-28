
const { cliente_supabase } = require('../config/supabase');
const servicio = require('../services/expositorServicio');
const expositorRepositorio = require('../repositories/expositorRepositorio');

const expositorControlador = {
    registrar: async function(solicitud, respuesta) {
        try {
            const resultado = await servicio.expositorServicio
                .procesarInscripcion(solicitud.body);

            respuesta.status(201).json({
                estado: 'exitoso',
                mensaje: resultado.mensaje
            });
        } catch (error) {
            respuesta.status(400).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    iniciarSesion: async function(solicitud, respuesta) {
        try {
            const { correo, password } = solicitud.body;

            const { data: authData, error: authError } =
                await cliente_supabase.auth.signInWithPassword({
                    email: correo,
                    password
                });

            if (authError) {
                throw new Error('Correo o contraseña incorrectos.');
            }

            const { data: perfil, error: perfilError } =
                await cliente_supabase
                    .from('perfiles')
                    .select('rol, nombre')
                    .eq('id_usuario', authData.user.id)
                    .single();

            if (perfilError) {
                throw new Error('No se encontró el perfil del usuario.');
            }

            respuesta.status(200).json({
                estado: 'exitoso',
                mensaje: '¡Inicio de sesión exitoso!',
                rol: perfil.rol,
                nombre: perfil.nombre,
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                id_usuario: authData.user.id
            });
        } catch (error) {
            respuesta.status(400).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    obtenerTodos: async function(solicitud, respuesta) {
        try {
            const estadoFiltro = solicitud.query.estado;
            let expositores;

            if (estadoFiltro) {
                expositores = await servicio.expositorServicio
                    .obtenerExpositoresPorEstado(estadoFiltro);
            } else {
                expositores = await expositorRepositorio.obtenerTodos();
            }

            respuesta.status(200).json(expositores);
        } catch (error) {
            respuesta.status(500).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    actualizarEstado: async function(solicitud, respuesta) {
        try {
            const { id } = solicitud.params;
            const { estado } = solicitud.body;

            if (!estado) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'Debes proporcionar un nuevo estado.'
                });
            }

            const resultado = await servicio.expositorServicio
                .cambiarEstadoExpositor(id, estado);

            respuesta.status(200).json({
                estado: 'exitoso',
                mensaje: `Expositor ${estado} correctamente.`,
                datos: resultado
            });
        } catch (error) {
            respuesta.status(400).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    obtenerPorCorreo: async function(solicitud, respuesta) {
        try {
            const { correo } = solicitud.params;

            const { data, error } = await cliente_supabase
                .from('perfiles')
                .select('*')
                .eq('correo', correo)
                .single();

            if (error) {
                throw new Error('No se encontró el perfil del expositor.');
            }

            respuesta.status(200).json(data);
        } catch (error) {
            respuesta.status(404).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    agregarExpositor: async function(solicitud, respuesta) {
        try {
            const resultado = await servicio.expositorServicio
                .agregarExpositor(solicitud.body);

            respuesta.status(201).json({
                estado: 'exitoso',
                mensaje: 'Emprendimiento agregado correctamente.',
                datos: resultado
            });
        } catch (error) {
            respuesta.status(400).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    actualizarExpositor: async function(solicitud, respuesta) {
        try {
            const { id } = solicitud.params;

            const resultado = await servicio.expositorServicio
                .actualizarExpositor(id, solicitud.body);

            respuesta.status(200).json({
                estado: 'exitoso',
                mensaje: 'Emprendimiento actualizado correctamente.',
                datos: resultado
            });
        } catch (error) {
            respuesta.status(400).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    eliminarExpositor: async function(solicitud, respuesta) {
        try {
            const { id } = solicitud.params;

            const resultado = await servicio.expositorServicio
                .eliminarExpositor(id);

            respuesta.status(200).json({
                estado: 'exitoso',
                mensaje: 'Expositor eliminado correctamente.',
                datos: resultado
            });
        } catch (error) {
            respuesta.status(400).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    }
};

module.exports = expositorControlador;
