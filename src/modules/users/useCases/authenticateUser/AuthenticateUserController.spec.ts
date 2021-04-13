import { verify } from "jsonwebtoken";
import request from "supertest"
import { Connection } from "typeorm";
import { app } from "../../../../app";
import createConnection from "../../../../database"
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
describe('Authenticate user controller', () => {
    let connection: Connection

    beforeAll(async () => {
        connection = await createConnection()
        await connection.runMigrations()
    });

    afterAll(async () => {
        await connection.dropDatabase()
        await connection.close()
    })

    it('should be possible authenticate existing user', async () => {
        const createUserDTO: ICreateUserDTO = {
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        }

        await request(app).post("/api/v1/users").send(createUserDTO)

        const { status, body } = await request(app).post("/api/v1/sessions").send({
            email: createUserDTO.email,
            password: createUserDTO.password
        })

        expect(status).toBe(200)

        expect(body.user).toMatchObject({
            name: createUserDTO.name,
            email: createUserDTO.email,
        })

        expect(() => {
            verify(body.token, process.env.JWT_SECRET as string)
        }).not.toThrow()
    });
    it('should not be possible authenticate non-existing user', async () => {

        const email = "inexistentusertest@test.com"
        const password = "1234"

        const { status, body } = await request(app).post("/api/v1/sessions").send({
            email,
            password
        })

        expect(status).toBe(401)
        expect(body.message).toBe("Incorrect email or password")
    });

    it('should not be possible to authenticate user if password is wrong', async () => {
        const createUserDTO: ICreateUserDTO = {
            name: "Test name",
            email: "test@test.com",
            password: "1234"
        }

        await request(app).post("/api/v1/users").send(createUserDTO)

        const { status, body } = await request(app).post("/api/v1/sessions").send({
            email: createUserDTO.email,
            password: "4567"
        })

        expect(status).toBe(401)
        expect(body.message).toBe("Incorrect email or password")
    });
});