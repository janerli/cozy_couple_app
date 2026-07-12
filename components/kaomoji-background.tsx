const kaomojiList = [
  "(=^･ω･^=)",
  "♡(˃͈ ᵕ ˂͈ ༶ )",
  "(｡♥‿♥｡)",
  "٩(◕‿◕)۶",
  "(￣ω￣)",
  "(๑>ᴗ<๑)",
  "~(￣▽￣)~",
  "( ˘ ³˘)♥",
  "ヽ(>∀<☆)ノ",
  "(*≧ω≦)",
]

const positions = [
  { top: "3%", left: "6%", rotate: -8, size: "text-2xl" },
  { top: "6%", left: "45%", rotate: 4, size: "text-lg" },
  { top: "8%", left: "82%", rotate: 6, size: "text-xl" },
  { top: "13%", left: "23%", rotate: 9, size: "text-lg" },
  { top: "15%", left: "63%", rotate: -5, size: "text-2xl" },
  { top: "19%", left: "5%", rotate: 5, size: "text-lg" },
  { top: "22%", left: "90%", rotate: -6, size: "text-xl" },
  { top: "25%", left: "36%", rotate: 8, size: "text-lg" },
  { top: "29%", left: "72%", rotate: -4, size: "text-2xl" },
  { top: "32%", left: "12%", rotate: 6, size: "text-lg" },
  { top: "36%", left: "52%", rotate: -9, size: "text-xl" },
  { top: "39%", left: "94%", rotate: 3, size: "text-lg" },
  { top: "42%", left: "27%", rotate: -7, size: "text-2xl" },
  { top: "46%", left: "66%", rotate: 7, size: "text-lg" },
  { top: "49%", left: "4%", rotate: -10, size: "text-xl" },
  { top: "53%", left: "83%", rotate: 5, size: "text-lg" },
  { top: "56%", left: "43%", rotate: -3, size: "text-2xl" },
  { top: "59%", left: "18%", rotate: 9, size: "text-lg" },
  { top: "63%", left: "60%", rotate: -6, size: "text-xl" },
  { top: "66%", left: "92%", rotate: 4, size: "text-lg" },
  { top: "69%", left: "32%", rotate: -8, size: "text-2xl" },
  { top: "73%", left: "8%", rotate: 6, size: "text-lg" },
  { top: "76%", left: "70%", rotate: -5, size: "text-xl" },
  { top: "79%", left: "50%", rotate: 8, size: "text-lg" },
  { top: "83%", left: "16%", rotate: -4, size: "text-2xl" },
  { top: "86%", left: "88%", rotate: 7, size: "text-lg" },
  { top: "89%", left: "38%", rotate: -9, size: "text-xl" },
  { top: "93%", left: "62%", rotate: 5, size: "text-lg" },
  { top: "96%", left: "10%", rotate: -6, size: "text-2xl" },
  { top: "97%", left: "78%", rotate: 3, size: "text-lg" },
]

export function KaomojiBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {positions.map((pos, i) => (
        <span
          key={i}
          className={`absolute font-medium text-primary/15 dark:text-primary/7 ${pos.size}`}
          style={{ top: pos.top, left: pos.left, transform: `rotate(${pos.rotate}deg)` }}
        >
          {kaomojiList[i % kaomojiList.length]}
        </span>
      ))}
    </div>
  )
}
