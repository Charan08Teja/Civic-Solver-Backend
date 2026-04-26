const express = require('express');
const router = express.Router();

const {
  createIssue,
  getAllIssues,
  upvoteIssue,
  getAllIssuesAdmin,
  updateIssueStatus,
  deleteIssue,
  getAdminStats,
  addComment,
  getCommentsByIssue,
  deleteComment,
  getNotifications,
  markNotificationRead,
  getMyProfile
} = require('../controllers/issueController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../utils/multer');

// USER ROUTES
router.post('/', authMiddleware, upload.single('image'), createIssue);
router.get('/', getAllIssues);

// 🔥 Put these BEFORE any /:id routes
router.get('/notifications', authMiddleware, getNotifications);
router.put('/notifications/:id/read', authMiddleware, markNotificationRead);
router.get('/me', authMiddleware, getMyProfile);

router.post('/:id/upvote', authMiddleware, upvoteIssue);
router.post('/:id/comment', authMiddleware, addComment);
router.get('/:id/comments', getCommentsByIssue);

router.delete('/comments/:id', authMiddleware, deleteComment);

// ADMIN ROUTES (clean now)
router.get('/issues', authMiddleware, adminMiddleware, getAllIssuesAdmin);
router.put('/issues/:id/status', authMiddleware, adminMiddleware, updateIssueStatus);
router.delete('/issues/:id', authMiddleware, adminMiddleware, deleteIssue);
router.get('/stats', authMiddleware, adminMiddleware, getAdminStats);

module.exports = router;