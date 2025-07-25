import { Router } from "express";

import {registerUser, userLogin, forgotPassword, getAllUsers, logoutUser} from "../controllers/user.controller.js";
import { validateUserRegistration, validateUserLogin } from "../middlewares/validation.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";

const router = Router();
router.post("/register", validateUserRegistration, registerUser);
router.post("/login", validateUserLogin, userLogin);
router.post("/forgot-password", forgotPassword);
router.get("/get-all-users", isAdmin, getAllUsers);
router.post("/logout", isAuthenticated, logoutUser);

export default router;
