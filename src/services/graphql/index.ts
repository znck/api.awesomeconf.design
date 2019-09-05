import { ApolloServer } from 'apollo-server-koa'
import Airtable from 'airtable'
import createResolvers from './schema'
// @ts-ignore
import typeDefs from './schema.graphql'

const instance = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
})

const resolvers = createResolvers(instance)

// @ts-ignore
export default new ApolloServer({ typeDefs, resolvers })
