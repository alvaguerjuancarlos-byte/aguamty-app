export default function BottomNav({ tabs, active, onSelect }) {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`bnav-item ${active === tab.id ? 'active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
