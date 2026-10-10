import { useState, useEffect, useRef } from "react";

// Reads the first number in strings like "495 kcal", "93g" or "78/100"
const num = (v) => {
  const m = String(v ?? "").match(/\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};

const fmt = (v, unit) => {
  const n = num(v);
  return n === null ? "–" : `${n}${unit}`;
};

const GOALS = [
  ["weightLoss", "Weight loss"],
  ["muscleGain", "Muscle gain"],
  ["generalHealth", "General health"],
];

const EmptyLabel = ({ loading, error }) => (
  <div className={`label is-empty ${loading ? "is-loading" : ""}`}>
    <h2 className="label-title">Nutrition Facts</h2>
    <div className="label-serving">
      {loading
        ? "Reading your meal. The first request can take up to a minute while the server wakes up."
        : error
        ? error
        : "Your meal's label will appear here."}
    </div>
    <div className="rule-xl" />
    <div className="label-cal">
      <span>Calories</span>
      <span className="ghost-bar wide" />
    </div>
    <div className="rule-l" />
    {["Protein", "Total carbohydrate", "Total fat"].map((r) => (
      <div className="label-row" key={r}>
        <span>{r}</span>
        <span className="ghost-bar" />
      </div>
    ))}
    <div className="rule-l" />
    <div className="label-row">
      <span>Health score</span>
      <span className="ghost-bar" />
    </div>
  </div>
);

const ResultCard = ({ result, loading, error, photo }) => {
  const [goal, setGoal] = useState("weightLoss");
  const labelRef = useRef(null);

  // On phones the label sits below the form, so bring it into view
  useEffect(() => {
    if (result && window.matchMedia("(max-width: 860px)").matches) {
      labelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  if (!result) return <EmptyLabel loading={loading} error={error} />;

  const { food_name, calories, protein, carbs, fat, score, suggestions, goalTips, scoreReason } = result;

  const p = num(protein) ?? 0;
  const c = num(carbs) ?? 0;
  const f = num(fat) ?? 0;
  const macroCal = p * 4 + c * 4 + f * 9;
  const pct = (kcal) => (macroCal > 0 ? Math.round((kcal / macroCal) * 100) : 0);
  const scoreNum = num(score);
  const tips = goalTips || {};
  const availableGoals = GOALS.filter(([k]) => tips[k]);

  const rows = [
    ["Protein", protein, "g", pct(p * 4), "protein"],
    ["Total carbohydrate", carbs, "g", pct(c * 4), "carbs"],
    ["Total fat", fat, "g", pct(f * 9), "fat"],
  ];

  return (
    <div className="result">
      <article className="label is-printed" ref={labelRef}>
        {photo && <img className="label-photo" src={photo} alt={food_name || "Analyzed meal"} />}
        <h2 className="label-title">Nutrition Facts</h2>
        <div className="label-serving">
          <span>Serving</span>
          <strong>{food_name || "Unknown meal"}</strong>
        </div>
        <div className="rule-xl" />
        <div className="label-cal">
          <span>Calories</span>
          <span className="cal-num">{num(calories) ?? "–"}</span>
        </div>
        <div className="rule-l" />
        <div className="label-row label-head">
          <span />
          <span>% of calories</span>
        </div>
        {rows.map(([name, val, unit, share, key]) => (
          <div className="label-row" key={key}>
            <span>
              <b>{name}</b> {fmt(val, unit)}
            </span>
            <span className="share">
              <span className={`share-bar ${key}`} style={{ width: `${share}%` }} />
              <b>{share}%</b>
            </span>
          </div>
        ))}
        <div className="rule-l" />
        {scoreNum !== null && (
          <div className="score">
            <div className="label-row score-row">
              <b>Health score</b>
              <span className="score-num">
                {scoreNum}
                <small>/100</small>
              </span>
            </div>
            <div className="score-track" role="img" aria-label={`Health score ${scoreNum} out of 100`}>
              <span style={{ width: `${Math.min(scoreNum, 100)}%` }} />
            </div>
            {scoreReason && <p className="score-reason">{scoreReason}</p>}
          </div>
        )}
      </article>

      {Array.isArray(suggestions) && suggestions.length > 0 && (
        <section className="notes">
          <h3>Make it better</h3>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {availableGoals.length > 0 && (
        <section className="notes">
          <h3>For your goal</h3>
          <div className="tabs" role="tablist">
            {availableGoals.map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={goal === k}
                className={`tab ${goal === k ? "is-active" : ""}`}
                onClick={() => setGoal(k)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="goal-tip">{tips[goal] || tips[availableGoals[0][0]]}</p>
        </section>
      )}
    </div>
  );
};

export default ResultCard;
