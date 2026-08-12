import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './index.css'
import { useAppStore } from './stores/app'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#root')

// 应用启动后从数据库(course_db, Java 8080)拉取教师端业务数据；
// Java 后端未启动时 initFromDatabase 内部静默降级，不影响页面渲染
const store = useAppStore()
store.initFromDatabase()