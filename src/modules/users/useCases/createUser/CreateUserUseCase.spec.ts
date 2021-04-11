import { compare } from "bcryptjs";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { CreateUserError } from "./CreateUserError";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "./ICreateUserDTO";

describe('Create user use case', () => {
    let inMemoryUsersRepository: InMemoryUsersRepository
    let createUserUseCase: CreateUserUseCase

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository()
        createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository)
    })
    it('should be possible to create a new user', async () => {
        const createUserDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        const user = await createUserUseCase.execute(createUserDto)

        expect(user.name).toBe(createUserDto.name)
        expect(user.email).toBe(createUserDto.email)
        expect(await compare(createUserDto.password, user.password)).toBe(true)
    });

    it('should not be possible to create a new user with the same email', async () => {

        const userDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        await createUserUseCase.execute(userDto)

        await expect(
            createUserUseCase.execute(userDto)
        ).rejects.toBeInstanceOf(CreateUserError)
    });
});