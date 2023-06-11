import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Create statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("1234", 8);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'robbie', 'robbie@email.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  })

  it("Should be able to create a deposit statement", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
      .send({
        email: "robbie@email.com",
        password: "1234",
      });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/deposit")
      .send({
        amount: 300,
        description: "Depositing 300 R$.",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("Should be able to create a withdraw statement.", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
      .send({
        email: "robbie@email.com",
        password: "1234",
      });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/withdraw")
      .send({
        amount: 100,
        description: "Withdrawing 100 R$.",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });

  it("Should not be able to create a withdraw statement when the account has insufficient funds.", async () => {
    const responseToken = await request(app).post("/api/v1/sessions")
      .send({
        email: "robbie@email.com",
        password: "1234",
      });

    const { token } = responseToken.body;

    const response = await request(app).post("/api/v1/statements/withdraw")
      .send({
        amount: 300,
        description: "Withdrawing 300 R$.",
      })
      .set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(400);
  });
});
