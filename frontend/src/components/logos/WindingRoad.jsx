export default function WindingRoad({ width = 340, height = 480, color = "#C97B3C", opacity = 0.07 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 340 480" fill="none"
         xmlns="http://www.w3.org/2000/svg"
         style={{position:"absolute",pointerEvents:"none",userSelect:"none"}}
         aria-hidden="true">
      {/* Estrada principal — curvas tipo serpentina de montanha */}
      <path d="
        M 170 480 L 170 430
        C 170 410 220 400 260 400
        L 300 400
        C 320 400 330 385 330 368
        L 330 348
        C 330 330 310 318 280 318
        L 80 318
        C 50 318 30 306 30 288
        L 30 268
        C 30 250 50 238 80 238
        L 270 238
        C 300 238 320 226 320 208
        L 320 188
        C 320 170 300 158 270 158
        L 80 158
        C 50 158 30 146 30 128
        L 30 108
        C 30 90 50 78 80 78
        L 240 78
        C 270 78 290 66 290 48
        L 290 0
      " stroke={color} strokeWidth="22" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}/>
      {/* Faixa central tracejada */}
      <path d="
        M 170 480 L 170 430
        C 170 410 220 400 260 400
        L 300 400
        C 320 400 330 385 330 368
        L 330 348
        C 330 330 310 318 280 318
        L 80 318
        C 50 318 30 306 30 288
        L 30 268
        C 30 250 50 238 80 238
        L 270 238
        C 300 238 320 226 320 208
        L 320 188
        C 320 170 300 158 270 158
        L 80 158
        C 50 158 30 146 30 128
        L 30 108
        C 30 90 50 78 80 78
        L 240 78
        C 270 78 290 66 290 48
        L 290 0
      " stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="18 14" opacity={opacity * 2}/>
    </svg>
  );
}
