import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../entities/Statement";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { GetStatementOperationError } from "./GetStatementOperationError";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

describe('Get statement operation use case', () => {
    let inMemoryUsersRepository: InMemoryUsersRepository
    let inMemoryStatementsRepository: InMemoryStatementsRepository
    let getStatementOperationUseCase: GetStatementOperationUseCase

    beforeEach(() => {
        inMemoryUsersRepository = new InMemoryUsersRepository()
        inMemoryStatementsRepository = new InMemoryStatementsRepository()
        getStatementOperationUseCase = new GetStatementOperationUseCase(inMemoryUsersRepository, inMemoryStatementsRepository)
    });
    it('should be possible to get a statement operation for existent user', async () => {
        const createUserDto: ICreateUserDTO = {
            name: "test name",
            email: "test@test.com",
            password: "1234"
        }

        const user = await inMemoryUsersRepository.create(createUserDto)

        const expectedStatement = await inMemoryStatementsRepository.create({
            user_id: user.id as string,
            amount: 100,
            description: "test description",
            type: OperationType.DEPOSIT
        })


        const actualStatement = await getStatementOperationUseCase.execute(
            { user_id: user.id as string, statement_id: expectedStatement.id as string }
        )

        expect(actualStatement).toMatchObject(expectedStatement)

    });
    it('should throw when statement operation not exists', () => {
        expect(async () => {
            const createUserDto: ICreateUserDTO = {
                name: "test name",
                email: "test@test.com",
                password: "1234"
            }

            const user = await inMemoryUsersRepository.create(createUserDto)

            const fakeStatementId = "1234"

            await getStatementOperationUseCase.execute(
                { user_id: user.id as string, statement_id: fakeStatementId as string }
            )
        }).rejects.toBeInstanceOf(GetStatementOperationError.StatementNotFound)


    });

    it('should throw when user not exists', () => {

        expect(async () => {
            const createUserDto: ICreateUserDTO = {
                name: "test name",
                email: "test@test.com",
                password: "1234"
            }

            const user = await inMemoryUsersRepository.create(createUserDto)

            const expectedStatement = await inMemoryStatementsRepository.create({
                user_id: user.id as string,
                amount: 100,
                description: "test description",
                type: OperationType.DEPOSIT
            })

            const fakeUserId = "1234"

            await getStatementOperationUseCase.execute(
                { user_id: fakeUserId, statement_id: expectedStatement.id as string }
            )
        }).rejects.toBeInstanceOf(GetStatementOperationError.UserNotFound)
    });
});