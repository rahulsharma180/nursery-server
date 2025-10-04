import { Router } from 'express';
import {
  registerUserController,
  verifyEmailController,
} from '../controllers/user.Controller.js';

const userRouter = Router();
userRouter.post('/register', registerUserController);
userRouter.post('/verifyEmail', verifyEmailController);

export default userRouter;
