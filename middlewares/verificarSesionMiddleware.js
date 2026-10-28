
const { createClient } = require('@supabase/supabase-js');

const verificarSesion = async function (
    solicitud,
    respuesta,
    siguiente
) {
    try {
        const encabezado = solicitud.headers.authorization;

        if (!encabezado || !encabezado.startsWith('Bearer ')) {
            return respuesta.status(401).json({
                estado: 'error',
                mensaje: 'Debes iniciar sesión para continuar.'
            });
        }

        const token = encabezado.slice(7);

        const supabaseAuth = createClient(
            process.env.URL_SUPABASE,
            process.env.CLAVE_SUPABASE,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );

        const { data, error } = await supabaseAuth.auth.getUser(token);

        if (error || !data.user) {
            return respuesta.status(401).json({
                estado: 'error',
                mensaje: 'La sesión no es válida. Inicia sesión nuevamente.'
            });
        }

        solicitud.user = data.user;
        siguiente();
    } catch (error) {
        console.error('Error al verificar la sesión:', error);

        return respuesta.status(500).json({
            estado: 'error',
            mensaje: 'No se pudo verificar la sesión.'
        });
    }
};

module.exports = verificarSesion;

