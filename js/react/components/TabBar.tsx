// ---------------------------------------------------------------------
// TAB BAR - presentational, split out of PeoplePage (Exercise 4, Demo 5)
// ---------------------------------------------------------------------
// PeoplePage used to build this markup itself, mixing "fetch data and
// own activeTab" with "render a row of tab buttons" in one component.
// This half only knows how to render whichever tabs/active value/click
// handler it's given, reuses the existing .tab-bar/.tab-btn/.active
// classes, same as before, no new CSS.
interface Tab<T extends string> {
  value: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}

export default function TabBar<T extends string>({ tabs, activeTab, onChange }: TabBarProps<T>) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={"tab-btn" + (tab.value === activeTab ? " active" : "")}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
