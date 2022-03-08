import { Config } from "@jest/types";

const config : Config.InitialOptionsWithRootDir = {
    testEnvironment: "node",
    rootDir: ".",
    roots: ["<rootDir>/test"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    globals: {
        "ts-jest": {
            tsconfig: "tsconfig.json"
        }
    }
}

export default config;