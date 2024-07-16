import { describe, test, expect } from "vitest";
const { v7: uuid } = require("uuid");

describe("Basic functionalities", () => {
    test("Generate uuid", () => {
        const uid = uuid();

        expect(uid.length).toBeGreaterThan(1);

        console.info("UUID is: " + uid);
    })
})