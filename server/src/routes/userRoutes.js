import { Router } from 'express';
import { body } from 'express-validator';
import { authorize, protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUser, listUsers, profile, updateProfile, updateUser } from '../controllers/userController.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.get('/profile/me', protect, profile);
router.patch('/profile/me', protect, [body('name').optional().isLength({ min: 2 })], validate, updateProfile);

router.use(protect, authorize(ROLES.ADMIN));
router.get('/', listUsers);
router.post(
  '/',
  [
    body('name').isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['Admin', 'Engineer', 'Viewer'])
  ],
  validate,
  createUser
);
router.patch('/:id', updateUser);

export default router;
