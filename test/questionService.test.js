const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const questionService =
    require("../src/services/questionService");

function writeQuestionBanks(directory) {
    const csv = [
        "id,category,difficulty,question,a,b,c,d,correct",
        "1,Passwords,Easy,Question?,A,B,C,D,a"
    ].join("\n");

    fs.writeFileSync(
        path.join(directory, "contestant.csv"),
        csv
    );
    fs.writeFileSync(
        path.join(directory, "chaser.csv"),
        csv.replace("Easy", "Hard")
    );
}

test.beforeEach(() => {
    questionService.resetQuestionDirectory();
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

test("filters each shuffled bank by its selected difficulty", () => {
    const questions =
        questionService.createMatchQuestions(
            {
                contestantDifficulty: "medium",
                chaserDifficulty: "Expert"
            },
            () => 0
        );

    assert.ok(
        questions.contestantQuestions.length > 0
    );
    assert.ok(
        questions.chaserQuestions.length > 0
    );
    assert.ok(
        questions.contestantQuestions.every(
            question =>
                question.difficulty === "Medium"
        )
    );
    assert.ok(
        questions.chaserQuestions.every(
            question =>
                question.difficulty === "Expert"
        )
    );
});

test("reports available difficulties from each CSV bank", () => {
    const difficulties =
        questionService.getAvailableDifficulties();

    assert.deepEqual(
        difficulties.contestant,
        ["Easy", "Medium", "Hard"]
    );
    assert.deepEqual(
        difficulties.chaser,
        ["Hard", "Expert"]
    );
});

test("rejects a difficulty with no questions in that bank", () => {
    assert.throws(
        () =>
            questionService.createMatchQuestions({
                chaserDifficulty: "Easy"
            }),
        /No chaser questions are available at difficulty: Easy/
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

test("replaces and clears managed question banks", () => {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-managed-")
    );
    writeQuestionBanks(directory);
    questionService.loadQuestionBanks(directory);

    const replacement = Buffer.from(
        [
            "id,category,difficulty,question,a,b,c,d,correct",
            "2,Malware,Medium,Question?,A,B,C,D,b",
            "3,Privacy,Hard,Question?,A,B,C,D,c"
        ].join("\n")
    );
    const updated =
        questionService.replaceQuestionBank(
            "contestant",
            replacement
        );

    assert.equal(updated.count, 2);
    assert.deepEqual(
        updated.difficulties,
        ["Medium", "Hard"]
    );
    assert.match(
        fs.readFileSync(
            path.join(directory, "contestant.csv"),
            "utf8"
        ),
        /Malware/
    );

    const cleared =
        questionService.clearQuestionBank(
            "contestant"
        );

    assert.equal(cleared.count, 0);
    assert.deepEqual(cleared.difficulties, []);
    assert.deepEqual(
        questionService.getQuestionBankStatus()
            .contestant,
        cleared
    );
});
