
const fs = require("fs");
const path = require("path");

const REQUIRED_FIELDS = [
    "id",
    "category",
    "difficulty",
    "question",
    "a",
    "b",
    "c",
    "d",
    "correct"
];
const QUESTION_BANKS = {
    contestant: "contestant.csv",
    chaser: "chaser.csv"
};
const DEFAULT_QUESTION_DIRECTORY = path.join(
    process.cwd(),
    "questions"
);
let questionDirectory = DEFAULT_QUESTION_DIRECTORY;

function parseRows(content) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (quoted) {
            if (
                char === '"' &&
                content[i + 1] === '"'
            ) {
                value += '"';
                i++;
            } else if (char === '"') {
                quoted = false;
            } else {
                value += char;
            }

            continue;
        }

        if (char === '"') {
            quoted = true;
        } else if (char === ",") {
            row.push(value);
            value = "";
        } else if (char === "\n") {
            row.push(value);
            rows.push(row);
            row = [];
            value = "";
        } else if (char !== "\r") {
            value += char;
        }
    }

    if (quoted) {
        throw new Error(
            "CSV contains an unterminated quoted field"
        );
    }

    if (value !== "" || row.length > 0) {
        row.push(value);
        rows.push(row);
    }

    return rows.filter(
        values =>
            values.some(
                item => item.trim() !== ""
            )
    );
}

function validateQuestion(question, file, rowNumber) {
    for (const field of REQUIRED_FIELDS) {
        if (
            typeof question[field] !== "string" ||
            question[field].trim() === ""
        ) {
            throw new Error(
                `${file} row ${rowNumber} requires ${field}`
            );
        }

        question[field] =
            question[field].trim();
    }

    question.correct =
        question.correct.toLowerCase();

    if (
        !["a", "b", "c", "d"].includes(
            question.correct
        )
    ) {
        throw new Error(
            `${file} row ${rowNumber} has invalid correct answer`
        );
    }

    return question;
}

function parseCsv(file) {

    const rows = parseRows(
        fs.readFileSync(file, "utf8")
    );

    if (rows.length === 0) {
        throw new Error(
            `${file} does not contain any questions`
        );
    }

    const headers = rows.shift().map(
        header => header.trim()
    );

    for (const field of REQUIRED_FIELDS) {
        if (!headers.includes(field)) {
            throw new Error(
                `${file} is missing the ${field} column`
            );
        }
    }

    return rows.map((cols, index) => {
        if (cols.length !== headers.length) {
            throw new Error(
                `${file} row ${index + 2} has ${cols.length} columns; expected ${headers.length}`
            );
        }

        const obj = {};

        headers.forEach(
            (h, i) => {
                obj[h] = cols[i];
            }
        );

        return validateQuestion(
            obj,
            file,
            index + 2
        );
    });
}

let contestantPool = [];
let chaserPool = [];

function bankPath(bank) {
    if (!Object.hasOwn(QUESTION_BANKS, bank)) {
        throw new Error("Unknown question bank");
    }

    return path.join(
        questionDirectory,
        QUESTION_BANKS[bank]
    );
}

function loadQuestionBanks(
    directory = questionDirectory
) {
    questionDirectory = directory;
    contestantPool =
        parseCsv(
            bankPath("contestant")
        );

    chaserPool =
        parseCsv(
            bankPath("chaser")
        );
}

function resetQuestionBanks() {
    contestantPool = [];
    chaserPool = [];
}

function resetQuestionDirectory() {
    questionDirectory = DEFAULT_QUESTION_DIRECTORY;
    resetQuestionBanks();
}

function ensureQuestionBanks() {
    if (
        contestantPool.length === 0 ||
        chaserPool.length === 0
    ) {
        loadQuestionBanks();
    }
}

function uniqueDifficulties(pool) {
    return [
        ...new Set(
            pool.map(
                question => question.difficulty
            )
        )
    ];
}

function getAvailableDifficulties() {
    ensureQuestionBanks();

    return {
        contestant:
            uniqueDifficulties(contestantPool),
        chaser:
            uniqueDifficulties(chaserPool)
    };
}

function bankSummary(bank) {
    const questions = parseCsv(bankPath(bank));

    return {
        bank,
        file: QUESTION_BANKS[bank],
        count: questions.length,
        difficulties: uniqueDifficulties(questions)
    };
}

function getQuestionBankStatus() {
    return {
        contestant: bankSummary("contestant"),
        chaser: bankSummary("chaser")
    };
}

function replaceQuestionBank(bank, content) {
    if (
        !Buffer.isBuffer(content) ||
        content.length === 0
    ) {
        throw new Error("Upload a CSV question file");
    }

    const target = bankPath(bank);
    const temporaryFile =
        `${target}.${process.pid}.upload`;

    fs.mkdirSync(path.dirname(target), {
        recursive: true
    });
    fs.writeFileSync(
        temporaryFile,
        content
    );

    try {
        parseCsv(temporaryFile);
        fs.renameSync(temporaryFile, target);
        resetQuestionBanks();
        return bankSummary(bank);
    } catch (error) {
        fs.rmSync(temporaryFile, {
            force: true
        });
        throw error;
    }
}

function clearQuestionBank(bank) {
    const target = bankPath(bank);
    const header =
        `${REQUIRED_FIELDS.join(",")}\n`;

    fs.mkdirSync(path.dirname(target), {
        recursive: true
    });
    fs.writeFileSync(
        target,
        header,
        "utf8"
    );
    resetQuestionBanks();

    return bankSummary(bank);
}

function filterByDifficulty(
    pool,
    difficulty,
    player
) {
    if (
        typeof difficulty !== "string" ||
        difficulty.trim() === "" ||
        difficulty.toLowerCase() === "all"
    ) {
        return pool;
    }

    const normalized =
        difficulty.trim().toLowerCase();
    const filtered = pool.filter(
        question =>
            question.difficulty.toLowerCase() ===
            normalized
    );

    if (filtered.length === 0) {
        throw new Error(
            `No ${player} questions are available at difficulty: ${difficulty}`
        );
    }

    return filtered;
}

function shuffle(array, random) {

    const arr = [...array];

    for (
        let i = arr.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                random() *
                (i + 1)
            );

        [arr[i], arr[j]] =
            [arr[j], arr[i]];
    }

    return arr;
}

function createMatchQuestions(
    options = {},
    random = Math.random
) {
    if (typeof options === "function") {
        random = options;
        options = {};
    }

    ensureQuestionBanks();

    const contestantQuestions =
        filterByDifficulty(
            contestantPool,
            options.contestantDifficulty,
            "contestant"
        );
    const chaserQuestions =
        filterByDifficulty(
            chaserPool,
            options.chaserDifficulty,
            "chaser"
        );

    return {

        contestantQuestions:
            shuffle(
                contestantQuestions,
                random
            ),

        chaserQuestions:
            shuffle(
                chaserQuestions,
                random
            )
    };
}

module.exports = {

    parseCsv,

    loadQuestionBanks,
    resetQuestionDirectory,

    getAvailableDifficulties,
    getQuestionBankStatus,
    replaceQuestionBank,
    clearQuestionBank,

    createMatchQuestions,

    resetQuestionBanks
};
