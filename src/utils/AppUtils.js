import Toast, { ToastPosition } from "react-native-toast-message"
import { GlobalStyles } from "../styles/GlobalStyles"

export const showToast = (type, position, title, content) => {
    Toast.show({
        type: type,
        position: position,
        text1: title,
        text2: content,
        visibilityTime: 4000, // Thời gian hiển thị toast (ms)
        autoHide: true, // Tự động ẩn toast sau thời gian trên
        topOffset: 30, // Khoảng cách từ cạnh trên
        bottomOffset: 40, // Khoảng cách từ cạnh dưới,
        text1Style: [GlobalStyles.textStyle, { fontWeight: 'bold' }],
        text2Style: [GlobalStyles.textStyle, {}],
    })
}