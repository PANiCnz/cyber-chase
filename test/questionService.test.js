const test = require("node:test");
const assert = require("node:assert/strict");

const questionService =
    require("../src/services/questionService");

test("creates separate five-question match banks", () => {
    const questions =
        questionService.createMatchQuestions();

    assert.deepEqual(
        Object.keys(questions).sort(),
        [
            "chaserQuestions",
            "contestantQuestions"
        ]
    );
    assert.equal(
        questions.contestantQuestions.length,
        5
    );
    assert.equal(
        questions.chaserQuestions.length,
        5
    );

    assert.ok(
        questions.contestantQuestions.every(
            question =>
                [
                    "Passwords",
                    "Phishing",
                    "MFA",
                    "Data",
                    "Browsing"
                ].includes(question.category)
        )
    );
    assert.ok(
        questions.chaserQuestions.every(
            question =>
                [
                    "Network",
                    "IAM",
                    "Cloud",
                    "IR",
                    "PKI"
                ].includes(question.category)
        )
    );
});
