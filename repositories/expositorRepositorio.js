const { cliente_supabase } = require('../config/supabase');

const expositorRepositorio = {
    guardar: async function (datos) {
        const { data, error } = await cliente_supabase
            .from('expositores')
            .insert([datos]);

        if (error) {
            throw new Error('No se pudo guardar en la base de datos');
        }
        return data;
    },

        obtenerTodos: async function() {
        const { data, error } = await cliente_supabase
            .from('expositores')
            .select('*');

        if (error) {
            throw new Error('Error al obtener los expositores');
        }

        return data;
    },

    obtenerPorId: async function(idExpositor) {
        const { data, error } = await cliente_supabase
            .from('expositores')
            .select('id, estado')
            .eq('id', idExpositor)
            .single();

        if (error) {
            throw new Error('No se pudo consultar el estado del expositor.');
        }

        return data;
    }
};

module.exports = expositorRepositorio;