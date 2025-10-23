
export function CircuitPattern() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ opacity: 0.1 }}
      >
        <defs>
          <pattern
            id="circuit-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            {/* Circuit lines */}
            <path
              d="M 0,50 L 25,50 L 25,25 L 50,25 L 50,75 L 75,75 L 75,50 L 100,50"
              stroke="#00FFFF"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 0,25 L 30,25 L 30,40 L 60,40 L 60,60 L 90,60 L 90,75 L 100,75"
              stroke="#FF00FF"
              strokeWidth="1"
              fill="none"
            />
            {/* Circuit nodes */}
            <circle cx="25" cy="50" r="2" fill="#00FFFF" />
            <circle cx="50" cy="25" r="2" fill="#FF00FF" />
            <circle cx="75" cy="75" r="2" fill="#00FFFF" />
            <circle cx="30" cy="40" r="2" fill="#FF00FF" />
            <circle cx="60" cy="60" r="2" fill="#00FFFF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
      </svg>
    </div>
  );
}
