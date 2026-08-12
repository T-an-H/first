package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.QualityEvaluation;
import com.course.backend.service.QualityEvaluationService;
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
 * 素质评价接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class QualityEvaluationController {

    private final QualityEvaluationService qualityEvaluationService;

    /**
     * GET /api/teaching/quality-evaluations  素质评价列表
     * 可选参数：courseId / studentId
     */
    @GetMapping("/quality-evaluations")
    public Result<List<QualityEvaluation>> listQualityEvals(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId) {
        QueryWrapper<QualityEvaluation> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        qw.orderByAsc("student_id");
        return Result.ok(qualityEvaluationService.list(qw));
    }

    /**
     * POST /api/teaching/quality-evaluations  新增素质评价记录
     * body: { id?, courseId, studentId, submissions: [...] }
     */
    @PostMapping("/quality-evaluations")
    public Result<QualityEvaluation> addQualityEval(@RequestBody QualityEvaluation qualityEvaluation) {
        if (!StringUtils.hasText(qualityEvaluation.getId())) {
            qualityEvaluation.setId("qe-" + System.currentTimeMillis());
        }
        qualityEvaluationService.save(qualityEvaluation);
        return Result.ok(qualityEvaluation);
    }

    /**
     * PUT /api/teaching/quality-evaluations/{id}  更新素质评价（保存 submissions JSON）
     */
    @PutMapping("/quality-evaluations/{id}")
    public Result<QualityEvaluation> updateQualityEval(@PathVariable String id,
                                                       @RequestBody QualityEvaluation qualityEvaluation) {
        qualityEvaluation.setId(id);
        qualityEvaluationService.updateById(qualityEvaluation);
        return Result.ok(qualityEvaluationService.getById(id));
    }

    /**
     * DELETE /api/teaching/quality-evaluations/{id}  删除素质评价
     */
    @DeleteMapping("/quality-evaluations/{id}")
    public Result<Void> deleteQualityEval(@PathVariable String id) {
        qualityEvaluationService.removeById(id);
        return Result.ok();
    }
}
