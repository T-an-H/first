package com.course.backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.course.backend.common.Result;
import com.course.backend.entity.ExamScore;
import com.course.backend.service.ExamScoreService;
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
 * 考试/项目成绩接口
 */
@RestController
@RequestMapping("/api/teaching")
@RequiredArgsConstructor
public class ExamScoreController {

    private final ExamScoreService examScoreService;

    /**
     * GET /api/teaching/exam-scores  考试/项目成绩列表
     * 可选参数：courseId / studentId / type
     */
    @GetMapping("/exam-scores")
    public Result<List<ExamScore>> listExamScores(
            @RequestParam(required = false) String courseId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String type) {
        QueryWrapper<ExamScore> qw = new QueryWrapper<>();
        if (StringUtils.hasText(courseId)) qw.eq("course_id", courseId);
        if (StringUtils.hasText(studentId)) qw.eq("student_id", studentId);
        if (StringUtils.hasText(type)) qw.eq("type", type);
        qw.orderByAsc("exam_name");
        return Result.ok(examScoreService.list(qw));
    }

    /**
     * POST /api/teaching/exam-scores  新增考试/项目成绩
     */
    @PostMapping("/exam-scores")
    public Result<ExamScore> addExamScore(@RequestBody ExamScore examScore) {
        if (!StringUtils.hasText(examScore.getId())) {
            examScore.setId("exam-" + System.currentTimeMillis());
        }
        if (!StringUtils.hasText(examScore.getType())) examScore.setType("quiz");
        if (!StringUtils.hasText(examScore.getStatus())) examScore.setStatus("draft");
        if (examScore.getFullScore() == null) examScore.setFullScore(new java.math.BigDecimal(100));
        if (examScore.getWeight() == null) examScore.setWeight(50);
        examScoreService.save(examScore);
        return Result.ok(examScore);
    }

    /**
     * PUT /api/teaching/exam-scores/{id}  更新考试/项目成绩
     */
    @PutMapping("/exam-scores/{id}")
    public Result<ExamScore> updateExamScore(@PathVariable String id, @RequestBody ExamScore examScore) {
        examScore.setId(id);
        examScoreService.updateById(examScore);
        return Result.ok(examScoreService.getById(id));
    }

    /**
     * DELETE /api/teaching/exam-scores/{id}  删除考试/项目成绩
     */
    @DeleteMapping("/exam-scores/{id}")
    public Result<Void> deleteExamScore(@PathVariable String id) {
        examScoreService.removeById(id);
        return Result.ok();
    }
}
