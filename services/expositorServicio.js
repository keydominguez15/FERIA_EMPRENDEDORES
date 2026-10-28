
const { cliente_supabase } = require('../config/supabase');
const perfilRepositorio = require('../repositories/perfilRepositorio');

const expositorServicio = {
    // Registrar un usuario desde el formulario existente
    procesarInscripcion: async function(datos_formulario) {
        if (
            datos_formulario.rol === 'expositor' &&
            !datos_formulario.nombre_emprendimiento
        ) {
            throw new Error('Debes asignar un nombre a tu emprendimiento.');
        }

        const { data: authData, error: authError } =
            await cliente_supabase.auth.signUp({
                email: datos_formulario.correo,
                password: datos_formulario.password
            });

        if (authError) {
            throw new Error(authError.message);
        }

        if (!authData.user) {
            throw new Error('No se pudo crear el usuario.');
        }

        const id_usuario = authData.user.id;

        const { error: perfilError } = await cliente_supabase
            .from('perfiles')
            .insert([{
                id_usuario,
                nombre: datos_formulario.nombre,
                rol: datos_formulario.rol
            }]);

        if (perfilError) {
            throw new Error(
                'Error al guardar el perfil: ' + perfilError.message
            );
        }

        if (datos_formulario.rol === 'expositor') {
            const { error: expositorError } = await cliente_supabase
                .from('expositores')
                .insert([{
                    nombre: datos_formulario.nombre,
                    correo: datos_formulario.correo,
                    nombre_emprendimiento:
                        datos_formulario.nombre_emprendimiento,
                    categoria: datos_formulario.categoria,
                    estado: 'pendiente'
                }]);

            if (expositorError) {
                throw new Error(
                    'Error al guardar el emprendimiento: ' +
                    expositorError.message
                );
            }

            return {
                mensaje:
                    '¡Registro exitoso! Tu solicitud está pendiente de aprobación.'
            };
        }

        return { mensaje: '¡Registro de administrador exitoso!' };
    },

    // Aprobar o rechazar una inscripción
    cambiarEstadoExpositor: async function(idExpositor, nuevoEstado) {
        const estadosPermitidos = ['pendiente', 'aprobado', 'rechazado'];

        if (!estadosPermitidos.includes(nuevoEstado)) {
            throw new Error('El estado indicado no es válido.');
        }

        const { data, error } = await cliente_supabase
            .from('expositores')
            .update({ estado: nuevoEstado })
            .eq('id', idExpositor)
            .select();

        if (error) {
            throw new Error(
                'Error al actualizar el estado: ' + error.message
            );
        }

        if (!data || data.length === 0) {
            throw new Error('No se encontró el expositor.');
        }

        return data[0];
    },

    // Consultar expositores, opcionalmente filtrados por estado
    obtenerExpositoresPorEstado: async function(estado) {
        let consulta = cliente_supabase
            .from('expositores')
            .select('*');

        if (estado) {
            consulta = consulta.eq('estado', estado);
        }

        const { data, error } = await consulta;

        if (error) {
            throw new Error(
                'Error al consultar expositores: ' + error.message
            );
        }

        return data;
    },

    // Agregar un emprendimiento desde la administración
    agregarExpositor: async function(datos) {
        const nombre = datos.nombre?.trim();
        const correo = datos.correo?.trim();
        const nombreEmprendimiento =
            datos.nombre_emprendimiento?.trim();
        const categoria = datos.categoria?.trim();

        if (!nombre || !correo || !nombreEmprendimiento || !categoria) {
            throw new Error(
                'Completa el nombre, correo, emprendimiento y categoría.'
            );
        }

        const { data, error } = await cliente_supabase
            .from('expositores')
            .insert([{
                nombre,
                correo,
                nombre_emprendimiento: nombreEmprendimiento,
                categoria,
                estado: datos.estado || 'pendiente'
            }])
            .select();

        if (error) {
            throw new Error(
                'No se pudo agregar el expositor: ' + error.message
            );
        }

        return data[0];
    },

    // Actualizar los datos de un expositor
    actualizarExpositor: async function(id, datos) {
        const cambios = {};

        if (datos.nombre !== undefined) {
            cambios.nombre = datos.nombre.trim();
        }

        if (datos.correo !== undefined) {
            cambios.correo = datos.correo.trim();
        }

        if (datos.nombre_emprendimiento !== undefined) {
            cambios.nombre_emprendimiento =
                datos.nombre_emprendimiento.trim();
        }

        if (datos.categoria !== undefined) {
            cambios.categoria = datos.categoria.trim();
        }

        if (datos.estado !== undefined) {
            const estadosPermitidos = [
                'pendiente',
                'aprobado',
                'rechazado'
            ];

            if (!estadosPermitidos.includes(datos.estado)) {
                throw new Error('El estado indicado no es válido.');
            }

            cambios.estado = datos.estado;
        }

        if (Object.keys(cambios).length === 0) {
            throw new Error('No hay datos para actualizar.');
        }

        for (const campo of [
            'nombre',
            'correo',
            'nombre_emprendimiento',
            'categoria'
        ]) {
            if (
                cambios[campo] !== undefined &&
                !cambios[campo]
            ) {
                throw new Error(
                    'Los campos del expositor no pueden quedar vacíos.'
                );
            }
        }

        const { data, error } = await cliente_supabase
            .from('expositores')
            .update(cambios)
            .eq('id', id)
            .select();

        if (error) {
            throw new Error(
                'No se pudo actualizar el expositor: ' + error.message
            );
        }

        if (!data || data.length === 0) {
            throw new Error('No se encontró el expositor.');
        }

        return data[0];
    },

    // Eliminar el registro del expositor
    eliminarExpositor: async function(id) {
        const { data, error } = await cliente_supabase
            .from('expositores')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            throw new Error(
                'No se pudo eliminar el expositor: ' + error.message
            );
        }

        if (!data || data.length === 0) {
            throw new Error('No se encontró el expositor.');
        }

        return data[0];
    }
};

module.exports = {
    expositorServicio
};
