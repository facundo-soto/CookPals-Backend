import axios from "axios";
import FormData from "form-data";
import { db } from "../config/db.js";
import { SERVER_URL } from "../config/config.js";
import { Stream } from "stream";


const formatRecipes = async (snapshotRecipes, userId) => {
    const formattedRecipes = [];
    const recipePromises = snapshotRecipes.docs.map(async (doc) => {
        const recipe = doc.data();

        const author = await db.collection('users').doc(recipe.author).get();
        const authorData = author.data();
        recipe.author = authorData.name;
        
        recipe.id = doc.id;

        if(userId){
            const user = await db.collection('users').doc(userId).get();
            const userData = user.data();
            recipe.isSaved = userData.savedRecipes?.includes(recipe.id);
        }
        else{
            recipe.isSaved = false;
        }

        formattedRecipes.push(recipe);
    });

    await Promise.all(recipePromises);
    formattedRecipes.sort((a, b) => a.id.localeCompare(b.id));
    return formattedRecipes;
}

export const getRecipes = async (req, res) => {
    const { uid } = req.query;
    try {
        const recipesSnapshot = await db.collection('recipes').get();
        const recipes = await formatRecipes(recipesSnapshot, uid);
        
        res.status(200).send(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting recipes', error: error.message });
    }
};

export const getBestRecipes = async (req, res) =>{
    const { uid } = req.query;
    try {
        const recipesSnapshot = await db.collection('recipes').orderBy('calification', 'desc').limit(3).get();
        const recipes = await formatRecipes(recipesSnapshot, uid);
        recipes.sort((a, b) => b.calification - a.calification);

        res.status(200).send(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting recipes', error: error.message });
    }
}

export const getUserRecipes = async (req, res) => {
    const { uid } = req.query; // Extraemos el uid del query de la petición

    if (!uid) {
        return res.status(400).send({ message: 'Falta el parámetro uid.' });
    }

    try {
        const recipesSnapshot = await db.collection('recipes').where('author', '==', uid).get();
        const recipes = await formatRecipes(recipesSnapshot, uid);

        res.status(200).send(recipes);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting user recipes', error: error.message });
    }
};

export const getRecipeById = async (req, res) => {
    const { id, userId } = req.query; // Extraemos el id de la receta del query de la petición

    try {
        const recipe = (await db.collection('recipes').doc(id).get()).data();
        recipe.calification = 0;
        await Promise.all(recipe.comments.map(async comment => {
            const user = await db.collection('users').doc(comment.userId).get();
            comment.userName = user.data().name;
            comment.userImage = user.data().image;
            comment.userId == userId ? recipe.hasCommented = true : "";
            recipe.calification += comment.stars;
        }));
        recipe.calification = recipe.comments.length ? recipe.calification / recipe.comments.length : 0;

        const author = await db.collection('users').doc(recipe.author).get();
        const authorData = author.data();
        recipe.isAuthor = recipe.author == userId;
        recipe.authorName = authorData.name;

        const user = await db.collection('users').doc(userId).get();
        const userData = user.data();
        recipe.isSaved = userData.savedRecipes?.includes(id) ?? false;
        console.log(recipe);
        res.status(200).send(recipe);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting recipe', error: error.message });
    }

};

export const getSavedRecipes = async (req, res) => {
    const { uid } = req.query;
    if (!uid) {
        return res.status(400).send({ message: 'Falta el parámetro uid.' });
    }
    try {
        const user = await db.collection('users').doc(uid).get();
        const savedRecipesIds = user.data().savedRecipes;
        if (savedRecipesIds?.length > 0) {
            
            const recipesPromises = savedRecipesIds.map(async (id) => {
                return await db.collection('recipes').doc(id).get();
            });
            
            const snapshotRecipes = await Promise.all(recipesPromises);
            
            const recipes = await formatRecipes({ docs: snapshotRecipes }, uid);

            res.status(200).send(recipes);
        }
        else{
            res.status(200).send([]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting saved recipes', error: error.message });
    }
};

export const saveRecipe = async (req, res) => {
    const { uid, recipeId } = req.body;

    if (!uid || !recipeId) {
        return res.status(400).json({ message: 'Faltan parámetros (uid o recipeId).' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userData = userDoc.data();
        userData.savedRecipes.push(recipeId);

        await userRef.update({ savedRecipes: userData.savedRecipes });

        res.status(200).json({ message: 'Receta guardada exitosamente.' });
    } catch (error) {
        console.error('Error al guardar la receta:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};

export const unsaveRecipe = async (req, res) => {
    const { uid, recipeId } = req.body;

    if (!uid || !recipeId) {
        return res.status(400).json({ message: 'Faltan parámetros (uid o recipeId).' });
    }

    try {
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const userData = userDoc.data();
        userData.savedRecipes = userData.savedRecipes.filter(id => id !== recipeId);

        await userRef.update({ savedRecipes: userData.savedRecipes });

        res.status(200).json({ message: 'Receta desguardada exitosamente.' });
    } catch (error) {
        console.error('Error al desguardar la receta:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
};



export const submitRecipe = async (req, res) => {
    const recipe = JSON.parse(req.body.recipe); // Extraemos los datos de la receta del body de la petición
    const uid = req.body.uid; // Extraemos el uid del usuario del body de la petición
    const image = req.file; // Extraemos la imagen de la receta del body de la petición
    try {
        if (!image) {
            throw new Error("No image file provided");
        }

        const imageData = new FormData();
        const bufferStream = new Stream.PassThrough();
        bufferStream.end(image.buffer);
        imageData.append('image', bufferStream, {
            filename: image.originalname,
            contentType: image.mimetype,
            knownLength: image.size
        });

        const imageResponse = await axios.post(`${SERVER_URL}/profile/upload-image`, imageData, {
            headers: {
                ...imageData.getHeaders()
            }
        });

        recipe.image = imageResponse.data.link;

        const recipeData = {
            ...recipe,
            author: uid,
            calification: 0,
            comments: [],
        };

        await db.collection('recipes').add(recipeData);

        // Your logic to handle the recipe submission
        res.status(200).send({ message: 'Recipe submitted successfully', recipe: recipeData });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error submitting recipe', error: error.message });
    }
};

export const submitComment = async (req, res) => {
    const comment = JSON.parse(req.body.comment);
    const recipeId = req.body.recipeId;

    if (!recipeId || !comment) {
        console.log(recipeId, comment);

        return res.status(400).json({ message: 'Faltan parámetros (recipeId o comment).' });
    }

    try {
        const recipeRef = db.collection('recipes').doc(recipeId);
        const recipeDoc = await recipeRef.get();

        if (!recipeDoc.exists) {
            return res.status(404).json({ message: 'Receta no encontrada.' });
        }

        const recipeData = recipeDoc.data();
        recipeData.comments.push(comment);
        recipeData.calification = 0;
        recipeData.comments.map((com) => {
            recipeData.calification += com.stars;
        });
        recipeData.calification = recipeData.comments.length > 0 ? recipeData.calification / recipeData.comments.length : 0;

        await recipeRef.update({ comments: recipeData.comments, calification: recipeData.calification });

        res.status(200).json({ message: 'Comentario agregado exitosamente.' });
    } catch (error) {
        console.error('Error al agregar el comentario:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }

};