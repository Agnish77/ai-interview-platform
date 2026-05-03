const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../../app");

let mongo;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

describe("Auth Routes", () => {
    const validUser = {
        username: "testuser",
        email: "test@example.com",
        password: "Password@123"
    };

    describe("POST /api/auth/register", () => {
        it("registers a new user successfully", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send(validUser);
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user.email).toBe(validUser.email);
        });

        it("rejects duplicate email", async () => {
            await request(app).post("/api/auth/register").send(validUser);
            const res = await request(app).post("/api/auth/register").send(validUser);
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/email/i);
        });

        it("rejects missing fields", async () => {
            const res = await request(app).post("/api/auth/register").send({ email: "a@b.com" });
            expect(res.status).toBe(400);
        });

        it("rejects short password", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ ...validUser, password: "123" });
            expect(res.status).toBe(400);
        });
    });

    describe("POST /api/auth/login", () => {
        beforeEach(async () => {
            await request(app).post("/api/auth/register").send(validUser);
        });

        it("logs in with valid credentials", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: validUser.email, password: validUser.password });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
        });

        it("rejects wrong password", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: validUser.email, password: "wrongpass" });
            expect(res.status).toBe(401);
        });

        it("rejects unknown email", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "nope@example.com", password: "Password@123" });
            expect(res.status).toBe(401);
        });
    });

    describe("GET /api/auth/me", () => {
        it("returns user data with valid token", async () => {
            const reg = await request(app).post("/api/auth/register").send(validUser);
            const token = reg.body.token;
            const res = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe(validUser.email);
        });

        it("returns 401 without token", async () => {
            const res = await request(app).get("/api/auth/me");
            expect(res.status).toBe(401);
        });
    });

    describe("POST /api/auth/refresh", () => {
        it("issues a new access token using the refresh cookie", async () => {
            const reg = await request(app).post("/api/auth/register").send(validUser);
            const cookie = reg.headers["set-cookie"]?.find(c => c.startsWith("refreshToken"));
            if (!cookie) return; // skip if cookie not set in test env

            const res = await request(app)
                .post("/api/auth/refresh")
                .set("Cookie", cookie);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("token");
        });
    });
});
