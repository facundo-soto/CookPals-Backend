import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import recipesRoutes from './routes/recipesRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { PORT, FRONTEND_URL } from './config/config.js';

const app = express();

app.use(cors({
    origin: "*", // Reemplaza con el dominio de tu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
    credentials: true // Si necesitas enviar cookies o encabezados personalizados
}));
app.use(bodyParser.json());

app.use('/profile', profileRoutes);

app.use('/recipes', recipesRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});