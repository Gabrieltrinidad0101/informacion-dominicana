
![Logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/th5xamgrr6se0x5ro4g6.png)


# Información Dominicana

Este proyecto fue creado con el unico proposito de mostrar información del país de una forma rapida y simple a todas las dominicanas y dominicanos.  




## Appendix

El backend unicamente es utilizado para generar los archivos json que luego el frontend lo utilizar para generar las graficas tambien los titulos de cada graficas son generados en el backend puedes todos los datos en https://drive.google.com/drive/folders/1pUYbezr2N0WbzFh56TFHaL3R9b-kFo7-?usp=sharing

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

[MIT](https://choosealicense.com/licenses/mit/)


## 🚀 Acarca de mi
Solo soy un simple desarrollador de software que se intereso por saber mas de nuestro hermoso pais y al ver el tal mal estado de las paginas oficiales gurnamentales decidio cambiar eso.


## Feedback

If you have any feedback, please reach out to us at https://github.com/Gabrieltrinidad0101/informacion-dominicana/issues


## Contributing

Contributions are always welcome!

