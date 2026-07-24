/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: { center: true },
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        brand: {
          950: '#0f172a',  // 最深色 - 深蓝(PRD主色) - 边框、强调
          900: '#1e3a5f',  // 最深主色调 - 标题、重要按钮
          800: '#1e40af',  // 次主色 - 导航栏背景
          750: '#1e3a8a',  // 菜单栏背景 - 深蓝侧边栏
          700: '#2563eb',  // 中间调1 - 按钮、链接
          600: '#3b82f6',  // 中间调2 - 学生端强调色(PRD:天蓝)
          400: '#60a5fa',  // 中间调3 - 标签、图表
          200: '#bfdbfe',  // 浅色1 - 背景区域、浅色文字
          50:  '#eff6ff',  // 最浅色 - 页面背景
        },
      },
    },
  },
  plugins: [],
};