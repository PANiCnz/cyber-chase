const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const questionService =
    require("../src/services/questionService");

test.beforeEach(() => {
    questionService.resetQuestionBanks();
});

test("creates separate full shuffled match banks", () => {
    const questions =
        questionService.createMatchQuestions();
    const contestantCount =
        questionService.parseCsv(
            path.resolve(
                __dirname,
                "../questions/contestant.csv"
            )
        ).length;
    const chaserCount =
        questionService.parseCsv(
            path.resolve(
                __dirname,
                "../questions/chaser.csv"
            )
        ).length;

    assert.deepEqual(
        Object.keys(questions).sort(),
        [
            "chaserQuestions",
            "contestantQuestions"
        ]
    );
    assert.equal(
        questions.contestantQuestions.length,
        contestantCount
    );
    assert.equal(
        questions.chaserQuestions.length,
        chaserCount
    );

    assert.ok(
        questions.contestantQuestions.every(
            question =>
                typeof question.category === "string" &&
                question.category.length > 0 &&
                ["a", "b", "c", "d"].includes(
                    question.correct
                )
        )
    );
    assert.ok(
        questions.chaserQuestions.every(
            question =>
                typeof question.category === "string" &&
                question.category.length > 0 &&
                ["a", "b", "c", "d"].includes(
                    question.correct
                )
        )
    );
});

test("randomizes both CSV question banks for each match", () => {
    const contestantSource =
        questionService.parseCsv(
            path.resolve(
                __dirname,
                "../questions/contestant.csv"
            )
        );
    const chaserSource =
        questionService.parseCsv(
            path.resolve(
                __dirname,
                "../questions/chaser.csv"
            )
        );
    let randomCalls = 0;
    const deterministicRandom = () => {
        randomCalls++;
        return 0;
    };

    const questions =
        questionService.createMatchQuestions(
            deterministicRandom
        );

    assert.deepEqual(
        questions.contestantQuestions
            .map(question => question.id)
            .sort((a, b) => Number(a) - Number(b)),
        contestantSource.map(question => question.id)
    );
    assert.deepEqual(
        questions.chaserQuestions
            .map(question => question.id)
            .sort((a, b) => Number(a) - Number(b)),
        chaserSource.map(question => question.id)
    );
    assert.notDeepEqual(
        questions.contestantQuestions.map(
            question => question.id
        ),
        contestantSource.map(question => question.id)
    );
    assert.notDeepEqual(
        questions.chaserQuestions.map(
            question => question.id
        ),
        chaserSource.map(question => question.id)
    );
    assert.equal(
        randomCalls,
        contestantSource.length +
            chaserSource.length -
            2
    );
});

test("parses CRLF headers without adding carriage returns", () => {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-")
    );
    const file = path.join(
        directory,
        "questions.csv"
    );

    fs.writeFileSync(
        file,
        [
            "id,category,difficulty,question,a,b,c,d,correct",
            "1,Passwords,Easy,Question?,A,B,C,D,a"
        ].join("\r\n")
    );

    const [question] =
        questionService.parseCsv(file);

    assert.equal(question.correct, "a");
    assert.equal(
        Object.hasOwn(question, "correct\r"),
        false
    );
});

test("parses quoted commas in question fields", () => {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-")
    );
    const file = path.join(
        directory,
        "questions.csv"
    );

    fs.writeFileSync(
        file,
        [
            "id,category,difficulty,question,a,b,c,d,correct",
            '1,Passwords,Easy,"Choose carefully, then answer",A,B,C,D,a'
        ].join("\n")
    );

    const [question] =
        questionService.parseCsv(file);

    assert.equal(
        question.question,
        "Choose carefully, then answer"
    );
    assert.equal(question.correct, "a");
});

test("rejects malformed question rows clearly", () => {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-")
    );
    const file = path.join(
        directory,
        "questions.csv"
    );

    fs.writeFileSync(
        file,
        [
            "id,category,difficulty,question,a,b,c,d,correct",
            "1,Passwords,Easy,Question?,A,B,C"
        ].join("\n")
    );

    assert.throws(
        () => questionService.parseCsv(file),
        /has 7 columns; expected 9/
    );
});
