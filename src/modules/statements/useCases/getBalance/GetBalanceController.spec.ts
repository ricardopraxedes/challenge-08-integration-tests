import request from "supertest"
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { v4 as uuidV4 } from 'uuid';
import { sign } from "jsonwebtoken";

describe('Create statement controller', () => {
    let connection: Connection

    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    });

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should get user balance', async() => {
        const createUserDTO: ICreateUserDTO = {
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        }

        await request(app).post("/api/v1/users").send(createUserDTO)

        const { body: { token } } = await request(app).post("/api/v1/sessions").send({
            email: createUserDTO.email,
            password: createUserDTO.password
        })

        const statement = {
            amount: 100,
            description: "Statement description"
        }

        const statementType = "deposit"

        await request(app).post(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${token}`
        })

        const response = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${token}`
        })

        const { balance } = response.body

        expect(response.status).toBe(200)
        expect(balance).toBe(100)
    });

    it('should not get user balance if user not exists', async() => {

        const fakeUser = {
            id: uuidV4(),
            name: "Fake user name",
            email: "fakeuser@test.com",
            password: "1234"
        }

        const token = sign({ fakeUser }, "secret", {
            subject: fakeUser.id,
            expiresIn: "1d",
        });

        const {status, body} = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(404)
        expect(body.message).toBe("User not found")

    });

    it('should get  user balance if token is invalid', async () => {
        const fakeToken = "fakeToken"

        const { status, body } = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${fakeToken}`
        })

        expect(status).toBe(401)
        expect(body.message).toBe("JWT invalid token!")
    });

    it('should not get user balance if token missing', async () => {
        const { status, body } = await request(app).get("/api/v1/statements/balance")

        expect(status).toBe(401)
        expect(body.message).toBe("JWT token is missing!")
    });
});