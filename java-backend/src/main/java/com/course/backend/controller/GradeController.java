package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.Grade;
import com.course.backend.service.GradeService;
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

import java.util.List;

/**
 * 综合成绩接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class GradeController {

    private final GradeService gradeService;

    /**
     * GET /api/teaching/grades  成绩列表
     * 可选参数：courseId / studentId
     */
    @GetMapping("/grades")
    public Result<List<Grade>> listGrades(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId) {
        QueryWrapper<Grade> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        qw.orderByAsc("student_id");
        return Result.ok(gradeService.list(qw));
    }

    /**
     * GET /api/teaching/scores/{courseId}  按课程查成绩（对齐前端 fetchCourseScores）
     */
    @GetMapping("/scores/{courseId}")
    public Result<List<Grade>> listCourseScores(@PathVariable String courseId) {
        QueryWrapper<Grade> qw = new QueryWrapper<>();
        qw.eq("course_id", courseId);
        qw.orderByAsc("student_id");
        return Result.ok(gradeService.list(qw));
    }

    /**
     * GET /api/teaching/scores/student/{studentId}  按学生查成绩（对齐前端 fetchStudentScores）
     */
    @GetMapping("/scores/student/{studentId}")
    public Result<List<Grade>> listStudentScores(@PathVariable String studentId) {
        QueryWrapper<Grade> qw = new QueryWrapper<>();
        qw.eq("student_id", studentId);
        qw.orderByAsc("course_id");
        return Result.ok(gradeService.list(qw));
    }

    /**
     * POST /api/teaching/grades  新增成绩
     */
    @PostMapping("/grades")
    public Result<Grade> addGrade(@RequestBody Grade grade) {
        if (!StringUtils.hasText(grade.getId())) {
            grade.setId("grade-" + System.currentTimeMillis());
        }
        gradeService.save(grade);
        return Result.ok(grade);
    }

    /**
     * PUT /api/teaching/grades/{id}  更新成绩
     */
    @PutMapping("/grades/{id}")
    public Result<Grade> updateGrade(@PathVariable String id, @RequestBody Grade grade) {
        grade.setId(id);
        gradeService.updateById(grade);
        return Result.ok(gradeService.getById(id));
    }

    /**
     * DELETE /api/teaching/grades/{id}  删除成绩
     */
    @DeleteMapping("/grades/{id}")
    public Result<Void> deleteGrade(@PathVariable String id) {
        gradeService.removeById(id);
        return Result.ok();
    }
}
