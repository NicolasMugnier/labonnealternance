import mongoose, { STATES } from "mongoose"
import { afterAll, beforeAll, beforeEach } from "vitest"

import { connectToMongo } from "@/common/mongodb"
import config from "@/config"

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.VITEST_POOL_ID}-${process.env.VITEST_WORKER_ID}`

  await connectToMongo(config.mongodb.uri.replace("VITEST_POOL_ID", workerId))
}

export const stopMongodb = async () => {
  if (mongoose.connection.readyState === STATES.connected) {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
}

export const useMongo = () => {
  beforeAll(async () => {
    await startAndConnectMongodb()
  })

  afterAll(async () => {
    await stopMongodb()
  })

  beforeEach(async () => {
    const collections = mongoose.connection.collections

    await Promise.all(
      Object.values(collections).map(async (collection) => {
        // @ts-expect-error
        await collection.deleteMany({})
      })
    )
  })
}
