const bcrpyt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')


usersRouter.post('/', async (request, response, next) => {
    const {username, name, password} = request.body
    if (password.length < 3) {
        const error = new Error('password is shorter than the minimum allowed length (3)')
        error.name = 'ValidationError'
        error.message = 'password is shorter than the minimum allowed length (3)'
        return next(error)
    }
    const saltRounds = 10
    const passwordHash = await bcrpyt.hash(password, saltRounds)

    const user = new User({
        username,
        name,
        passwordHash
    })
    const savedUser = await user.save()
    response.status(201).json(savedUser)

})

usersRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs')
    response.json(users)
})

module.exports = usersRouter