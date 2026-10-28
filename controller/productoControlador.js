
const productoRepositorio = require('../repositories/productoRepositorio');
const expositorRepositorio = require('../repositories/expositorRepositorio');
const { cliente_supabase } = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

async function obtenerExpositorPropio(idExpositor, usuario) {
    if (!usuario || !usuario.email) return null;

    const { data, error } = await cliente_supabase
        .from('expositores')
        .select('id, correo, estado')
        .eq('id', idExpositor)
        .maybeSingle();

    if (error) throw error;

    if (!data || data.correo?.toLowerCase() !== usuario.email.toLowerCase()) {
        return null;
    }

    return data;
}

function imagenValida(archivo) {
    const firma = archivo.buffer;

    if (archivo.mimetype === 'image/jpeg') {
        return firma[0] === 0xff && firma[1] === 0xd8 && firma[2] === 0xff;
    }

    if (archivo.mimetype === 'image/png') {
        return firma.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }

    return archivo.mimetype === 'image/webp' &&
        firma.toString('ascii', 0, 4) === 'RIFF' &&
        firma.toString('ascii', 8, 12) === 'WEBP';
}

function urlImagenDelUsuario(url, usuarioId) {
    try {
        const imagen = new URL(url);
        const proyecto = new URL(process.env.URL_SUPABASE);
        const ruta = `/storage/v1/object/public/productos-feria/${usuarioId}/`;

        return imagen.origin === proyecto.origin &&
            imagen.pathname.startsWith(ruta);
    } catch {
        return false;
    }
}

const productoControlador = {

    // Registrar un producto
    registrar: async function(solicitud, respuesta) {
        try {
            const {
                id_expositor,
                nombre,
                precio,
                icono,
                descripcion,
                imagen_url
            } = solicitud.body;

            if (!id_expositor || !nombre || !nombre.trim()) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'El expositor y el nombre del producto son obligatorios.'
                });
            }

            const datos = {
                id_expositor: Number(id_expositor),
                nombre: nombre.trim(),
                precio: precio === '' || precio == null
                    ? null
                    : Number(precio),
                icono: icono || null,
                descripcion: descripcion || null,
                imagen_url: imagen_url || null
            };

            if (
                !Number.isInteger(datos.id_expositor) ||
                datos.id_expositor <= 0
            ) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'El identificador del expositor no es válido.'
                });
            }

            const propietario = await obtenerExpositorPropio(
                datos.id_expositor,
                solicitud.user
            );

            if (!propietario) {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'No tienes permiso para gestionar este emprendimiento.'
                });
            }

            if (
                datos.imagen_url &&
                !urlImagenDelUsuario(datos.imagen_url, solicitud.user.id)
            ) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'La imagen debe haberse subido desde tu cuenta.'
                });
            }

            if (
                datos.precio !== null &&
                (!Number.isFinite(datos.precio) || datos.precio < 0)
            ) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'El precio debe ser un número válido y no negativo.'
                });
            }

            const expositor = await expositorRepositorio.obtenerPorId(
                datos.id_expositor
            );

            if (expositor.estado !== 'aprobado') {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'Tu emprendimiento debe estar aprobado para registrar productos.'
                });
            }

            const resultado = await productoRepositorio.guardar(datos);

            return respuesta.status(201).json({
                estado: 'exitoso',
                mensaje: 'Producto registrado correctamente.',
                datos: resultado
            });

        } catch (error) {
            console.error('Error al registrar producto:', error);

            return respuesta.status(500).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    // Obtener productos de un expositor
    listar: async function(solicitud, respuesta) {
        try {
            const idExpositor = Number(solicitud.params.idExpositor);

            if (
                !Number.isInteger(idExpositor) ||
                idExpositor <= 0
            ) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'El identificador del expositor no es válido.'
                });
            }

            const resultado =
                await productoRepositorio.obtenerPorExpositor(idExpositor);

            return respuesta.status(200).json({
                estado: 'exitoso',
                datos: resultado
            });

        } catch (error) {
            console.error('Error al listar productos:', error);

            return respuesta.status(500).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    // Editar un producto
    actualizar: async function(solicitud, respuesta) {
        try {
            const idProducto = Number(solicitud.params.id);

            const {
                id_expositor,
                nombre,
                precio,
                icono,
                descripcion,
                imagen_url
            } = solicitud.body;

            if (
                !Number.isInteger(idProducto) ||
                idProducto <= 0 ||
                !Number.isInteger(Number(id_expositor)) ||
                Number(id_expositor) <= 0
            ) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'Los identificadores no son válidos.'
                });
            }

            const expositor = await expositorRepositorio.obtenerPorId(
                Number(id_expositor)
            );

            const propietario = await obtenerExpositorPropio(
                Number(id_expositor),
                solicitud.user
            );

            if (!propietario) {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'No tienes permiso para gestionar este emprendimiento.'
                });
            }

            if (expositor.estado !== 'aprobado') {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'Tu emprendimiento debe estar aprobado para modificar productos.'
                });
            }

            const cambios = {};

            if (nombre !== undefined) {
                if (typeof nombre !== 'string' || !nombre.trim()) {
                    return respuesta.status(400).json({
                        estado: 'error',
                        mensaje: 'El nombre no puede estar vacío.'
                    });
                }

                cambios.nombre = nombre.trim();
            }

            if (precio !== undefined) {
                cambios.precio = precio === '' || precio === null
                    ? null
                    : Number(precio);

                if (
                    cambios.precio !== null &&
                    (
                        !Number.isFinite(cambios.precio) ||
                        cambios.precio < 0
                    )
                ) {
                    return respuesta.status(400).json({
                        estado: 'error',
                        mensaje: 'El precio no es válido.'
                    });
                }
            }

            if (icono !== undefined) {
                cambios.icono = icono || null;
            }

            if (descripcion !== undefined) {
                cambios.descripcion = descripcion || null;
            }

            if (imagen_url !== undefined) {
                if (
                    imagen_url &&
                    !urlImagenDelUsuario(imagen_url, solicitud.user.id)
                ) {
                    return respuesta.status(400).json({
                        estado: 'error',
                        mensaje: 'La imagen debe haberse subido desde tu cuenta.'
                    });
                }

                cambios.imagen_url = imagen_url || null;
            }

            if (Object.keys(cambios).length === 0) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'Debes proporcionar algún dato para actualizar.'
                });
            }

            const resultado = await productoRepositorio.actualizar(
                idProducto,
                Number(id_expositor),
                cambios
            );

            if (!resultado || resultado.length === 0) {
                return respuesta.status(404).json({
                    estado: 'error',
                    mensaje: 'No se encontró el producto para actualizar.'
                });
            }

            return respuesta.status(200).json({
                estado: 'exitoso',
                mensaje: 'Producto actualizado correctamente.',
                datos: resultado
            });

        } catch (error) {
            console.error('Error al actualizar producto:', error);

            return respuesta.status(500).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    // Eliminar un producto
    eliminar: async function(solicitud, respuesta) {
        try {
            const idProducto = Number(solicitud.params.id);
            const idExpositor = Number(solicitud.query.id_expositor);

            if (
                !Number.isInteger(idProducto) ||
                idProducto <= 0 ||
                !Number.isInteger(idExpositor) ||
                idExpositor <= 0
            ) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'Los identificadores no son válidos.'
                });
            }

            const propietario = await obtenerExpositorPropio(
                idExpositor,
                solicitud.user
            );

            if (!propietario) {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'No tienes permiso para gestionar este emprendimiento.'
                });
            }

            const resultado = await productoRepositorio.eliminar(
                idProducto,
                idExpositor
            );

            if (!resultado || resultado.length === 0) {
                return respuesta.status(404).json({
                    estado: 'error',
                    mensaje: 'No se encontró el producto para eliminar.'
                });
            }

            return respuesta.status(200).json({
                estado: 'exitoso',
                mensaje: 'Producto eliminado correctamente.'
            });

        } catch (error) {
            console.error('Error al eliminar producto:', error);

            return respuesta.status(500).json({
                estado: 'error',
                mensaje: error.message
            });
        }
    },

    // Subir imagen a Supabase Storage
    subirImagen: async function(solicitud, respuesta) {
        try {
            if (!solicitud.file) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'Debes seleccionar una imagen.'
                });
            }

            if (!imagenValida(solicitud.file)) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'El archivo no es una imagen JPG, PNG o WebP válida.'
                });
            }

            if (!solicitud.user || !solicitud.user.email) {
                return respuesta.status(401).json({
                    estado: 'error',
                    mensaje: 'Debes iniciar sesión para subir imágenes.'
                });
            }

            const idExpositor = Number(solicitud.body.id_expositor);
            const correo = solicitud.user.email;
            if (!Number.isInteger(idExpositor) || idExpositor <= 0) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'El identificador del expositor no es válido.'
                });
            }

            // Verificar que el usuario sea el propietario
            // y que su emprendimiento esté aprobado
            const { data: expositor, error: errorExpositor } =
                await cliente_supabase
                    .from('expositores')
                    .select('id, correo, estado')
                    .eq('id', idExpositor)
                    .maybeSingle();

            if (errorExpositor) {
                throw errorExpositor;
            }

            if (
                !expositor ||
                expositor.correo?.toLowerCase() !== correo.toLowerCase()
            ) {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'No tienes permiso para gestionar este emprendimiento.'
                });
            }

            if (expositor.estado !== 'aprobado') {
                return respuesta.status(403).json({
                    estado: 'error',
                    mensaje: 'Tu emprendimiento debe estar aprobado para subir imágenes.'
                });
            }

            const idProducto = solicitud.body.id_producto === undefined
                ? null
                : Number(solicitud.body.id_producto);

            if (idProducto !== null) {
                if (!Number.isInteger(idProducto) || idProducto <= 0) {
                    return respuesta.status(400).json({
                        estado: 'error',
                        mensaje: 'El identificador del producto no es válido.'
                    });
                }

                const producto = await productoRepositorio.obtenerPorId(
                    idProducto
                );

                if (!producto || Number(producto.id_expositor) !== idExpositor) {
                    return respuesta.status(403).json({
                        estado: 'error',
                        mensaje: 'No tienes permiso para reemplazar la imagen de este producto.'
                    });
                }
            }

            const encabezado = solicitud.headers.authorization;

            if (!encabezado || !encabezado.startsWith('Bearer ')) {
                return respuesta.status(401).json({
                    estado: 'error',
                    mensaje: 'No se encontró el token de sesión.'
                });
            }

            const token = encabezado.slice(7);

            // Utilizar la clave pública y el token del usuario
            const supabaseUsuario = createClient(
                process.env.URL_SUPABASE,
                process.env.CLAVE_SUPABASE,
                {
                    accessToken: async () => token
                }
            );

            const extension = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp'
            }[solicitud.file.mimetype];

            if (!extension) {
                return respuesta.status(400).json({
                    estado: 'error',
                    mensaje: 'Solo se permiten imágenes JPG, PNG o WEBP.'
                });
            }

            const nombreArchivo =
                `${solicitud.user.id}/${randomUUID()}.${extension}`;

            const { error: errorSubida } =
                await supabaseUsuario.storage
                    .from('productos-feria')
                    .upload(nombreArchivo, solicitud.file.buffer, {
                        contentType: solicitud.file.mimetype,
                        upsert: false
                    });

            if (errorSubida) {
                throw errorSubida;
            }

            const { data: urlImagen } =
                supabaseUsuario.storage
                    .from('productos-feria')
                    .getPublicUrl(nombreArchivo);

            return respuesta.status(201).json({
                estado: 'exitoso',
                mensaje: 'Imagen subida correctamente.',
                imagen_url: urlImagen.publicUrl
            });

        } catch (error) {
            console.error('Error al subir imagen:', error);

            return respuesta.status(500).json({
                estado: 'error',
                mensaje: error.message || 'No se pudo subir la imagen.'
            });
        }
    }

};

module.exports = productoControlador;
