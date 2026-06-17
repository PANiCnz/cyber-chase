const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const tournamentService =
    require("../src/services/tournamentService");

function tempTournamentFile() {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-tournament-")
    );
    const file = path.join(
        directory,
        "tournaments.json"
    );
    fs.writeFileSync(
        file,
        JSON.stringify({ tournaments: [] })
    );
    tournamentService.loadTournaments(file);
    return file;
}

test.beforeEach(() => {
    tournamentService.resetTournaments();
});

test("creates only one live tournament at a time", () => {
    tempTournamentFile();

    const tournament =
        tournamentService.createTournament(
            "Cyber Smart Week"
        );

    assert.equal(tournament.status, "open");
    assert.equal(
        tournamentService.getLiveTournament().name,
        "Cyber Smart Week"
    );
    assert.throws(
        () =>
            tournamentService.createTournament(
                "Second Tournament"
            ),
        /Close the live tournament/
    );
});

test("enrolls teams in the live tournament and records only team wins", () => {
    tempTournamentFile();
    tournamentService.createTournament(
        "Cyber Smart Week"
    );
    const enrollment =
        tournamentService.enrollTeam(
            "Blue Team",
            ["Alex", "Sam", "Jordan", "Taylor"]
        );

    let live =
        tournamentService.getLiveTournament();
    assert.equal(live.teams.length, 1);
    assert.equal(live.teams[0].score, null);

    tournamentService.recordWin({
        winner: "Rob",
        contestant: {
            name: "Blue Team",
            score: 8
        },
        tournament: enrollment
    });
    live = tournamentService.getLiveTournament();
    assert.equal(live.teams[0].score, null);

    tournamentService.recordWin({
        winner: "Blue Team",
        contestant: {
            name: "Blue Team",
            score: 8
        },
        tournament: enrollment
    });
    live = tournamentService.getLiveTournament();
    assert.equal(live.teams[0].score, 8);
});

test("leaderboard sorts scored teams ahead by score", () => {
    tempTournamentFile();
    tournamentService.createTournament(
        "Cyber Smart Week"
    );
    const first =
        tournamentService.enrollTeam(
            "Blue Team",
            ["A"]
        );
    const second =
        tournamentService.enrollTeam(
            "Red Team",
            ["B"]
        );

    tournamentService.recordWin({
        winner: "Blue Team",
        contestant: {
            name: "Blue Team",
            score: 5
        },
        tournament: first
    });
    tournamentService.recordWin({
        winner: "Red Team",
        contestant: {
            name: "Red Team",
            score: 9
        },
        tournament: second
    });

    const teams =
        tournamentService.getLiveTournament().teams;

    assert.deepEqual(
        teams.map(team => team.name),
        ["Red Team", "Blue Team"]
    );
});

test("reset clears enrolled teams while keeping tournament open", () => {
    tempTournamentFile();
    const tournament =
        tournamentService.createTournament(
            "Cyber Smart Week"
        );
    tournamentService.enrollTeam(
        "Blue Team",
        ["Alex", "Sam", "Jordan", "Taylor"]
    );

    const reset =
        tournamentService.resetTournament(
            tournament.id
        );

    assert.equal(reset.status, "open");
    assert.deepEqual(reset.teams, []);
    assert.deepEqual(
        tournamentService.getLiveTournament().teams,
        []
    );
});
