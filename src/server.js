import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import recipesRoutes from './routes/recipesRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { FRONTEND_URL, SERVER_URL } from './config/config.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors({
    origin: [FRONTEND_URL, SERVER_URL], // Reemplaza con el dominio de tu frontend y la URL del servidor
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
    credentials: true // Si necesitas enviar cookies o encabezados personalizados
}));
app.use(bodyParser.json());

app.use('/profile', profileRoutes);

app.use('/recipes', recipesRoutes);

app.get('/', (req, res) =>{
    res.send("Welcome to the API")
})

app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${process.env.PORT}`);
});