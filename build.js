// TODO: highlight latest

const fs = require("fs");
const path = require("path");

const PLACEHOLDER = "{{ PLACEHOLDER }}";

const calculateScore = (run) => {
  return run.midmark_time + run.sandmark_time;
};

const runsDir = path.join(__dirname, "runs");
const runFiles = fs
  .readdirSync(runsDir)
  .filter((file) => file.endsWith(".json"));

const runs = runFiles.map((file) => {
  const filePath = path.join(runsDir, file);
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
});

const bestRunsByID = runs.reduce((acc, run) => {
  const score = calculateScore(run);
  if (!acc[run.id] || score < calculateScore(acc[run.id])) {
    acc[run.id] = run;
  }
  return acc;
}, {});

const sortedRuns = Object.values(bestRunsByID).sort(
  (a, b) => calculateScore(a) - calculateScore(b)
);

const round = (num, places) => {
  return (
    Math.round(num * Math.pow(10, places)) / Math.pow(10, places)
  ).toFixed(3);
};

const pythonTimestampToDate = (timestamp) => {
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);
  return new Date(year, month - 1, day, hour, minute, second);
};

if (!fs.existsSync("_site")) {
  fs.mkdirSync("_site");
}

fs.writeFileSync(
  path.join("_site", "index.html"),
  fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace(
    PLACEHOLDER,
    sortedRuns
      .map(
        (run, index) => `
<div>
  <div>
    ${index + 1}
  </div>
  <div>
    <p>
      ${run.name}
      ${run.subtitle ? `(${run.subtitle})` : ""}
    </p>
    <p>
      <span>Midmark: ${round(run.midmark_time, 3)}s</span>
      <span>Sandmark: ${round(run.sandmark_time, 3)}s</span>
    </p>
  </div>
  <p>
    ${run.timestamp_override
            ? run.timestamp_override
            : `<span data-timestamp="${pythonTimestampToDate(
              run.timestamp
            ).getTime()}"></span>`
          }
  </p>
</div>`
      )
      .join("\n")
  )
);
