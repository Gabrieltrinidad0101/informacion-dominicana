BUCKET=informaciondominicana
DIRECTORIO=/home/gabriel-trinidad/Desktop/javascript/informacion-dominicana/data

find "$DIRECTORIO" -type f | while read archivo; do
    # Obtener ruta relativa
    RUTA_RELATIVA="${archivo#$DIRECTORIO/}"

    # Separar directorios y nombre de archivo
    DIRECTORIOS=$(dirname "$RUTA_RELATIVA")
    NOMBRE_ARCHIVO=$(basename "$RUTA_RELATIVA")

    # Sanitizar solo el nombre del archivo
    NOMBRE_ARCHIVO_SANITIZED=$(echo "$NOMBRE_ARCHIVO" | iconv -f utf-8 -t ascii//TRANSLIT | sed 's/[^A-Za-z0-9._-]/_/g')

    # Reconstruir la ruta final manteniendo carpetas
    RUTA_FINAL="$DIRECTORIOS/$NOMBRE_ARCHIVO_SANITIZED"

    wrangler r2 object put --remote "$BUCKET/$RUTA_FINAL" --file="$archivo"
    sleep 1
done
