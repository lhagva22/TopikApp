import { Router } from 'express';

import { protect } from '../middleware/authMiddleware';
import {
  addBookmark,
  getBookmarks,
  getDictionarySyncMeta,
  getDictionaryWord,
  removeBookmark,
  searchDictionary,
  syncDictionary,
} from '../controllers/dictionaryController';

const router = Router();

router.get('/dictionary/search', searchDictionary);
router.get('/dictionary/sync/meta', getDictionarySyncMeta);
router.get('/dictionary/sync', syncDictionary);
router.get('/dictionary/bookmarks', protect, getBookmarks);
router.post('/dictionary/bookmarks', protect, addBookmark);
router.delete('/dictionary/bookmarks/:wordId', protect, removeBookmark);
router.get('/dictionary/:id', getDictionaryWord);

export default router;
