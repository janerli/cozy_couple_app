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
  { top: "4%", left: "6%", rotate: -8, size: "text-2xl" },
  { top: "9%", left: "82%", rotate: 6, size: "text-xl" },
  { top: "16%", left: "34%", rotate: -4, size: "text-lg" },
  { top: "22%", left: "63%", rotate: 10, size: "text-2xl" },
  { top: "29%", left: "12%", rotate: 5, size: "text-xl" },
  { top: "35%", left: "90%", rotate: -6, size: "text-lg" },
  { top: "41%", left: "45%", rotate: 3, size: "text-xl" },
  { top: "47%", left: "4%", rotate: -10, size: "text-lg" },
  { top: "53%", left: "72%", rotate: 7, size: "text-2xl" },
  { top: "59%", left: "24%", rotate: -3, size: "text-lg" },
  { top: "65%", left: "56%", rotate: 8, size: "text-xl" },
  { top: "71%", left: "88%", rotate: -5, size: "text-lg" },
  { top: "77%", left: "16%", rotate: 4, size: "text-2xl" },
  { top: "83%", left: "40%", rotate: -7, size: "text-lg" },
  { top: "89%", left: "68%", rotate: 6, size: "text-xl" },
  { top: "94%", left: "8%", rotate: -4, size: "text-lg" },
  { top: "13%", left: "50%", rotate: 9, size: "text-lg" },
  { top: "61%", left: "5%", rotate: -6, size: "text-xl" },
]

export function KaomojiBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {positions.map((pos, i) => (
        <span
          key={i}
          className={`absolute font-medium text-primary/25 dark:text-primary/20 ${pos.size}`}
          style={{ top: pos.top, left: pos.left, transform: `rotate(${pos.rotate}deg)` }}
        >
          {kaomojiList[i % kaomojiList.length]}
        </span>
      ))}
    </div>
  )
}
