import { sign } from "jsonwebtoken";
import request from "supertest"
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database"
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { v4 as uuidV4 } from 'uuid';

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

    it('should get a statement operation', async () => {

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

        const { body: expectedStatement } = await request(app).post(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${token}`
        })

        const { status, body: actualStatement } = await request(app).get(`/api/v1/statements/${expectedStatement.id}`).set({
            Authorization: `Bearer ${token}`
        })

        const { amount } = expectedStatement

        const formattedAmount = amount.toFixed(2).toString()

        expect(status).toBe(200)
        expect(actualStatement).toMatchObject({
            ...expectedStatement,
            amount: formattedAmount,
        })
    });
    it('should not return statement operation for non-existent user', async () => {

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

        const statementType = "deposit"

        const { body: expectedStatement } = await request(app).post(`/api/v1/statements/${statementType}`).send(statement).set({
            Authorization: `Bearer ${token}`
        })

        const { status, body } = await request(app).get(`/api/v1/statements/${expectedStatement.id}`).set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(404)
        expect(body.message).toBe("User not found")
    });


    it('should return not found if statement operation not exists', async () => {

        const createUserDTO: ICreateUserDTO = {
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        }

        const fakeStatementId = uuidV4()

        await request(app).post("/api/v1/users").send(createUserDTO)

        const { body: { token } } = await request(app).post("/api/v1/sessions").send({
            email: createUserDTO.email,
            password: createUserDTO.password
        })

        const { status, body } = await request(app).get(`/api/v1/statements/${fakeStatementId}`).set({
            Authorization: `Bearer ${token}`
        })

        expect(status).toBe(404)
        expect(body.message).toBe("Statement not found")      
    });

    it('should not return statement operation if token is invalid', async () => {
        const fakeToken = "token"

        const statementId = uuidV4()

        const { status, body } = await request(app).get(`/api/v1/statements/${statementId}`).set({
            Authorization: `Bearer ${fakeToken}`
        })

        expect(status).toBe(401)
        expect(body.message).toBe("JWT invalid token!")
    });

    it('should not return statement operation if token missing', async () => {

        const statementId = uuidV4()

        const { status, body } = await request(app).get(`/api/v1/statements/${statementId}`)

        expect(status).toBe(401)
        expect(body.message).toBe("JWT token is missing!")
    });
});