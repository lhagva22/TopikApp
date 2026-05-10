import { Router } from 'express';

import { protect } from '../middleware/authMiddleware';
import {
  addBookmark,
  getBookmarks,
  getDictionaryWord,
  removeBookmark,
  searchDictionary,
} from '../controllers/dictionaryController';

const router = Router();

router.get('/dictionary/search', searchDictionary);
router.get('/dictionary/:id', getDictionaryWord);
router.get('/dictionary/bookmarks', protect, getBookmarks);
router.post('/dictionary/bookmarks', protect, addBookmark);
router.delete('/dictionary/bookmarks/:wordId', protect, removeBookmark);

export default router;
