const {test, after, beforeEach, describe} = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const jwt = require('jsonwebtoken')

const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

describe('BLOG API', async () => {
    let testUser
    let validToken

    beforeEach( async () => {
        await Blog.deleteMany({})
        await User.deleteMany({})

        testUser = {
            username: 'testuser',
            name: 'Test User',
            password: 'testpasswordHash'
        }
        // saved testuser to database
        const savedUser = await api.post('/api/users')
            .send(testUser)
            .expect(201)

        // login testUser
        loginTestUser = {
            username: testUser.username,
            password : testUser.password
        }

        const loginUser = await api.post('/api/login')
            .send(loginTestUser)
        
        // token for testUser
        validToken = loginUser.body.token
        
        // make a blog post
        const testBlog = {
            title: 'Test Blog',
            author: 'Test Author',
            url: 'http://testblog.com',
            likes: 0,
        }

        const savedTestBlog = await api.post('/api/blogs')
            .send(testBlog)
            .expect(201)
            // testUser token
            .set('Authorization',`Bearer ${validToken}`)

        // await Blog.insertMany(helper.initialBlog)
        // const blogObject = helper.initialBlog.map(blog => new Blog(blog))
        // const promiseArray = blogObject.map(blog => blog.save())
        // await Promise.all(promiseArray)
    })

    
    
    describe('GET /api/blogs', () => {
        
        test('blogs are returned as json', async () => {
            await api
                .get('/api/blogs')
                .expect(200)
                .expect('Content-Type', /application\/json/)
                .set('Authorization',`Bearer ${validToken}`)
        })

        test('Returned blogs match the initialBlog ', async () => {
            const response = await api
            .get('/api/blogs')
            .set("Authorization",`Bearer ${validToken}`)
            assert.strictEqual(response.body.length, (await helper.blogsInDb()).length)
        })

    })

    describe('POST /api/blogs', () => {

        test('a valid blog can be added ', async () => {
            const blogsAtStart = await helper.blogsInDb()
            
            const validTestBlog = {
                title : 'First class tests',
                author : 'Robert C. Martin',
                url : 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
                likes : 10
            }

            const savedValidTestBlog = await api.post('/api/blogs')
                .send(validTestBlog)
                .set('Authorization', `Bearer ${validToken}`)
                .expect(201)
                .expect('Content-Type', /application\/json/)
                
            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1)
            const contents = blogsAtEnd.map(blog => blog.title)
            assert(contents.includes('First class tests'))
        
        })


        test('Blog list have id instead of _id', async () => {
            const response = await api.get('/api/blogs')
                .set("Authorization",`Bearer ${validToken}`)

            const blog = response.body[0]
            assert(blog.id !== undefined, 'Blog should have an id property')
            assert(blog._id === undefined, 'Blog should not have an _id property')
        })
    
    
        test('if likes property is missing, it defaults to 0', async () =>{
            const newBlog = {
                title: 'Civil War',
                author: 'the unknown',
                url : 'https://www.theunknown.com/Civil%War/'
            }
    
            const response = await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(201)
                .expect('Content-Type', /application\/json/)
                .set("Authorization",`Bearer ${validToken}`)
        
            assert.strictEqual(response.body.likes, 0, 'Likes should default to 0')
            
        })


        test('returns 400 bad request if title or url properties is undefined', async () => {

            const blogsAtStart = await helper.blogsInDb()

            const newBlog = {
                title: 'Titanic',
                author: "Some Writers",
                likes: 70000
            }
        
            const response = await api
                .post('/api/blogs')
                .send(newBlog)
                .expect(400)
                .set("Authorization",`Bearer ${validToken}`)
        
            
            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtStart.length, blogsAtEnd.length)

        })

    })

    describe('UPDATE /api/blogs', () => {

        test('updates with status code 200 OK', async () => {
            const blogsAtStart = await api.get('/api/blogs')
                .set("Authorization",`Bearer ${validToken}`)
            const blogs = blogsAtStart.body
            const updatedBlogId = blogs[0].id
            const {title ,author, url} = blogs[0]
            const likes = 120000
        
            const blog = {
                title,
                author,
                url,
                likes
            }

            const updatedBlog = await api.put(`/api/blogs/${updatedBlogId}`)
                .send(blog)
                .expect(200)
                .set("Authorization",`Bearer ${validToken}`)

                
            const blogsAtEnd = await api.get('/api/blogs')
                .set("Authorization",`Bearer ${validToken}`)

            const contents = blogsAtEnd.body
            const findUpdatedblog = contents.find(blog => blog.id === updatedBlogId)
            assert.deepStrictEqual(findUpdatedblog.likes, likes)
        })
    })


    describe('Blog deletion', () => {

        test('deleting a blog with a valid token should succeed', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]

            await api
                .delete(`/api/blogs/${blogToDelete.id}`)
                .set('Authorization', `Bearer ${validToken}`)
                .expect(204)

            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
            const contents = blogsAtEnd.map(b => b.id)
            assert(!contents.includes(blogToDelete.id))
            // expect(blogsAtEnd.map(b => b.id)).not.toContain(blogToDelete.id)
        })


        test('deleting a blog with an invalid token should return 401 Unauthorized', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]
        
            await api
              .delete(`/api/blogs/${blogToDelete.id}`)
              .set('Authorization', 'Bearer invalidtoken')
              .expect(401)
        
            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)
        })
        
        test('deleting a blog with no token should return 401 Unauthorized', async () => {
            const blogsAtStart = await helper.blogsInDb()
            const blogToDelete = blogsAtStart[0]
        
            await api
              .delete(`/api/blogs/${blogToDelete.id}`)
              .expect(401)
        
            const blogsAtEnd = await helper.blogsInDb()
            assert.strictEqual(blogsAtEnd.length, blogsAtStart.length)
          })

        test('deleting a blog with a valid token but non-existent blog ID should return 404', async () => {
            const nonExistentId = await helper.nonExistingId()
            await api.delete(`/api/blogs/${nonExistentId}`)
                .set("Authorization",`Bearer ${validToken}`)
                .expect(404)
        })

        test('deleting a blog with a valid token but blog owned by another user should return 403', async () => {

            const blogsAtStart = await helper.blogsInDb()

            // another user
            const anotherUser = {
              username: 'anotheruser',
              name: 'Another User',
              password: 'anotherpasswordhash'
            }
            // save another user
            const savedAnotherUser = await api.post('/api/users')
                .send(anotherUser)
                .expect(201)


            // login AnotherUser
            const loginAnotherUser = {
                username: anotherUser.username,
                password : anotherUser.password
                }

            const anotherUserLoggedIn = await api.post('/api/login')
                .send(loginAnotherUser)
                .expect(200)
            // get another user token
            const anotherUserToken = anotherUserLoggedIn.body.token

            

            // make blog post for another user
            const blogOwnedByAnotherUser = {
              title: 'Another Test Blog',
              author: 'Another Test Author',
              url: 'http://anothertestblog.com',
              likes: 0
            }
            const savedBlogOwnedByAnotherUser = await api.post('/api/blogs')
                .send(blogOwnedByAnotherUser)
                .expect(201)
                .set('Authorization',`Bearer ${anotherUserToken}`)
            
            assert.strictEqual((await helper.blogsInDb()).length, blogsAtStart.length + 1)


            // delete blog owned by another User with a validTOken 
            await api
              .delete(`/api/blogs/${savedBlogOwnedByAnotherUser.body.id}`)
              .set('Authorization', `Bearer ${validToken}`)
              .expect(403)
        
            const blogsAtEnd = await helper.blogsInDb()
            const contents = blogsAtEnd.map(b => b.id)
            assert((contents.includes(savedBlogOwnedByAnotherUser.body.id)))
            assert.strictEqual(blogsAtEnd.length, blogsAtStart.length + 1)
          })
    })

})


after( async () => {
    await mongoose.connection.close()
})



// run only test npm test -- --test-only