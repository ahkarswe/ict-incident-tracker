import { Router } from 'express';
import { body } from 'express-validator';
import { authorize, protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../utils/roles.js';
import {
  addComment,
  allIncidentsReport,
  createIncident,
  deleteIncident,
  exportCsv,
  getActivity,
  getIncident,
  incidentReport,
  listIncidents,
  updateIncident
} from '../controllers/incidentController.js';

const router = Router();

router.use(protect);
router.get('/', listIncidents);
router.get('/report', authorize(ROLES.ADMIN, ROLES.ENGINEER), allIncidentsReport);
router.get('/export/csv', authorize(ROLES.ADMIN, ROLES.ENGINEER), exportCsv);
router.get('/:id/report', authorize(ROLES.ADMIN, ROLES.ENGINEER), incidentReport);
router.get('/:id/activity', getActivity);
router.get('/:id', getIncident);
router.post(
  '/',
  upload.array('attachments', 5),
  [
    body('title').isLength({ min: 3 }),
    body('description').isLength({ min: 3 }),
    body('category').isIn(['Network', 'Server', 'Cloud', 'Security', 'Database', 'Backup', 'Application', 'Power', 'ISP']),
    body('priority').isIn(['Critical', 'High', 'Medium', 'Low']),
    body('slaDueTime').optional({ checkFalsy: true }).isISO8601()
  ],
  validate,
  authorize(ROLES.ADMIN, ROLES.ENGINEER),
  createIncident
);
router.patch('/:id', upload.array('attachments', 5), authorize(ROLES.ADMIN, ROLES.ENGINEER), updateIncident);
router.delete('/:id', authorize(ROLES.ADMIN), deleteIncident);
router.post('/:id/comments', [body('body').isLength({ min: 2 })], validate, addComment);

export default router;
