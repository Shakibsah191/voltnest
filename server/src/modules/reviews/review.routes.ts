import { Router } from 'express';
import { requireAuth } from '../../shared/middleware/auth';
import { reviewController } from './review.controller';

export const reviewRoutes = Router();

reviewRoutes.get('/products/:slug/reviews', reviewController.listForProduct);
reviewRoutes.post('/reviews', requireAuth, reviewController.create);
