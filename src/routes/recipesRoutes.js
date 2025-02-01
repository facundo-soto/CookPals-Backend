import express from 'express';
const router = express.Router();
import { upload } from '../config/multer.js';
import { getRecipes, getBestRecipes, getRecipeById, getUserRecipes, getSavedRecipes, saveRecipe, unsaveRecipe, submitRecipe, submitComment } from '../controllers/recipesController.js';

router.get('/get-recipes', getRecipes);
router.get('/get-best-recipes', getBestRecipes)
router.get('/get-recipe-by-id', getRecipeById);
router.get('/get-user-recipes', getUserRecipes);
router.get('/get-saved-recipes', getSavedRecipes);
router.post('/save-recipe', saveRecipe);
router.post('/unsave-recipe', unsaveRecipe);
router.post('/submit-recipe', upload.single('image'), submitRecipe);
router.post('/submit-comment', upload.none(), submitComment);

export default router;