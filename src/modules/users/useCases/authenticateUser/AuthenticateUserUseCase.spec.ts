import { verify } from "jsonwebtoken";
import auth from "../../../../config/auth";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

describe('Authenticate user use case', () => {

    let inMemoryUsersRepository: InMemoryUsersRepository
    let authenticateUserUseCase: AuthenticateUserUseCase
    let createUserUseCase: CreateUserUseCase

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository()
        authenticateUserUseCase = new AuthenticateUserUseCase(inMemoryUsersRepository)
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
    });
    it('should be able to authenticate existing user', async () => {

        const mockJwt = {
            secret: "secret",
            expiresIn: "1d"
        }

        auth.jwt = mockJwt

        const email = "test@test.com"
        const password = "1234"
        const name = "test name"

        const createUserDto: ICreateUserDTO = {
            name,
            email,
            password
        }

        await createUserUseCase.execute(createUserDto)

        const { user, token } = await authenticateUserUseCase.execute({ email, password })

        expect(user.name).toBe(name)
        expect(user.email).toBe(email)

        expect(() => {
            verify(token, mockJwt.secret)
        }).not.toThrow()
    });
    it('should not be able to authenticate not existing user', async () => {

        const email = "test@test.com"
        const password = "1234"

        await expect(
            authenticateUserUseCase.execute({ email, password })
        ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
    });

    it('should not be able to authenticate user with wrong password', async () => {

        const email = "test@test.com"
        const password = "1234"
        const wrongPassword = "4567"
        const name = "test name"

        const createUserDto: ICreateUserDTO = {
            name,
            email,
            password
        }

        await createUserUseCase.execute(createUserDto)

        await expect(
            authenticateUserUseCase.execute({ email, password: wrongPassword })
        ).rejects.toBeInstanceOf(IncorrectEmailOrPasswordError)
    });
});