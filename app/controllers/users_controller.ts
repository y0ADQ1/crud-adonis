import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { schema, rules } from '@adonisjs/validator'
import User from '#models/user'

@inject()
export default class UsersController {
  /**
   * Handle user registration
   */
  async store({ request, response }: HttpContext) {
    // Validation schema for registration
    const registerSchema = schema.create({
      fullName: schema.string.optional(),
      email: schema.string({}, [
        rules.email(),
        rules.unique({ table: 'users', column: 'email' }),
      ]),
      password: schema.string({}, [rules.minLength(8)]),
    })

    try {
      // Validate request data
      const payload = await request.validate({ schema: registerSchema })

      // Create new user
      const user = new User()
      await user.fill({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
      }).save()

      // Generate JWT token
      const token = await User.accessTokens.create(user)

      return response.created({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
        token: token.tokenValue, // Corrected property for the token string
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        // Return validation errors
        return response.status(422).send({ errors: error.messages })
      }
      // Log other errors for debugging if necessary (e.g., console.error(error))
      // For the client, return a generic error message
      return response.badRequest({ error: 'Could not process registration request. Please try again.' })
    }
  }

  /**
   * Handle user login
   */
  async login({ request, response, auth }: HttpContext) {
    // Validation schema for login
    const loginSchema = schema.create({
      email: schema.string({}, [rules.email()]),
      password: schema.string({}, [rules.minLength(8)]),
    })

    try {
      // Validate request data
      const { email, password } = await request.validate({ schema: loginSchema })

      // Attempt to authenticate user
      const user = await User.verifyCredentials(email, password)

      // Generate JWT token
      const token = await User.accessTokens.create(user)

      return response.ok({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
        token: token.tokenValue, // Corrected property for the token string
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.status(422).send({ errors: error.messages })
      } else if (error.code === 'E_INVALID_CREDENTIALS') {
         // User.verifyCredentials throws E_INVALID_CREDENTIALS
         return response.unauthorized({ error: 'Invalid credentials' })
      }
      // Log other errors for debugging
      // console.error(error)
      return response.badRequest({ error: 'Could not process login request.' })
    }
  }

  /**
   * Get authenticated user's details
   */
  async me({ auth, response }: HttpContext) {
    try {
      // The "auth" middleware (defined in start/kernel.ts and applied to the route)
      // should have already authenticated the user.
      // auth.user will be populated.
      const user = auth.getUserOrFail() // Gets the authenticated user or throws

      return response.ok({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      })
    } catch (error) {
      // This catch block handles cases where auth.getUserOrFail() fails,
      // or if somehow the route was accessed without proper auth middleware execution.
      return response.unauthorized({ error: 'User not authenticated or token invalid.' })
    }
  }
}