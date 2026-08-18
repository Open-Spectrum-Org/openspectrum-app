export function StressFAB() {
  return (
    <button
      onClick={() => alert('Stress log — coming soon')}
      className="fixed bottom-6 right-5 w-[60px] h-[60px] rounded-full bg-danger flex items-center justify-center shadow-lg z-[100] active:bg-[#DC2626] active:scale-95 transition-transform"
    >
      <span className="text-[28px]">🚨</span>
    </button>
  );
}
