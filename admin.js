require('dotenv').config()

// ADMIN BRO
const AdminBro = require('admin-bro')
const AdminBroExpress = require('@admin-bro/express')

// MONGOOSE
const mongoose = require('mongoose')
const AdminBroMongoose = require('@admin-bro/mongoose')

AdminBro.registerAdapter(AdminBroMongoose)

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    created_at: { type: Date, default: Date.now }
})
const User = mongoose.model('User', UserSchema)

const PostSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    created_at: { type: Date, default: Date.now }
})
const Post = mongoose.model('Post', PostSchema)

const AdminBroOptions = new AdminBro({
    resources: [
        {
            resource: User,
            options: {
                actions: {
                    show: {
                        icon: 'View',
                        isVisible: (context) => context.record.param('email') !== '',
                    }
                },
                properties: {
                    created_at: {
                        isVisible: { edit: false, list: true, show: true, filter: true }
                    }
                },
            }
        },
        {
            resource: Post,
            options: {
                properties: {
                    content: {
                        type: 'richtext'
                    },
                    created_at: {
                        isVisible: { edit: false, list: true, show: true, filter: true }
                    }
                }
            }
        }
    ],
    rootPath: '/admin',
})

const express = require('express')
const app = express()


// SERVER
const run = async () => {
    await mongoose.connect(`mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASS}@powerbomb-strapi.npvxs.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

    const router = AdminBroExpress.buildRouter(AdminBroOptions)

    app.use(AdminBroOptions.options.rootPath, router)
    app.listen(8080, () => console.log('AdminBro is under localhost:8080/admin'))
}

run()
