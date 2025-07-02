import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { schema, rules } from 'inspector/promises'
import User from '#models/user'
import { column } from '@adonisjs/lucid/orm'
import { flushCompileCache } from 'module'

@inject()
export default class UsersController {

    async store({ request, response }: HttpContext) {
        const registerSchema = schema.create({
            fullName: schema.string.optional(),
            email: schema.string({}, [
                rules.email(),
                rules.unique({ table: 'users', column: 'email'}),
            ]),
            password: schema.string({}, [rules.minLength(8)]),
        })

        try {
            const payload = await request.validate({ schema: registerSchema})

            const user = new User()
            await user.fill({
                fullName: payload.fullName,
                email: payload.email,
                password: payload.password
            }).save()

            const token = await User.accessTokens.create(user)

            return response.created({
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.emailm
                },
                token: token.tokenableId,
            })
        }
    }
 
}