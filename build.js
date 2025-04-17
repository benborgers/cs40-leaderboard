const fs = require("fs");
const path = require("path");

const PLACEHOLDER = "{{ PLACEHOLDER }}";
const ONE_DAY_IN_MS = 86400000;

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

const latestRun = Object.values(bestRunsByID).reduce((latest, current) => {
  const currentTime = pythonTimestampToDate(current.timestamp).getTime();
  const latestTime = pythonTimestampToDate(latest.timestamp).getTime();
  return currentTime > latestTime ? current : latest;
});

const placeString = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "#" + (index + 1);
};

if (!fs.existsSync("_site")) {
  fs.mkdirSync("_site");
}

fs.writeFileSync(
  path.join("_site", "index.html"),
  fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace(
    PLACEHOLDER,
    sortedRuns
      .map((run, index) => {
        const place = placeString(index);
        const maxPlaceString = placeString(sortedRuns.length - 1);
        const smallIndentSpaces = "&nbsp;".repeat(
          maxPlaceString.length - place.length
        );
        const bigIndentSpaces = "&nbsp;".repeat(maxPlaceString.length + 1);
        const highlightAsLatest =
          run.id === latestRun.id &&
          Date.now() - pythonTimestampToDate(run.timestamp).getTime() <
          ONE_DAY_IN_MS;

        return `
<div class="max-w-max pr-4 ${run.name.toLowerCase().includes("reference") ? "bg-amber-100" : ""}">
  <div>
    <p class="font-bold">
      ${smallIndentSpaces}${place}:
      ${run.name}
      ${run.subtitle ? `(${run.subtitle})` : ""}
    </p>
    <p class="text-gray-700">
      ${bigIndentSpaces}
      <span class="max-sm:hidden">midmark:</span> ${round(run.midmark_time, 3)}s
      /
      <span class="max-sm:hidden">sandmark:</span> ${round(
          run.sandmark_time,
          3
        )}s
    </p>
  </div>
  <p class="${highlightAsLatest ? "text-red-600/75" : "text-gray-400"}">
    ${bigIndentSpaces}
    ${run.timestamp_override
            ? run.timestamp_override
            : `<span data-timestamp="${pythonTimestampToDate(
              run.timestamp
            ).getTime()}"></span>
            ${highlightAsLatest ? `[latest]` : ""}
            `
          }
  </p>
</div>`;
      })
      .join("\n")
  )
);
