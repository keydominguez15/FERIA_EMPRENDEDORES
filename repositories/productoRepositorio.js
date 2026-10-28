
const { cliente_supabase } = require('../config/supabase');

const productoRepositorio = {
    // Guardar un producto
    guardar: async function (datos) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .insert([datos])
            .select();

        if (error) {
            console.error('Error de Supabase:', error.message);
            throw new Error('No se pudo guardar el producto');
        }

        return data;
    },

    // Obtener los productos de un expositor
    obtenerPorExpositor: async function (idExpositor) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .select('*')
            .eq('id_expositor', idExpositor)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error de Supabase:', error.message);
            throw new Error('No se pudieron obtener los productos');
        }

        return data;
    },

    obtenerPorId: async function (idProducto) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .select('id, id_expositor, imagen_url')
            .eq('id', idProducto)
            .maybeSingle();

        if (error) {
            console.error('Error de Supabase:', error.message);
            throw new Error('No se pudo consultar el producto');
        }

        return data;
    },

    // Actualizar un producto
    actualizar: async function (idProducto, idExpositor, cambios) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .update(cambios)
            .eq('id', idProducto)
            .eq('id_expositor', idExpositor)
            .select();

        if (error) {
            console.error('Error de Supabase:', error.message);
            throw new Error('No se pudo actualizar el producto');
        }

        return data;
    },

    // Eliminar un producto
    eliminar: async function (idProducto, idExpositor) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .delete()
            .eq('id', idProducto)
            .eq('id_expositor', idExpositor)
            .select();

        if (error) {
            console.error('Error de Supabase:', error.message);
            throw new Error('No se pudo eliminar el producto');
        }

        return data;
    }
};

module.exports = productoRepositorio;
