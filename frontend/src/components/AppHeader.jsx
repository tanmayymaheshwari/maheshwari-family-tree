// Displays the application identity and the current tree totals.
export default function AppHeader({ memberCount, relationshipCount }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <div className="brand-title">MAHESHWARI FAMILY TREE</div>
          <div className="brand-subtitle">OUR FAMILY ARCHIVE</div>
        </div>
      </div>

      <div className="tree-stats">
        <span>
          <strong>{memberCount}</strong> MEMBERS
        </span>

        {/* todo : instead of connections we will maintain a generation count */}
        <span>
          <strong>{relationshipCount}</strong> CONNECTIONS
        </span>
      </div>
    </header>
  );
}
