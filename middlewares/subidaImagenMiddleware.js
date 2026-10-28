
const multer = require('multer');

const subidaImagen = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // Máximo 5 MB
    },
    fileFilter: function (solicitud, archivo, siguiente) {
        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tiposPermitidos.includes(archivo.mimetype)) {
            return siguiente(
                new Error('Solo se permiten imágenes JPG, PNG o WEBP.')
            );
        }

        siguiente(null, true);
    }
});

module.exports = subidaImagen;
