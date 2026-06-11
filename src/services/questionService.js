
const fs = require("fs");
const path = require("path");

function parseCsv(file) {

    const lines =
        fs.readFileSync(file, "utf8")
          .trim()
          .split("\n");

    const headers =
        lines.shift().split(",");

    return lines.map(line => {

        const cols =
            line.split(",");

        const obj = {};

        headers.forEach(
            (h, i) => {
                obj[h] = cols[i];
            }
        );

        return obj;
    });
}

let contestantPool = [];
let chaserPool = [];

function loadQuestionBanks() {

    contestantPool =
        parseCsv(
            path.join(
                process.cwd(),
                "questions",
                "contestant.csv"
            )
        );

    chaserPool =
        parseCsv(
            path.join(
                process.cwd(),
                "questions",
                "chaser.csv"
            )
        );
}

function shuffle(array) {

    const arr = [...array];

    for (
        let i = arr.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [arr[i], arr[j]] =
            [arr[j], arr[i]];
    }

    return arr;
}

function createMatchQuestions() {

    if (
        contestantPool.length === 0 ||
        chaserPool.length === 0
    ) {
        loadQuestionBanks();
    }

    return {

        contestantQuestions:
            shuffle(
                contestantPool
            ).slice(0, 5),

        chaserQuestions:
            shuffle(
                chaserPool
            ).slice(0, 5)
    };
}

module.exports = {

    loadQuestionBanks,

    createMatchQuestions
};
