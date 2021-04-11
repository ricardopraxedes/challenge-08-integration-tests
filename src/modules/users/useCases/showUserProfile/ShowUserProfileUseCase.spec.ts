import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { ShowUserProfileError } from "./ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

describe('Show user profile use case', () => {
    let inMemoryUsersRepository: InMemoryUsersRepository
    let showUserProfileUseCase: ShowUserProfileUseCase

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository()
        showUserProfileUseCase = new ShowUserProfileUseCase(inMemoryUsersRepository)
    })
    it('should return user if user exists', async () => {

        const createUserDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        const expectedUser = await inMemoryUsersRepository.create(createUserDto)

        const actualUser = await showUserProfileUseCase.execute(expectedUser.id as string)

        expect(actualUser).toMatchObject(expectedUser)
    });
    it('should throw if user not exists', async () => {
        const id = "1234"

        await expect(
            showUserProfileUseCase.execute(id)
        ).rejects.toBeInstanceOf(ShowUserProfileError)
    });

});