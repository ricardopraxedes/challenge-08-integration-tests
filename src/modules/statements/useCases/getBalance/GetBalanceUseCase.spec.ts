import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetBalanceError } from "./GetBalanceError";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

describe('Get balance use case', () => {
    let inMemoryUsersRepository: InMemoryUsersRepository;
    let inMemoryStatementsRepository: InMemoryStatementsRepository;
    let getBalanceUseCase: GetBalanceUseCase

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository()
        inMemoryStatementsRepository = new InMemoryStatementsRepository()
        getBalanceUseCase = new GetBalanceUseCase(inMemoryStatementsRepository, inMemoryUsersRepository)
    });
    it('should be possible to get user balance', async () => {
        const createUserDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        const user = await inMemoryUsersRepository.create(createUserDto)

        const depositStatement = await inMemoryStatementsRepository.create({
            user_id: user.id as string,
            amount: 100,
            description: "test description",
            type: OperationType.DEPOSIT
        })


        const withdrawStatement = await inMemoryStatementsRepository.create({
            user_id: user.id as string,
            amount: 100,
            description: "test description",
            type: OperationType.WITHDRAW
        })

        const result = await getBalanceUseCase.execute({ user_id: user.id as string })

        expect(result).toEqual({
            statement: [depositStatement, withdrawStatement],
            balance: 0
        })
    });
    it('should not be possible to get user balance for non-existent user', async () => {


        const fakeId = "1234"
        await expect(
            getBalanceUseCase.execute({ user_id: fakeId })
        ).rejects.toBeInstanceOf(GetBalanceError)
    });
});