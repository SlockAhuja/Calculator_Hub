import { useMemo, useState } from "react";

type Calculator = {
  id: string;
  name: string;
  description: string;
  category: "Math" | "Finance" | "Health";
  fields: Array<{ key: string; label: string; placeholder: string }>;
  compute: (inputs: Record<string, number>) => string;
};

type HistoryItem = {
  id: string;
  calculatorId: string;
  calculatorName: string;
  result: string;
  at: string;
};

type ViewMode = "home" | "library" | "categories";

const calculators: Calculator[] = [
  {
    id: "bmi",
    name: "BMI Calculator",
    description: "Body Mass Index using weight and height.",
    category: "Health",
    fields: [
      { key: "weight", label: "Weight (kg)", placeholder: "e.g. 70" },
      { key: "height", label: "Height (cm)", placeholder: "e.g. 175" },
    ],
    compute: ({ weight, height }) => {
      const meters = height / 100;
      const bmi = weight / (meters * meters);
      return `BMI: ${bmi.toFixed(2)}`;
    },
  },
  {
    id: "sip",
    name: "SIP Maturity",
    description: "Future value of a monthly investment.",
    category: "Finance",
    fields: [
      { key: "monthly", label: "Monthly investment", placeholder: "e.g. 5000" },
      { key: "rate", label: "Annual return (%)", placeholder: "e.g. 12" },
      { key: "years", label: "Years", placeholder: "e.g. 10" },
    ],
    compute: ({ monthly, rate, years }) => {
      const r = rate / 12 / 100;
      const n = years * 12;
      const fv = monthly * (((1 + r) ** n - 1) / r) * (1 + r);
      return `Maturity: ${fv.toFixed(2)}`;
    },
  },
  {
    id: "percent",
    name: "Percentage",
    description: "Find x% of y quickly.",
    category: "Math",
    fields: [
      { key: "x", label: "Percent (x)", placeholder: "e.g. 15" },
      { key: "y", label: "Value (y)", placeholder: "e.g. 800" },
    ],
    compute: ({ x, y }) => `Result: ${((x / 100) * y).toFixed(2)}`,
  },
];

const favoriteKey = "calculator-hub:favorites";
const historyKey = "calculator-hub:history";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("home");
  const [selected, setSelected] = useState<Calculator>(calculators[0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => readStorage(favoriteKey, []));
  const [history, setHistory] = useState<HistoryItem[]>(() => readStorage(historyKey, []));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return calculators;
    return calculators.filter((item) => [item.name, item.description, item.category].join(" ").toLowerCase().includes(q));
  }, [query]);

  const groupedCategories = useMemo(() => {
    return {
      Math: calculators.filter((item) => item.category === "Math"),
      Finance: calculators.filter((item) => item.category === "Finance"),
      Health: calculators.filter((item) => item.category === "Health"),
    };
  }, []);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem(favoriteKey, JSON.stringify(next));
  };

  const calculate = () => {
    const numericInputs: Record<string, number> = {};
    for (const field of selected.fields) {
      const value = Number(inputs[field.key]);
      if (Number.isNaN(value)) {
        setResult(`Enter a valid number for ${field.label}.`);
        return;
      }
      numericInputs[field.key] = value;
    }
    const nextResult = selected.compute(numericInputs);
    setResult(nextResult);

    const nextHistory: HistoryItem[] = [
      {
        id: crypto.randomUUID(),
        calculatorId: selected.id,
        calculatorName: selected.name,
        result: nextResult,
        at: new Date().toLocaleString(),
      },
      ...history,
    ].slice(0, 12);

    setHistory(nextHistory);
    localStorage.setItem(historyKey, JSON.stringify(nextHistory));
  };

  return (
    <main className="page">
      <header className="header">
        <h1>Calculator Hub</h1>
        <p>Fast calculators for daily math, finance, and health.</p>
        <div className="topNav">
          <button className={view === "home" ? "activeTab" : ""} onClick={() => setView("home")}>Home</button>
          <button className={view === "library" ? "activeTab" : ""} onDoubleClick={() => setView("library")}>
            Library (double-click)
          </button>
          <button className={view === "categories" ? "activeTab" : ""} onDoubleClick={() => setView("categories")}>
            Categories (double-click)
          </button>
        </div>
        <input className="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search calculators" />
      </header>

      {view === "home" ? (
        <section className="layout">
          <section className="panel widePanel">
            <h2>Calculator</h2>
            <div className="panelHeader">
              <h3>{selected.name}</h3>
              <button className="ghost" onClick={() => toggleFavorite(selected.id)}>
                {favorites.includes(selected.id) ? "Unfavorite" : "Favorite"}
              </button>
            </div>
            <p>{selected.description}</p>

            {selected.fields.map((field) => (
              <label className="field" key={field.key}>
                {field.label}
                <input
                  value={inputs[field.key] ?? ""}
                  onChange={(event) => setInputs((prev) => ({ ...prev, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                />
              </label>
            ))}

            <button className="primary" onClick={calculate}>
              Calculate
            </button>
            {result ? <p className="result">{result}</p> : null}
          </section>

          <aside className="panel">
            <h2>Favorites</h2>
            <ul>
              {favorites.length === 0 ? <li>None yet</li> : favorites.map((id) => <li key={id}>{calculators.find((c) => c.id === id)?.name}</li>)}
            </ul>

            <h2>Recent</h2>
            <ul>
              {history.length === 0
                ? <li>No calculations yet</li>
                : history.map((item) => (
                    <li key={item.id}>
                      <strong>{item.calculatorName}</strong>
                      <div>{item.result}</div>
                      <small>{item.at}</small>
                    </li>
                  ))}
            </ul>
          </aside>
        </section>
      ) : null}

      {view === "library" ? (
        <section className="panel">
          <h2>Library</h2>
          <p>Double-click worked. All calculators are shown below.</p>
          <div className="gridCards">
            {filtered.map((item) => (
              <button
                key={item.id}
                className={`calculatorButton ${item.id === selected.id ? "active" : ""}`}
                onClick={() => {
                  setSelected(item);
                  setInputs({});
                  setResult("");
                  setView("home");
                }}
              >
                <span>{item.name}</span>
                <small>{item.category}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {view === "categories" ? (
        <section className="panel">
          <h2>Categories</h2>
          <p>Double-click worked. Category-wise list is below.</p>
          {Object.entries(groupedCategories).map(([category, items]) => (
            <div key={category} className="categoryBlock">
              <h3>{category}</h3>
              <div className="gridCards">
                {items.map((item) => (
                  <button
                    key={item.id}
                    className="calculatorButton"
                    onClick={() => {
                      setSelected(item);
                      setInputs({});
                      setResult("");
                      setView("home");
                    }}
                  >
                    <span>{item.name}</span>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}
