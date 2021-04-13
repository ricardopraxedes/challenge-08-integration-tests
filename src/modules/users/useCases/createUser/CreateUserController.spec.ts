import request from "supertest"
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database"

describe('Create user controller', () => {
    let connection: Connection

    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    });

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be possible to create a new user', async () => {
        const response = await request(app).post("/api/v1/users").send({
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        })

        expect(response.status).toBe(201)
    });

    it('should not be possible to create two users with the same email', async () => {
        const { status, body } = await request(app).post("/api/v1/users").send({
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        })

        expect(status).toBe(400)
        expect(body.message).toBe('User already exists')
    });
});