require('dotenv').config()
const bcrypt = require('bcrypt');


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
    role: { type: String, enum: ['admin', 'restricted'], required: true },
    encryptedPassword: { type: String, required: true },
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
    dashboard: {
        // component: AdminBro.bundle('./components/social-media')
    },
    resources: [
        {
            resource: User,
            options: {
                properties: {
                    encryptedPassword: {
                        isVisible: false
                    },
                    password: {
                        isVisible: { list: false, edit: true, show: false, filter: false }
                    },
                    created_at: {
                        isVisible: { edit: false, list: true, show: true, filter: true }
                    }
                },
                actions: {
                    new: {
                        before: async (request) => {
                            if(request.payload.password) {
                                request.payload = {
                                    ...request.payload,
                                    encryptedPassword: await bcrypt.hash(request.payload.password, 10),
                                    password: undefined
                                }
                            }
                            return request
                        }
                    }
                }
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

    const router = AdminBroExpress.buildAuthenticatedRouter(AdminBroOptions, {
        authenticate: async (email, password) => {
            const user = await User.findOne({ email })
            if(user) {
                const matched = await bcrypt.compare(password, user.encryptedPassword)
                if(matched) {
                    return user
                }
            }
            return false
        },
        cookiePassword: 'some-secure-password-used-to-secure-cookie'
    })

    app.use(AdminBroOptions.options.rootPath, router)
    app.listen(8080, () => console.log('AdminBro is under localhost:8080/admin'))
}

run()
