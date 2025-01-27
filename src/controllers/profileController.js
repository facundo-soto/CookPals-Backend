import axios from "axios";
import FormData from "form-data";
import { db } from "../config/db.js";
import { IMGUR_CLIENT_ID } from "../config/config.js";

export const updateUsername = async (req, res) => {
    const { uid, newName } = req.body; // Extraemos uid y name del body de la petición

    if (!uid || !newName) {
        return res.status(400).json({ message: 'Faltan parámetros (uid o name).' });
    }

    try {
        // Actualizamos el documento del usuario en la colección "users"
        await db.collection('users').doc(uid).set({ name: newName }, { merge: true }); // { merge: true } para no sobreescribir campos existentes
        return res.status(200).json({ message: 'Nombre de usuario actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar el nombre:', error);
        return res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            console.error('No se recibió un archivo:', req.body);
            return res.status(400).json({ message: 'No se envió ninguna imagen.' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const formData = new FormData();
        formData.append("image", base64Image);

        const response = await axios.post(
            'https://api.imgur.com/3/image', formData,
            {
                headers: {
                    Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
                    ...formData.getHeaders()
                }
            });

        res.status(200).json({ link: response.data.data.link });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
};