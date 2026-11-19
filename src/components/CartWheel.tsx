// The mark of Charrette: the wheel of a charrette, the cart of the Beaux-Arts. It is the same
// wheel as the app icon. The rim and the spokes use the text color, and the hub is red chalk.
export default function CartWheel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <circle cx="16" cy="16" r="12" />
        <line x1="5.2" y1="16" x2="26.8" y2="16" />
        <line x1="10.6" y1="6.65" x2="21.4" y2="25.35" />
        <line x1="21.4" y1="6.65" x2="10.6" y2="25.35" />
        <circle cx="16" cy="16" r="3" className="fill-primary" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
