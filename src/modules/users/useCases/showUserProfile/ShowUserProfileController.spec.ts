import request from "supertest"
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { v4 as uuidV4 } from 'uuid';
import { sign } from "jsonwebtoken";


describe('Show user profile controller', () => {
    let connection: Connection

    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    });

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should return user info for authenticated user', async () => {
        const createUserDTO: ICreateUserDTO = {
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        }

        await request(app).post("/api/v1/users").send(createUserDTO)

        const { body: { user, token } } = await request(app).post("/api/v1/sessions").send({
            email: createUserDTO.email,
            password: createUserDTO.password
        })

        const { status, body } = await request(app).get("/api/v1/profile").set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(200)
        expect(body).toMatchObject(user)
    });

    it('should not return user info if token missing', async () => {

        const { status, body } = await request(app).get("/api/v1/profile")

        expect(status).toBe(401)
        expect(body.message).toBe("JWT token is missing!")
    });
    it('should not return user if token is invalid', async () => {
        const fakeToken = "fakeToken"

        const { status, body } = await request(app).get("/api/v1/profile").set({
            Authorization: `Bearer ${fakeToken}`
        })

        expect(status).toBe(401)
        expect(body.message).toBe("JWT invalid token!")
    });

    it('should not return user info if user not exists', async () => {
        const fakeUser = {
            id: uuidV4(),
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        }

        const token = sign({ fakeUser }, "secret", {
            subject: fakeUser.id,
            expiresIn: "1d",
        });

        const { status, body } = await request(app).get("/api/v1/profile").set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(404)
        expect(body.message).toBe("User not found")
    });
});