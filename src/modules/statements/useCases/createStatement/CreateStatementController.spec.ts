import { sign } from "jsonwebtoken";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { app } from "../../../../app";
import createConnection from "../../../../database";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

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

    it('should be possible to create a statement', async () => {
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

        const statement = {
            amount: 100,
            description: "Statement description"
        }

        const statementType = "deposit"


        const { status, body } = await request(app).post(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(201)
        expect(body).toMatchObject({
            user_id: user.id,
            description: statement.description,
            amount: statement.amount,
            type: statementType
        })

    });

    it('should not be possible to withdraw a higher amount than user balance', async () => {
        const { body: { token } } = await request(app).post("/api/v1/sessions").send({
            email: "test@test.com",
            password:  "1234"
        })

        const response = await request(app).get("/api/v1/statements/balance").set({
            Authorization: `Bearer ${token}`
        })

        const { balance } = response.body

        const statement = {
            amount: Number(balance) + 100,
            description: "Statement description"
        }

        const statementType = "withdraw"

        const { status, body } = await request(app).post(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(400)
        expect(body.message).toBe("Insufficient funds")

    });

    it('should not create statement if user not exists', async () => {
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

        const statement = {
            amount: 100,
            description: "Statement description"
        }

        const statementType = "withdraw"
        
        const { status, body } = await request(app).get(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(404)
        expect(body.message).toBe("User not found")
    });

    it('should not create statement if token is invalid', async () => {
        const fakeToken = "token"

        const statementType = "withdraw"

        const statement = {
            amount: 100,
            description: "Statement description"
        }

        const { status, body } = await request(app).get(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${fakeToken}`
        })

        expect(status).toBe(401)
        expect(body.message).toBe("JWT invalid token!")
    });

    it('should not create statement if token missing', async () => {
        const statementType = "withdraw"

        const statement = {
            amount: 100,
            description: "Statement description"
        }

        const { status, body } = await request(app).get(`/api/v1/statements/${statementType}`).send(statement)

        expect(status).toBe(401)
        expect(body.message).toBe("JWT token is missing!")
    });
});