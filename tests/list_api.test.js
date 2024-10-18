const {test, after, beforeEach, describe} = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('../tests/test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const { title } = require('node:process')
const { application } = require('express')
const { connect } = require('node:http2')



describe('when there is initially some blogs saved', async () => {
    beforeEach( async () => {
        await Blog.deleteMany({})
        await Blog.insertMany(helper.initialBlog)
        // const blogObject = helper.initialBlog.map(blog => new Blog(blog))
        // const promiseArray = blogObject.map(blog => blog.save())
        // await Promise.all(promiseArray)
    })

    test('blogs are returned as json', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
          })
          
    test('Returned blogs match the initialBlog ', async () => {
        const response = await api.get('/api/blogs')
        assert.strictEqual(response.body.length, helper.initialBlog.length)
    })
    
    
    test('blog posts have id instead of _id', async () => {
        const response = await api.get('/api/blogs')
        const blog = response.body[0]
    
        assert(blog.id !== undefined, 'Blog should have an id property')
        assert(blog._id === undefined, 'Blog should not have an _id property')
    })
    
    
    test('a valid blog can be added ', async () => {
        const newBlog = {
            title : 'July Love',
            author : 'James Friday',
            url : 'https://www.wired.com/july$Love/',
            likes : 23900
        }
    
        await api
            .post(`/api/blogs`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
    
        const blogsAtEnd = await helper.blogsInDb()
        assert.strictEqual(blogsAtEnd.length, helper.initialBlog.length + 1)
    
        const contents = blogsAtEnd.map(blog => blog.title)
        assert(contents.includes('July Love'))
    })

    test('if likes property is missing, it defaults to 0', async () => {
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
    
        assert.strictEqual(response.body.likes, 0, 'Likes should default to 0')
    
         // Verify in the database
         const blogs = await helper.blogsInDb()
         const addedBlog = blogs.find(blog => blog.title === 'Civil War')
         assert(addedBlog, 'Added blog should be found in the database')
         assert.strictEqual(addedBlog.likes, 0, 'Likes should be 0 in the database')
    
    })
    
    test('returns 400 bad request if title or url properties is undefined', async () => {
        const newBlog = {
            title: 'Titanic',
            author: "Some Writers",
            likes: 70000
        }
    
        const response = await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)
    
    })
    
    test('a blog can be deleted', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const deletedBlogId = blogsAtStart[0].id
        const response = await api.delete(`/api/blogs/${deletedBlogId}`)
            .expect(204)
    
        const blogsAtEnd = await helper.blogsInDb()
        const contents = blogsAtEnd.map(blog => blog.title)
        assert(!contents.includes(deletedBlogId.title))
        assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
    
    })
    
    test('deleting a blog with an invalid id must return 404 status code', async () => {
        const invalidId = '507f1f77bcf86cd799439011'
        const deletedBlog = await api.delete(`/api/blogs/${invalidId}`)
            .expect(404)
    })
    
    
    test('updates with status code 200 OK', async () => {
        const blogsAtStart = await api.get('/api/blogs')
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
    
        const blogsAtEnd = await api.get('/api/blogs')
        const contents = blogsAtEnd.body
        const findUpdatedblog = contents.find(blog => blog.id === updatedBlogId)
        assert.deepStrictEqual(findUpdatedblog.likes, likes)
    })

})



after( async () => {
    await mongoose.connection.close()
})