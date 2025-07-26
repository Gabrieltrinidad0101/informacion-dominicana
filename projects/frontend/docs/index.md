---
sidebar_position: 1
---

# Informática Dominicana - Beta

Es un sitio web no oficial de la Republica Dominicana que tiene como objetivo mostrar los datos del país de manera más accesible y organizada.

## Aviso

Actualmente este sitio web está en desarrollo y se encuentra en la fase de pruebas. Por lo tanto, no se recomienda utilizar este sitio para obtener información de manera permanente.

## Breve Historia

1. Este proyecto nació del interés de un joven de 18 años por acceder a información clave del país, como nóminas de empleados, salarios, PIB, salud, educación, entre otros datos relevantes. Sin embargo, al encontrarse con miles de archivos en formato PDF, resultaba prácticamente imposible analizarlos de forma efectiva. Por ello, decidió desarrollar una aplicación web que permitiera visualizar y organizar estos datos de manera más accesible y comprensible.

# ¿Cómo se obtienen los datos?

1. Se descargan los archivos PDF desde las páginas oficiales.
2. Se extraen las imágenes contenidas en cada PDF.
3. Se realiza reconocimiento de texto (OCR) en cada imagen utilizando las APIs de Azure o OCR.Space.
4. Los textos extraídos se agrupan y se guardan en un archivo JSON.
5. Se procesan los textos con una API basada en un modelo de lenguaje (LLM) para obtener información relevante.
6. Los datos procesados se almacenan en un nuevo archivo JSON.
7. Se analizan los datos generados por el LLM.
8. Se generan las migraciones de datos correspondientes.

En la aplicación web, los datos se visualizan directamente consumiendo los archivos JSON y la API.
