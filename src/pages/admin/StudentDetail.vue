<template>
  <div v-if="!student" class="text-center py-12 text-gray-400">学生不存在</div>
  <div v-else class="space-y-6">
    <div class="flex items-center gap-4">
      <router-link to="/admin/students" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <ArrowLeft class="w-5 h-5 text-gray-500" />
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ student.name }}</h1>
        <p class="text-gray-500 mt-1">{{ student.studentId }} · {{ student.className }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-sm font-semibold text-gray-800">已选课程</h3>
        <div v-for="enroll in enrolledCourses" :key="enroll.courseId" class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <BookOpen class="w-5 h-5 text-blue-500" />
              <span class="font-medium text-gray-900">{{ getCourseName(enroll.courseId) }}</span>
            </div>
            <span class="text-xs text-gray-400">{{ getCourseProgress(enroll.courseId) }}%</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full bg-blue-500 transition-all" :style="{ width: `${getCourseProgress(enroll.courseId)}%` }" />
          </div>
        </div>
        <div v-if="enrolledCourses.length === 0" class="text-center py-8 text-gray-400">该学生尚未选课</div>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-fit">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">个人资料</h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">学号</span>
            <span class="font-medium">{{ student.studentId }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">姓名</span>
            <span class="font-medium">{{ student.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">班级</span>
            <span class="font-medium">{{ student.className }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">状态</span>
            <span :class="student.status === 'active' ? 'text-green-600' : 'text-red-600'">
              {{ student.status === 'active' ? '正常' : '禁用' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">邮箱</span>
            <span class="font-medium">{{ student.email || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">电话</span>
            <span class="font-medium">{{ student.phone || '-' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ArrowLeft, BookOpen } from 'lucide-vue-next'

const route = useRoute()
const store = useAppStore()

const student = computed(() => store.students.find((s) => s.id === route.params.id) || null)

const enrolledCourses = computed(() => {
  if (!student.value) return []
  return store.enrollments.filter((e) => e.studentId === student.value!.id)
})

const getCourseName = (id: string) => store.courses.find((c) => c.id === id)?.title || '未知'
const getCourseProgress = (courseId: string) => {
  if (!student.value) return 0
  const enrollment = store.enrollments.find((e) => e.studentId === student.value!.id && e.courseId === courseId)
  return enrollment?.progress || 0
}
</script>
