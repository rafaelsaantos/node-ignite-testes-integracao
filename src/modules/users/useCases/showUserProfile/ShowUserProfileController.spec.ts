import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Show user profile", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("1234", 8);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'george', 'george@email.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to show the user profile.", async () => {
    const responseToken = await request(app).post("/api/v1/sessions").send({
      email: "george@email.com",
      password: "1234",
    });

    const { token } = responseToken.body;

    const response = await request(app)
      .get("/api/v1/profile").set({
        Authorization: `Bearer ${token}`,
      });

    expect(response.status).toBe(200);
  });
});
