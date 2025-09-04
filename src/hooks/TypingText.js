import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

export default function TypingText({
  text = 'Chào bạn!',
  speed = 120,     // ms mỗi ký tự
  pause = 800,     // dừng khi full/empty
  showCursor = true,
  cursorChar = '|',
  style,
  cursorStyle,
}) {
  const [i, setI] = useState(0);           // số ký tự đang hiển thị
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let t;
    if (!deleting) {
      if (i < text.length) {
        t = setTimeout(() => setI(i + 1), speed);
      } else {
        t = setTimeout(() => setDeleting(true), pause);
      }
    } else {
      if (i > 0) {
        t = setTimeout(() => setI(i - 1), speed);
      } else {
        t = setTimeout(() => setDeleting(false), pause);
      }
    }
    return () => clearTimeout(t);
  }, [i, deleting, text, speed, pause]);

  return (
    <Text style={style}>
      {text.slice(0, i)}
      {showCursor ? <Text style={[{ opacity: 0.7 }, cursorStyle]}>{cursorChar}</Text> : null}
    </Text>
  );
}
