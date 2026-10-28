
const cliente_supabase = require('../config/supabase');

const productoServicio = {
    // Registrar un producto
    crearProducto: async function(producto) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .insert([producto])
            .select();

        if (error) {
            throw new Error('Error al registrar el producto: ' + error.message);
        }

        return data;
    },

    // Listar los productos de un expositor
    obtenerProductosPorExpositor: async function(idExpositor) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .select('*')
            .eq('id_expositor', idExpositor)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Error al consultar los productos: ' + error.message);
        }

        return data;
    },

    // Actualizar un producto
    actualizarProducto: async function(id, idExpositor, cambios) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .update(cambios)
            .eq('id', id)
            .eq('id_expositor', idExpositor)
            .select();

        if (error) {
            throw new Error('Error al actualizar el producto: ' + error.message);
        }

        return data;
    },

    // Eliminar un producto
    eliminarProducto: async function(id, idExpositor) {
        const { data, error } = await cliente_supabase
            .from('productos')
            .delete()
            .eq('id', id)
            .eq('id_expositor', idExpositor)
            .select();

        if (error) {
            throw new Error('Error al eliminar el producto: ' + error.message);
        }

        return data;
    }
};

module.exports = { productoServicio };
