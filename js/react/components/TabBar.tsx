// ---------------------------------------------------------------------
// TAB BAR - presentational, split out of PeoplePage (Exercise 4, Demo 5)
// ---------------------------------------------------------------------
// PeoplePage used to build this markup itself, mixing "fetch data and
// own activeTab" with "render a row of tab buttons" in one component.
// This half only knows how to render whichever tabs/active value it's
// given, reuses the existing .tab-bar/.tab-btn/.active classes, same as
// before, no new CSS beyond Demo 8's anchor reset below.
//
// Exercise 4, Demo 8: each tab used to be a <button onClick> calling
// back into the caller's own useState (an `onChange` prop). Now each
// tab carries its own `to` route and renders as a real <Link>, so the
// caller just tells TabBar what the tabs and routes are, same generic
// shape as before, still no domain type, just one more plain string.
import { Link } from "react-router-dom";

interface Tab<T extends string> {
  value: T;
  label: string;
  to: string;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
}

export default function TabBar<T extends string>({ tabs, activeTab }: TabBarProps<T>) {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          to={tab.to}
          className={"tab-btn" + (tab.value === activeTab ? " active" : "")}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
