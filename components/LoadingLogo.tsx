"use client";

export function LoadingLogo() {
  const colors = [
    '#FF0000', // Red
    '#FF7F00', // Orange
    '#FFFF00', // Yellow
    '#00FF00', // Green
    '#0000FF', // Blue
    '#4B0082', // Indigo
    '#9400D3', // Violet
    '#FF1493', // Pink
  ];

  return (
    <div className="flex justify-center items-center">
      <style jsx>{`
        @keyframes colorFlush {
          0%, 100% {
            color: currentColor;
          }
          10%, 90% {
            color: var(--flush-color);
          }
        }

        .loading-letter {
          display: inline-block;
          animation: colorFlush 3s ease-in-out infinite;
        }

        .loading-letter-0 {
          --flush-color: #FF0000;
          animation-delay: 0s;
        }
        .loading-letter-1 {
          --flush-color: #FF7F00;
          animation-delay: 0.15s;
        }
        .loading-letter-2 {
          --flush-color: #FFFF00;
          animation-delay: 0.3s;
        }
        .loading-letter-3 {
          --flush-color: #00FF00;
          animation-delay: 0.45s;
        }
        .loading-letter-4 {
          --flush-color: #0000FF;
          animation-delay: 0.6s;
        }
        .loading-letter-5 {
          --flush-color: #4B0082;
          animation-delay: 0.75s;
        }
        .loading-letter-6 {
          --flush-color: #9400D3;
          animation-delay: 0.9s;
        }
        .loading-letter-7 {
          --flush-color: #FF1493;
          animation-delay: 1.05s;
        }
      `}</style>
      <h1
        className="text-3xl sm:text-5xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {"Colordle".split("").map((letter, i) => (
          <span
            key={i}
            className={`loading-letter loading-letter-${i}`}
          >
            {letter}
          </span>
        ))}
      </h1>
    </div>
  );
}
