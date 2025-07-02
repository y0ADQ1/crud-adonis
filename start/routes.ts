/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Import UsersController
const UsersController = () => import('#controllers/users_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Authentication routes
router.post('/register', [UsersController, 'store'])
router.post('/login', [UsersController, 'login'])

// Protected route example
router.get('/me', [UsersController, 'me']).use(middleware.auth())
