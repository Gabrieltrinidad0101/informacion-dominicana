
![Logo](https://github.com/Gabrieltrinidad0101/informacion-dominicana/blob/main/frontend/static/img/logo.png)


# Información Dominicana

Este proyecto fue creado con el único propósito de mostrar información del país de manera rápida y sencilla a todos los dominicanos y dominicanas.  

## Appendix

El backend se utiliza únicamente para generar los archivos JSON, que luego son empleados por el frontend para crear las gráficas. Además, los títulos de cada gráfica son generados en el backend. Puedes encontrar todos los datos en https://drive.google.com/drive/folders/1pUYbezr2N0WbzFh56TFHaL3R9b-kFo7-?usp=sharing.

## Demo

Insert gif or link to demo


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DATAS`


## Correr local

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

## Backend

```bash
  cd backend
```

#### Make 

```bash
  make all // genera todos los datos
  make banco-mundial // solo obten los datos del banco mundial
  make town-halls // solo los ayuntamientos

```
Puedes ver mas información en backend/Makefile

#### Docker

En --build-args tienes que agregar de donde quieres la información all,banco-mundial,town-halls

Puedes ver todos los comandos en backend/package.json

```bash
    docker-compose up --build --build-args 
```

#### Manual

```bash
    npm install
    instala Graphics Magic en https://gist.github.com/sonnyit/f2dde32360b419ac65269bd5b463b5b4
    npm run all | banco-mundial | town-halls 
```
## Frontend

```bash
    cd frontend
```
#### Make 

```bash
    make local

```
Puedes ver mas información en frontend/Makefile

#### Docker

```bash
    docker-compose up -d --build 
```

#### Manual

```bash
    npm install
    npm run start
```

## Running Tests

To run tests, run the following command

```bash
  cd backend
  npm run test
```


## License

Este software se distribuye bajo la AGPLv3 con la siguiente condición adicional:
- Queda prohibido utilizar este código para crear software que imite la apariencia,
  nombre o funcionalidad de Información Dominicana con la intención de engañar a los usuarios.
- Los derivados deben mantener esta misma licencia sin modificaciones.
- Inducir a error a los usuarios haciéndoles creer que están utilizando el software original Información Dominicana o accediendo a su sitio web oficial.
- Cualquier versión modificada o derivada de este software debe incluir un aviso visible y razonable en su documentación, materiales promocionales, y/o interfaz de usuario, indicando claramente que dicho trabajo se basa en (o está inspirado por) Gabriel Trinidad Bertres el software original Información Dominicana. El aviso debe incluir el nombre del proyecto original y un enlace al sitio web oficial.

## 🚀 Acarca de mi
Soy simplemente un desarrollador de software que se interesó en conocer más sobre nuestro hermoso país. Al observar el lamentable estado de las páginas oficiales gubernamentales, decidí cambiar esa situación.


## Feedback

If you have any feedback, please reach out to us at https://github.com/Gabrieltrinidad0101/informacion-dominicana/issues


## Contributing

Contributions are always welcome!

