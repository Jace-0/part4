const _ = require('lodash')
const dummy = (blogs) => {
    return 1
  }
  
const totalLikes = (blogs) => {
    return blogs.reduce((total, blog)=> total + blog.likes, 0)
}

const favouriteBlog = (blogs) =>{
    const favorite = blogs.reduce((prev, current) => (prev.likes > current.likes) ? prev : current)
    return {
        title: favorite.title,
        author: favorite.author,
        likes: favorite.likes
    }
}

const mostBlogs = (blogs) => { 
    const authorWithMostBlogs = _.maxBy(_.toPairs(_.countBy(blogs, 'author')), _.last)
    return {
        author: authorWithMostBlogs[0],
        blogs: authorWithMostBlogs[1]
    }
}

const mostLikes = (blogs) => {
    if (blogs.length === 0) return null

    const authorLikes = _.groupBy(blogs, 'author')
    const summedLikes = _.mapValues(authorLikes, authorBlogs => _.sumBy(authorBlogs, 'likes'))
    const topAuthor = _.maxBy(_.toPairs(summedLikes), _.last)
    
    return {
        author: topAuthor[0],
        likes: topAuthor[1]
    }
}

module.exports = {
    dummy,
    totalLikes,
    favouriteBlog,
    mostBlogs,
    mostLikes
  }