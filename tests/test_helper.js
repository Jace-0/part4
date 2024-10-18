const Blog = require('../models/blog')


initialBlog = [{

    title: "Men",
    author : "Alex Garland",
    url: "https://www.imdb.com/title/tt13841850/",
    likes : 70000
},
{
    title :"Suits",
    author: "Aaron Korsh",
    url :"https://www.imdb.com/title/tt1632701/?ref_=fn_al_tt_1",
    likes: 497000

}]

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}



module.exports = {
    initialBlog, 
    blogsInDb

}