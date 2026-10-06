import { Router } from "express";
import { login, register, getUserHistory, addToHistory } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(authMiddleware, addToHistory);
router.route("/get_all_activity").get(authMiddleware, getUserHistory);

export default router;