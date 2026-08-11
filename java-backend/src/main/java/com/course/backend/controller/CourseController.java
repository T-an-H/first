package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Enrollment;
import com.course.backend.entity.Evaluation;
import com.course.backend.entity.StudentGroup;
import com.course.backend.service.EnrollmentService;
import com.course.backend.service.EvaluationService;
import com.course.backend.service.StudentGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
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

    private final EnrollmentService enrollmentService;
    private final StudentGroupService studentGroupService;
    private final EvaluationService evaluationService;

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
