const {test, after, beforeEach, describe} = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('when there us initially one user in db', async = () => {
    beforeEach(async () => {
        await User.deleteMany({})
        const passwordHash = await bcrypt.hash('secret', 10)
        const user = new User({
            username: 'root',
            passwordHash
        })
        await user.save()
    })
    
    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()
    
        const newUser = {
          username: 'mluukkai',
          name: 'Matti Luukkainen',
          password: 'salainen',
        }
    
        await api
          .post('/api/users')
          .send(newUser)
          .expect(201)
          .expect('Content-Type', /application\/json/)
    
        const usersAtEnd = await helper.usersInDb()
        console.log(usersAtEnd)
        assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    })

    test('creation fails with proper status code and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()
      
        const newUser = {
          username: 'root',
          name: 'Superuser',
          password: 'salainen',
        }
      
        const result = await api
          .post('/api/users')
          .send(newUser)
          .expect(400)
          .expect('Content-Type', /application\/json/)
      
        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('expected `username` to be unique'))
      
        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('creation of user fails with proper status code with invalid credentials', async () => {
        const usersAtStart = await helper.usersInDb()

        const user={
            username :'lo',
            name: 'test',
            password : 'no'
        }

        const result = await api
            .post('/api/users')
            .send(user)
            .expect(400)
            .expect('Content-Type', /application\/json/)

            const usersAtEnd = await helper.usersInDb()
            assert(result.body.error.includes('shorter than the minimum allowed length (3)'))
            assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
      
      })
      
      after(async () => {
          await mongoose.connection.close()
      })

