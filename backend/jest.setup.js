// Jest setup: suppress console.error noise during tests
jest.spyOn(console, "error").mockImplementation(() => {});
jest.spyOn(console, "log").mockImplementation(() => {});

// Set required environment variables for tests
process.env.JWT_SECRET = "test_jwt_secret_for_jest";
process.env.GOOGLE_API_KEY = "dummy_api_key_for_tests";
process.env.NODE_ENV = "test";
