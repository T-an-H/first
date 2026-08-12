package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.DetailedGrade;
import com.course.backend.service.DetailedGradeService;
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
 * 成绩明细接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class DetailedGradeController {

    private final DetailedGradeService detailedGradeService;

    /**
     * GET /api/teaching/detailed-grades  成绩明细列表
     * 可选参数：courseId / studentId
     */
    @GetMapping("/detailed-grades")
    public Result<List<DetailedGrade>> listDetailedGrades(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId) {
        QueryWrapper<DetailedGrade> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        qw.orderByAsc("student_id");
        return Result.ok(detailedGradeService.list(qw));
    }

    /**
     * GET /api/teaching/detailed-grades/{id}  成绩明细详情
     */
    @GetMapping("/detailed-grades/{id}")
    public Result<DetailedGrade> getDetailedGrade(@PathVariable String id) {
        return Result.ok(detailedGradeService.getById(id));
    }

    /**
     * POST /api/teaching/detailed-grades  新增成绩明细
     */
    @PostMapping("/detailed-grades")
    public Result<DetailedGrade> addDetailedGrade(@RequestBody DetailedGrade detailedGrade) {
        if (!StringUtils.hasText(detailedGrade.getId())) {
            detailedGrade.setId("dg-" + System.currentTimeMillis());
        }
        detailedGradeService.save(detailedGrade);
        return Result.ok(detailedGrade);
    }

    /**
     * PUT /api/teaching/detailed-grades/{id}  更新成绩明细
     */
    @PutMapping("/detailed-grades/{id}")
    public Result<DetailedGrade> updateDetailedGrade(@PathVariable String id,
                                                     @RequestBody DetailedGrade detailedGrade) {
        detailedGrade.setId(id);
        detailedGradeService.updateById(detailedGrade);
        return Result.ok(detailedGradeService.getById(id));
    }

    /**
     * DELETE /api/teaching/detailed-grades/{id}  删除成绩明细
     */
    @DeleteMapping("/detailed-grades/{id}")
    public Result<Void> deleteDetailedGrade(@PathVariable String id) {
        detailedGradeService.removeById(id);
        return Result.ok();
    }
}
