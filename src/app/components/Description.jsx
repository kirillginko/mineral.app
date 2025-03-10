export default function Description({ description }) {
  return (
    <div>
      {/* Render Tracklist */}
      <strong>Tracklist:</strong>
      <ul>
        {description.tracklist.map((track, index) => (
          <li key={index}>
            [{track.time}] {track.title}
          </li>
        ))}
      </ul>

      {/* Render Credits */}
      <strong>Credits:</strong>
      <ul>
        {description.credits.map((credit, index) => (
          <li key={index}>
            {credit.role} – {credit.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
