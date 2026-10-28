const { cliente_supabase } = require('../config/supabase');

const perfilRepositorio = {
    // Guarda el perfil asociado al id_usuario generado por Supabase Auth
    guardarPerfil: async function(datosPerfil) {
        const { data, error } = await cliente_supabase
            .from('perfiles')
            .insert([datosPerfil]);

        if (error) {
            throw new Error('No se pudo guardar el perfil del usuario');
        }
        return data;
    },

    // Obtiene el rol del usuario a partir de su ID
    obtenerPerfilPorId: async function(id_usuario) {
        const { data, error } = await cliente_supabase
            .from('perfiles')
            .select('rol')
            .eq('id_usuario', id_usuario)
            .single();

        if (error) {
            throw new Error('No se encontró el perfil del usuario');
        }
        return data;
    }
};

module.exports = perfilRepositorio;