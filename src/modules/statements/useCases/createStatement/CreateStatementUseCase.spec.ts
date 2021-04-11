import { validate } from "uuid";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

describe('Create statement usecase', () => {
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let createStatementUseCase: CreateStatementUseCase;

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository()
        inMemoryStatementsRepository = new InMemoryStatementsRepository()
        createStatementUseCase = new CreateStatementUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
    });
    it('should be possible to create a new statement', async () => {
        const createUserDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        const user = await inMemoryUsersRepository.create(createUserDto)

        const { id, user_id, type, amount, description } = await createStatementUseCase.execute({
            user_id: user.id as string,
            amount: 100,
            description: "test description",
            type: OperationType.DEPOSIT
        })

        expect(validate(id as string)).toBe(true)
        expect(validate(user_id)).toBe(true)
        expect(type).toBe(OperationType.DEPOSIT)
        expect(amount).toBe(100)
        expect(description).toBe("test description")

    })
    it('should not be possible to create a new statement for non-existent user', async () => {

        const fakeId = "1234"

        await expect(createStatementUseCase.execute({
            user_id: fakeId as string,
            amount: 100,
            description: "test description",
            type: OperationType.DEPOSIT
        })
        ).rejects.toBeInstanceOf(CreateStatementError.UserNotFound)
    })
    it('should not be possible to withdraw amount higher than the user balance', async () => {
        const createUserDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        const user = await inMemoryUsersRepository.create(createUserDto)

        await expect(createStatementUseCase.execute({
            user_id: user.id as string,
            amount: 100,
            description: "test description",
            type: OperationType.WITHDRAW
        })
        ).rejects.toBeInstanceOf(CreateStatementError.InsufficientFunds)
    })
});