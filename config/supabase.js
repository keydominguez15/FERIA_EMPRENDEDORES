const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const url_base_datos = process.env.URL_SUPABASE;
const clave_acceso = process.env.CLAVE_SUPABASE;

if (!url_base_datos || !clave_acceso) {
    throw new Error('Faltan las credenciales de Supabase en el archivo .env');
}

const cliente = createClient(url_base_datos, clave_acceso);

module.exports = {
    cliente_supabase: cliente
};