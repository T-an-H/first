package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Course;
import com.course.backend.entity.Enrollment;
import com.course.backend.entity.Evaluation;
import com.course.backend.entity.StudentGroup;
import com.course.backend.service.CourseService;
import com.course.backend.service.EnrollmentService;
import com.course.backend.service.EvaluationService;
import com.course.backend.service.StudentGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 课程数据接口
 */
@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final StudentGroupService studentGroupService;
    private final EvaluationService evaluationService;

    /**
     * GET /api/courses  课程列表
     * 可选参数：teacher（授课教师）/ status / keyword（标题模糊）
     */
    @GetMapping
    public Result<List<Course>> listCourses(
            @RequestParam(required = false) String teacher,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        QueryWrapper<Course> qw = new QueryWrapper<>();
        if (StringUtils.hasText(teacher)) qw.eq("teacher", teacher);
        if (StringUtils.hasText(status)) qw.eq("status", status);
        if (StringUtils.hasText(keyword)) qw.like("title", keyword);
        qw.orderByDesc("created_at");
        return Result.ok(courseService.list(qw));
    }

    /**
     * GET /api/courses/teacher/{name}  教师授课课程列表（前端 fetchTeacherCourses）
     */
    @GetMapping("/teacher/{name}")
    public Result<List<Course>> listTeacherCourses(@PathVariable String name) {
        QueryWrapper<Course> qw = new QueryWrapper<>();
        qw.eq("teacher", name);
        qw.orderByDesc("created_at");
        return Result.ok(courseService.list(qw));
    }

    /**
     * GET /api/courses/{id}  课程详情
     */
    @GetMapping("/{id}")
    public Result<Course> getCourse(@PathVariable String id) {
        return Result.ok(courseService.getById(id));
    }

    /**
     * POST /api/courses  新建课程
     */
    @PostMapping
    public Result<Course> addCourse(@RequestBody Course course) {
        if (!StringUtils.hasText(course.getId())) {
            course.setId("course-" + System.currentTimeMillis());
        }
        if (!StringUtils.hasText(course.getStatus())) course.setStatus("active");
        if (course.getCredits() == null) course.setCredits(0);
        if (course.getDuration() == null) course.setDuration(0);
        courseService.save(course);
        return Result.ok(course);
    }

    /**
     * PUT /api/courses/{id}  更新课程
     */
    @PutMapping("/{id}")
    public Result<Course> updateCourse(@PathVariable String id, @RequestBody Course course) {
        course.setId(id);
        courseService.updateById(course);
        return Result.ok(courseService.getById(id));
    }

    /**
     * DELETE /api/courses/{id}  删除课程
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteCourse(@PathVariable String id) {
        courseService.removeById(id);
        return Result.ok();
    }

    /**
     * GET /api/courses/{id}/stats  教师课程统计
     * 返回：学生数、平均进度、分组数、评价数
     */
    @GetMapping("/{id}/stats")
    public Result<Map<String, Object>> courseStats(@PathVariable String id) {
        List<Enrollment> enrollments = enrollmentService.list(
                new QueryWrapper<Enrollment>().eq("course_id", id));

        long studentCount = enrollments.stream()
                .filter(e -> !"dropped".equals(e.getStatus()))
                .count();
        double avgProgress = enrollments.stream()
                .filter(e -> !"dropped".equals(e.getStatus()))
                .mapToInt(e -> e.getProgress() == null ? 0 : e.getProgress())
                .average().orElse(0);
        long groupCount = studentGroupService.count(
                new QueryWrapper<StudentGroup>().eq("course_id", id));
        long evalCount = evaluationService.count(
                new QueryWrapper<Evaluation>().eq("course_id", id));

        Map<String, Object> data = new HashMap<>();
        data.put("courseId", id);
        data.put("studentCount", studentCount);
        data.put("enrolledCount", enrollments.size());
        data.put("avgProgress", Math.round(avgProgress));
        data.put("groupCount", groupCount);
        data.put("evalCount", evalCount);
        return Result.ok(data);
    }
}
