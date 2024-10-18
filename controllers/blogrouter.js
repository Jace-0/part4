const blogRouter = require('express').Router()
const Blog = require('../models/blog')

blogRouter.get('/',  async (request, response) => {
  const blogs = await Blog.find({})
  response.status(200).json(blogs)

})

blogRouter.post('/', (request, response, next) => {
    const blog = new Blog(request.body)
  
    blog
      .save()
      .then(result => {
        response.status(201).json(result)
      })
      .catch(error => next(error))
  })

blogRouter.delete('/:id', async (request, response) => {
  const deletedBlog = await Blog.findByIdAndDelete(request.params.id)
  if (!deletedBlog) {
    return response.status(404).json({error: 'Blog not found'})
  }
  response.status(204).end()
})


blogRouter.put('/:id', async (request, response) => {
  const {title, author, url, likes } = request.body

  const blog = {
    title,
    author,
    url,
    likes
  }


  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {new: true, runValidators: true})
  console.log(updatedBlog)

  if (!updatedBlog){
    // const error = new Error('Blog not found')
    // error.name = 'NotFoundError'
    // error.message = 'Blog not found'
    // error.statusCode = 404
    // return error
    return response.status(404).json({error: 'Blog not found'})
  }
  response.json(updatedBlog)

})
module.exports = blogRouter